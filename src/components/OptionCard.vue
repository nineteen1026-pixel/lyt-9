<script setup lang="ts">
import { computed } from 'vue'
import { Star, Plus, Minus, FileText, CheckCircle, XCircle, FileSignature, Trash2, Edit3, ArrowLeftRight, RefreshCw } from 'lucide-vue-next'

interface BaseOption {
  id: string
  price: number
  contracted: boolean
  contractPrice: number
  pros: string[]
  cons: string[]
  rating: number
  notes: string
  createdAt: number
  [key: string]: any
}

const props = defineProps<{
  option: BaseOption
  title: string
  subtitle?: string
  image?: string
  tags?: string[]
  metaItems?: { icon: any; label: string; value: string | number }[]
  showStatus?: boolean
  selectedForCompare?: boolean
  disabled?: boolean
  isChanging?: boolean
}>()

const emit = defineEmits<{
  (e: 'sign', id: string, price: number): void
  (e: 'cancel', id: string): void
  (e: 'edit', id: string): void
  (e: 'delete', id: string): void
  (e: 'toggleCompare', id: string): void
}>()

const formatPrice = (price: number) => `¥${price.toLocaleString()}`

const renderStars = computed(() => {
  const full = Math.floor(props.option.rating)
  const half = props.option.rating - full >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return { full, half, empty }
})

const statusClass = computed(() => {
  if (props.option.contracted) {
    return 'bg-green-50 border-green-200'
  }
  if (props.selectedForCompare) {
    return 'bg-primary-50 border-primary-300 ring-2 ring-primary-300'
  }
  if (props.disabled) {
    return 'bg-gray-50 opacity-70'
  }
  if (props.isChanging) {
    return 'bg-white hover:shadow-xl hover:-translate-y-1 border-champagne-200'
  }
  return 'bg-white hover:shadow-xl hover:-translate-y-1'
})
</script>

<template>
  <div
    class="rounded-2xl overflow-hidden shadow-md transition-all duration-300 border"
    :class="statusClass"
  >
    <div v-if="image" class="relative">
      <img :src="image" :alt="title" class="w-full h-48 object-cover" />
      <div
        v-if="showStatus !== false"
        class="absolute top-3 right-3"
      >
        <span
          v-if="option.contracted"
          class="px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white flex items-center gap-1"
        >
          <CheckCircle class="w-3 h-3" />
          已选
        </span>
        <span
          v-else
          class="px-3 py-1 rounded-full text-xs font-medium bg-champagne-200 text-champagne-400"
        >
          备选
        </span>
      </div>
      <div class="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent"></div>
      <div class="absolute bottom-3 left-4 right-4">
        <h3 class="text-lg font-bold text-white">{{ title }}</h3>
        <p v-if="subtitle" class="text-xs text-white/80 mt-0.5">{{ subtitle }}</p>
      </div>
    </div>

    <div class="p-4">
      <div v-if="!image" class="flex items-start justify-between mb-3">
        <div>
          <h3 class="font-bold text-gray-800 text-lg">{{ title }}</h3>
          <p v-if="subtitle" class="text-sm text-gray-500 mt-1">{{ subtitle }}</p>
        </div>
        <div class="text-right">
          <p class="text-xl font-bold text-primary-500">{{ formatPrice(option.price) }}</p>
        </div>
      </div>

      <div class="flex items-center gap-3 mb-4">
        <div class="flex items-center gap-0.5">
          <template v-for="i in renderStars.full" :key="'f'+i">
            <Star class="w-4 h-4 fill-amber-400 text-amber-400" />
          </template>
          <template v-for="i in renderStars.half" :key="'h'+i">
            <Star class="w-4 h-4 fill-amber-400/50 text-amber-400" />
          </template>
          <template v-for="i in renderStars.empty" :key="'e'+i">
            <Star class="w-4 h-4 text-gray-300" />
          </template>
        </div>
        <span class="text-sm text-gray-500">{{ option.rating.toFixed(1) }}</span>
        <span v-if="image" class="ml-auto text-lg font-bold text-primary-500">{{ formatPrice(option.price) }}</span>
      </div>

      <div v-if="tags && tags.length" class="flex flex-wrap gap-2 mb-4">
        <span
          v-for="tag in tags"
          :key="tag"
          class="px-2.5 py-1 bg-primary-50 text-primary-400 rounded-full text-xs"
        >
          {{ tag }}
        </span>
      </div>

      <div v-if="metaItems && metaItems.length" class="grid grid-cols-2 gap-2 mb-4">
        <div
          v-for="meta in metaItems"
          :key="meta.label"
          class="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg"
        >
          <component :is="meta.icon" class="w-4 h-4 text-primary-400" />
          <span class="truncate">{{ meta.label }}: {{ meta.value }}</span>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 mb-4">
        <div v-if="option.pros.length" class="p-3 bg-green-50/60 rounded-xl">
          <div class="flex items-center gap-1.5 mb-2">
            <Plus class="w-4 h-4 text-green-500" />
            <span class="text-xs font-medium text-green-700">优点</span>
          </div>
          <div class="space-y-1">
            <div v-for="pro in option.pros" :key="pro" class="flex items-start gap-1.5">
              <div class="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0"></div>
              <span class="text-xs text-green-700">{{ pro }}</span>
            </div>
          </div>
        </div>

        <div v-if="option.cons.length" class="p-3 bg-red-50/60 rounded-xl">
          <div class="flex items-center gap-1.5 mb-2">
            <Minus class="w-4 h-4 text-red-500" />
            <span class="text-xs font-medium text-red-700">缺点</span>
          </div>
          <div class="space-y-1">
            <div v-for="con in option.cons" :key="con" class="flex items-start gap-1.5">
              <div class="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0"></div>
              <span class="text-xs text-red-700">{{ con }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="option.notes" class="flex items-start gap-1.5 p-3 bg-champagne-50/60 rounded-xl mb-4">
        <FileText class="w-4 h-4 text-champagne-400 flex-shrink-0 mt-0.5" />
        <span class="text-xs text-champagne-500">{{ option.notes }}</span>
      </div>

      <div v-if="option.contracted" class="flex items-center justify-between gap-2 p-3 bg-green-50 rounded-xl">
        <div class="flex items-center gap-2">
          <CheckCircle class="w-5 h-5 text-green-500" />
          <div>
            <span class="text-sm text-green-600 font-medium">已签约确认</span>
            <p class="text-xs text-green-500">合同金额: {{ formatPrice(option.contractPrice) }}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            @click="emit('edit', option.id)"
            class="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
            title="编辑"
          >
            <Edit3 class="w-4 h-4" />
          </button>
          <button
            @click="emit('cancel', option.id)"
            class="px-3 py-1.5 text-xs bg-white text-red-500 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
          >
            取消
          </button>
        </div>
      </div>

      <div v-else class="space-y-2">
        <div class="flex gap-2">
          <button
            @click="emit('sign', option.id, option.price)"
            :disabled="disabled"
            class="flex-1 py-2.5 text-white rounded-xl font-medium flex items-center justify-center gap-1.5 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            :class="isChanging ? 'bg-gradient-to-r from-champagne-400 to-amber-500' : 'bg-gradient-to-r from-primary-400 to-primary-500'"
          >
            <component :is="isChanging ? RefreshCw : FileSignature" class="w-4 h-4" />
            {{ isChanging ? '变更套系' : '选型确认' }}
          </button>
          <button
            @click="emit('toggleCompare', option.id)"
            :class="selectedForCompare ? 'bg-primary-500 text-white' : 'bg-white text-primary-500 border border-primary-200 hover:bg-primary-50'"
            class="py-2.5 px-3 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-all duration-300 text-sm"
            :title="selectedForCompare ? '移出对比' : '加入对比'"
          >
            <ArrowLeftRight class="w-4 h-4" />
          </button>
          <button
            @click="emit('edit', option.id)"
            class="py-2.5 px-3 bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-all duration-300 text-sm"
            title="编辑"
          >
            <Edit3 class="w-4 h-4" />
          </button>
          <button
            @click="emit('delete', option.id)"
            class="py-2.5 px-3 bg-white text-red-400 border border-red-200 hover:bg-red-50 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-all duration-300 text-sm"
            title="删除"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
        <div v-if="disabled" class="flex items-center gap-2 p-2 bg-gray-100 rounded-xl">
          <XCircle class="w-4 h-4 text-gray-400" />
          <span class="text-xs text-gray-500 font-medium">已选定其他方案，先取消后再选</span>
        </div>
        <div v-else-if="isChanging" class="flex items-center gap-2 p-2 bg-champagne-50 rounded-xl border border-champagne-200">
          <RefreshCw class="w-4 h-4 text-champagne-500" />
          <span class="text-xs text-champagne-600 font-medium">点击变更为新套系将自动替换当前方案</span>
        </div>
      </div>
    </div>
  </div>
</template>
