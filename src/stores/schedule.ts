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

  let isSyncing = false

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
    if (newItem.personInChargeId && !newItem.personInCharge) {
      const rehearsalStore = useRehearsalStore()
      newItem.personInCharge = rehearsalStore.getStaffNameById(newItem.personInChargeId)
    }
    items.value.push(newItem)
    items.value.sort((a, b) => a.time.localeCompare(b.time))
  }

  function updateItem(id: string, updates: Partial<Omit<ScheduleItem, 'id'>>) {
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      const oldPersonId = items.value[index].personInChargeId
      items.value[index] = { ...items.value[index], ...updates }

      if (updates.personInChargeId !== undefined) {
        const rehearsalStore = useRehearsalStore()
        const name = rehearsalStore.getStaffNameById(updates.personInChargeId)
        if (name) {
          items.value[index].personInCharge = name
        }
      }

      items.value.sort((a, b) => a.time.localeCompare(b.time))

      const newPersonId = items.value[index].personInChargeId
      const newPersonName = items.value[index].personInCharge

      if (oldPersonId !== newPersonId && !isSyncing) {
        const rehearsalStore = useRehearsalStore()
        rehearsalStore.syncFromSchedulePersonChange(id, newPersonId, newPersonName)
      }
    }
  }

  function updateItemPerson(itemId: string, personId: string | undefined, personName: string) {
    const index = items.value.findIndex(item => item.id === itemId)
    if (index === -1) return

    const oldPersonId = items.value[index].personInChargeId
    items.value[index] = {
      ...items.value[index],
      personInChargeId: personId,
      personInCharge: personName
    }

    if (oldPersonId !== personId && !isSyncing) {
      const rehearsalStore = useRehearsalStore()
      rehearsalStore.syncFromSchedulePersonChange(itemId, personId, personName)
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

  function setSyncing(value: boolean) {
    isSyncing = value
  }

  return {
    items,
    weddingDate,
    setWeddingDate,
    addItem,
    updateItem,
    deleteItem,
    getItemById,
    updateItemPerson,
    setSyncing
  }
})
