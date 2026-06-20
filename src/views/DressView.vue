<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDressStore, type Dress, type DressCategory } from '@/stores/dress'
import { useBudgetStore } from '@/stores/budget'
import { useRoleStore } from '@/stores/role'
import { Shirt, Tag, Ruler, Calendar, Palette as DressPalette, Plus, Filter, ArrowUpDown, SlidersHorizontal, ArrowLeftRight, X } from 'lucide-vue-next'
import OptionCard from '@/components/OptionCard.vue'
import OptionFormModal from '@/components/OptionFormModal.vue'
import CompareModal from '@/components/CompareModal.vue'
import ConfirmSelectionModal from '@/components/ConfirmSelectionModal.vue'
import Toast from '@/components/Toast.vue'
import RoleSwitcher from '@/components/RoleSwitcher.vue'

const router = useRouter()
const route = useRoute()
const dressStore = useDressStore()
const budgetStore = useBudgetStore()
const roleStore = useRoleStore()

const drillMode = ref(false)
const contractedListRef = ref<HTMLElement | null>(null)
let drillHighlightTimer: ReturnType<typeof setTimeout> | null = null

const showFormModal = ref(false)
const showCompareModal = ref(false)
const showConfirmModal = ref(false)
const editItem = ref<Dress | null>(null)
const selectedForConfirm = ref<Dress | null>(null)
const compareIds = ref<string[]>([])

type SortKey = 'createdAt' | 'price' | 'rating'
type FilterStatus = 'all' | 'contracted' | 'alternative'
const sortKey = ref<SortKey>('createdAt')
const sortDesc = ref(true)
const filterStatus = ref<FilterStatus>('all')
const activeTypeTab = ref<DressCategory | 'all'>('all')
const showFilter = ref(false)

const toastVisible = ref(false)
const toastMessage = ref('')
const toastDescription = ref('')
const toastType = ref<'success' | 'error' | 'warning' | 'info'>('success')

const showToast = (message: string, description?: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', duration = 2500) => {
  toastMessage.value = message
  toastDescription.value = description ?? ''
  toastType.value = type
  toastVisible.value = true
  setTimeout(() => {
    toastVisible.value = false
  }, duration)
}

const formatPrice = (price: number) => `¥${price.toLocaleString()}`

const typeGroups: DressCategory[] = ['主纱', '出门纱', '敬酒服']

const getContractedByType = (type: DressCategory) =>
  dressStore.dresses.find(d => d.type === type && d.contracted) ?? null

const previousForConfirm = computed(() => {
  if (!selectedForConfirm.value) return null
  const contracted = getContractedByType(selectedForConfirm.value.type)
  if (!contracted) return null
  if (contracted.id === selectedForConfirm.value.id) return null
  return {
    id: contracted.id,
    title: contracted.name,
    subtitle: `${contracted.brand} · ${contracted.type}`,
    price: contracted.price,
    contractPrice: contracted.contractPrice,
    image: contracted.image
  }
})

const sortedItems = computed(() => {
  let list = [...dressStore.dresses]
  if (activeTypeTab.value !== 'all') {
    list = list.filter(d => d.type === activeTypeTab.value)
  }
  if (filterStatus.value === 'contracted') {
    list = list.filter(d => d.contracted)
  } else if (filterStatus.value === 'alternative') {
    list = list.filter(d => !d.contracted)
  }
  list.sort((a, b) => {
    let diff = 0
    switch (sortKey.value) {
      case 'price':
        diff = a.price - b.price
        break
      case 'rating':
        diff = a.rating - b.rating
        break
      case 'createdAt':
      default:
        diff = a.createdAt - b.createdAt
    }
    return sortDesc.value ? -diff : diff
  })
  return list
})

const hasContractedByType = (type: DressCategory) =>
  dressStore.dresses.some(d => d.type === type && d.contracted)

const contractedByTypeCount = (type: DressCategory) =>
  dressStore.dresses.filter(d => d.type === type && d.contracted).length

const totalContractedPrice = computed(() => dressStore.totalContractedWithFitting)
const totalContractOnly = computed(() => dressStore.totalContractPrice)
const totalFittingFee = computed(() => dressStore.totalFittingFee)

const calcRecordTotal = (record: any) =>
  record.alterationFee + record.accessoryFee + record.cleaningFee + record.otherFee

const contractedCount = computed(() => dressStore.dresses.filter(d => d.contracted).length)
const alternativeCount = computed(() => dressStore.dresses.filter(d => !d.contracted).length)

const compareItems = computed(() => {
  return compareIds.value
    .map(id => dressStore.getDressById(id))
    .filter(Boolean)
    .map(d => ({
      id: d!.id,
      title: d!.name,
      subtitle: `${d!.brand} · ${d!.type}`,
      price: d!.price,
      rating: d!.rating,
      pros: d!.pros,
      cons: d!.cons,
      image: d!.image,
      contracted: d!.contracted,
      extraFields: [
        { label: '类别', value: d!.type },
        { label: '品牌', value: d!.brand },
        { label: '风格', value: d!.style },
        { label: '尺码', value: d!.size },
        { label: '颜色', value: d!.color }
      ]
    }))
})

const budgetItem = computed(() => budgetStore.getItemByCategory('婚纱'))

const openAddModal = () => {
  editItem.value = null
  showFormModal.value = true
}

const openEditModal = (id: string) => {
  const item = dressStore.getDressById(id)
  if (item) {
    editItem.value = { ...item }
    showFormModal.value = true
  }
}

const handleFormSubmit = (data: any) => {
  if (editItem.value) {
    dressStore.updateDress(editItem.value.id, data)
    showToast('修改成功', '礼服信息已更新', 'success')
  } else {
    dressStore.addDress(data)
    showToast('添加成功', '已添加到婚纱方案库', 'success')
  }
  showFormModal.value = false
  editItem.value = null
}

const handleDelete = (id: string) => {
  if (confirm('确定要删除此礼服方案吗？')) {
    const item = dressStore.getDressById(id)
    dressStore.deleteDress(id)
    compareIds.value = compareIds.value.filter(i => i !== id)
    showToast('已删除', item?.name ?? '', 'info')
  }
}

const openConfirmModal = (id: string) => {
  const item = dressStore.getDressById(id)
  if (item) {
    selectedForConfirm.value = item
    showConfirmModal.value = true
  }
}

const handleConfirmSelection = (_id: string, price: number) => {
  if (!selectedForConfirm.value) return
  const id = selectedForConfirm.value.id
  const dressName = selectedForConfirm.value.name
  const isChange = !!previousForConfirm.value
  const previousName = previousForConfirm.value?.title
  dressStore.updateContractDress(id, price)
  showConfirmModal.value = false
  showCompareModal.value = false
  compareIds.value = []
  selectedForConfirm.value = null
  if (isChange && previousName) {
    showToast('套系变更成功！', `${previousName} → ${dressName} ${formatPrice(price)}，预算已更新`, 'success', 2800)
  } else {
    showToast('选型确认成功！', `${dressName} ${formatPrice(price)} 已写入预算`, 'success', 2500)
  }
  setTimeout(() => {
    router.push('/budget')
  }, 1800)
}

const handleCancelContract = (id: string) => {
  dressStore.cancelContractDress(id)
  showToast('已取消签约', '预算已同步更新', 'info')
}

const toggleCompare = (id: string) => {
  const idx = compareIds.value.indexOf(id)
  if (idx >= 0) {
    compareIds.value.splice(idx, 1)
  } else {
    if (compareIds.value.length >= 4) {
      showToast('最多对比4个方案', '请先移除部分方案', 'warning')
      return
    }
    compareIds.value.push(id)
  }
}

const removeFromCompare = (id: string) => {
  compareIds.value = compareIds.value.filter(i => i !== id)
}

const selectFromCompare = (id: string) => {
  openConfirmModal(id)
}

const toggleSortDesc = () => {
  sortDesc.value = !sortDesc.value
}

const typeTabStyle = (type: DressCategory | 'all') =>
  activeTypeTab.value === type
    ? 'bg-primary-500 text-white shadow-md'
    : 'bg-white text-gray-600 hover:bg-primary-50'

const clearDrillHighlight = () => {
  if (drillHighlightTimer) {
    clearTimeout(drillHighlightTimer)
    drillHighlightTimer = null
  }
  drillMode.value = false
  document.removeEventListener('click', clearDrillHighlight)
  document.removeEventListener('scroll', clearDrillHighlight)
}

const applyDrillDown = () => {
  if (route.query.drill !== '1') return

  clearDrillHighlight()
  drillMode.value = true
  filterStatus.value = 'contracted'
  showFilter.value = true
  activeTypeTab.value = 'all'

  const fromLabel = route.query.from === 'overview' ? '总览' : '预算'
  const contractedList = dressStore.dresses.filter(d => d.contracted)

  if (contractedList.length > 0) {
    showToast(
      '已自动定位已确认方案',
      `来自${fromLabel}页饼图下钻 · 共 ${contractedList.length} 项已确认方案`,
      'success',
      3500
    )
  } else {
    showToast(
      '暂无已确认方案',
      `来自${fromLabel}页饼图下钻 · 请先确认选型`,
      'info',
      3500
    )
  }

  nextTick(() => {
    setTimeout(() => {
      if (contractedListRef.value) {
        contractedListRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        window.scrollTo({ top: 200, behavior: 'smooth' })
      }
    }, 150)

    setTimeout(() => {
      document.addEventListener('click', clearDrillHighlight, { once: true })
      document.addEventListener('scroll', clearDrillHighlight, { once: true })
    }, 500)

    drillHighlightTimer = setTimeout(() => {
      clearDrillHighlight()
    }, 12000)
  })
}

onMounted(() => {
  applyDrillDown()
})

onBeforeUnmount(() => {
  clearDrillHighlight()
})

watch(
  () => [route.query.drill, route.query._t],
  () => {
    applyDrillDown()
  }
)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-ivory to-champagne-100 pb-20">
    <div class="animate-fade-in">
      <div class="bg-gradient-to-r from-primary-400 to-primary-500 px-6 pt-12 pb-20 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div class="absolute inset-0 opacity-10">
          <div class="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white"></div>
          <div class="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white"></div>
        </div>
        <div class="relative z-10">
          <div class="flex items-center justify-between mb-4">
            <div class="w-28"></div>
            <div class="text-center">
              <h1 class="text-3xl font-serif font-bold text-white">婚纱礼服</h1>
              <p class="text-primary-100 mt-2">最美一刻，为你而选</p>
            </div>
            <RoleSwitcher />
          </div>

          <div class="grid grid-cols-4 gap-2 mt-6">
            <div class="bg-white/15 backdrop-blur-sm rounded-2xl p-2.5 text-center">
              <p class="text-xl font-bold text-white">{{ dressStore.dresses.length }}</p>
              <p class="text-[10px] text-primary-100 mt-0.5">总方案</p>
            </div>
            <div
              v-for="t in typeGroups"
              :key="t"
              class="bg-white/15 backdrop-blur-sm rounded-2xl p-2.5 text-center"
            >
              <p class="text-xl font-bold text-white">{{ contractedByTypeCount(t) }}/{{ dressStore.dresses.filter(d => d.type === t).length }}</p>
              <p class="text-[10px] text-primary-100 mt-0.5">{{ t }}</p>
            </div>
          </div>

          <div v-if="totalContractedPrice > 0" class="mt-4 bg-white/20 backdrop-blur-sm rounded-2xl p-3">
            <div class="text-center mb-2">
              <p class="text-sm text-primary-50">已确认总金额（含试穿费用）</p>
              <p class="text-2xl font-bold text-white mt-0.5">{{ formatPrice(totalContractedPrice) }}</p>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="bg-white/10 rounded-xl p-2 text-center">
                <p class="text-primary-100">合同金额</p>
                <p class="text-white font-bold mt-0.5">{{ formatPrice(totalContractOnly) }}</p>
              </div>
              <div class="bg-white/10 rounded-xl p-2 text-center">
                <p class="text-primary-100">试穿费用</p>
                <p class="text-white font-bold mt-0.5">{{ formatPrice(totalFittingFee) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="px-4 -mt-12 relative z-20">
        <div class="bg-white rounded-2xl shadow-lg p-4 mb-5 animate-slide-up" style="animation-delay: 0.1s">
          <div class="flex items-center gap-3 mb-3">
            <button
              @click="openAddModal"
              class="flex-1 py-3 bg-gradient-to-r from-primary-400 to-primary-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-md transition-all duration-300"
            >
              <Plus class="w-5 h-5" />
              添加礼服方案
            </button>
            <button
              @click="showCompareModal = true"
              :disabled="compareIds.length < 2"
              class="py-3 px-4 bg-champagne-100 text-champagne-400 rounded-xl font-medium flex items-center gap-2 hover:bg-champagne-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              :class="{ 'bg-primary-500 text-white hover:bg-primary-600': compareIds.length >= 2 }"
            >
              <ArrowLeftRight class="w-5 h-5" />
              <span class="text-sm">{{ compareIds.length >= 2 ? `对比(${compareIds.length})` : '对比' }}</span>
            </button>
            <button
              @click="showFilter = !showFilter"
              class="py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-medium flex items-center gap-2 hover:bg-gray-200 transition-all duration-300"
              :class="{ 'bg-primary-100 text-primary-500': showFilter }"
            >
              <SlidersHorizontal class="w-5 h-5" />
            </button>
          </div>

          <div class="flex gap-2 mb-3">
            <button
              @click="activeTypeTab = 'all'"
              class="flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-300"
              :class="typeTabStyle('all')"
            >
              全部
            </button>
            <button
              v-for="t in typeGroups"
              :key="t"
              @click="activeTypeTab = t"
              class="flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-300"
              :class="typeTabStyle(t)"
            >
              {{ t }}
            </button>
          </div>

          <div v-if="showFilter" class="space-y-3 pt-3 border-t border-gray-100 animate-fade-in">
            <div class="flex items-center gap-3">
              <Filter class="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span class="text-sm text-gray-600 font-medium">状态:</span>
              <div class="flex gap-2 flex-wrap">
                <button
                  v-for="s in ([
                    { key: 'all', label: '全部' },
                    { key: 'contracted', label: '已确认' },
                    { key: 'alternative', label: '备选' }
                  ] as const)"
                  :key="s.key"
                  @click="filterStatus = s.key"
                  class="px-3 py-1.5 text-xs rounded-lg transition-colors"
                  :class="filterStatus === s.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                >
                  {{ s.label }}
                </button>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <ArrowUpDown class="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span class="text-sm text-gray-600 font-medium">排序:</span>
              <div class="flex gap-2 flex-wrap items-center">
                <button
                  v-for="s in ([
                    { key: 'createdAt', label: '添加时间' },
                    { key: 'price', label: '价格' },
                    { key: 'rating', label: '评分' }
                  ] as const)"
                  :key="s.key"
                  @click="sortKey = s.key"
                  class="px-3 py-1.5 text-xs rounded-lg transition-colors"
                  :class="sortKey === s.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                >
                  {{ s.label }}
                </button>
                <button
                  @click="toggleSortDesc"
                  class="px-2 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
                >
                  {{ sortDesc ? '↓ 降序' : '↑ 升序' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="sortedItems.length === 0" class="bg-white rounded-2xl p-10 text-center shadow-md animate-fade-in">
          <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Shirt class="w-10 h-10 text-gray-400" />
          </div>
          <h3 class="text-lg font-bold text-gray-700 mb-2">暂无礼服方案</h3>
          <p class="text-sm text-gray-500 mb-5">点击上方"添加礼服方案"开始建立你的备选库</p>
          <button
            @click="openAddModal"
            class="py-3 px-6 bg-gradient-to-r from-primary-400 to-primary-500 text-white rounded-xl font-medium inline-flex items-center gap-2 hover:shadow-md transition-all duration-300"
          >
            <Plus class="w-5 h-5" />
            立即添加
          </button>
        </div>

        <div ref="contractedListRef" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="(dress, index) in sortedItems"
            :key="dress.id"
            class="animate-slide-up"
            :style="{ animationDelay: `${0.15 + index * 0.08}s` }"
          >
            <div
              :class="[
                'rounded-2xl transition-all duration-700',
                drillMode && dress.contracted ? 'ring-4 ring-green-400 ring-offset-2 ring-offset-transparent shadow-xl scale-[1.02] animate-pulse' : ''
              ]"
            >
              <OptionCard
                :option="dress"
                :title="dress.name"
                :subtitle="`${dress.brand} · ${dress.type}`"
                :image="dress.image"
                :tags="[dress.type, dress.style, dress.color]"
                :meta-items="[
                  { icon: DressPalette, label: '品牌', value: dress.brand },
                  { icon: Ruler, label: '尺码', value: dress.size },
                  { icon: Shirt, label: '颜色', value: dress.color },
                  { icon: Calendar, label: '试纱', value: dress.fittingDate || '待定' }
                ]"
                :selected-for-compare="compareIds.includes(dress.id)"
                :is-changing="!dress.contracted && hasContractedByType(dress.type)"
                @sign="openConfirmModal"
                @cancel="handleCancelContract"
                @edit="openEditModal"
                @delete="handleDelete"
                @toggle-compare="toggleCompare"
              />
            </div>
          </div>
        </div>

        <div v-if="dressStore.sizeChart.length" class="animate-slide-up bg-white rounded-2xl p-5 shadow-md mt-6 mb-5" style="animation-delay: 0.5s">
          <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Ruler class="w-5 h-5 text-primary-400" />
            尺码对照表
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-100">
                  <th class="py-3 px-2 text-left text-gray-500 font-medium">尺码</th>
                  <th class="py-3 px-2 text-center text-gray-500 font-medium">胸围</th>
                  <th class="py-3 px-2 text-center text-gray-500 font-medium">腰围</th>
                  <th class="py-3 px-2 text-center text-gray-500 font-medium">臀围</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in dressStore.sizeChart" :key="row.size" class="border-b border-gray-50">
                  <td class="py-3 px-2 font-medium text-primary-500">{{ row.size }}</td>
                  <td class="py-3 px-2 text-center text-gray-700">{{ row.bust }} cm</td>
                  <td class="py-3 px-2 text-center text-gray-700">{{ row.waist }} cm</td>
                  <td class="py-3 px-2 text-center text-gray-700">{{ row.hip }} cm</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="dressStore.fittingRecords.length" class="animate-slide-up" style="animation-delay: 0.6s">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-800">试纱记录</h2>
            <div v-if="totalFittingFee > 0" class="text-xs text-primary-500 font-medium">
              试穿费用合计：{{ formatPrice(totalFittingFee) }}
            </div>
          </div>
          <div class="space-y-3">
            <div
              v-for="record in dressStore.fittingRecords"
              :key="record.id"
              class="bg-white rounded-2xl p-4 shadow-md"
            >
              <div class="flex items-center justify-between mb-3">
                <div>
                  <p class="font-bold text-gray-800">{{ record.dressName }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ record.date }} {{ record.time }}</p>
                </div>
                <div v-if="calcRecordTotal(record) > 0" class="text-right">
                  <p class="text-lg font-bold text-primary-500">{{ formatPrice(calcRecordTotal(record)) }}</p>
                  <p class="text-[10px] text-gray-400">本次费用</p>
                </div>
              </div>

              <div v-if="calcRecordTotal(record) > 0" class="mb-3 grid grid-cols-4 gap-2 text-xs">
                <div v-if="record.alterationFee > 0" class="bg-champagne-50 rounded-lg p-2 text-center">
                  <p class="text-gray-400">修改费</p>
                  <p class="font-medium text-champagne-400 mt-0.5">{{ formatPrice(record.alterationFee) }}</p>
                </div>
                <div v-if="record.accessoryFee > 0" class="bg-primary-50 rounded-lg p-2 text-center">
                  <p class="text-gray-400">配饰费</p>
                  <p class="font-medium text-primary-500 mt-0.5">{{ formatPrice(record.accessoryFee) }}</p>
                </div>
                <div v-if="record.cleaningFee > 0" class="bg-morandi-green/10 rounded-lg p-2 text-center">
                  <p class="text-gray-400">清洗费</p>
                  <p class="font-medium text-morandi-green mt-0.5">{{ formatPrice(record.cleaningFee) }}</p>
                </div>
                <div v-if="record.otherFee > 0" class="bg-morandi-purple/10 rounded-lg p-2 text-center">
                  <p class="text-gray-400">其他费</p>
                  <p class="font-medium text-morandi-purple mt-0.5">{{ formatPrice(record.otherFee) }}</p>
                </div>
              </div>

              <p class="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">{{ record.notes }}</p>
            </div>
          </div>
        </div>
      </div>

      <OptionFormModal
        :visible="showFormModal"
        :title="editItem ? '编辑礼服方案' : '添加礼服方案'"
        category="dress"
        :edit-data="editItem"
        @close="showFormModal = false; editItem = null"
        @submit="handleFormSubmit"
      />

      <CompareModal
        :visible="showCompareModal"
        :items="compareItems"
        category="婚纱"
        @close="showCompareModal = false"
        @remove="removeFromCompare"
        @select="selectFromCompare"
      />

      <ConfirmSelectionModal
        :visible="showConfirmModal"
        :option="selectedForConfirm ? {
          id: selectedForConfirm.id,
          title: selectedForConfirm.name,
          subtitle: `${selectedForConfirm.brand} · ${selectedForConfirm.type}`,
          price: selectedForConfirm.price,
          image: selectedForConfirm.image
        } : null"
        category="婚纱"
        budget-category="婚纱"
        :current-budget="budgetItem ? {
          planned: budgetItem.planned,
          actual: budgetItem.actual,
          locked: budgetItem.locked
        } : undefined"
        :previous-option="previousForConfirm"
        @close="showConfirmModal = false; selectedForConfirm = null"
        @confirm="handleConfirmSelection"
      />

      <Toast
        :visible="toastVisible"
        :message="toastMessage"
        :description="toastDescription"
        :type="toastType"
      />
    </div>
  </div>
</template>
