import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { get, set } from '../utils/storage'
import {
  mockDress,
  mockSizeChart,
  mockFittingRecords,
  type Dress,
  type DressCategory,
  type SizeChartRow,
  type FittingRecord
} from '../data/mockData'

export { type Dress, type DressCategory, type SizeChartRow, type FittingRecord }

export const useDressStore = defineStore('dress', () => {
  const STORAGE_KEY_DRESSES = 'wedding-dress'
  const STORAGE_KEY_SIZE_CHART = 'wedding-dress-size-chart'
  const STORAGE_KEY_FITTING_RECORDS = 'wedding-dress-fitting-records'

  const dresses = ref<Dress[]>(get(STORAGE_KEY_DRESSES, mockDress))
  const sizeChart = ref<SizeChartRow[]>(get(STORAGE_KEY_SIZE_CHART, mockSizeChart))
  const fittingRecords = ref<FittingRecord[]>(get(STORAGE_KEY_FITTING_RECORDS, mockFittingRecords))

  watch(dresses, (newValue) => {
    set(STORAGE_KEY_DRESSES, newValue)
  }, { deep: true })

  watch(sizeChart, (newValue) => {
    set(STORAGE_KEY_SIZE_CHART, newValue)
  }, { deep: true })

  watch(fittingRecords, (newValue) => {
    set(STORAGE_KEY_FITTING_RECORDS, newValue)
  }, { deep: true })

  function addDress(dress: Omit<Dress, 'id'>) {
    const newDress: Dress = {
      ...dress,
      id: Date.now().toString()
    }
    dresses.value.push(newDress)
  }

  function updateDress(id: string, updates: Partial<Omit<Dress, 'id'>>) {
    const index = dresses.value.findIndex(dress => dress.id === id)
    if (index !== -1) {
      dresses.value[index] = { ...dresses.value[index], ...updates }
    }
  }

  function deleteDress(id: string) {
    const index = dresses.value.findIndex(dress => dress.id === id)
    if (index !== -1) {
      dresses.value.splice(index, 1)
    }
  }

  function getDressById(id: string) {
    return dresses.value.find(dress => dress.id === id)
  }

  const mainDress = computed(() => dresses.value.find(d => d.type === '主纱'))
  const goingOutDress = computed(() => dresses.value.find(d => d.type === '出门纱'))
  const toastDress = computed(() => dresses.value.find(d => d.type === '敬酒服'))

  return {
    dresses,
    sizeChart,
    fittingRecords,
    addDress,
    updateDress,
    deleteDress,
    getDressById,
    mainDress,
    goingOutDress,
    toastDress
  }
})
