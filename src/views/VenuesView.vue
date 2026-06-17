<script setup lang="ts">
import { useVenuesStore, type VenueStatus } from '@/stores/venues'
import { MapPin, Users, Tag, CheckCircle, Star } from 'lucide-vue-next'

const venuesStore = useVenuesStore()

const getStatusConfig = (status: VenueStatus) => {
  switch (status) {
    case 'booked':
      return { label: '已预订', class: 'bg-primary-500 text-white' }
    case 'alternative':
      return { label: '备选', class: 'bg-champagne-200 text-champagne-300' }
  }
}

const formatPrice = (price: number) => {
  return `¥${price.toLocaleString()}`
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-ivory to-champagne-100 pb-20">
    <div class="animate-fade-in">
      <div class="bg-gradient-to-r from-primary-400 to-primary-500 px-6 pt-12 pb-16 rounded-b-3xl shadow-lg">
        <h1 class="text-3xl font-serif font-bold text-white text-center">婚礼场地</h1>
        <p class="text-primary-100 text-center mt-2">甄选场地，铭记时刻</p>
      </div>

      <div class="px-4 -mt-10">
        <div class="space-y-4">
          <div 
            v-for="(venue, index) in venuesStore.venues" 
            :key="venue.id"
            class="animate-slide-up bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
            :style="{ animationDelay: `${0.1 + index * 0.15}s` }"
          >
            <div class="relative">
              <img 
                :src="venue.image" 
                :alt="venue.name"
                class="w-full h-48 object-cover"
              />
              <div class="absolute top-3 right-3">
                <span 
                  class="px-3 py-1 rounded-full text-xs font-medium"
                  :class="getStatusConfig(venue.status).class"
                >
                  {{ getStatusConfig(venue.status).label }}
                </span>
              </div>
              <div class="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div class="absolute bottom-3 left-4 right-4">
                <h3 class="text-lg font-bold text-white">{{ venue.name }}</h3>
              </div>
            </div>
            
            <div class="p-4">
              <div class="flex items-center gap-2 text-gray-500 text-sm mb-3">
                <MapPin class="w-4 h-4 text-primary-400" />
                <span class="truncate">{{ venue.address }}</span>
              </div>
              
              <div class="flex items-center gap-4 mb-4">
                <div class="flex items-center gap-1.5 text-sm text-gray-600">
                  <Users class="w-4 h-4 text-champagne-300" />
                  <span>容纳{{ venue.capacity }}人</span>
                </div>
                <div class="flex items-center gap-1.5 text-sm text-gray-600">
                  <Tag class="w-4 h-4 text-primary-400" />
                  <span>{{ formatPrice(venue.price) }}</span>
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="feature in venue.features" 
                  :key="feature"
                  class="px-2.5 py-1 bg-primary-50 text-primary-400 rounded-full text-xs"
                >
                  {{ feature }}
                </span>
              </div>

              <div v-if="venue.status === 'booked'" class="mt-4 flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                <CheckCircle class="w-5 h-5 text-green-500" />
                <span class="text-sm text-green-600 font-medium">已选择此场地举办婚礼</span>
              </div>

              <div v-else class="mt-4 flex items-center gap-2 p-3 bg-champagne-100 rounded-xl">
                <Star class="w-5 h-5 text-champagne-300" />
                <span class="text-sm text-champagne-300 font-medium">备选场地，可进一步了解</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
