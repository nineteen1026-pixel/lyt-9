<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGuestsStore, type GuestStatus, type GuestGroup } from '@/stores/guests'
import { useScheduleStore, type ScheduleItem } from '@/stores/schedule'
import { useRehearsalStore, type RehearsalStep } from '@/stores/rehearsal'
import {
  ArrowLeft, Phone, Utensils, Clock, MapPin, User,
  Calendar, ListChecks, ExternalLink, Users
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const guestsStore = useGuestsStore()
const scheduleStore = useScheduleStore()
const rehearsalStore = useRehearsalStore()

const guestId = route.params.id as string
const guest = computed(() => guestsStore.getGuestById(guestId))

const matchedStaffIds = computed(() => {
  if (!guest.value) return []
  return rehearsalStore.staff
    .filter(s => s.name === guest.value!.name || s.phone === guest.value!.phone)
    .map(s => s.id)
})

const relatedScheduleItems = computed<ScheduleItem[]>(() => {
  if (!guest.value) return []
  const name = guest.value.name
  const ids = matchedStaffIds.value
  return scheduleStore.items.filter(item => {
    if (ids.includes(item.personInChargeId || '')) return true
    if (item.personInCharge.includes(name)) return true
    return false
  })
})

const relatedRehearsalSteps = computed<RehearsalStep[]>(() => {
  if (!guest.value) return []
  const name = guest.value.name
  const ids = matchedStaffIds.value
  return rehearsalStore.steps.filter(step => {
    if (ids.includes(step.personInChargeId || '')) return true
    if (step.personInCharge.includes(name)) return true
    return false
  })
})

const getStatusConfig = (status: GuestStatus) => {
  switch (status) {
    case 'confirmed': return { label: '已确认', class: 'bg-green-100 text-green-600' }
    case 'pending': return { label: '待定', class: 'bg-yellow-100 text-yellow-600' }
    case 'declined': return { label: '缺席', class: 'bg-red-100 text-red-500' }
  }
}

const getGroupLabel = (group: GuestGroup) => {
  switch (group) {
    case 'groom': return '男方'
    case 'bride': return '女方'
    case 'both': return '双方'
  }
}

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-primary-400',
    'bg-champagne-300',
    'bg-morandi-purple',
    'bg-morandi-green',
    'bg-morandi-blue',
  ]
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
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

const goBack = () => {
  router.push('/guests')
}

const goToSchedule = (itemId?: string) => {
  if (itemId) {
    router.push({ path: '/schedule', query: { highlight: itemId } })
  } else {
    router.push('/schedule')
  }
}

const goToRehearsal = (stepId?: string) => {
  if (stepId) {
    router.push({ path: '/rehearsal', query: { highlight: stepId } })
  } else {
    router.push('/rehearsal')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-ivory to-champagne-100 pb-20">
    <div class="animate-fade-in" v-if="guest">
      <div class="bg-gradient-to-r from-primary-400 to-primary-500 px-6 pt-12 pb-16 rounded-b-3xl shadow-lg">
        <div class="flex items-center justify-between mb-2">
          <button
            @click="goBack"
            class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div class="text-center">
            <h1 class="text-2xl font-serif font-bold text-white">宾客详情</h1>
          </div>
          <div class="w-10"></div>
        </div>
      </div>

      <div class="px-4 -mt-10">
        <div class="animate-slide-up bg-white rounded-2xl p-5 shadow-md mb-6" style="animation-delay: 0.1s">
          <div class="flex items-center gap-4 mb-4">
            <div
              class="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl"
              :class="getAvatarColor(guest.name)"
            >
              {{ guest.avatar }}
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-bold text-gray-800">{{ guest.name }}</h2>
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatusConfig(guest.status).class"
                >
                  {{ getStatusConfig(guest.status).label }}
                </span>
              </div>
              <div class="flex items-center gap-3 mt-1">
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-medium border"
                  :class="guest.group === 'groom' ? 'bg-blue-50 text-blue-500 border-blue-200' : guest.group === 'bride' ? 'bg-pink-50 text-pink-500 border-pink-200' : 'bg-purple-50 text-purple-500 border-purple-200'"
                >
                  {{ getGroupLabel(guest.group) }}
                </span>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Phone class="w-4 h-4 text-primary-500" />
              </div>
              <div>
                <p class="text-xs text-gray-400">电话</p>
                <p class="font-medium text-gray-800 text-sm">{{ guest.phone || '未填写' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-champagne-100 flex items-center justify-center flex-shrink-0">
                <Utensils class="w-4 h-4 text-champagne-300" />
              </div>
              <div>
                <p class="text-xs text-gray-400">桌号</p>
                <p class="font-medium text-gray-800 text-sm">
                  {{ guest.tableNumber !== null ? `${guest.tableNumber}号桌` : '未分桌' }}
                </p>
              </div>
            </div>
            <div v-if="matchedStaffIds.length > 0" class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-morandi-purple/20 flex items-center justify-center flex-shrink-0">
                <User class="w-4 h-4 text-morandi-purple" />
              </div>
              <div>
                <p class="text-xs text-gray-400">婚礼角色</p>
                <div class="flex flex-wrap gap-1 mt-0.5">
                  <span
                    v-for="sid in matchedStaffIds"
                    :key="sid"
                    class="px-2 py-0.5 rounded-full text-xs font-medium bg-morandi-purple/10 text-morandi-purple"
                  >
                    {{ rehearsalStore.staff.find(s => s.id === sid)?.role || '' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="animate-slide-up mb-6" style="animation-delay: 0.2s">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Calendar class="w-5 h-5 text-primary-400" />
              参与的流程
              <span class="text-xs font-normal text-gray-400">({{ relatedScheduleItems.length }})</span>
            </h2>
            <button
              @click="goToSchedule"
              class="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 transition-colors"
            >
              查看全部流程
              <ExternalLink class="w-3 h-3" />
            </button>
          </div>

          <div v-if="relatedScheduleItems.length > 0" class="space-y-2">
            <div
              v-for="(item, index) in relatedScheduleItems"
              :key="item.id"
              class="animate-slide-up bg-white rounded-xl p-4 shadow-sm"
              :style="{ animationDelay: `${0.3 + index * 0.08}s` }"
            >
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Clock class="w-5 h-5 text-primary-500" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <h3 class="font-medium text-gray-800 text-sm">{{ item.title }}</h3>
                    <span class="text-xs text-primary-400 flex-shrink-0 ml-2">{{ item.time }}</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-0.5">{{ item.description }}</p>
                  <div class="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    <span class="flex items-center gap-1">
                      <MapPin class="w-3 h-3" />
                      {{ item.location }}
                    </span>
                    <span v-if="item.personInCharge" class="flex items-center gap-1">
                      <Users class="w-3 h-3" />
                      {{ item.personInCharge }}
                    </span>
                  </div>
                </div>
                <button
                  @click="goToSchedule(item.id)"
                  class="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-400 hover:bg-primary-100 hover:text-primary-600 transition-colors"
                  title="前往流程编辑"
                >
                  <ExternalLink class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div v-else class="bg-white rounded-2xl p-6 shadow-sm text-center">
            <Calendar class="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p class="text-sm text-gray-400">该宾客暂未参与婚礼流程</p>
          </div>
        </div>

        <div class="animate-slide-up mb-6" style="animation-delay: 0.35s">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ListChecks class="w-5 h-5 text-primary-400" />
              参与的彩排环节
              <span class="text-xs font-normal text-gray-400">({{ relatedRehearsalSteps.length }})</span>
            </h2>
            <button
              @click="goToRehearsal"
              class="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 transition-colors"
            >
              查看全部彩排
              <ExternalLink class="w-3 h-3" />
            </button>
          </div>

          <div v-if="relatedRehearsalSteps.length > 0" class="space-y-2">
            <div
              v-for="(step, index) in relatedRehearsalSteps"
              :key="step.id"
              class="animate-slide-up bg-white rounded-xl p-4 shadow-sm"
              :style="{ animationDelay: `${0.4 + index * 0.08}s` }"
            >
              <div class="flex items-start gap-3">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 text-sm"
                  :class="getStepNumberColor(index)"
                >
                  {{ step.stepNumber }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <h3 class="font-medium text-gray-800 text-sm">{{ step.title }}</h3>
                    <span v-if="step.duration" class="text-xs text-champagne-300 flex-shrink-0 ml-2">{{ step.duration }}</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-0.5">{{ step.description }}</p>
                  <div class="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    <span v-if="step.personInCharge" class="flex items-center gap-1">
                      <Users class="w-3 h-3" />
                      {{ step.personInCharge }}
                    </span>
                    <span v-if="step.notes">备注: {{ step.notes }}</span>
                  </div>
                </div>
                <button
                  @click="goToRehearsal(step.id)"
                  class="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-400 hover:bg-primary-100 hover:text-primary-600 transition-colors"
                  title="前往彩排编辑"
                >
                  <ExternalLink class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div v-else class="bg-white rounded-2xl p-6 shadow-sm text-center">
            <ListChecks class="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p class="text-sm text-gray-400">该宾客暂未参与彩排环节</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <Users class="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p class="text-gray-400 mb-4">未找到该宾客</p>
        <button
          @click="goBack"
          class="px-4 py-2 bg-primary-500 text-white rounded-full text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          返回宾客列表
        </button>
      </div>
    </div>
  </div>
</template>
