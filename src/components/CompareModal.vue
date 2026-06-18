<script setup lang="ts">
import { computed } from 'vue'
import { X, CheckCircle, XCircle, Minus, ArrowLeftRight, FileSignature } from 'lucide-vue-next'

interface CompareItem {
  id: string
  title: string
  subtitle?: string
  price: number
  rating: number
  pros: string[]
  cons: string[]
  image?: string
  contracted: boolean
  extraFields?: { label: string; value: any }[]
  [key: string]: any
}

const props = defineProps<{
  visible: boolean
  items: CompareItem[]
  category: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'remove', id: string): void
  (e: 'select', id: string): void
}>()

const formatPrice = (price: number) => `¥${price.toLocaleString()}`

const allPros = computed(() => {
  const set = new Set<string>()
  props.items.forEach(item => item.pros.forEach(p => set.add(p)))
  return Array.from(set)
})

const allCons = computed(() => {
  const set = new Set<string>()
  props.items.forEach(item => item.cons.forEach(c => set.add(c)))
  return Array.from(set)
})

const extraLabels = computed(() => {
  if (!props.items.length) return []
  const labels = new Set<string>()
  props.items.forEach(item => {
    item.extraFields?.forEach(f => labels.add(f.label))
  })
  return Array.from(labels)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')"></div>
      <div class="relative bg-white rounded-3xl p-6 w-full max-w-5xl animate-fade-in shadow-2xl my-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ArrowLeftRight class="w-6 h-6 text-primary-500" />
              {{ category }}方案对比
            </h3>
            <p class="text-sm text-gray-500 mt-1">对比 {{ items.length }} 个方案，助你做出最优选择</p>
          </div>
          <button
            @click="emit('close')"
            class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X class="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div v-if="items.length < 2" class="py-12 text-center">
          <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <ArrowLeftRight class="w-10 h-10 text-gray-400" />
          </div>
          <p class="text-gray-500">请至少选择 2 个方案进行对比</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th class="text-left py-4 px-4 bg-gray-50 rounded-tl-2xl text-sm font-medium text-gray-600 sticky left-0 z-10 min-w-[140px]">
                  对比项
                </th>
                <th
                  v-for="(item, index) in items"
                  :key="item.id"
                  class="py-4 px-4 bg-gray-50 text-center min-w-[200px]"
                  :class="index === items.length - 1 ? 'rounded-tr-2xl' : ''"
                >
                  <div class="relative inline-block">
                    <button
                      @click="emit('remove', item.id)"
                      class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 text-red-500 flex items-center justify-center transition-colors z-10"
                    >
                      <X class="w-3.5 h-3.5" />
                    </button>
                    <div class="flex flex-col items-center gap-2">
                      <div
                        v-if="item.image"
                        class="w-20 h-20 rounded-xl overflow-hidden shadow-md"
                      >
                        <img :src="item.image" :alt="item.title" class="w-full h-full object-cover" />
                      </div>
                      <div
                        v-else
                        class="w-20 h-20 rounded-xl bg-gradient-to-br from-primary-100 to-champagne-100 flex items-center justify-center shadow-md"
                      >
                        <span class="text-lg font-bold text-primary-500">{{ item.title.charAt(0) }}</span>
                      </div>
                    </div>
                  </div>
                  <p class="font-bold text-gray-800 mt-3 text-sm">{{ item.title }}</p>
                  <p v-if="item.subtitle" class="text-xs text-gray-500 mt-0.5">{{ item.subtitle }}</p>
                  <p class="text-lg font-bold text-primary-500 mt-2">{{ formatPrice(item.price) }}</p>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-gray-100">
                <td class="py-4 px-4 bg-white text-sm font-medium text-gray-700 sticky left-0 z-10 min-w-[140px]">
                  <div class="flex items-center gap-1.5">
                    <span class="text-amber-400">★</span>
                    综合评分
                  </div>
                </td>
                <td
                  v-for="item in items"
                  :key="item.id"
                  class="py-4 px-4 text-center bg-white"
                >
                  <div class="flex flex-col items-center gap-1">
                    <div class="flex gap-0.5">
                      <template v-for="i in 5" :key="i">
                        <span
                          class="text-sm"
                          :class="i <= Math.round(item.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'"
                        >★</span>
                      </template>
                    </div>
                    <span class="text-sm font-medium text-gray-600">{{ item.rating.toFixed(1) }} 分</span>
                  </div>
                </td>
              </tr>

              <tr
                v-for="label in extraLabels"
                :key="label"
                class="border-b border-gray-100"
              >
                <td class="py-4 px-4 bg-white text-sm font-medium text-gray-700 sticky left-0 z-10 min-w-[140px]">
                  {{ label }}
                </td>
                <td
                  v-for="item in items"
                  :key="item.id"
                  class="py-4 px-4 text-center bg-white text-sm text-gray-600"
                >
                  {{ item.extraFields?.find(f => f.label === label)?.value ?? '-' }}
                </td>
              </tr>

              <tr class="border-b border-gray-100">
                <td class="py-4 px-4 bg-green-50/50 text-sm font-medium text-green-700 sticky left-0 z-10 min-w-[140px] align-top">
                  <div class="flex items-start gap-1.5 pt-1">
                    <CheckCircle class="w-4 h-4 mt-0.5 flex-shrink-0" />
                    优点
                  </div>
                </td>
                <td
                  v-for="item in items"
                  :key="item.id"
                  class="py-4 px-4 bg-green-50/30 align-top"
                >
                  <div class="space-y-1.5">
                    <template v-if="item.pros.length">
                      <div
                        v-for="pro in item.pros"
                        :key="pro"
                        class="flex items-start gap-1.5 text-xs text-green-700"
                      >
                        <CheckCircle class="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-green-400" />
                        <span>{{ pro }}</span>
                      </div>
                    </template>
                    <span v-else class="text-xs text-gray-400">-</span>
                  </div>
                </td>
              </tr>

              <tr class="border-b border-gray-100">
                <td class="py-4 px-4 bg-red-50/50 text-sm font-medium text-red-700 sticky left-0 z-10 min-w-[140px] align-top">
                  <div class="flex items-start gap-1.5 pt-1">
                    <XCircle class="w-4 h-4 mt-0.5 flex-shrink-0" />
                    缺点
                  </div>
                </td>
                <td
                  v-for="item in items"
                  :key="item.id"
                  class="py-4 px-4 bg-red-50/30 align-top"
                >
                  <div class="space-y-1.5">
                    <template v-if="item.cons.length">
                      <div
                        v-for="con in item.cons"
                        :key="con"
                        class="flex items-start gap-1.5 text-xs text-red-700"
                      >
                        <Minus class="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-red-400" />
                        <span>{{ con }}</span>
                      </div>
                    </template>
                    <span v-else class="text-xs text-gray-400">-</span>
                  </div>
                </td>
              </tr>

              <tr>
                <td class="py-6 px-4 bg-gray-50 rounded-bl-2xl sticky left-0 z-10 min-w-[140px]">
                  <span class="text-sm font-medium text-gray-600">操作</span>
                </td>
                <td
                  v-for="(item, index) in items"
                  :key="item.id"
                  class="py-6 px-4 bg-gray-50 text-center"
                  :class="index === items.length - 1 ? 'rounded-br-2xl' : ''"
                >
                  <button
                    v-if="!item.contracted"
                    @click="emit('select', item.id)"
                    class="py-2.5 px-5 bg-gradient-to-r from-primary-400 to-primary-500 text-white rounded-xl font-medium flex items-center justify-center gap-1.5 hover:shadow-lg transition-all duration-300 text-sm mx-auto"
                  >
                    <FileSignature class="w-4 h-4" />
                    选型确认
                  </button>
                  <span
                    v-else
                    class="py-2.5 px-5 bg-green-100 text-green-700 rounded-xl font-medium flex items-center justify-center gap-1.5 text-sm mx-auto inline-flex"
                  >
                    <CheckCircle class="w-4 h-4" />
                    已选择
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Teleport>
</template>
