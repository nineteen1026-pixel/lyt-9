import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { get, set } from '../utils/storage'
import { mockChecklist, type ChecklistItem } from '../data/mockData'
import { useBudgetStore } from './budget'

export { type ChecklistItem }

export const useChecklistStore = defineStore('checklist', () => {
  const STORAGE_KEY = 'wedding-checklist'

  const items = ref<ChecklistItem[]>(get(STORAGE_KEY, mockChecklist))

  watch(items, (newValue) => {
    set(STORAGE_KEY, newValue)
  }, { deep: true })

  const completedCount = computed(() => items.value.filter(i => i.completed).length)
  const totalCount = computed(() => items.value.length)
  const progress = computed(() => totalCount.value > 0 ? (completedCount.value / totalCount.value) * 100 : 0)

  function syncBudgetConfirmations() {
    const budgetStore = useBudgetStore()
    const categoriesWithTasks = new Map<string, boolean[]>()

    items.value.forEach(item => {
      if (item.budgetCategory) {
        if (!categoriesWithTasks.has(item.budgetCategory)) {
          categoriesWithTasks.set(item.budgetCategory, [])
        }
        categoriesWithTasks.get(item.budgetCategory)!.push(item.completed)
      }
    })

    categoriesWithTasks.forEach((completedList, category) => {
      const allCompleted = completedList.every(c => c)
      if (allCompleted) {
        budgetStore.confirmCategory(category)
      } else {
        budgetStore.unconfirmCategory(category)
      }
    })
  }

  function addItem(item: Omit<ChecklistItem, 'id' | 'order'>) {
    const maxOrder = items.value.reduce((max, i) => Math.max(max, i.order), 0)
    const newItem: ChecklistItem = {
      ...item,
      id: Date.now().toString(),
      order: maxOrder + 1
    }
    items.value.push(newItem)
    if (newItem.completed) {
      syncBudgetConfirmations()
    }
  }

  function updateItem(id: string, updates: Partial<Omit<ChecklistItem, 'id'>>) {
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      items.value[index] = { ...items.value[index], ...updates }
      items.value.sort((a, b) => a.order - b.order)
      syncBudgetConfirmations()
    }
  }

  function toggleComplete(id: string) {
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      items.value[index].completed = !items.value[index].completed
      syncBudgetConfirmations()
    }
  }

  function deleteItem(id: string) {
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      items.value.splice(index, 1)
      syncBudgetConfirmations()
    }
  }

  function getItemById(id: string) {
    return items.value.find(item => item.id === id)
  }

  function getItemsByCategory(category: string) {
    return items.value.filter(item => item.budgetCategory === category)
  }

  return {
    items,
    completedCount,
    totalCount,
    progress,
    addItem,
    updateItem,
    toggleComplete,
    deleteItem,
    getItemById,
    getItemsByCategory,
    syncBudgetConfirmations
  }
})
