import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { get, set } from '../utils/storage'
import {
  mockPhotography,
  mockTeam,
  mockPortfolio,
  mockPackages,
  type Photography,
  type TeamMember,
  type PortfolioItem,
  type PhotographyPackage
} from '../data/mockData'

export { type Photography, type TeamMember, type PortfolioItem, type PhotographyPackage }

export const usePhotographyStore = defineStore('photography', () => {
  const STORAGE_KEY = 'wedding-photography'

  const items = ref<Photography[]>(get(STORAGE_KEY, mockPhotography))
  const team = ref<TeamMember[]>(mockTeam)
  const portfolio = ref<PortfolioItem[]>(mockPortfolio)
  const packages = ref<PhotographyPackage[]>(mockPackages)

  watch(items, (newValue) => {
    set(STORAGE_KEY, newValue)
  }, { deep: true })

  function addItem(item: Omit<Photography, 'id'>) {
    const newItem: Photography = {
      ...item,
      id: Date.now().toString()
    }
    items.value.push(newItem)
  }

  function updateItem(id: string, updates: Partial<Omit<Photography, 'id'>>) {
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      items.value[index] = { ...items.value[index], ...updates }
    }
  }

  function deleteItem(id: string) {
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      items.value.splice(index, 1)
    }
  }

  function getItemById(id: string) {
    return items.value.find(item => item.id === id)
  }

  return {
    items,
    team,
    portfolio,
    packages,
    addItem,
    updateItem,
    deleteItem,
    getItemById
  }
})
