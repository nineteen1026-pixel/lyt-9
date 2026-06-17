<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDressStore, type DressCategory } from '@/stores/dress'
import { Shirt, Ruler, Clock, ChevronRight, Tag, Palette, X, FileSignature, CheckCircle } from 'lucide-vue-next'

const dressStore = useDressStore()
const activeCategory = ref<DressCategory>('主纱')

const showContractModal = ref(false)
const selectedDressId = ref<string | null>(null)
const contractPrice = ref(0)

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

const openContractModal = (dressId: string, currentPrice: number) => {
  selectedDressId.value = dressId
  contractPrice.value = currentPrice
  showContractModal.value = true
}

const closeContractModal = () => {
  showContractModal.value = false
  selectedDressId.value = null
  contractPrice.value = 0
}

const confirmContract = () => {
  if (selectedDressId.value && contractPrice.value > 0) {
    dressStore.updateContractDress(selectedDressId.value, contractPrice.value)
    closeContractModal()
  }
}

const cancelContract = (dressId: string) => {
  dressStore.cancelContractDress(dressId)
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

              <div v-if="dress.contracted" class="flex items-center justify-between gap-2 p-3 bg-green-50 rounded-xl">
                <div class="flex items-center gap-2">
                  <CheckCircle class="w-5 h-5 text-green-500" />
                  <div>
                    <span class="text-sm text-green-600 font-medium">已签约</span>
                    <p class="text-xs text-green-500">签约金额: {{ formatPrice(dress.contractPrice) }}</p>
                  </div>
                </div>
                <button 
                  @click="cancelContract(dress.id)"
                  class="px-3 py-1.5 text-xs bg-white text-red-500 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                >
                  取消签约
                </button>
              </div>

              <button 
                v-else
                @click="openContractModal(dress.id, dress.price)"
                class="w-full py-3 bg-gradient-to-r from-primary-400 to-primary-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300"
              >
                <FileSignature class="w-5 h-5" />
                立即签约
              </button>
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

      <Teleport to="body">
        <div v-if="showContractModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeContractModal"></div>
          <div class="relative bg-white rounded-3xl p-6 w-full max-w-md animate-fade-in shadow-2xl">
            <button 
              @click="closeContractModal"
              class="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X class="w-5 h-5 text-gray-500" />
            </button>
            
            <div class="text-center mb-6">
              <div class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                <FileSignature class="w-8 h-8 text-primary-500" />
              </div>
              <h3 class="text-xl font-bold text-gray-800">婚纱签约</h3>
              <p class="text-sm text-gray-500 mt-1">请确认签约金额</p>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">签约金额</label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">¥</span>
                  <input 
                    v-model.number="contractPrice"
                    type="number"
                    class="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors text-lg font-medium"
                    placeholder="请输入签约金额"
                  />
                </div>
              </div>

              <div class="flex gap-3 pt-4">
                <button 
                  @click="closeContractModal"
                  class="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button 
                  @click="confirmContract"
                  :disabled="contractPrice <= 0"
                  class="flex-1 py-3 bg-gradient-to-r from-primary-400 to-primary-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认签约
                </button>
              </div>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>
