<script setup lang="ts">
import { ref } from 'vue'
import { useRehearsalStore } from '@/stores/rehearsal'
import { Calendar, Clock, MapPin, Phone, Users, ChevronDown, ChevronUp, AlertCircle } from 'lucide-vue-next'

const rehearsalStore = useRehearsalStore()
const expandedNotice = ref<string | null>('1')

const toggleNotice = (id: string) => {
  expandedNotice.value = expandedNotice.value === id ? null : id
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

const getStepNumberColor = (index: number) => {
  const colors = [
    'bg-primary-500',
    'bg-primary-400',
    'bg-champagne-300',
    'bg-morandi-purple',
    'bg-morandi-green',
    'bg-morandi-blue',
  ]
  return colors[index % colors.length]
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-ivory to-champagne-100 pb-20">
    <div class="animate-fade-in">
      <div class="bg-gradient-to-r from-primary-400 to-primary-500 px-6 pt-12 pb-16 rounded-b-3xl shadow-lg">
        <h1 class="text-3xl font-serif font-bold text-white text-center">婚礼彩排</h1>
        <p class="text-primary-100 text-center mt-2">预演完美，确保顺利</p>
      </div>

      <div class="px-4 -mt-10">
        <div class="animate-slide-up bg-white rounded-2xl p-5 shadow-md mb-6" style="animation-delay: 0.1s">
          <h2 class="text-lg font-bold text-gray-800 mb-4">彩排信息</h2>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Calendar class="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p class="text-xs text-gray-400">彩排日期</p>
                <p class="font-medium text-gray-800">{{ formatDate(rehearsalStore.rehearsalInfo.date) }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-champagne-100 flex items-center justify-center flex-shrink-0">
                <Clock class="w-5 h-5 text-champagne-300" />
              </div>
              <div>
                <p class="text-xs text-gray-400">彩排时间</p>
                <p class="font-medium text-gray-800">{{ rehearsalStore.rehearsalInfo.time }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-morandi-purple/20 flex items-center justify-center flex-shrink-0">
                <MapPin class="w-5 h-5 text-morandi-purple" />
              </div>
              <div>
                <p class="text-xs text-gray-400">彩排地点</p>
                <p class="font-medium text-gray-800">{{ rehearsalStore.rehearsalInfo.location }}</p>
                <p class="text-sm text-gray-500">{{ rehearsalStore.rehearsalInfo.address }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-morandi-green/20 flex items-center justify-center flex-shrink-0">
                <Phone class="w-5 h-5 text-morandi-green" />
              </div>
              <div>
                <p class="text-xs text-gray-400">联系人</p>
                <p class="font-medium text-gray-800">{{ rehearsalStore.rehearsalInfo.contact }} · {{ rehearsalStore.rehearsalInfo.contactPhone }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="animate-slide-up mb-6" style="animation-delay: 0.2s">
          <h2 class="text-lg font-bold text-gray-800 mb-4">流程步骤</h2>
          <div class="space-y-3">
            <div 
              v-for="(step, index) in rehearsalStore.steps" 
              :key="step.id"
              class="animate-slide-up bg-white rounded-xl p-4 shadow-sm flex gap-4"
              :style="{ animationDelay: `${0.3 + index * 0.1}s` }"
            >
              <div 
                class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                :class="getStepNumberColor(index)"
              >
                {{ step.stepNumber }}
              </div>
              <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                  <h3 class="font-medium text-gray-800">{{ step.title }}</h3>
                </div>
                <p class="text-sm text-gray-500 mb-2">{{ step.description }}</p>
                <div class="flex items-center gap-4 text-xs text-gray-400">
                  <span>负责人: {{ step.personInCharge }}</span>
                  <span v-if="step.notes">备注: {{ step.notes }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="animate-slide-up bg-white rounded-2xl p-5 shadow-md mb-6" style="animation-delay: 0.5s">
          <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users class="w-5 h-5 text-primary-400" />
            人员分工
          </h2>
          <div class="space-y-3">
            <div 
              v-for="(person, index) in rehearsalStore.staff" 
              :key="person.id"
              class="flex items-center justify-between p-3 bg-primary-50/50 rounded-xl"
              :style="{ animationDelay: `${0.6 + index * 0.1}s` }"
            >
              <div class="flex items-center gap-3">
                <div 
                  class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  :class="[
                    person.role.includes('司仪') ? 'bg-primary-400' :
                    person.role.includes('摄影') ? 'bg-champagne-300' :
                    person.role.includes('摄像') ? 'bg-morandi-purple' :
                    person.role.includes('化妆') ? 'bg-morandi-green' :
                    person.role.includes('督导') ? 'bg-morandi-blue' :
                    'bg-primary-400'
                  ]"
                >
                  {{ person.name.charAt(0) }}
                </div>
                <div>
                  <p class="font-medium text-gray-800 text-sm">{{ person.name }}</p>
                  <p class="text-xs text-gray-500">{{ person.role }}</p>
                </div>
              </div>
              <span class="text-sm text-gray-400">{{ person.phone }}</span>
            </div>
          </div>
        </div>

        <div class="animate-slide-up mb-6" style="animation-delay: 0.7s">
          <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle class="w-5 h-5 text-primary-400" />
            注意事项
          </h2>
          <div class="space-y-2">
            <div 
              v-for="(notice, index) in rehearsalStore.notices" 
              :key="notice.id"
              class="animate-slide-up bg-white rounded-xl overflow-hidden shadow-sm"
              :style="{ animationDelay: `${0.8 + index * 0.1}s` }"
            >
              <button 
                @click="toggleNotice(notice.id)"
                class="w-full flex items-center justify-between p-4 text-left"
              >
                <span class="font-medium text-gray-800">{{ notice.title }}</span>
                <component 
                  :is="expandedNotice === notice.id ? ChevronUp : ChevronDown" 
                  class="w-5 h-5 text-gray-400 transition-transform duration-300" 
                />
              </button>
              <div 
                class="overflow-hidden transition-all duration-300"
                :class="expandedNotice === notice.id ? 'max-h-40' : 'max-h-0'"
              >
                <div class="px-4 pb-4">
                  <p class="text-sm text-gray-500 leading-relaxed">{{ notice.content }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
