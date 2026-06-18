import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { get, set } from '../utils/storage'
import { mockGuests, type Guest, type GuestStatus, type GuestGroup } from '../data/mockData'
import { useVenuesStore } from './venues'

export { type Guest, type GuestStatus, type GuestGroup }

export interface TableValidationResult {
  valid: boolean
  message: string
  assignedCount: number
  venueCapacity: number
  overflow: number
}

export const useGuestsStore = defineStore('guests', () => {
  const STORAGE_KEY = 'wedding-guests'
  const venuesStore = useVenuesStore()

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

  const assignedGuestsCount = computed(() =>
    guests.value.filter(g => g.tableNumber !== null && g.status === 'confirmed').length
  )

  const bookedVenueCapacity = computed(() =>
    venuesStore.bookedVenues.reduce((sum, v) => sum + v.capacity, 0)
  )

  const isOverCapacity = computed(() =>
    assignedGuestsCount.value > bookedVenueCapacity.value
  )

  const capacityOverflow = computed(() =>
    Math.max(0, assignedGuestsCount.value - bookedVenueCapacity.value)
  )

  function validateTableAssignment(guestId: string, newTableNumber: number | null): TableValidationResult {
    const guest = getGuestById(guestId)
    if (!guest) {
      return { valid: false, message: '宾客不存在', assignedCount: 0, venueCapacity: 0, overflow: 0 }
    }

    if (guest.status !== 'confirmed') {
      return { valid: true, message: '', assignedCount: assignedGuestsCount.value, venueCapacity: bookedVenueCapacity.value, overflow: 0 }
    }

    const currentAssigned = assignedGuestsCount.value
    const wasAssigned = guest.tableNumber !== null
    const willBeAssigned = newTableNumber !== null

    let newAssignedCount = currentAssigned
    let isIncreasing = false
    if (!wasAssigned && willBeAssigned) {
      newAssignedCount = currentAssigned + 1
      isIncreasing = true
    } else if (wasAssigned && !willBeAssigned) {
      newAssignedCount = currentAssigned - 1
      isIncreasing = false
    }

    const capacity = bookedVenueCapacity.value
    const overflow = Math.max(0, newAssignedCount - capacity)

    if (isIncreasing && overflow > 0) {
      const venueNames = venuesStore.bookedVenues.map(v => v.name).join('、')
      return {
        valid: false,
        message: `场地席位数不足！已预订场地「${venueNames}」总容量为${capacity}人，当前已分配${newAssignedCount}人，超出${overflow}人。`,
        assignedCount: newAssignedCount,
        venueCapacity: capacity,
        overflow
      }
    }

    return {
      valid: true,
      message: '',
      assignedCount: newAssignedCount,
      venueCapacity: capacity,
      overflow: 0
    }
  }

  function updateGuestTable(guestId: string, tableNumber: number | null): TableValidationResult {
    const validation = validateTableAssignment(guestId, tableNumber)
    if (!validation.valid) {
      return validation
    }

    updateGuest(guestId, { tableNumber })
    return validation
  }

  const capacityWarning = computed(() => {
    if (bookedVenueCapacity.value === 0) {
      return null
    }
    if (isOverCapacity.value) {
      const venueNames = venuesStore.bookedVenues.map(v => v.name).join('、')
      return {
        title: '场地席位超员预警',
        content: `已预订场地「${venueNames}」总容量为${bookedVenueCapacity.value}人，当前已分配${assignedGuestsCount.value}人，超出${capacityOverflow.value}人。请调整分桌安排或更换更大容量的场地。`
      }
    }
    return null
  })

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
    bothGuests,
    assignedGuestsCount,
    bookedVenueCapacity,
    isOverCapacity,
    capacityOverflow,
    validateTableAssignment,
    updateGuestTable,
    capacityWarning
  }
})
