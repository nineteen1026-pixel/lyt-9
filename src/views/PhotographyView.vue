<script setup lang="ts">
import { ref } from 'vue'
import { usePhotographyStore } from '@/stores/photography'
import { Camera, Video, BookOpen, Gift, Check } from 'lucide-vue-next'

const photographyStore = usePhotographyStore()
const activeTab = ref(1)

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
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-ivory to-champagne-100 pb-20">
    <div class="animate-fade-in">
      <div class="bg-gradient-to-r from-primary-400 to-primary-500 px-6 pt-12 pb-16 rounded-b-3xl shadow-lg">
        <h1 class="text-3xl font-serif font-bold text-white text-center">摄影团队</h1>
        <p class="text-primary-100 text-center mt-2">光影流转，定格永恒</p>
      </div>

      <div class="px-4 -mt-10">
        <div class="animate-slide-up bg-white rounded-2xl p-5 shadow-md mb-6" style="animation-delay: 0.1s">
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
    </div>
  </div>
</template>
