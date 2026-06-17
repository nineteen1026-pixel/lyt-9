import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { get, set } from '../utils/storage'
import { mockGuests, type Guest, type GuestStatus, type GuestGroup } from '../data/mockData'

export { type Guest, type GuestStatus, type GuestGroup }

export const useGuestsStore = defineStore('guests', () => {
  const STORAGE_KEY = 'wedding-guests'

  const guests = ref<Guest[]>(get(STORAGE_KEY, mockGuests))

  watch(guests, (newValue) => {
    set(STORAGE_KEY, newValue)
  }, { deep: true })

  function addGuest(guest: Omit<Guest, 'id'>) {
    const newGuest: Guest = {
      ...guest,
      id: Date.now().toString()
    }
    guests.value.push(newGuest)
  }

  function updateGuest(id: string, updates: Partial<Omit<Guest, 'id'>>) {
    const index = guests.value.findIndex(guest => guest.id === id)
    if (index !== -1) {
      guests.value[index] = { ...guests.value[index], ...updates }
    }
  }

  function deleteGuest(id: string) {
    const index = guests.value.findIndex(guest => guest.id === id)
    if (index !== -1) {
      guests.value.splice(index, 1)
    }
  }

  function getGuestById(id: string) {
    return guests.value.find(guest => guest.id === id)
  }

  const totalCount = computed(() => guests.value.length)
  const confirmedCount = computed(() => guests.value.filter(g => g.status === 'confirmed').length)
  const pendingCount = computed(() => guests.value.filter(g => g.status === 'pending').length)
  const declinedCount = computed(() => guests.value.filter(g => g.status === 'declined').length)

  const groomGuests = computed(() => guests.value.filter(g => g.group === 'groom'))
  const brideGuests = computed(() => guests.value.filter(g => g.group === 'bride'))
  const bothGuests = computed(() => guests.value.filter(g => g.group === 'both'))

  return {
    guests,
    addGuest,
    updateGuest,
    deleteGuest,
    getGuestById,
    totalCount,
    confirmedCount,
    pendingCount,
    declinedCount,
    groomGuests,
    brideGuests,
    bothGuests
  }
})
