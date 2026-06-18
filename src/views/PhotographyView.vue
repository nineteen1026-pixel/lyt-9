<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePhotographyStore, type Photography } from '@/stores/photography'
import { useBudgetStore } from '@/stores/budget'
import { Camera, Calendar, Palette, Plus, Filter, ArrowUpDown, SlidersHorizontal, ArrowLeftRight, Check } from 'lucide-vue-next'
import OptionCard from '@/components/OptionCard.vue'
import OptionFormModal from '@/components/OptionFormModal.vue'
import CompareModal from '@/components/CompareModal.vue'
import ConfirmSelectionModal from '@/components/ConfirmSelectionModal.vue'
import Toast from '@/components/Toast.vue'

const router = useRouter()
const photographyStore = usePhotographyStore()
const budgetStore = useBudgetStore()

const showFormModal = ref(false)
const showCompareModal = ref(false)
const showConfirmModal = ref(false)
const editItem = ref<Photography | null>(null)
const selectedForConfirm = ref<Photography | null>(null)
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

const hasContractedItem = computed(() => photographyStore.items.some(p => p.contracted))

const currentContractedItem = computed(() => photographyStore.items.find(p => p.contracted) ?? null)

const previousForConfirm = computed(() => {
  if (!selectedForConfirm.value) return null
  if (!currentContractedItem.value) return null
  if (currentContractedItem.value.id === selectedForConfirm.value.id) return null
  return {
    id: currentContractedItem.value.id,
    title: currentContractedItem.value.teamName,
    subtitle: currentContractedItem.value.packageType,
    price: currentContractedItem.value.price,
    contractPrice: currentContractedItem.value.contractPrice
  }
})

const sortedItems = computed(() => {
  let list = [...photographyStore.items]
  if (filterStatus.value === 'contracted') {
    list = list.filter(p => p.contracted)
  } else if (filterStatus.value === 'alternative') {
    list = list.filter(p => !p.contracted)
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

const contractedCount = computed(() => photographyStore.items.filter(p => p.contracted).length)
const alternativeCount = computed(() => photographyStore.items.filter(p => !p.contracted).length)
const totalContractedPrice = computed(() => photographyStore.items.filter(p => p.contracted).reduce((s, p) => s + p.contractPrice, 0))

const compareItems = computed(() => {
  return compareIds.value
    .map(id => photographyStore.getItemById(id))
    .filter(Boolean)
    .map(p => ({
      id: p!.id,
      title: p!.teamName,
      subtitle: p!.packageType,
      price: p!.price,
      rating: p!.rating,
      pros: p!.pros,
      cons: p!.cons,
      contracted: p!.contracted,
      extraFields: [
        { label: '风格', value: p!.style },
        { label: '套餐', value: p!.packageType },
        { label: '拍摄日期', value: p!.shootDate || '-' }
      ]
    }))
})

const budgetItem = computed(() => budgetStore.getItemByCategory('摄影'))

const openAddModal = () => {
  editItem.value = null
  showFormModal.value = true
}

const openEditModal = (id: string) => {
  const item = photographyStore.getItemById(id)
  if (item) {
    editItem.value = { ...item }
    showFormModal.value = true
  }
}

const handleFormSubmit = (data: any) => {
  if (editItem.value) {
    photographyStore.updateItem(editItem.value.id, data)
    showToast('修改成功', '摄影方案已更新', 'success')
  } else {
    photographyStore.addItem(data)
    showToast('添加成功', '已添加到摄影方案库', 'success')
  }
  showFormModal.value = false
  editItem.value = null
}

const handleDelete = (id: string) => {
  if (confirm('确定要删除此摄影方案吗？')) {
    const item = photographyStore.getItemById(id)
    photographyStore.deleteItem(id)
    compareIds.value = compareIds.value.filter(i => i !== id)
    showToast('已删除', item?.teamName ?? '', 'info')
  }
}

const openConfirmModal = (id: string) => {
  const item = photographyStore.getItemById(id)
  if (item) {
    selectedForConfirm.value = item
    showConfirmModal.value = true
  }
}

const handleConfirmSelection = (_id: string, price: number) => {
  if (!selectedForConfirm.value) return
  const id = selectedForConfirm.value.id
  const teamName = selectedForConfirm.value.teamName
  const isChange = !!previousForConfirm.value
  const previousName = previousForConfirm.value?.title
  photographyStore.updateContractItem(id, price)
  showConfirmModal.value = false
  showCompareModal.value = false
  compareIds.value = []
  selectedForConfirm.value = null
  if (isChange && previousName) {
    showToast('套系变更成功！', `${previousName} → ${teamName} ${formatPrice(price)}，预算已更新`, 'success', 2800)
  } else {
    showToast('选型确认成功！', `${teamName} ${formatPrice(price)} 已写入预算`, 'success', 2500)
  }
  setTimeout(() => {
    router.push('/budget')
  }, 1800)
}

const handleCancelContract = (id: string) => {
  photographyStore.cancelContractItem(id)
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

const getAvatarColor = (name: string) => {
  const colors = ['bg-primary-400', 'bg-champagne-300', 'bg-morandi-purple', 'bg-morandi-green']
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}
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
          <h1 class="text-3xl font-serif font-bold text-white text-center">摄影团队</h1>
          <p class="text-primary-100 text-center mt-2">光影流转，定格永恒瞬间</p>

          <div class="grid grid-cols-3 gap-3 mt-6">
            <div class="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
              <p class="text-2xl font-bold text-white">{{ photographyStore.items.length }}</p>
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
              添加摄影方案
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

        <div v-if="sortedItems.length === 0" class="bg-white rounded-2xl p-10 text-center shadow-md animate-fade-in">
          <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Camera class="w-10 h-10 text-gray-400" />
          </div>
          <h3 class="text-lg font-bold text-gray-700 mb-2">暂无摄影方案</h3>
          <p class="text-sm text-gray-500 mb-5">点击上方"添加摄影方案"开始建立你的备选库</p>
          <button
            @click="openAddModal"
            class="py-3 px-6 bg-gradient-to-r from-primary-400 to-primary-500 text-white rounded-xl font-medium inline-flex items-center gap-2 hover:shadow-md transition-all duration-300"
          >
            <Plus class="w-5 h-5" />
            立即添加
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="(item, index) in sortedItems"
            :key="item.id"
            class="animate-slide-up"
            :style="{ animationDelay: `${0.15 + index * 0.08}s` }"
          >
            <OptionCard
              :option="item"
              :title="item.teamName"
              :subtitle="item.packageType"
              :tags="[item.style, item.packageType]"
              :meta-items="[
                { icon: Palette, label: '风格', value: item.style },
                { icon: Calendar, label: '日期', value: item.shootDate || '待定' }
              ]"
              :selected-for-compare="compareIds.includes(item.id)"
              :is-changing="!item.contracted && hasContractedItem"
              @sign="openConfirmModal"
              @cancel="handleCancelContract"
              @edit="openEditModal"
              @delete="handleDelete"
              @toggle-compare="toggleCompare"
            />
          </div>
        </div>

        <div class="animate-slide-up bg-white rounded-2xl p-5 shadow-md mt-6 mb-5" style="animation-delay: 0.4s">
          <h2 class="text-lg font-bold text-gray-800 mb-4">团队介绍</h2>
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="(member, index) in photographyStore.team"
              :key="member.id"
              class="flex items-center gap-3 p-3 bg-primary-50/50 rounded-xl"
              :style="{ animationDelay: `${0.2 + index * 0.1}s` }"
            >
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                :class="getAvatarColor(member.name)"
              >
                {{ member.avatar }}
              </div>
              <div>
                <p class="font-medium text-gray-800 text-sm">{{ member.name }}</p>
                <p class="text-xs text-gray-500">{{ member.role }}</p>
                <p class="text-xs text-primary-400">{{ member.experience }}经验</p>
              </div>
            </div>
          </div>
        </div>

        <div class="animate-slide-up mb-5" style="animation-delay: 0.5s">
          <h2 class="text-lg font-bold text-gray-800 mb-4">作品展示</h2>
          <div class="grid grid-cols-3 gap-2">
            <div
              v-for="(pItem, index) in photographyStore.portfolio"
              :key="pItem.id"
              class="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
              :style="{ animationDelay: `${0.4 + index * 0.1}s` }"
            >
              <img
                :src="pItem.image"
                :alt="pItem.title"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p class="absolute bottom-2 left-2 right-2 text-white text-xs font-medium text-center">{{ pItem.title }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="animate-slide-up" style="animation-delay: 0.6s">
          <h2 class="text-lg font-bold text-gray-800 mb-4">套餐参考</h2>
          <div class="space-y-3">
            <div
              v-for="pkg in photographyStore.packages"
              :key="pkg.id"
              class="bg-white rounded-2xl p-4 shadow-md"
            >
              <div class="flex items-center justify-between mb-3">
                <div>
                  <p class="font-bold text-gray-800">{{ pkg.name }}</p>
                  <div class="flex gap-2 mt-1 text-xs text-gray-500">
                    <span>{{ pkg.photographers }}位摄影</span>
                    <span>·</span>
                    <span>{{ pkg.photos }}张照片</span>
                    <span>·</span>
                    <span>{{ pkg.videos }}个视频</span>
                  </div>
                </div>
                <p class="text-xl font-bold text-primary-500">{{ formatPrice(pkg.price) }}</p>
              </div>
              <div class="space-y-1">
                <div
                  v-for="extra in pkg.includes.slice(0, 3)"
                  :key="extra"
                  class="flex items-center gap-2"
                >
                  <div class="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check class="w-2.5 h-2.5 text-green-500" />
                  </div>
                  <span class="text-xs text-gray-600">{{ extra }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <OptionFormModal
        :visible="showFormModal"
        :title="editItem ? '编辑摄影方案' : '添加摄影方案'"
        category="photography"
        :edit-data="editItem"
        @close="showFormModal = false; editItem = null"
        @submit="handleFormSubmit"
      />

      <CompareModal
        :visible="showCompareModal"
        :items="compareItems"
        category="摄影"
        @close="showCompareModal = false"
        @remove="removeFromCompare"
        @select="selectFromCompare"
      />

      <ConfirmSelectionModal
        :visible="showConfirmModal"
        :option="selectedForConfirm ? {
          id: selectedForConfirm.id,
          title: selectedForConfirm.teamName,
          subtitle: selectedForConfirm.packageType,
          price: selectedForConfirm.price
        } : null"
        category="摄影"
        budget-category="摄影"
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
