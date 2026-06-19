<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useVenuesStore, type Venue } from '@/stores/venues'
import { useBudgetStore } from '@/stores/budget'
import { useRoleStore } from '@/stores/role'
import { MapPin, Users, Tag, Plus, Filter, ArrowUpDown, SlidersHorizontal, ArrowLeftRight, X } from 'lucide-vue-next'
import OptionCard from '@/components/OptionCard.vue'
import OptionFormModal from '@/components/OptionFormModal.vue'
import CompareModal from '@/components/CompareModal.vue'
import ConfirmSelectionModal from '@/components/ConfirmSelectionModal.vue'
import Toast from '@/components/Toast.vue'
import RoleSwitcher from '@/components/RoleSwitcher.vue'

const router = useRouter()
const route = useRoute()
const venuesStore = useVenuesStore()
const budgetStore = useBudgetStore()
const roleStore = useRoleStore()

const drillMode = ref(false)
const contractedListRef = ref<HTMLElement | null>(null)
let drillHighlightTimer: ReturnType<typeof setTimeout> | null = null

const showFormModal = ref(false)
const showCompareModal = ref(false)
const showConfirmModal = ref(false)
const editVenue = ref<Venue | null>(null)
const selectedForConfirm = ref<Venue | null>(null)
const compareIds = ref<string[]>([])

type SortKey = 'createdAt' | 'price' | 'rating'
type FilterStatus = 'all' | 'contracted' | 'alternative'
const sortKey = ref<SortKey>('createdAt')
const sortDesc = ref(true)
const filterStatus = ref<FilterStatus>('all')
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

const hasBookedVenue = computed(() => venuesStore.venues.some(v => v.contracted))

const sortedVenues = computed(() => {
  let list = [...venuesStore.venues]
  if (filterStatus.value === 'contracted') {
    list = list.filter(v => v.contracted)
  } else if (filterStatus.value === 'alternative') {
    list = list.filter(v => !v.contracted)
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

const contractedCount = computed(() => venuesStore.venues.filter(v => v.contracted).length)
const alternativeCount = computed(() => venuesStore.venues.filter(v => !v.contracted).length)
const totalContractedPrice = computed(() => venuesStore.venues.filter(v => v.contracted).reduce((s, v) => s + v.contractPrice, 0))

const compareItems = computed(() => {
  return compareIds.value
    .map(id => venuesStore.getVenueById(id))
    .filter(Boolean)
    .map(v => ({
      id: v!.id,
      title: v!.name,
      subtitle: v!.address,
      price: v!.price,
      rating: v!.rating,
      pros: v!.pros,
      cons: v!.cons,
      image: v!.image,
      contracted: v!.contracted,
      extraFields: [
        { label: '容纳人数', value: `${v!.capacity}人` },
        { label: '地址', value: v!.address },
        { label: '特色', value: v!.features.slice(0, 3).join('、') }
      ]
    }))
})

const budgetItem = computed(() => budgetStore.getItemByCategory('场地'))

const openAddModal = () => {
  editVenue.value = null
  showFormModal.value = true
}

const openEditModal = (id: string) => {
  const venue = venuesStore.getVenueById(id)
  if (venue) {
    editVenue.value = { ...venue }
    showFormModal.value = true
  }
}

const handleFormSubmit = (data: any) => {
  if (editVenue.value) {
    venuesStore.updateVenue(editVenue.value.id, data)
    showToast('修改成功', '场地信息已更新', 'success')
  } else {
    venuesStore.addVenue(data)
    showToast('添加成功', '已添加到场地方案库', 'success')
  }
  showFormModal.value = false
  editVenue.value = null
}

const handleDelete = (id: string) => {
  if (confirm('确定要删除此场地方案吗？')) {
    const venue = venuesStore.getVenueById(id)
    venuesStore.deleteVenue(id)
    compareIds.value = compareIds.value.filter(i => i !== id)
    showToast('已删除', venue?.name ?? '', 'info')
  }
}

const openConfirmModal = (id: string) => {
  const venue = venuesStore.getVenueById(id)
  if (venue) {
    selectedForConfirm.value = venue
    showConfirmModal.value = true
  }
}

const handleConfirmSelection = (_id: string, price: number) => {
  if (!selectedForConfirm.value) return
  const id = selectedForConfirm.value.id
  const venueName = selectedForConfirm.value.name
  venuesStore.updateContractVenue(id, price)
  showConfirmModal.value = false
  showCompareModal.value = false
  compareIds.value = []
  selectedForConfirm.value = null
  showToast('选型确认成功！', `${venueName} ${formatPrice(price)} 已写入预算`, 'success', 2500)
  setTimeout(() => {
    router.push('/budget')
  }, 1800)
}

const handleCancelContract = (id: string) => {
  venuesStore.cancelContractVenue(id)
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

  const fromLabel = route.query.from === 'overview' ? '总览' : '预算'
  const contractedList = venuesStore.venues.filter(v => v.contracted)

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
              <h1 class="text-3xl font-serif font-bold text-white">婚礼场地</h1>
              <p class="text-primary-100 mt-2">多方案甄选，定格完美场地</p>
            </div>
            <RoleSwitcher />
          </div>

          <div class="grid grid-cols-3 gap-3 mt-6">
            <div class="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
              <p class="text-2xl font-bold text-white">{{ venuesStore.venues.length }}</p>
              <p class="text-xs text-primary-100 mt-0.5">方案总数</p>
            </div>
            <div class="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
              <p class="text-2xl font-bold text-white">{{ contractedCount }}</p>
              <p class="text-xs text-primary-100 mt-0.5">已确认</p>
            </div>
            <div class="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
              <p class="text-2xl font-bold text-white">{{ alternativeCount }}</p>
              <p class="text-xs text-primary-100 mt-0.5">待选方案</p>
            </div>
          </div>

          <div v-if="totalContractedPrice > 0" class="mt-4 bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p class="text-sm text-primary-50">已确认合同金额</p>
            <p class="text-xl font-bold text-white mt-0.5">{{ formatPrice(totalContractedPrice) }}</p>
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
              添加场地方案
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

        <div v-if="sortedVenues.length === 0" class="bg-white rounded-2xl p-10 text-center shadow-md animate-fade-in">
          <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <MapPin class="w-10 h-10 text-gray-400" />
          </div>
          <h3 class="text-lg font-bold text-gray-700 mb-2">暂无场地方案</h3>
          <p class="text-sm text-gray-500 mb-5">点击上方"添加场地方案"开始建立你的备选库</p>
          <button
            @click="openAddModal"
            class="py-3 px-6 bg-gradient-to-r from-primary-400 to-primary-500 text-white rounded-xl font-medium inline-flex items-center gap-2 hover:shadow-md transition-all duration-300"
          >
            <Plus class="w-5 h-5" />
            立即添加
          </button>
        </div>

        <div v-else ref="contractedListRef" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          <div
            v-for="(venue, index) in sortedVenues"
            :key="venue.id"
            class="animate-slide-up"
            :style="{ animationDelay: `${0.15 + index * 0.08}s` }"
          >
            <div
              :class="[
                'rounded-2xl transition-all duration-700',
                drillMode && venue.contracted ? 'ring-4 ring-green-400 ring-offset-2 ring-offset-transparent shadow-xl scale-[1.02] animate-pulse' : ''
              ]"
            >
              <OptionCard
                :option="venue"
                :title="venue.name"
                :subtitle="venue.address"
                :image="venue.image"
                :tags="venue.features"
                :meta-items="[
                  { icon: MapPin, label: '地址', value: venue.address },
                  { icon: Users, label: '容纳', value: `${venue.capacity}人` },
                  { icon: Tag, label: '报价', value: formatPrice(venue.price) }
                ]"
                :selected-for-compare="compareIds.includes(venue.id)"
                :disabled="!venue.contracted && hasBookedVenue"
                @sign="openConfirmModal"
                @cancel="handleCancelContract"
                @edit="openEditModal"
                @delete="handleDelete"
                @toggle-compare="toggleCompare"
              />
            </div>
          </div>
        </div>
      </div>

      <OptionFormModal
        :visible="showFormModal"
        :title="editVenue ? '编辑场地' : '添加场地方案'"
        category="venue"
        :edit-data="editVenue"
        @close="showFormModal = false; editVenue = null"
        @submit="handleFormSubmit"
      />

      <CompareModal
        :visible="showCompareModal"
        :items="compareItems"
        category="场地"
        @close="showCompareModal = false"
        @remove="removeFromCompare"
        @select="selectFromCompare"
      />

      <ConfirmSelectionModal
        :visible="showConfirmModal"
        :option="selectedForConfirm ? {
          id: selectedForConfirm.id,
          title: selectedForConfirm.name,
          subtitle: selectedForConfirm.address,
          price: selectedForConfirm.price,
          image: selectedForConfirm.image
        } : null"
        category="场地"
        budget-category="场地"
        :current-budget="budgetItem ? {
          planned: budgetItem.planned,
          actual: budgetItem.actual,
          locked: budgetItem.locked
        } : undefined"
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
