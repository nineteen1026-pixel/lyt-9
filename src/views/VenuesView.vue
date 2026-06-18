<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useVenuesStore, type VenueStatus } from '@/stores/venues'
import { MapPin, Users, Tag, CheckCircle, Star, X, FileSignature, Ban } from 'lucide-vue-next'
import Toast from '@/components/Toast.vue'

const router = useRouter()
const venuesStore = useVenuesStore()

const showContractModal = ref(false)
const selectedVenueId = ref<string | null>(null)
const contractPrice = ref(0)

const toastVisible = ref(false)
const toastMessage = ref('')
const toastDescription = ref('')
const toastType = ref<'success' | 'error' | 'warning' | 'info'>('success')

const showToast = (message: string, description?: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', duration = 2500) => {
  toastMessage.value = message
  toastDescription.value = description ?? ''
  toastType.value = type
  toastVisible.value = true
  setTimeout(() => {
    toastVisible.value = false
  }, duration)
}

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

const openContractModal = (venueId: string, currentPrice: number) => {
  selectedVenueId.value = venueId
  contractPrice.value = currentPrice
  showContractModal.value = true
}

const closeContractModal = () => {
  showContractModal.value = false
  selectedVenueId.value = null
  contractPrice.value = 0
}

const confirmContract = () => {
  if (selectedVenueId.value && contractPrice.value > 0) {
    const venue = venuesStore.getVenueById(selectedVenueId.value)
    venuesStore.updateContractVenue(selectedVenueId.value, contractPrice.value)
    closeContractModal()
    showToast(
      '场地签约成功！',
      `${venue?.name ?? ''} 已签约 ${formatPrice(contractPrice.value)}`,
      'success',
      2000
    )
    setTimeout(() => {
      router.push('/budget')
    }, 1500)
  }
}

const hasBookedVenue = computed(() => {
  return venuesStore.venues.some(v => v.contracted)
})

const cancelContract = (venueId: string) => {
  venuesStore.cancelContractVenue(venueId)
  showToast('已取消签约', '', 'info')
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
            :class="{ 'opacity-60 grayscale pointer-events-none': !venue.contracted && hasBookedVenue, 'hover:shadow-xl hover:-translate-y-1': venue.contracted || !hasBookedVenue, 'hover:shadow-none hover:translate-y-0': !venue.contracted && hasBookedVenue }"
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

              <div v-if="venue.contracted" class="mt-4 flex items-center justify-between gap-2 p-3 bg-green-50 rounded-xl">
                <div class="flex items-center gap-2">
                  <CheckCircle class="w-5 h-5 text-green-500" />
                  <div>
                    <span class="text-sm text-green-600 font-medium">已签约</span>
                    <p class="text-xs text-green-500">签约金额: {{ formatPrice(venue.contractPrice) }}</p>
                  </div>
                </div>
                <button 
                  @click="cancelContract(venue.id)"
                  class="px-3 py-1.5 text-xs bg-white text-red-500 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                >
                  取消签约
                </button>
              </div>

              <div v-else class="mt-4">
                <div v-if="hasBookedVenue" class="flex items-center gap-2 p-3 bg-gray-100 rounded-xl">
                  <Ban class="w-5 h-5 text-gray-400" />
                  <span class="text-sm text-gray-500 font-medium">已选定其他场地</span>
                </div>
                <template v-else>
                  <div class="flex items-center gap-2 p-3 bg-champagne-100 rounded-xl mb-3">
                    <Star class="w-5 h-5 text-champagne-300" />
                    <span class="text-sm text-champagne-300 font-medium">备选场地，可签约预订</span>
                  </div>
                  <button 
                    @click="openContractModal(venue.id, venue.price)"
                    class="w-full py-3 bg-gradient-to-r from-primary-400 to-primary-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300"
                  >
                    <FileSignature class="w-5 h-5" />
                    立即签约
                  </button>
                </template>
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
              <h3 class="text-xl font-bold text-gray-800">场地签约</h3>
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

      <Toast 
        :visible="toastVisible" 
        :message="toastMessage" 
        :description="toastDescription"
        :type="toastType" 
      />
    </div>
  </div>
</template>
