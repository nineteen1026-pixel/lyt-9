import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { get, set } from '../utils/storage'
import { mockBudget, type BudgetItem } from '../data/mockData'
import { useVenuesStore } from './venues'
import { usePhotographyStore } from './photography'
import { useDressStore } from './dress'

export { type BudgetItem }

export const useBudgetStore = defineStore('budget', () => {
  const STORAGE_KEY = 'wedding-budget'

  const items = ref<BudgetItem[]>(get(STORAGE_KEY, mockBudget))

  watch(items, (newValue) => {
    set(STORAGE_KEY, newValue)
  }, { deep: true })

  function addItem(item: Omit<BudgetItem, 'id'>) {
    const newItem: BudgetItem = {
      ...item,
      id: Date.now().toString(),
      budget: item.budget ?? item.planned
    }
    items.value.push(newItem)
  }

  function updateItem(id: string, updates: Partial<Omit<BudgetItem, 'id'>>) {
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      const updated = { ...items.value[index], ...updates }
      if (updates.planned !== undefined && updates.budget === undefined) {
        updated.budget = updates.planned
      }
      items.value[index] = updated
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

  function updateActualByCategory(category: string, actual: number) {
    const index = items.value.findIndex(item => item.category === category)
    if (index !== -1) {
      items.value[index].actual = actual
    }
  }

  function getItemByCategory(category: string) {
    return items.value.find(item => item.category === category)
  }

  const totalBudget = computed(() => items.value.reduce((sum, item) => sum + (item.budget ?? item.planned), 0))
  const totalSpent = computed(() => items.value.reduce((sum, item) => sum + item.actual, 0))
  const remaining = computed(() => totalBudget.value - totalSpent.value)
  const progress = computed(() => totalBudget.value > 0 ? (totalSpent.value / totalBudget.value) * 100 : 0)

  const totalPlanned = () => items.value.reduce((sum, item) => sum + item.planned, 0)
  const totalActual = () => items.value.reduce((sum, item) => sum + item.actual, 0)

  function syncContractedToBudget() {
    const venuesStore = useVenuesStore()
    const photographyStore = usePhotographyStore()
    const dressStore = useDressStore()

    const totalVenuesContracted = venuesStore.venues
      .filter(v => v.contracted)
      .reduce((sum, v) => sum + v.contractPrice, 0)
    updateActualByCategory('场地', totalVenuesContracted)

    const totalPhotographyContracted = photographyStore.items
      .filter(p => p.contracted)
      .reduce((sum, p) => sum + p.contractPrice, 0)
    updateActualByCategory('摄影', totalPhotographyContracted)

    const totalDressContracted = dressStore.dresses
      .filter(d => d.contracted)
      .reduce((sum, d) => sum + d.contractPrice, 0)
    updateActualByCategory('婚纱', totalDressContracted)
  }

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    getItemById,
    updateActualByCategory,
    getItemByCategory,
    syncContractedToBudget,
    totalBudget,
    totalSpent,
    remaining,
    progress,
    totalPlanned,
    totalActual
  }
})
