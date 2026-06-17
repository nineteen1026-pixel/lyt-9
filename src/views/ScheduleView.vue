<script setup lang="ts">
import { computed } from 'vue'
import { useScheduleStore } from '@/stores/schedule'
import Timeline from '@/components/Timeline.vue'
import { Calendar } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'

const scheduleStore = useScheduleStore()
const { weddingDate, items } = storeToRefs(scheduleStore)

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
  items.value.forEach(item => {
    const period = getTimePeriod(item.time)
    if (!groups[period]) {
      groups[period] = []
    }
    groups[period].push(item)
  })
  return groups
})

const handleDateChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  scheduleStore.setWeddingDate(target.value)
}
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
              <p class="text-lg font-bold text-gray-800">{{ formatDate(weddingDate) }}</p>
            </div>
          </div>
          <input
            :value="weddingDate"
            @input="handleDateChange"
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

            <Timeline :items="items" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
