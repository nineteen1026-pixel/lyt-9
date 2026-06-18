<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useBudgetStore } from '@/stores/budget'
import { useGuestsStore } from '@/stores/guests'
import PieChart from '@/components/PieChart.vue'
import Toast from '@/components/Toast.vue'
import { Wallet, TrendingDown, TrendingUp, Target, AlertTriangle, Info } from 'lucide-vue-next'

const budgetStore = useBudgetStore()
const guestsStore = useGuestsStore()

const toastVisible = ref(false)
const toastMessage = ref('')
const toastDescription = ref('')
const toastType = ref<'success' | 'error' | 'warning' | 'info'>('warning')

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
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-ivory to-champagne-100 pb-20">
    <div class="animate-fade-in">
      <div class="bg-gradient-to-r from-primary-400 to-primary-500 px-6 pt-12 pb-16 rounded-b-3xl shadow-lg">
        <h1 class="text-3xl font-serif font-bold text-white text-center">婚礼预算</h1>
        <p class="text-primary-100 text-center mt-2">精心规划，幸福启航</p>
      </div>

      <div class="px-4 -mt-10">
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
              class="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300"
              :class="{ 'ring-2 ring-red-400 bg-red-50': isOverBudget(item.budget, item.actual) }"
              :style="{ animationDelay: `${0.8 + index * 0.1}s` }"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div 
                    class="w-10 h-10 rounded-xl flex items-center justify-center"
                    :style="{ backgroundColor: item.color + '20' }"
                  >
                    <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: item.color }"></div>
                  </div>
                  <div>
                    <p class="font-medium" :class="isOverBudget(item.budget, item.actual) ? 'text-red-600' : 'text-gray-800'">{{ item.category }}</p>
                    <p class="text-xs" :class="isOverBudget(item.budget, item.actual) ? 'text-red-400' : 'text-gray-400'">预算: {{ formatCurrency(item.budget) }}</p>
                  </div>
                </div>
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
