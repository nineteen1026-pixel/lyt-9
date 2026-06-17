import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { get, set } from '../utils/storage'
import { mockVenues, type Venue, type VenueStatus } from '../data/mockData'
import { useBudgetStore } from './budget'

export { type Venue, type VenueStatus }

export const useVenuesStore = defineStore('venues', () => {
  const STORAGE_KEY = 'wedding-venues'

  const venues = ref<Venue[]>(get(STORAGE_KEY, mockVenues))

  watch(venues, (newValue) => {
    set(STORAGE_KEY, newValue)
  }, { deep: true })

  function addVenue(venue: Omit<Venue, 'id'>) {
    const newVenue: Venue = {
      ...venue,
      id: Date.now().toString(),
      contracted: venue.contracted ?? false,
      contractPrice: venue.contractPrice ?? 0
    }
    venues.value.push(newVenue)
  }

  function updateVenue(id: string, updates: Partial<Omit<Venue, 'id'>>) {
    const index = venues.value.findIndex(venue => venue.id === id)
    if (index !== -1) {
      venues.value[index] = { ...venues.value[index], ...updates }
    }
  }

  function updateContractVenue(id: string, contractPrice: number) {
    const budgetStore = useBudgetStore()
    venues.value.forEach((venue) => {
      if (venue.id !== id) {
        venue.contracted = false
        venue.contractPrice = 0
        venue.status = 'alternative'
      }
    })
    const index = venues.value.findIndex(venue => venue.id === id)
    if (index !== -1) {
      venues.value[index].contracted = true
      venues.value[index].contractPrice = contractPrice
      venues.value[index].status = 'booked'

      budgetStore.updateActualByCategory('场地', contractPrice)
    }
  }

  function cancelContractVenue(id: string) {
    const budgetStore = useBudgetStore()
    const index = venues.value.findIndex(venue => venue.id === id)
    if (index !== -1) {
      venues.value[index].contracted = false
      venues.value[index].contractPrice = 0
      venues.value[index].status = 'alternative'

      budgetStore.updateActualByCategory('场地', 0)
    }
  }

  function deleteVenue(id: string) {
    const budgetStore = useBudgetStore()
    const index = venues.value.findIndex(venue => venue.id === id)
    if (index !== -1) {
      venues.value.splice(index, 1)

      const totalContracted = venues.value
        .filter(v => v.contracted)
        .reduce((sum, v) => sum + v.contractPrice, 0)
      budgetStore.updateActualByCategory('场地', totalContracted)
    }
  }

  function getVenueById(id: string) {
    return venues.value.find(venue => venue.id === id)
  }

  const bookedVenues = computed(() => venues.value.filter(v => v.status === 'booked'))
  const candidateVenues = computed(() => venues.value.filter(v => v.status === 'alternative'))

  return {
    venues,
    addVenue,
    updateVenue,
    updateContractVenue,
    cancelContractVenue,
    deleteVenue,
    getVenueById,
    bookedVenues,
    candidateVenues
  }
})
