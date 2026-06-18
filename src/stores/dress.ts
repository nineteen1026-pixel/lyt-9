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
import { useBudgetStore } from './budget'

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
      id: Date.now().toString(),
      contracted: dress.contracted ?? false,
      contractPrice: dress.contractPrice ?? 0,
      pros: dress.pros ?? [],
      cons: dress.cons ?? [],
      rating: dress.rating ?? 0,
      notes: dress.notes ?? '',
      createdAt: dress.createdAt ?? Date.now()
    }
    dresses.value.push(newDress)
  }

  function updateDress(id: string, updates: Partial<Omit<Dress, 'id'>>) {
    const index = dresses.value.findIndex(dress => dress.id === id)
    if (index !== -1) {
      dresses.value[index] = { ...dresses.value[index], ...updates }
    }
  }

  function updateContractDress(id: string, contractPrice: number) {
    const budgetStore = useBudgetStore()
    const index = dresses.value.findIndex(dress => dress.id === id)
    if (index !== -1) {
      dresses.value[index].contracted = true
      dresses.value[index].contractPrice = contractPrice
      
      const totalContracted = dresses.value
        .filter(d => d.contracted)
        .reduce((sum, d) => sum + d.contractPrice, 0)
      
      budgetStore.updateActualByCategory('婚纱', totalContracted)
    }
  }

  function cancelContractDress(id: string) {
    const budgetStore = useBudgetStore()
    const index = dresses.value.findIndex(dress => dress.id === id)
    if (index !== -1) {
      dresses.value[index].contracted = false
      dresses.value[index].contractPrice = 0
      
      const totalContracted = dresses.value
        .filter(d => d.contracted)
        .reduce((sum, d) => sum + d.contractPrice, 0)
      
      budgetStore.updateActualByCategory('婚纱', totalContracted)
    }
  }

  function deleteDress(id: string) {
    const budgetStore = useBudgetStore()
    const index = dresses.value.findIndex(dress => dress.id === id)
    if (index !== -1) {
      dresses.value.splice(index, 1)

      const totalContracted = dresses.value
        .filter(d => d.contracted)
        .reduce((sum, d) => sum + d.contractPrice, 0)
      budgetStore.updateActualByCategory('婚纱', totalContracted)
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
    updateContractDress,
    cancelContractDress,
    deleteDress,
    getDressById,
    mainDress,
    goingOutDress,
    toastDress
  }
})
