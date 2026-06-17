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
import { useBudgetStore } from './budget'

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
      id: Date.now().toString(),
      contracted: item.contracted ?? false,
      contractPrice: item.contractPrice ?? 0
    }
    items.value.push(newItem)
  }

  function updateItem(id: string, updates: Partial<Omit<Photography, 'id'>>) {
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      items.value[index] = { ...items.value[index], ...updates }
    }
  }

  function updateContractItem(id: string, contractPrice: number) {
    const budgetStore = useBudgetStore()
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      items.value[index].contracted = true
      items.value[index].contractPrice = contractPrice
      
      const totalContracted = items.value
        .filter(p => p.contracted)
        .reduce((sum, p) => sum + p.contractPrice, 0)
      
      budgetStore.updateActualByCategory('摄影', totalContracted)
    }
  }

  function cancelContractItem(id: string) {
    const budgetStore = useBudgetStore()
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      items.value[index].contracted = false
      items.value[index].contractPrice = 0
      
      const totalContracted = items.value
        .filter(p => p.contracted)
        .reduce((sum, p) => sum + p.contractPrice, 0)
      
      budgetStore.updateActualByCategory('摄影', totalContracted)
    }
  }

  function deleteItem(id: string) {
    const budgetStore = useBudgetStore()
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      items.value.splice(index, 1)

      const totalContracted = items.value
        .filter(p => p.contracted)
        .reduce((sum, p) => sum + p.contractPrice, 0)
      budgetStore.updateActualByCategory('摄影', totalContracted)
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
    updateContractItem,
    cancelContractItem,
    deleteItem,
    getItemById
  }
})
