<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGuestsStore, type Guest, type GuestStatus, type GuestGroup } from '@/stores/guests'
import { Search, Users, CheckCircle, Clock, XCircle, Utensils, Edit3, X, AlertTriangle, Info } from 'lucide-vue-next'
import Toast from '@/components/Toast.vue'

const guestsStore = useGuestsStore()
const searchQuery = ref('')
const activeFilter = ref<GuestStatus | 'all'>('all')
const activeGroup = ref<GuestGroup | 'all'>('all')

const showTableModal = ref(false)
const selectedGuest = ref<Guest | null>(null)
const editingTableNumber = ref<number | null>(null)

const toastVisible = ref(false)
const toastMessage = ref('')
const toastDescription = ref('')
const toastType = ref<'success' | 'error' | 'warning' | 'info'>('success')

const showToast = (message: string, description?: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', duration = 3000) => {
  toastMessage.value = message
  toastDescription.value = description ?? ''
  toastType.value = type
  toastVisible.value = true
  setTimeout(() => {
    toastVisible.value = false
  }, duration)
}

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

const previewValidation = computed(() => {
  if (!selectedGuest.value) return null
  return guestsStore.validateTableAssignment(selectedGuest.value.id, editingTableNumber.value)
})

const canSave = computed(() => {
  if (!selectedGuest.value) return false
  if (editingTableNumber.value === selectedGuest.value.tableNumber) return false
  return previewValidation.value?.valid ?? false
})

const previewAssignedCount = computed(() => {
  return previewValidation.value?.assignedCount ?? guestsStore.assignedGuestsCount
})

const openTableModal = (guest: Guest) => {
  selectedGuest.value = guest
  editingTableNumber.value = guest.tableNumber
  showTableModal.value = true
}

const closeTableModal = () => {
  showTableModal.value = false
  selectedGuest.value = null
  editingTableNumber.value = null
}

const saveTableNumber = () => {
  if (!selectedGuest.value || !canSave.value) return

  const tableNum = editingTableNumber.value
  const result = guestsStore.updateGuestTable(selectedGuest.value.id, tableNum)

  if (!result.valid) {
    showToast('分桌保存失败', result.message, 'error', 4000)
    return
  }

  if (tableNum === null) {
    showToast('已取消分桌', `${selectedGuest.value.name} 的分桌已取消`, 'info')
  } else {
    showToast('分桌保存成功', `${selectedGuest.value.name} 已分配到 ${tableNum}号桌`, 'success')
  }
  closeTableModal()
}

const clearTableNumber = () => {
  editingTableNumber.value = null
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
        <div class="grid grid-cols-4 gap-3 mb-6">
          <div class="animate-slide-up bg-white rounded-2xl p-3 shadow-md text-center" style="animation-delay: 0.1s">
            <p class="text-2xl font-bold text-primary-500">{{ guestsStore.totalCount }}</p>
            <p class="text-xs text-gray-500">总人数</p>
          </div>
          <div class="animate-slide-up bg-white rounded-2xl p-3 shadow-md text-center" style="animation-delay: 0.2s">
            <p class="text-2xl font-bold text-green-500">{{ guestsStore.confirmedCount }}</p>
            <p class="text-xs text-gray-500">已确认</p>
          </div>
          <div class="animate-slide-up bg-white rounded-2xl p-3 shadow-md text-center" style="animation-delay: 0.25s">
            <p class="text-2xl font-bold" :class="guestsStore.isOverCapacity ? 'text-red-500' : (guestsStore.hasBookedVenue ? 'text-primary-500' : 'text-yellow-500')">
              <template v-if="guestsStore.hasBookedVenue">
                {{ guestsStore.assignedGuestsCount }}/{{ guestsStore.bookedVenueCapacity }}
              </template>
              <template v-else>
                未预订
              </template>
            </p>
            <p class="text-xs text-gray-500">已分配/场地容量</p>
          </div>
          <div class="animate-slide-up bg-white rounded-2xl p-3 shadow-md text-center" style="animation-delay: 0.3s">
            <p class="text-2xl font-bold text-red-500">{{ guestsStore.declinedCount }}</p>
            <p class="text-xs text-gray-500">缺席</p>
          </div>
        </div>

        <div v-if="guestsStore.capacityWarning" class="animate-slide-up mb-4 rounded-2xl p-4 shadow-sm" style="animation-delay: 0.35s"
          :class="guestsStore.hasBookedVenue ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'">
          <div class="flex items-start gap-3">
            <component :is="guestsStore.hasBookedVenue ? AlertTriangle : Info" class="w-6 h-6 flex-shrink-0 mt-0.5" :class="guestsStore.hasBookedVenue ? 'text-red-500' : 'text-yellow-500'" />
            <div>
              <p class="font-medium" :class="guestsStore.hasBookedVenue ? 'text-red-700' : 'text-yellow-700'">{{ guestsStore.capacityWarning.title }}</p>
              <p class="text-sm mt-1" :class="guestsStore.hasBookedVenue ? 'text-red-600' : 'text-yellow-600'">{{ guestsStore.capacityWarning.content }}</p>
            </div>
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
              <button 
                @click="openTableModal(guest)"
                class="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-500 hover:bg-primary-100 transition-colors"
                :disabled="guest.status === 'declined'"
                :class="{ 'opacity-50 cursor-not-allowed': guest.status === 'declined' }"
                :title="guest.status === 'declined' ? '缺席宾客无需分桌' : '编辑分桌'"
              >
                <Edit3 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="filteredGuests.length === 0" class="animate-fade-in text-center py-16">
          <Users class="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p class="text-gray-400">暂无符合条件的宾客</p>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showTableModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeTableModal"></div>
        <div class="relative bg-white rounded-3xl p-6 w-full max-w-md animate-fade-in shadow-2xl">
          <button 
            @click="closeTableModal"
            class="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X class="w-5 h-5 text-gray-500" />
          </button>
          
          <div class="text-center mb-6">
            <div class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <Utensils class="w-8 h-8 text-primary-500" />
            </div>
            <h3 class="text-xl font-bold text-gray-800">编辑分桌</h3>
            <p class="text-sm text-gray-500 mt-1">{{ selectedGuest?.name }}</p>
          </div>

          <div class="space-y-4">
            <div v-if="selectedGuest?.status === 'declined'" class="p-4 bg-red-50 rounded-xl">
              <p class="text-sm text-red-700">
                <AlertTriangle class="w-4 h-4 inline mr-1" />
                该宾客状态为「缺席」，无需分桌。
              </p>
            </div>

            <div v-if="!guestsStore.hasBookedVenue" class="p-4 bg-yellow-50 rounded-xl">
              <p class="text-sm text-yellow-700">
                <Info class="w-4 h-4 inline mr-1" />
                尚未预订场地，请先预订场地后再进行分桌安排。
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">桌号</label>
              <input 
                v-model.number="editingTableNumber"
                type="number"
                min="1"
                class="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors text-lg font-medium text-center"
                :class="previewValidation && !previewValidation.valid ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-primary-400'"
                placeholder="输入桌号，留空表示取消分桌"
              />
              <button 
                v-if="editingTableNumber !== null"
                @click="clearTableNumber"
                class="mt-2 w-full py-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                清除桌号，取消分桌
              </button>
            </div>

            <div v-if="previewValidation && !previewValidation.valid" class="p-4 bg-red-50 rounded-xl border border-red-200">
              <p class="text-sm text-red-700">
                <AlertTriangle class="w-4 h-4 inline mr-1" />
                {{ previewValidation.message }}
              </p>
            </div>

            <div class="bg-gray-50 rounded-xl p-4">
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">
                  <template v-if="guestsStore.hasBookedVenue">保存后已分配人数</template>
                  <template v-else>已分配人数</template>
                </span>
                <span class="font-medium" :class="(previewValidation && previewValidation.overflow > 0) ? 'text-red-500' : 'text-gray-800'">
                  <template v-if="guestsStore.hasBookedVenue">
                    {{ previewAssignedCount }} / {{ guestsStore.bookedVenueCapacity }} 人
                  </template>
                  <template v-else>
                    {{ guestsStore.assignedGuestsCount }} / 未预订
                  </template>
                </span>
              </div>
              <div v-if="guestsStore.hasBookedVenue" class="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all duration-300"
                  :class="(previewValidation && previewValidation.overflow > 0) ? 'bg-red-500' : 'bg-primary-500'"
                  :style="{ width: `${Math.min((previewAssignedCount / guestsStore.bookedVenueCapacity) * 100, 100)}%` }"
                ></div>
              </div>
              <p v-if="previewValidation && previewValidation.overflow > 0" class="text-xs text-red-500 mt-2">
                <AlertTriangle class="w-3 h-3 inline mr-1" />
                保存后将超出场地容量 {{ previewValidation.overflow }} 人
              </p>
            </div>

            <div class="flex gap-3 pt-4">
              <button 
                @click="closeTableModal"
                class="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button 
                @click="saveTableNumber"
                :disabled="!canSave"
                class="flex-1 py-3 bg-gradient-to-r from-primary-400 to-primary-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Toast 
      :visible="toastVisible" 
      :message="toastMessage" 
      :description="toastDescription"
      :type="toastType" 
    />
  </div>
</template>
