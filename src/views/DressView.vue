<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDressStore, type DressCategory } from '@/stores/dress'
import { Shirt, Ruler, Clock, ChevronRight, Tag, Palette } from 'lucide-vue-next'

const dressStore = useDressStore()
const activeCategory = ref<DressCategory>('主纱')

const categories: { key: DressCategory; label: string }[] = [
  { key: '主纱', label: '主纱' },
  { key: '出门纱', label: '出门纱' },
  { key: '敬酒服', label: '敬酒服' },
]

const filteredDresses = computed(() => {
  return dressStore.dresses.filter(d => d.type === activeCategory.value)
})

const formatPrice = (price: number) => {
  return `¥${price.toLocaleString()}`
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-ivory to-champagne-100 pb-20">
    <div class="animate-fade-in">
      <div class="bg-gradient-to-r from-primary-400 to-primary-500 px-6 pt-12 pb-16 rounded-b-3xl shadow-lg">
        <h1 class="text-3xl font-serif font-bold text-white text-center">婚纱礼服</h1>
        <p class="text-primary-100 text-center mt-2">最美时刻，盛装出席</p>
      </div>

      <div class="px-4 -mt-10">
        <div class="animate-slide-up mb-4 flex gap-2" style="animation-delay: 0.1s">
          <button 
            v-for="cat in categories" 
            :key="cat.key"
            @click="activeCategory = cat.key"
            class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-300"
            :class="activeCategory === cat.key 
              ? 'bg-white text-primary-500 shadow-md' 
              : 'bg-white/50 text-gray-600 hover:bg-white'"
          >
            {{ cat.label }}
          </button>
        </div>

        <div class="space-y-4 mb-6">
          <div 
            v-for="(dress, index) in filteredDresses" 
            :key="dress.id"
            class="animate-slide-up bg-white rounded-2xl overflow-hidden shadow-md"
            :style="{ animationDelay: `${0.2 + index * 0.15}s` }"
          >
            <img 
              :src="dress.image" 
              :alt="dress.style"
              class="w-full h-64 object-cover"
            />
            <div class="p-4">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-lg font-bold text-gray-800">{{ dress.style }}</h3>
                <span class="text-lg font-bold text-primary-500">{{ formatPrice(dress.price) }}</span>
              </div>
              
              <div class="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <div class="flex items-center gap-1">
                  <Tag class="w-4 h-4 text-champagne-300" />
                  <span>{{ dress.type }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <Ruler class="w-4 h-4 text-primary-400" />
                  <span>{{ dress.size }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <Clock class="w-4 h-4 text-morandi-purple" />
                  <span>{{ dress.fittingDate }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="animate-slide-up bg-white rounded-2xl p-5 shadow-md mb-6" style="animation-delay: 0.5s">
          <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Ruler class="w-5 h-5 text-primary-400" />
            尺寸参数表
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-100">
                  <th class="py-2 px-3 text-left text-gray-500 font-medium">尺码</th>
                  <th class="py-2 px-3 text-center text-gray-500 font-medium">胸围</th>
                  <th class="py-2 px-3 text-center text-gray-500 font-medium">腰围</th>
                  <th class="py-2 px-3 text-center text-gray-500 font-medium">臀围</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="row in dressStore.sizeChart" 
                  :key="row.size"
                  class="border-b border-gray-50 last:border-0"
                  :class="row.size === 'S' ? 'bg-primary-50/50' : ''"
                >
                  <td class="py-3 px-3">
                    <span 
                      class="px-2 py-0.5 rounded text-xs font-medium"
                      :class="row.size === 'S' ? 'bg-primary-500 text-white' : 'text-gray-700'"
                    >
                      {{ row.size }}
                    </span>
                  </td>
                  <td class="py-3 px-3 text-center text-gray-600">{{ row.bust }}cm</td>
                  <td class="py-3 px-3 text-center text-gray-600">{{ row.waist }}cm</td>
                  <td class="py-3 px-3 text-center text-gray-600">{{ row.hip }}cm</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="animate-slide-up" style="animation-delay: 0.6s">
          <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock class="w-5 h-5 text-primary-400" />
            试穿记录
          </h2>
          <div class="relative">
            <div class="absolute left-5 top-0 bottom-0 w-0.5 bg-primary-200"></div>
            <div class="space-y-4">
              <div 
                v-for="(record, index) in dressStore.fittingRecords" 
                :key="record.id"
                class="relative pl-12"
                :style="{ animationDelay: `${0.7 + index * 0.1}s` }"
              >
                <div class="absolute left-3 top-1 w-4 h-4 rounded-full bg-primary-500 border-4 border-primary-100"></div>
                <div class="bg-white rounded-xl p-4 shadow-sm">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-primary-500">{{ record.date }} {{ record.time }}</span>
                    <ChevronRight class="w-4 h-4 text-gray-400" />
                  </div>
                  <p class="font-medium text-gray-800">{{ record.dressName }}</p>
                  <p class="text-sm text-gray-500 mt-1">{{ record.notes }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
