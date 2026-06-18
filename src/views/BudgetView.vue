<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBudgetStore } from '@/stores/budget'
import { useGuestsStore } from '@/stores/guests'
import { useVenuesStore } from '@/stores/venues'
import { usePhotographyStore } from '@/stores/photography'
import { useDressStore } from '@/stores/dress'
import PieChart from '@/components/PieChart.vue'
import Toast from '@/components/Toast.vue'
import { Wallet, TrendingDown, TrendingUp, Target, AlertTriangle, Info, Lock, MapPin, Camera, Shirt, ExternalLink, CheckCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-vue-next'

const router = useRouter()
const budgetStore = useBudgetStore()
const guestsStore = useGuestsStore()
const venuesStore = useVenuesStore()
const photographyStore = usePhotographyStore()
const dressStore = useDressStore()

const expandedCategory = ref<string | null>(null)

const toastVisible = ref(false)
const toastMessage = ref('')
const toastDescription = ref('')
const toastType = ref<'success' | 'error' | 'warning' | 'info'>('warning')

const showToast = (message: string, description?: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', duration = 2500) => {
  toastMessage.value = message
  toastDescription.value = description ?? ''
  toastType.value = type
  toastVisible.value = true
  setTimeout(() => {
    toastVisible.value = false
  }, duration)
}

onMounted(() => {
  if (guestsStore.capacityWarning) {
    toastMessage.value = guestsStore.capacityWarning.title
    toastDescription.value = guestsStore.capacityWarning.content
    toastType.value = guestsStore.hasBookedVenue ? 'warning' : 'info'
    toastVisible.value = true
    setTimeout(() => {
      toastVisible.value = false
    }, 5000)
  }
})

const formatCurrency = (value: number) => {
  return `¥${value.toLocaleString()}`
}

const totalBudget = computed(() => budgetStore.items.reduce((sum, item) => sum + item.budget, 0))
const totalSpent = computed(() => budgetStore.items.reduce((sum, item) => sum + item.actual, 0))
const remaining = computed(() => totalBudget.value - totalSpent.value)
const progress = computed(() => Math.min((totalSpent.value / totalBudget.value) * 100, 100))

const isOverBudget = (budget: number, actual: number) => {
  return actual > budget
}

const pieData = computed(() =>
  budgetStore.items.map(item => ({
    name: item.category,
    value: item.actual,
    color: item.color,
    overBudget: isOverBudget(item.budget, item.actual)
  }))
)

const getDifferenceClass = (diff: number) => {
  if (diff > 0) return 'text-green-500'
  if (diff < 0) return 'text-red-500'
  return 'text-gray-500'
}

const getDifferenceIcon = (diff: number) => {
  if (diff > 0) return TrendingDown
  if (diff < 0) return TrendingUp
  return Target
}

const categoryIcon = (category: string) => {
  switch (category) {
    case '场地': return MapPin
    case '摄影': return Camera
    case '婚纱': return Shirt
    default: return null
  }
}

const categoryRoute = (category: string) => {
  switch (category) {
    case '场地': return '/venues'
    case '摄影': return '/photography'
    case '婚纱': return '/dress'
    default: return null
  }
}

const getSelectedOptions = (category: string) => {
  switch (category) {
    case '场地':
      return venuesStore.venues
        .filter(v => v.contracted)
        .map(v => ({ id: v.id, name: v.name, subtitle: v.address, price: v.contractPrice, image: v.image }))
    case '摄影':
      return photographyStore.items
        .filter(p => p.contracted)
        .map(p => ({ id: p.id, name: p.teamName, subtitle: p.packageType, price: p.contractPrice, image: null }))
    case '婚纱':
      return dressStore.dresses
        .filter(d => d.contracted)
        .map(d => ({ id: d.id, name: d.name, subtitle: `${d.brand} · ${d.type}`, price: d.contractPrice, image: d.image }))
    default:
      return []
  }
}

const getAlternativeOptions = (category: string) => {
  switch (category) {
    case '场地':
      return venuesStore.venues
        .filter(v => !v.contracted)
        .map(v => ({ id: v.id, name: v.name, subtitle: v.address, price: v.price, image: v.image }))
    case '摄影':
      return photographyStore.items
        .filter(p => !p.contracted)
        .map(p => ({ id: p.id, name: p.teamName, subtitle: p.packageType, price: p.price, image: null }))
    case '婚纱':
      return dressStore.dresses
        .filter(d => !d.contracted)
        .map(d => ({ id: d.id, name: d.name, subtitle: `${d.brand} · ${d.type}`, price: d.price, image: d.image }))
    default:
      return []
  }
}

const toggleExpand = (category: string) => {
  expandedCategory.value = expandedCategory.value === category ? null : category
}

const handleSync = () => {
  budgetStore.syncContractedToBudget()
  showToast('同步成功', '已将所有选型的合同金额同步到预算', 'success')
}

const goToCategory = (category: string) => {
  const route = categoryRoute(category)
  if (route) router.push(route)
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
          <h1 class="text-3xl font-serif font-bold text-white text-center">婚礼预算</h1>
          <p class="text-primary-100 text-center mt-2">精心规划，幸福启航</p>

          <div class="flex items-center justify-center mt-4">
            <button
              @click="handleSync"
              class="py-2 px-4 bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-medium flex items-center gap-1.5 hover:bg-white/30 transition-colors"
            >
              <RefreshCw class="w-4 h-4" />
              同步选型金额
            </button>
          </div>
        </div>
      </div>

      <div class="px-4 -mt-12 relative z-20">
        <div v-if="guestsStore.capacityWarning" class="animate-slide-up mb-4 rounded-2xl p-4 shadow-md" style="animation-delay: 0.05s"
          :class="guestsStore.hasBookedVenue ? 'bg-red-50 border-2 border-red-300' : 'bg-yellow-50 border-2 border-yellow-300'">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              :class="guestsStore.hasBookedVenue ? 'bg-red-100' : 'bg-yellow-100'">
              <component :is="guestsStore.hasBookedVenue ? AlertTriangle : Info" class="w-6 h-6" :class="guestsStore.hasBookedVenue ? 'text-red-500' : 'text-yellow-500'" />
            </div>
            <div class="flex-1">
              <p class="font-bold" :class="guestsStore.hasBookedVenue ? 'text-red-700' : 'text-yellow-700'">{{ guestsStore.capacityWarning.title }}</p>
              <p class="text-sm mt-1" :class="guestsStore.hasBookedVenue ? 'text-red-600' : 'text-yellow-600'">{{ guestsStore.capacityWarning.content }}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-6">
          <div class="animate-slide-up bg-white rounded-2xl p-4 shadow-md" style="animation-delay: 0.1s">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <Wallet class="w-5 h-5 text-primary-500" />
              </div>
              <span class="text-sm text-gray-500">总预算</span>
            </div>
            <p class="text-xl font-bold text-gray-800">{{ formatCurrency(totalBudget) }}</p>
          </div>

          <div class="animate-slide-up bg-white rounded-2xl p-4 shadow-md" style="animation-delay: 0.2s">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-10 h-10 rounded-xl bg-champagne-100 flex items-center justify-center">
                <TrendingUp class="w-5 h-5 text-champagne-300" />
              </div>
              <span class="text-sm text-gray-500">已支出</span>
            </div>
            <p class="text-xl font-bold text-champagne-300">{{ formatCurrency(totalSpent) }}</p>
          </div>

          <div class="animate-slide-up bg-white rounded-2xl p-4 shadow-md" style="animation-delay: 0.3s">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingDown class="w-5 h-5 text-green-500" />
              </div>
              <span class="text-sm text-gray-500">剩余</span>
            </div>
            <p class="text-xl font-bold text-green-500">{{ formatCurrency(remaining) }}</p>
          </div>

          <div class="animate-slide-up bg-white rounded-2xl p-4 shadow-md" style="animation-delay: 0.4s">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <Target class="w-5 h-5 text-primary-500" />
              </div>
              <span class="text-sm text-gray-500">进度</span>
            </div>
            <p class="text-xl font-bold text-primary-500">{{ progress.toFixed(1) }}%</p>
          </div>
        </div>

        <div class="w-full bg-white rounded-full h-3 mb-6 overflow-hidden shadow-inner animate-slide-up" style="animation-delay: 0.5s">
          <div
            class="h-full bg-gradient-to-r from-primary-400 to-primary-500 rounded-full transition-all duration-1000 ease-out"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>

        <div class="animate-slide-up bg-white rounded-2xl p-4 shadow-md mb-6" style="animation-delay: 0.6s">
          <h2 class="text-lg font-bold text-gray-800 mb-4">支出分布</h2>
          <PieChart :data="pieData" class="w-full h-64" />
        </div>

        <div class="animate-slide-up" style="animation-delay: 0.7s">
          <h2 class="text-lg font-bold text-gray-800 mb-4">支出明细</h2>
          <div class="space-y-3">
            <div
              v-for="(item, index) in budgetStore.items"
              :key="item.id"
              class="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              :class="{
                'ring-2 ring-red-400 bg-red-50': isOverBudget(item.budget, item.actual),
                'ring-2 ring-primary-300 bg-primary-50/50': item.locked
              }"
              :style="{ animationDelay: `${0.8 + index * 0.1}s` }"
            >
              <div
                class="p-4 cursor-pointer"
                @click="toggleExpand(item.category)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-xl flex items-center justify-center relative"
                      :style="{ backgroundColor: item.color + '20' }"
                    >
                      <component
                        v-if="categoryIcon(item.category)"
                        :is="categoryIcon(item.category)"
                        class="w-5 h-5"
                        :style="{ color: item.color }"
                      />
                      <div v-else class="w-3 h-3 rounded-full" :style="{ backgroundColor: item.color }"></div>
                      <div v-if="item.locked" class="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                        <Lock class="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>
                    <div>
                      <div class="flex items-center gap-1.5">
                        <p class="font-medium" :class="isOverBudget(item.budget, item.actual) ? 'text-red-600' : 'text-gray-800'">{{ item.category }}</p>
                        <span v-if="item.locked" class="text-xs text-primary-500 bg-primary-100 px-1.5 py-0.5 rounded-full">已锁定</span>
                      </div>
                      <p class="text-xs" :class="isOverBudget(item.budget, item.actual) ? 'text-red-400' : 'text-gray-400'">预算: {{ formatCurrency(item.budget) }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="text-right">
                      <p class="font-medium" :class="isOverBudget(item.budget, item.actual) ? 'text-red-600' : 'text-gray-800'">{{ formatCurrency(item.actual) }}</p>
                      <div class="flex items-center justify-end gap-1">
                        <component
                          :is="getDifferenceIcon(item.budget - item.actual)"
                          class="w-3 h-3"
                          :class="getDifferenceClass(item.budget - item.actual)"
                        />
                        <span
                          class="text-xs font-medium"
                          :class="getDifferenceClass(item.budget - item.actual)"
                        >
                          {{ item.budget - item.actual > 0 ? '+' : '' }}{{ formatCurrency(item.budget - item.actual) }}
                          <span v-if="isOverBudget(item.budget, item.actual)" class="ml-1">(超支)</span>
                        </span>
                      </div>
                    </div>
                    <component
                      :is="expandedCategory === item.category ? ChevronUp : ChevronDown"
                      class="w-5 h-5 text-gray-400"
                    />
                  </div>
                </div>

                <div
                  v-if="getSelectedOptions(item.category).length"
                  class="mt-3 flex items-center gap-2"
                >
                  <CheckCircle class="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span class="text-xs text-green-600 flex-1 truncate">
                    已选: {{ getSelectedOptions(item.category).map(o => o.name).join('、') }}
                  </span>
                </div>
                <div
                  v-else-if="categoryRoute(item.category)"
                  class="mt-3 flex items-center gap-2"
                >
                  <Info class="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span class="text-xs text-gray-500 flex-1">
                    暂无选型，去{{ item.category }}页面添加方案
                  </span>
                </div>
              </div>

              <div
                v-if="expandedCategory === item.category"
                class="border-t border-gray-100 p-4 bg-gray-50/50 animate-fade-in"
              >
                <div v-if="getSelectedOptions(item.category).length" class="mb-4">
                  <h4 class="text-sm font-bold text-green-600 mb-3 flex items-center gap-1.5">
                    <CheckCircle class="w-4 h-4" />
                    已确认方案
                    <span class="text-xs font-normal text-green-500 ml-auto">
                      {{ formatCurrency(getSelectedOptions(item.category).reduce((s, o) => s + o.price, 0)) }}
                    </span>
                  </h4>
                  <div class="space-y-2">
                    <div
                      v-for="opt in getSelectedOptions(item.category)"
                      :key="opt.id"
                      class="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200"
                    >
                      <div
                        v-if="opt.image"
                        class="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-sm"
                      >
                        <img :src="opt.image" :alt="opt.name" class="w-full h-full object-cover" />
                      </div>
                      <div
                        v-else
                        class="w-14 h-14 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0"
                      >
                        <component :is="categoryIcon(item.category)" class="w-6 h-6 text-green-500" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="font-medium text-gray-800 text-sm truncate">{{ opt.name }}</p>
                        <p class="text-xs text-gray-500 truncate">{{ opt.subtitle }}</p>
                      </div>
                      <div class="text-right flex-shrink-0">
                        <p class="font-bold text-green-600 text-sm">{{ formatCurrency(opt.price) }}</p>
                        <span class="text-[10px] text-green-500">合同价</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="getAlternativeOptions(item.category).length" class="mb-4">
                  <h4 class="text-sm font-bold text-champagne-400 mb-3 flex items-center gap-1.5">
                    <Target class="w-4 h-4" />
                    待选方案 ({{ getAlternativeOptions(item.category).length }})
                    <span class="text-xs font-normal text-champagne-300 ml-auto">
                      报价范围 {{ formatCurrency(Math.min(...getAlternativeOptions(item.category).map(o => o.price))) }} - {{ formatCurrency(Math.max(...getAlternativeOptions(item.category).map(o => o.price))) }}
                    </span>
                  </h4>
                  <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
                    <div
                      v-for="opt in getAlternativeOptions(item.category)"
                      :key="opt.id"
                      class="flex items-center gap-3 p-3 bg-white rounded-xl border border-champagne-100"
                    >
                      <div
                        v-if="opt.image"
                        class="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-sm"
                      >
                        <img :src="opt.image" :alt="opt.name" class="w-full h-full object-cover" />
                      </div>
                      <div
                        v-else
                        class="w-12 h-12 rounded-lg bg-champagne-50 flex items-center justify-center flex-shrink-0"
                      >
                        <component :is="categoryIcon(item.category)" class="w-5 h-5 text-champagne-300" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="font-medium text-gray-800 text-sm truncate">{{ opt.name }}</p>
                        <p class="text-xs text-gray-400 truncate">{{ opt.subtitle }}</p>
                      </div>
                      <div class="text-right flex-shrink-0">
                        <p class="font-bold text-champagne-400 text-sm">{{ formatCurrency(opt.price) }}</p>
                        <span class="text-[10px] text-champagne-300">报价</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="categoryRoute(item.category)" class="flex justify-center pt-2 border-t border-gray-100">
                  <button
                    @click.stop="goToCategory(item.category)"
                    class="py-2.5 px-5 bg-gradient-to-r from-primary-400 to-primary-500 text-white rounded-xl text-sm font-medium flex items-center gap-1.5 hover:shadow-md transition-all duration-300"
                  >
                    <ExternalLink class="w-4 h-4" />
                    去{{ item.category }}页面选型
                  </button>
                </div>

                <div v-if="!categoryRoute(item.category) && !getSelectedOptions(item.category).length && !getAlternativeOptions(item.category).length" class="text-center py-4">
                  <p class="text-sm text-gray-400">该分类暂无关联的方案选型</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Toast
      :visible="toastVisible"
      :message="toastMessage"
      :description="toastDescription"
      :type="toastType"
    />
  </div>
</template>
