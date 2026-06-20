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
      contractPrice: item.contractPrice ?? 0,
      pros: item.pros ?? [],
      cons: item.cons ?? [],
      rating: item.rating ?? 0,
      notes: item.notes ?? '',
      createdAt: item.createdAt ?? Date.now()
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
    items.value.forEach((item) => {
      if (item.id !== id) {
        item.contracted = false
        item.contractPrice = 0
      }
    })
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      const item = items.value[index]
      items.value[index].contracted = true
      items.value[index].contractPrice = contractPrice
      
      budgetStore.recordContractChange('摄影', contractPrice, '用户', item.teamName)
    }
  }

  function cancelContractItem(id: string) {
    const budgetStore = useBudgetStore()
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      const item = items.value[index]
      items.value[index].contracted = false
      items.value[index].contractPrice = 0

      budgetStore.recordContractChange('摄影', 0, '用户', item.teamName)
    }
  }

  function deleteItem(id: string) {
    const budgetStore = useBudgetStore()
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      const deletedItem = items.value[index]
      items.value.splice(index, 1)

      const totalContracted = items.value
        .filter(p => p.contracted)
        .reduce((sum, p) => sum + p.contractPrice, 0)
      const contractedNames = items.value
        .filter(p => p.contracted)
        .map(p => p.teamName)
        .join('、')
      budgetStore.recordContractChange('摄影', totalContracted, '用户', `删除${deletedItem.teamName}${contractedNames ? `，剩余：${contractedNames}` : ''}`)
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
