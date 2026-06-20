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

const safeFee = (val: number | undefined): number => (typeof val === 'number' ? val : 0)

const calcRecordFee = (record: FittingRecord | Partial<FittingRecord>): number =>
  safeFee(record.alterationFee) +
  safeFee(record.accessoryFee) +
  safeFee(record.cleaningFee) +
  safeFee(record.otherFee)

export const useDressStore = defineStore('dress', () => {
  const STORAGE_KEY_DRESSES = 'wedding-dress'
  const STORAGE_KEY_SIZE_CHART = 'wedding-dress-size-chart'
  const STORAGE_KEY_FITTING_RECORDS = 'wedding-dress-fitting-records'

  const dresses = ref<Dress[]>(get(STORAGE_KEY_DRESSES, mockDress))
  const sizeChart = ref<SizeChartRow[]>(get(STORAGE_KEY_SIZE_CHART, mockSizeChart))
  const fittingRecords = ref<FittingRecord[]>(get(STORAGE_KEY_FITTING_RECORDS, mockFittingRecords))

  let syncDescription: string = ''
  let syncOperator: string = '系统同步'
  let lastSyncedAmount: number | null = null

  watch(dresses, (newValue) => {
    set(STORAGE_KEY_DRESSES, newValue)
  }, { deep: true })

  watch(sizeChart, (newValue) => {
    set(STORAGE_KEY_SIZE_CHART, newValue)
  }, { deep: true })

  watch(fittingRecords, (newValue) => {
    set(STORAGE_KEY_FITTING_RECORDS, newValue)
  }, { deep: true })

  const contractedDressIds = computed(() =>
    dresses.value.filter(d => d.contracted).map(d => d.id)
  )

  const hasContractedDresses = computed(() => contractedDressIds.value.length > 0)

  const totalFittingFee = computed(() => {
    const contractedIds = contractedDressIds.value
    let total = 0
    for (const record of fittingRecords.value) {
      const fee = calcRecordFee(record)
      if (record.dressId) {
        if (contractedIds.includes(record.dressId)) {
          total += fee
        }
      } else {
        if (contractedIds.length > 0) {
          total += fee
        }
      }
    }
    return total
  })

  const totalContractPrice = computed(() =>
    dresses.value
      .filter(d => d.contracted)
      .reduce((sum, d) => sum + safeFee(d.contractPrice), 0)
  )

  const totalContractedWithFitting = computed(() =>
    totalContractPrice.value + totalFittingFee.value
  )

  const fittingFeeByDress = computed(() => {
    const map: Record<string, number> = {}
    for (const record of fittingRecords.value) {
      const fee = calcRecordFee(record)
      if (record.dressId) {
        map[record.dressId] = (map[record.dressId] || 0) + fee
      }
    }
    return map
  })

  const getFittingFeeForDress = (dressId: string) => {
    let total = 0
    for (const record of fittingRecords.value) {
      const fee = calcRecordFee(record)
      if (record.dressId === dressId) {
        total += fee
      }
    }
    return total
  }

  const getFittingRecordsForDress = (dressId: string) => {
    return fittingRecords.value.filter(r => r.dressId === dressId)
  }

  function performSync() {
    if (!hasContractedDresses.value) {
      lastSyncedAmount = 0
      return
    }

    const currentAmount = totalContractedWithFitting.value
    if (lastSyncedAmount !== null && lastSyncedAmount === currentAmount) {
      syncDescription = ''
      return
    }

    const budgetStore = useBudgetStore()

    const contractedNames = dresses.value
      .filter(d => d.contracted)
      .map(d => d.name)
      .join('、')

    const fittingFeeNote = totalFittingFee.value > 0
      ? `，含试穿费用¥${totalFittingFee.value.toLocaleString()}`
      : ''

    const desc = syncDescription || (contractedNames
      ? `签约${contractedNames}${fittingFeeNote}`
      : '婚纱费用更新')

    budgetStore.recordContractChange('婚纱', currentAmount, syncOperator, desc)

    lastSyncedAmount = currentAmount
    syncDescription = ''
    syncOperator = '系统同步'
  }

  function syncToBudget(operator: string = '系统同步', description: string = '') {
    syncOperator = operator
    syncDescription = description
    performSync()
  }

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
    const targetDress = dresses.value.find(d => d.id === id)
    if (targetDress) {
      const targetType = targetDress.type
      dresses.value.forEach((dress) => {
        if (dress.type === targetType && dress.id !== id) {
          dress.contracted = false
          dress.contractPrice = 0
        }
      })
    }
    const index = dresses.value.findIndex(dress => dress.id === id)
    if (index !== -1) {
      const dress = dresses.value[index]
      dresses.value[index].contracted = true
      dresses.value[index].contractPrice = contractPrice

      const contractedNames = dresses.value
        .filter(d => d.contracted)
        .map(d => d.name)
        .join('、')

      const fittingFeeNote = totalFittingFee.value > 0
        ? `，含试穿费用¥${totalFittingFee.value.toLocaleString()}`
        : ''

      syncOperator = '用户'
      syncDescription = `签约${dress.name}${contractedNames ? `，全部：${contractedNames}` : ''}${fittingFeeNote}`
    }
  }

  function cancelContractDress(id: string) {
    const index = dresses.value.findIndex(dress => dress.id === id)
    if (index !== -1) {
      const dress = dresses.value[index]
      dresses.value[index].contracted = false
      dresses.value[index].contractPrice = 0

      const contractedNames = dresses.value
        .filter(d => d.contracted)
        .map(d => d.name)
        .join('、')

      const fittingFeeNote = totalFittingFee.value > 0
        ? `，含试穿费用¥${totalFittingFee.value.toLocaleString()}`
        : ''

      syncOperator = '用户'
      syncDescription = `取消${dress.name}${contractedNames ? `，剩余：${contractedNames}` : ''}${fittingFeeNote}`
    }
  }

  function deleteDress(id: string) {
    const index = dresses.value.findIndex(dress => dress.id === id)
    if (index !== -1) {
      const deletedDress = dresses.value[index]
      dresses.value.splice(index, 1)

      const contractedNames = dresses.value
        .filter(d => d.contracted)
        .map(d => d.name)
        .join('、')

      const fittingFeeNote = totalFittingFee.value > 0
        ? `，含试穿费用¥${totalFittingFee.value.toLocaleString()}`
        : ''

      syncOperator = '用户'
      syncDescription = `删除${deletedDress.name}${contractedNames ? `，剩余：${contractedNames}` : ''}${fittingFeeNote}`
    }
  }

  function getDressById(id: string) {
    return dresses.value.find(dress => dress.id === id)
  }

  function isRecordAffectBudget(record: FittingRecord | Partial<FittingRecord>): boolean {
    if (!hasContractedDresses.value) return false
    if (record.dressId) {
      return contractedDressIds.value.includes(record.dressId)
    }
    return true
  }

  function addFittingRecord(record: Omit<FittingRecord, 'id'>) {
    const newRecord: FittingRecord = {
      alterationFee: 0,
      accessoryFee: 0,
      cleaningFee: 0,
      otherFee: 0,
      ...record,
      id: Date.now().toString()
    }
    fittingRecords.value.push(newRecord)

    const recordFee = calcRecordFee(newRecord)
    if (isRecordAffectBudget(newRecord) && recordFee > 0) {
      syncOperator = '系统同步'
      syncDescription = `新增试穿记录：${newRecord.dressName}，费用¥${recordFee.toLocaleString()}`
    }
  }

  function updateFittingRecord(id: string, updates: Partial<Omit<FittingRecord, 'id'>>) {
    const index = fittingRecords.value.findIndex(r => r.id === id)
    if (index !== -1) {
      const oldRecord = fittingRecords.value[index]
      const oldFee = calcRecordFee(oldRecord)
      const wasAffecting = isRecordAffectBudget(oldRecord)

      fittingRecords.value[index] = { ...fittingRecords.value[index], ...updates }
      const newRecord = fittingRecords.value[index]
      const newFee = calcRecordFee(newRecord)
      const isAffecting = isRecordAffectBudget(newRecord)

      const shouldSync = (wasAffecting || isAffecting) && oldFee !== newFee
      if (shouldSync) {
        const action = oldFee !== newFee ? `费用${newFee > oldFee ? '增加' : '减少'}¥${Math.abs(newFee - oldFee).toLocaleString()}` : ''
        syncOperator = '系统同步'
        syncDescription = `试穿记录更新：${newRecord.dressName}${action}`
      }
    }
  }

  function deleteFittingRecord(id: string) {
    const index = fittingRecords.value.findIndex(r => r.id === id)
    if (index !== -1) {
      const deletedRecord = fittingRecords.value[index]
      const recordFee = calcRecordFee(deletedRecord)
      fittingRecords.value.splice(index, 1)

      if (isRecordAffectBudget(deletedRecord) && recordFee > 0) {
        syncOperator = '系统同步'
        syncDescription = `删除试穿记录：${deletedRecord.dressName}，扣除费用¥${recordFee.toLocaleString()}`
      }
    }
  }

  watch(
    () => totalContractedWithFitting.value,
    () => {
      performSync()
    }
  )

  watch(
    () => hasContractedDresses.value,
    (hasContract) => {
      if (hasContract && lastSyncedAmount === null) {
        syncOperator = '系统同步'
        syncDescription = '婚纱费用初始同步'
      }
      if (hasContract || lastSyncedAmount && lastSyncedAmount > 0) {
        performSync()
      }
    }
  )

  const mainDress = computed(() => dresses.value.find(d => d.type === '主纱'))
  const goingOutDress = computed(() => dresses.value.find(d => d.type === '出门纱'))
  const toastDress = computed(() => dresses.value.find(d => d.type === '敬酒服'))

  return {
    dresses,
    sizeChart,
    fittingRecords,
    totalContractPrice,
    totalFittingFee,
    totalContractedWithFitting,
    fittingFeeByDress,
    contractedDressIds,
    hasContractedDresses,
    getFittingFeeForDress,
    getFittingRecordsForDress,
    addDress,
    updateDress,
    updateContractDress,
    cancelContractDress,
    deleteDress,
    getDressById,
    addFittingRecord,
    updateFittingRecord,
    deleteFittingRecord,
    syncToBudget,
    mainDress,
    goingOutDress,
    toastDress
  }
})
