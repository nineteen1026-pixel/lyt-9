import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { get, set } from '../utils/storage'
import { mockSchedule, mockWeddingDate, type ScheduleItem } from '../data/mockData'

export { type ScheduleItem }

export const useScheduleStore = defineStore('schedule', () => {
  const STORAGE_KEY = 'wedding-schedule'

  const items = ref<ScheduleItem[]>(get(STORAGE_KEY, mockSchedule))
  const weddingDate = ref(mockWeddingDate)

  watch(items, (newValue) => {
    set(STORAGE_KEY, newValue)
  }, { deep: true })

  function addItem(item: Omit<ScheduleItem, 'id'>) {
    const newItem: ScheduleItem = {
      ...item,
      id: Date.now().toString()
    }
    items.value.push(newItem)
    items.value.sort((a, b) => a.time.localeCompare(b.time))
  }

  function updateItem(id: string, updates: Partial<Omit<ScheduleItem, 'id'>>) {
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      items.value[index] = { ...items.value[index], ...updates }
      items.value.sort((a, b) => a.time.localeCompare(b.time))
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
    weddingDate,
    addItem,
    updateItem,
    deleteItem,
    getItemById
  }
})
