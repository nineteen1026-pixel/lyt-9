import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { get, set } from '../utils/storage'
import { mockSchedule, mockWeddingDate, type ScheduleItem } from '../data/mockData'
import { useRehearsalStore } from './rehearsal'

export { type ScheduleItem }

export const useScheduleStore = defineStore('schedule', () => {
  const STORAGE_KEY = 'wedding-schedule'
  const DATE_STORAGE_KEY = 'wedding-date'

  const items = ref<ScheduleItem[]>(get(STORAGE_KEY, mockSchedule))
  const weddingDate = ref<string>(get(DATE_STORAGE_KEY, mockWeddingDate))

  watch(items, (newValue) => {
    set(STORAGE_KEY, newValue)
  }, { deep: true })

  watch(weddingDate, (newValue) => {
    set(DATE_STORAGE_KEY, newValue)
  })

  function setWeddingDate(date: string) {
    weddingDate.value = date
  }

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
      const oldPerson = items.value[index].personInCharge
      const newPerson = updates.personInCharge
      items.value[index] = { ...items.value[index], ...updates }
      items.value.sort((a, b) => a.time.localeCompare(b.time))

      if (newPerson !== undefined && newPerson !== oldPerson) {
        const rehearsalStore = useRehearsalStore()
        rehearsalStore.syncFromSchedulePersonChange(oldPerson, newPerson)
      }
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
    setWeddingDate,
    addItem,
    updateItem,
    deleteItem,
    getItemById
  }
})
