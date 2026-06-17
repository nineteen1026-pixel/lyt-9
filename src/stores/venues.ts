import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { get, set } from '../utils/storage'
import { mockVenues, type Venue, type VenueStatus } from '../data/mockData'

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
      id: Date.now().toString()
    }
    venues.value.push(newVenue)
  }

  function updateVenue(id: string, updates: Partial<Omit<Venue, 'id'>>) {
    const index = venues.value.findIndex(venue => venue.id === id)
    if (index !== -1) {
      venues.value[index] = { ...venues.value[index], ...updates }
    }
  }

  function deleteVenue(id: string) {
    const index = venues.value.findIndex(venue => venue.id === id)
    if (index !== -1) {
      venues.value.splice(index, 1)
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
    deleteVenue,
    getVenueById,
    bookedVenues,
    candidateVenues
  }
})
