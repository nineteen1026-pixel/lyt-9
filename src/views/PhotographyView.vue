<script setup lang="ts">
import { ref } from 'vue'
import { usePhotographyStore } from '@/stores/photography'
import { Camera, Video, BookOpen, Gift, Check, X, FileSignature, CheckCircle, Calendar, Palette } from 'lucide-vue-next'

const photographyStore = usePhotographyStore()
const activeTab = ref(1)

const showContractModal = ref(false)
const selectedItemId = ref<string | null>(null)
const contractPrice = ref(0)

const formatPrice = (price: number) => {
  return `¥${price.toLocaleString()}`
}

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-primary-400',
    'bg-champagne-300',
    'bg-morandi-purple',
    'bg-morandi-green',
  ]
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

const openContractModal = (itemId: string, currentPrice: number) => {
  selectedItemId.value = itemId
  contractPrice.value = currentPrice
  showContractModal.value = true
}

const closeContractModal = () => {
  showContractModal.value = false
  selectedItemId.value = null
  contractPrice.value = 0
}

const confirmContract = () => {
  if (selectedItemId.value && contractPrice.value > 0) {
    photographyStore.updateContractItem(selectedItemId.value, contractPrice.value)
    closeContractModal()
  }
}

const cancelContract = (itemId: string) => {
  photographyStore.cancelContractItem(itemId)
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-ivory to-champagne-100 pb-20">
    <div class="animate-fade-in">
      <div class="bg-gradient-to-r from-primary-400 to-primary-500 px-6 pt-12 pb-16 rounded-b-3xl shadow-lg">
        <h1 class="text-3xl font-serif font-bold text-white text-center">摄影团队</h1>
        <p class="text-primary-100 text-center mt-2">光影流转，定格永恒</p>
      </div>

      <div class="px-4 -mt-10">
        <div class="animate-slide-up mb-6" style="animation-delay: 0.1s">
          <h2 class="text-lg font-bold text-gray-800 mb-4">摄影团队选择</h2>
          <div class="space-y-4">
            <div 
              v-for="(item, index) in photographyStore.items" 
              :key="item.id"
              class="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300"
              :style="{ animationDelay: `${0.2 + index * 0.1}s` }"
            >
              <div class="flex items-start justify-between mb-4">
                <div>
                  <h3 class="font-bold text-gray-800 text-lg">{{ item.teamName }}</h3>
                  <p class="text-sm text-gray-500 mt-1">{{ item.packageType }}</p>
                </div>
                <div class="text-right">
                  <p class="text-xl font-bold text-primary-500">{{ formatPrice(item.price) }}</p>
                </div>
              </div>
              
              <div class="flex flex-wrap gap-3 mb-4">
                <div class="flex items-center gap-1.5 text-sm text-gray-600 bg-primary-50 px-3 py-1.5 rounded-full">
                  <Palette class="w-4 h-4 text-primary-400" />
                  <span>{{ item.style }}</span>
                </div>
                <div class="flex items-center gap-1.5 text-sm text-gray-600 bg-champagne-50 px-3 py-1.5 rounded-full">
                  <Calendar class="w-4 h-4 text-champagne-300" />
                  <span>{{ item.shootDate }}</span>
                </div>
              </div>

              <div v-if="item.contracted" class="flex items-center justify-between gap-2 p-3 bg-green-50 rounded-xl">
                <div class="flex items-center gap-2">
                  <CheckCircle class="w-5 h-5 text-green-500" />
                  <div>
                    <span class="text-sm text-green-600 font-medium">已签约</span>
                    <p class="text-xs text-green-500">签约金额: {{ formatPrice(item.contractPrice) }}</p>
                  </div>
                </div>
                <button 
                  @click="cancelContract(item.id)"
                  class="px-3 py-1.5 text-xs bg-white text-red-500 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                >
                  取消签约
                </button>
              </div>

              <button 
                v-else
                @click="openContractModal(item.id, item.price)"
                class="w-full py-3 bg-gradient-to-r from-primary-400 to-primary-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300"
              >
                <FileSignature class="w-5 h-5" />
                立即签约
              </button>
            </div>
          </div>
        </div>

        <div class="animate-slide-up bg-white rounded-2xl p-5 shadow-md mb-6" style="animation-delay: 0.5s">
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

        <div class="animate-slide-up mb-6" style="animation-delay: 0.3s">
          <h2 class="text-lg font-bold text-gray-800 mb-4">作品展示</h2>
          <div class="grid grid-cols-3 gap-2">
            <div 
              v-for="(item, index) in photographyStore.portfolio" 
              :key="item.id"
              class="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
              :style="{ animationDelay: `${0.4 + index * 0.1}s` }"
            >
              <img 
                :src="item.image" 
                :alt="item.title"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p class="absolute bottom-2 left-2 right-2 text-white text-xs font-medium text-center">{{ item.title }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="animate-slide-up" style="animation-delay: 0.5s">
          <h2 class="text-lg font-bold text-gray-800 mb-4">套系选择</h2>
          
          <div class="flex gap-2 mb-4">
            <button 
              v-for="pkg in photographyStore.packages" 
              :key="pkg.id"
              @click="activeTab = pkg.id"
              class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-300"
              :class="activeTab === pkg.id 
                ? 'bg-primary-500 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-primary-50'"
            >
              {{ pkg.name }}
            </button>
          </div>

          <div 
            v-for="pkg in photographyStore.packages" 
            :key="pkg.id"
            v-show="activeTab === pkg.id"
            class="bg-white rounded-2xl p-5 shadow-md animate-fade-in"
          >
            <div class="text-center mb-5">
              <p class="text-3xl font-bold text-primary-500">{{ formatPrice(pkg.price) }}</p>
              <p class="text-sm text-gray-400 mt-1">{{ pkg.name }}</p>
            </div>

            <div class="grid grid-cols-2 gap-3 mb-5">
              <div class="flex items-center gap-2 p-3 bg-primary-50/50 rounded-xl">
                <Camera class="w-5 h-5 text-primary-400" />
                <div>
                  <p class="text-sm font-medium text-gray-800">{{ pkg.photographers }}位</p>
                  <p class="text-xs text-gray-500">摄影师</p>
                </div>
              </div>
              <div class="flex items-center gap-2 p-3 bg-primary-50/50 rounded-xl">
                <BookOpen class="w-5 h-5 text-primary-400" />
                <div>
                  <p class="text-sm font-medium text-gray-800">{{ pkg.photos }}张</p>
                  <p class="text-xs text-gray-500">照片</p>
                </div>
              </div>
              <div class="flex items-center gap-2 p-3 bg-primary-50/50 rounded-xl">
                <Video class="w-5 h-5 text-primary-400" />
                <div>
                  <p class="text-sm font-medium text-gray-800">{{ pkg.videos }}个</p>
                  <p class="text-xs text-gray-500">视频</p>
                </div>
              </div>
              <div class="flex items-center gap-2 p-3 bg-primary-50/50 rounded-xl">
                <Gift class="w-5 h-5 text-primary-400" />
                <div>
                  <p class="text-sm font-medium text-gray-800">{{ pkg.albums }}本</p>
                  <p class="text-xs text-gray-500">相册</p>
                </div>
              </div>
            </div>

            <div>
              <p class="text-sm font-medium text-gray-800 mb-2">包含内容</p>
              <div class="space-y-2">
                <div 
                  v-for="extra in pkg.includes" 
                  :key="extra"
                  class="flex items-center gap-2"
                >
                  <div class="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check class="w-3 h-3 text-green-500" />
                  </div>
                  <span class="text-sm text-gray-600">{{ extra }}</span>
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
              <h3 class="text-xl font-bold text-gray-800">摄影签约</h3>
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
