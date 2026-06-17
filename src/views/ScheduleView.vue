<script setup lang="ts">
import { ref, computed } from 'vue'
import { useScheduleStore } from '@/stores/schedule'
import { Calendar, Clock, MapPin, User, Sun, Moon, Sparkles, Car, Camera, Heart, Coffee, Building, Users, Mic, Wine, Hand, Image, Shirt, Utensils, Home } from 'lucide-vue-next'

const scheduleStore = useScheduleStore()
const selectedDate = ref(scheduleStore.weddingDate)

const iconMap: Record<string, typeof Sun> = {
  sun: Sun,
  moon: Moon,
  sparkles: Sparkles,
  car: Car,
  camera: Camera,
  heart: Heart,
  coffee: Coffee,
  'map-pin': MapPin,
  building: Building,
  users: Users,
  rings: Heart,
  mic: Mic,
  wine: Wine,
  hand: Hand,
  image: Image,
  shirt: Shirt,
  utensils: Utensils,
  home: Home,
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekDays[date.getDay()]}`
}

const getTimePeriod = (time: string) => {
  const hour = parseInt(time.split(':')[0])
  if (hour >= 6 && hour < 12) return '上午'
  if (hour >= 12 && hour < 18) return '下午'
  return '晚上'
}

const groupedSchedule = computed(() => {
  const groups: Record<string, typeof scheduleStore.items> = {}
  scheduleStore.items.forEach(item => {
    const period = getTimePeriod(item.time)
    if (!groups[period]) {
      groups[period] = []
    }
    groups[period].push(item)
  })
  return groups
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-ivory to-champagne-100 pb-20">
    <div class="animate-fade-in">
      <div class="bg-gradient-to-r from-primary-400 to-primary-500 px-6 pt-12 pb-16 rounded-b-3xl shadow-lg">
        <h1 class="text-3xl font-serif font-bold text-white text-center">婚礼流程</h1>
        <p class="text-primary-100 text-center mt-2">精心安排，圆满时刻</p>
      </div>

      <div class="px-4 -mt-10">
        <div class="animate-slide-up bg-white rounded-2xl p-5 shadow-md mb-6" style="animation-delay: 0.1s">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <Calendar class="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p class="text-sm text-gray-500">婚礼日期</p>
              <p class="text-lg font-bold text-gray-800">{{ formatDate(selectedDate) }}</p>
            </div>
          </div>
          <input 
            v-model="selectedDate"
            type="date" 
            class="w-full p-3 bg-primary-50 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-primary-300 transition-all"
          />
        </div>

        <div class="space-y-6">
          <div v-for="(items, period) in groupedSchedule" :key="period">
            <div class="animate-slide-up flex items-center gap-2 mb-3" style="animation-delay: 0.2s">
              <div class="h-px flex-1 bg-gradient-to-r from-transparent via-primary-200 to-transparent"></div>
              <span class="px-4 py-1 bg-primary-100 text-primary-500 rounded-full text-sm font-medium">{{ period }}</span>
              <div class="h-px flex-1 bg-gradient-to-r from-transparent via-primary-200 to-transparent"></div>
            </div>

            <div class="relative">
              <div class="absolute left-5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary-300 to-primary-100"></div>
              
              <div class="space-y-4">
                <div 
                  v-for="(item, index) in items" 
                  :key="item.id"
                  class="animate-slide-up relative pl-12"
                  :style="{ animationDelay: `${0.3 + index * 0.1}s` }"
                >
                  <div class="absolute left-2 top-2 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center shadow-lg">
                    <Clock class="w-3 h-3 text-white" />
                  </div>
                  
                  <div class="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-lg font-bold text-primary-500">{{ item.time }}</span>
                    </div>
                    
                    <h3 class="font-medium text-gray-800 mb-2">{{ item.title }}</h3>
                    <p class="text-sm text-gray-500 mb-3">{{ item.description }}</p>
                    
                    <div class="space-y-1.5">
                      <div class="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin class="w-4 h-4 text-champagne-300 flex-shrink-0" />
                        <span>{{ item.location }}</span>
                      </div>
                      <div class="flex items-center gap-2 text-sm text-gray-500">
                        <User class="w-4 h-4 text-primary-400 flex-shrink-0" />
                        <span>{{ item.personInCharge }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
