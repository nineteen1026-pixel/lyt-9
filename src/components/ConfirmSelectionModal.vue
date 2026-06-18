<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { X, FileSignature, CheckCircle, Wallet, AlertTriangle, ArrowRight, ArrowLeftRight, TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
  option: {
    id: string
    title: string
    subtitle?: string
    price: number
    image?: string
    [key: string]: any
  } | null
  category: string
  budgetCategory: string
  currentBudget?: {
    planned: number
    actual: number
    locked?: boolean
  }
  previousOption?: {
    id: string
    title: string
    subtitle?: string
    price: number
    contractPrice: number
    image?: string
    [key: string]: any
  } | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', id: string, price: number): void
}>()

const contractPrice = ref(0)

watch(() => props.visible, (val) => {
  if (val && props.option) {
    contractPrice.value = props.option.price
  }
})

const formatPrice = (price: number) => `¥${price.toLocaleString()}`

const isChanging = computed(() => !!props.previousOption)

const priceDiff = computed(() => {
  if (!props.previousOption) return null
  return contractPrice.value - props.previousOption.contractPrice
})

const budgetDiff = computed(() => {
  if (!props.currentBudget) return null
  if (isChanging.value && props.previousOption) {
    return contractPrice.value - props.previousOption.contractPrice
  }
  return contractPrice.value - props.currentBudget.actual
})

const newBudgetActual = computed(() => {
  if (!props.currentBudget) return contractPrice.value
  if (isChanging.value && props.previousOption) {
    return props.currentBudget.actual - props.previousOption.contractPrice + contractPrice.value
  }
  return props.currentBudget.actual + contractPrice.value
})

const overBudget = computed(() => {
  if (!props.currentBudget) return false
  return newBudgetActual.value > props.currentBudget.planned
})

const budgetRemaining = computed(() => {
  if (!props.currentBudget) return 0
  return props.currentBudget.planned - newBudgetActual.value
})

const canConfirm = computed(() => {
  return contractPrice.value > 0 && !props.currentBudget?.locked
})

const handleConfirm = () => {
  if (!canConfirm.value || !props.option) return
  emit('confirm', props.option.id, contractPrice.value)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible && option" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="emit('close')"></div>
      <div class="relative bg-white rounded-3xl p-6 w-full max-w-md animate-fade-in shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          @click="emit('close')"
          class="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <X class="w-5 h-5 text-gray-500" />
        </button>

        <div class="text-center mb-6">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-champagne-100 flex items-center justify-center mx-auto mb-4">
            <component :is="isChanging ? ArrowLeftRight : FileSignature" class="w-8 h-8 text-primary-500" />
          </div>
          <h3 class="text-xl font-bold text-gray-800">{{ isChanging ? '套系变更确认' : '选型确认' }}</h3>
          <p class="text-sm text-gray-500 mt-1">{{ isChanging ? '确认变更后将自动更新预算' : '确认后将一键写入预算' }}</p>
        </div>

        <div v-if="isChanging && previousOption" class="mb-5">
          <div class="relative">
            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border-2 border-gray-200 opacity-80">
              <div
                v-if="previousOption.image"
                class="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-md"
              >
                <img :src="previousOption.image" :alt="previousOption.title" class="w-full h-full object-cover" />
              </div>
              <div v-else class="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex-shrink-0 shadow-md flex items-center justify-center">
                <span class="text-lg font-bold text-gray-500">{{ previousOption.title.charAt(0) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="px-2 py-0.5 text-[10px] rounded-full bg-gray-200 text-gray-600 font-medium">原套系</span>
                </div>
                <h4 class="font-medium text-gray-700 truncate text-sm mt-1">{{ previousOption.title }}</h4>
                <p v-if="previousOption.subtitle" class="text-[11px] text-gray-500 mt-0.5 truncate">{{ previousOption.subtitle }}</p>
              </div>
              <div class="text-right">
                <p class="text-xs text-gray-500 line-through">{{ formatPrice(previousOption.price) }}</p>
                <p class="text-sm font-bold text-gray-600">{{ formatPrice(previousOption.contractPrice) }}</p>
              </div>
            </div>

            <div class="flex justify-center my-2">
              <div class="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-md z-10">
                <ArrowRight class="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 p-4 bg-primary-50 rounded-2xl mb-5 border-2 border-primary-200">
          <div
            v-if="option.image"
            class="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-md"
          >
            <img :src="option.image" :alt="option.title" class="w-full h-full object-cover" />
          </div>
          <div v-else class="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-100 to-champagne-100 flex-shrink-0 shadow-md flex items-center justify-center">
            <span class="text-xl font-bold text-primary-500">{{ option.title.charAt(0) }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="px-2 py-0.5 text-[10px] rounded-full" :class="isChanging ? 'bg-primary-500 text-white' : 'bg-primary-100 text-primary-600'" font-medium>
                {{ isChanging ? '新套系' : '选套系' }}
              </span>
            </div>
            <h4 class="font-bold text-gray-800 truncate mt-1">{{ option.title }}</h4>
            <p v-if="option.subtitle" class="text-xs text-gray-500 mt-0.5 truncate">{{ option.subtitle }}</p>
            <p class="text-sm text-primary-500 font-medium mt-1">{{ category }}</p>
          </div>
        </div>

        <div v-if="isChanging && priceDiff !== null" class="mb-5 p-4 rounded-2xl border-2"
          :class="priceDiff > 0 ? 'bg-red-50 border-red-200' : priceDiff < 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <component
                :is="priceDiff > 0 ? TrendingUp : priceDiff < 0 ? TrendingDown : Minus"
                class="w-5 h-5"
                :class="priceDiff > 0 ? 'text-red-500' : priceDiff < 0 ? 'text-green-500' : 'text-gray-500'"
              />
              <span class="text-sm font-medium"
                :class="priceDiff > 0 ? 'text-red-700' : priceDiff < 0 ? 'text-green-700' : 'text-gray-700'"
              >
                套系差额
              </span>
            </div>
            <span class="text-lg font-bold"
              :class="priceDiff > 0 ? 'text-red-600' : priceDiff < 0 ? 'text-green-600' : 'text-gray-600'"
            >
              {{ priceDiff > 0 ? '+' : '' }}{{ formatPrice(priceDiff) }}
            </span>
          </div>
          <p class="text-xs mt-2"
            :class="priceDiff > 0 ? 'text-red-600' : priceDiff < 0 ? 'text-green-600' : 'text-gray-500'"
          >
            <template v-if="priceDiff > 0">
              新套系比原套系贵 {{ formatPrice(priceDiff) }}，预算将相应增加
            </template>
            <template v-else-if="priceDiff < 0">
              新套系比原套系省 {{ formatPrice(Math.abs(priceDiff)) }}，预算将相应减少
            </template>
            <template v-else>
              新旧套系价格相同，预算无变化
            </template>
          </p>
        </div>

        <div class="space-y-4 mb-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">确认合同金额</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">¥</span>
              <input
                v-model.number="contractPrice"
                type="number"
                class="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors text-lg font-medium"
                placeholder="请输入最终合同金额"
              />
            </div>
            <p v-if="option.price !== contractPrice" class="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
              原始报价 {{ formatPrice(option.price) }}
              <ArrowRight class="w-3 h-3" />
              合同价 {{ formatPrice(contractPrice) }}
            </p>
          </div>

          <div v-if="currentBudget" class="p-4 rounded-2xl border-2" :class="overBudget ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'">
            <div class="flex items-center gap-2 mb-3">
              <Wallet class="w-5 h-5" :class="overBudget ? 'text-red-500' : 'text-green-500'" />
              <span class="text-sm font-medium" :class="overBudget ? 'text-red-700' : 'text-green-700'">{{ budgetCategory }}预算</span>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">预算金额</span>
                <span class="font-medium text-gray-800">{{ formatPrice(currentBudget.planned) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">当前已用</span>
                <span class="font-medium text-gray-800">{{ formatPrice(currentBudget.actual) }}</span>
              </div>
              <div class="flex justify-between pt-2 border-t" :class="overBudget ? 'border-red-200' : 'border-green-200'">
                <span class="font-medium" :class="overBudget ? 'text-red-700' : 'text-green-700'">
                  {{ isChanging ? '变更后已用' : '确认后已用' }}
                </span>
                <span class="font-bold" :class="overBudget ? 'text-red-600' : 'text-green-600'">
                  {{ formatPrice(newBudgetActual) }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium" :class="overBudget ? 'text-red-700' : 'text-green-700'">
                  {{ overBudget ? '超出预算' : '剩余预算' }}
                </span>
                <span class="font-bold" :class="overBudget ? 'text-red-600' : 'text-green-600'">
                  {{ overBudget ? '+' : '' }}{{ formatPrice(Math.abs(budgetRemaining)) }}
                </span>
              </div>
              <div v-if="isChanging && budgetDiff !== null" class="flex justify-between pt-2 border-t"
                :class="budgetDiff > 0 ? 'border-orange-200' : budgetDiff < 0 ? 'border-blue-200' : 'border-gray-200'"
              >
                <span class="font-medium text-xs text-gray-600">
                  预算变动额
                </span>
                <span class="font-bold text-xs"
                  :class="budgetDiff > 0 ? 'text-orange-600' : budgetDiff < 0 ? 'text-blue-600' : 'text-gray-500'"
                >
                  {{ budgetDiff > 0 ? '+' : '' }}{{ formatPrice(budgetDiff) }}
                </span>
              </div>
            </div>
            <div v-if="currentBudget.locked" class="flex items-center gap-1.5 mt-3 p-2 bg-gray-100 rounded-lg">
              <AlertTriangle class="w-4 h-4 text-amber-500" />
              <span class="text-xs text-amber-700">该预算分类已锁定，请先在预算页解锁</span>
            </div>
            <div v-else-if="overBudget" class="flex items-center gap-1.5 mt-3 p-2 bg-red-100/50 rounded-lg">
              <AlertTriangle class="w-4 h-4 text-red-500" />
              <span class="text-xs text-red-700">超出预算，确认后将标记为超支</span>
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="emit('close')"
            class="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            @click="handleConfirm"
            :disabled="!canConfirm"
            class="flex-1 py-3 bg-gradient-to-r from-primary-400 to-primary-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle class="w-5 h-5" />
            {{ isChanging ? '确认变更套系' : '确认写入预算' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
