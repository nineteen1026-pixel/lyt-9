<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGuestsStore, type Guest, type GuestStatus, type GuestGroup } from '@/stores/guests'
import { Search, Users, CheckCircle, Clock, XCircle, Utensils } from 'lucide-vue-next'

const guestsStore = useGuestsStore()
const searchQuery = ref('')
const activeFilter = ref<GuestStatus | 'all'>('all')
const activeGroup = ref<GuestGroup | 'all'>('all')

const statusFilters: { key: GuestStatus | 'all'; label: string; icon: typeof Users }[] = [
  { key: 'all', label: '全部', icon: Users },
  { key: 'confirmed', label: '已确认', icon: CheckCircle },
  { key: 'pending', label: '待定', icon: Clock },
  { key: 'declined', label: '缺席', icon: XCircle },
]

const groupFilters: { key: GuestGroup | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'groom', label: '男方' },
  { key: 'bride', label: '女方' },
  { key: 'both', label: '双方' },
]

const filteredGuests = computed(() => {
  return guestsStore.guests.filter(guest => {
    const matchesSearch = guest.name.includes(searchQuery.value) || guest.phone.includes(searchQuery.value)
    const matchesStatus = activeFilter.value === 'all' || guest.status === activeFilter.value
    const matchesGroup = activeGroup.value === 'all' || guest.group === activeGroup.value
    return matchesSearch && matchesStatus && matchesGroup
  })
})

const getStatusConfig = (status: GuestStatus) => {
  switch (status) {
    case 'confirmed':
      return { label: '已确认', class: 'bg-green-100 text-green-600' }
    case 'pending':
      return { label: '待定', class: 'bg-yellow-100 text-yellow-600' }
    case 'declined':
      return { label: '缺席', class: 'bg-red-100 text-red-500' }
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
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-ivory to-champagne-100 pb-20">
    <div class="animate-fade-in">
      <div class="bg-gradient-to-r from-primary-400 to-primary-500 px-6 pt-12 pb-16 rounded-b-3xl shadow-lg">
        <h1 class="text-3xl font-serif font-bold text-white text-center">宾客名单</h1>
        <p class="text-primary-100 text-center mt-2">共邀挚爱，见证幸福</p>
      </div>

      <div class="px-4 -mt-10">
        <div class="grid grid-cols-3 gap-3 mb-6">
          <div class="animate-slide-up bg-white rounded-2xl p-3 shadow-md text-center" style="animation-delay: 0.1s">
            <p class="text-2xl font-bold text-primary-500">{{ guestsStore.totalCount }}</p>
            <p class="text-xs text-gray-500">总人数</p>
          </div>
          <div class="animate-slide-up bg-white rounded-2xl p-3 shadow-md text-center" style="animation-delay: 0.2s">
            <p class="text-2xl font-bold text-green-500">{{ guestsStore.confirmedCount }}</p>
            <p class="text-xs text-gray-500">已确认</p>
          </div>
          <div class="animate-slide-up bg-white rounded-2xl p-3 shadow-md text-center" style="animation-delay: 0.3s">
            <p class="text-2xl font-bold text-red-500">{{ guestsStore.declinedCount }}</p>
            <p class="text-xs text-gray-500">缺席</p>
          </div>
        </div>

        <div class="animate-slide-up bg-white rounded-2xl p-3 shadow-md mb-4 flex items-center gap-3" style="animation-delay: 0.4s">
          <Search class="w-5 h-5 text-gray-400" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="搜索宾客姓名或电话..." 
            class="flex-1 outline-none text-gray-700 placeholder-gray-400"
          />
        </div>

        <div class="animate-slide-up mb-4 flex gap-2 overflow-x-auto pb-2" style="animation-delay: 0.5s">
          <button 
            v-for="filter in statusFilters" 
            :key="filter.key"
            @click="activeFilter = filter.key"
            class="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300"
            :class="activeFilter === filter.key 
              ? 'bg-primary-500 text-white shadow-md' 
              : 'bg-white text-gray-600 hover:bg-primary-50'"
          >
            <component :is="filter.icon" class="w-4 h-4" />
            {{ filter.label }}
          </button>
        </div>

        <div class="animate-slide-up mb-4 flex gap-2 overflow-x-auto pb-2" style="animation-delay: 0.6s">
          <button 
            v-for="filter in groupFilters" 
            :key="filter.key"
            @click="activeGroup = filter.key"
            class="px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 border"
            :class="activeGroup === filter.key 
              ? 'bg-champagne-200 text-champagne-300 border-champagne-200' 
              : 'bg-white text-gray-500 border-gray-200 hover:border-champagne-200'"
          >
            {{ filter.label }}
          </button>
        </div>

        <div class="space-y-3">
          <div 
            v-for="(guest, index) in filteredGuests" 
            :key="guest.id"
            class="animate-slide-up bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300"
            :style="{ animationDelay: `${0.7 + index * 0.1}s` }"
          >
            <div class="flex items-center gap-3">
              <div 
                class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                :class="getAvatarColor(guest.name)"
              >
                {{ guest.avatar }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="font-medium text-gray-800">{{ guest.name }}</p>
                  <span 
                    class="px-2 py-0.5 rounded-full text-xs"
                    :class="getStatusConfig(guest.status).class"
                  >
                    {{ getStatusConfig(guest.status).label }}
                  </span>
                </div>
                <p class="text-sm text-gray-400 mt-0.5">{{ guest.phone }}</p>
                <div class="flex items-center gap-3 mt-1">
                  <span class="text-xs text-gray-400">{{ getGroupLabel(guest.group) }}</span>
                  <span v-if="guest.tableNumber" class="flex items-center gap-1 text-xs text-primary-500">
                    <Utensils class="w-3 h-3" />
                    {{ guest.tableNumber }}号桌
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredGuests.length === 0" class="animate-fade-in text-center py-16">
          <Users class="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p class="text-gray-400">暂无符合条件的宾客</p>
        </div>
      </div>
    </div>
  </div>
</template>
