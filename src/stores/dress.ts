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

  const contractedDressIds = computed(() =>
    dresses.value.filter(d => d.contracted).map(d => d.id)
  )

  const fittingFeeByDress = computed(() => {
    const map: Record<string, number> = {}
    for (const record of fittingRecords.value) {
      const fee = record.alterationFee + record.accessoryFee + record.cleaningFee + record.otherFee
      if (record.dressId) {
        map[record.dressId] = (map[record.dressId] || 0) + fee
      } else {
        for (const id of contractedDressIds.value) {
          map[id] = (map[id] || 0)
        }
      }
    }
    return map
  })

  const totalFittingFee = computed(() => {
    const contractedIds = contractedDressIds.value
    let total = 0
    for (const record of fittingRecords.value) {
      const fee = record.alterationFee + record.accessoryFee + record.cleaningFee + record.otherFee
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
      .reduce((sum, d) => sum + d.contractPrice, 0)
  )

  const totalContractedWithFitting = computed(() =>
    totalContractPrice.value + totalFittingFee.value
  )

  const getFittingFeeForDress = (dressId: string) => {
    let total = 0
    for (const record of fittingRecords.value) {
      const fee = record.alterationFee + record.accessoryFee + record.cleaningFee + record.otherFee
      if (record.dressId === dressId) {
        total += fee
      }
    }
    return total
  }

  const getFittingRecordsForDress = (dressId: string) => {
    return fittingRecords.value.filter(r => r.dressId === dressId)
  }

  function syncToBudget(operator: string = '系统同步', extraDescription: string = '') {
    const budgetStore = useBudgetStore()

    const contractedNames = dresses.value
      .filter(d => d.contracted)
      .map(d => d.name)
      .join('、')

    const fittingFeeNote = totalFittingFee.value > 0
      ? `，含试穿费用¥${totalFittingFee.value.toLocaleString()}`
      : ''

    const description = contractedNames
      ? `签约${contractedNames}${fittingFeeNote}${extraDescription ? '，' + extraDescription : ''}`
      : ''

    budgetStore.recordContractChange('婚纱', totalContractedWithFitting.value, operator, description)
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
    const budgetStore = useBudgetStore()
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

      budgetStore.recordContractChange(
        '婚纱',
        totalContractedWithFitting.value,
        '用户',
        `签约${dress.name}${contractedNames ? `，全部：${contractedNames}` : ''}${fittingFeeNote}`
      )
    }
  }

  function cancelContractDress(id: string) {
    const budgetStore = useBudgetStore()
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

      budgetStore.recordContractChange(
        '婚纱',
        totalContractedWithFitting.value,
        '用户',
        `取消${dress.name}${contractedNames ? `，剩余：${contractedNames}` : ''}${fittingFeeNote}`
      )
    }
  }

  function deleteDress(id: string) {
    const budgetStore = useBudgetStore()
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

      budgetStore.recordContractChange(
        '婚纱',
        totalContractedWithFitting.value,
        '用户',
        `删除${deletedDress.name}${contractedNames ? `，剩余：${contractedNames}` : ''}${fittingFeeNote}`
      )
    }
  }

  function getDressById(id: string) {
    return dresses.value.find(dress => dress.id === id)
  }

  function addFittingRecord(record: Omit<FittingRecord, 'id'>) {
    const newRecord: FittingRecord = {
      ...record,
      id: Date.now().toString()
    }
    fittingRecords.value.push(newRecord)

    const hasContracted = contractedDressIds.value.length > 0
    const recordFee = record.alterationFee + record.accessoryFee + record.cleaningFee + record.otherFee
    const isAffectingBudget = hasContracted && (
      (record.dressId && contractedDressIds.value.includes(record.dressId)) ||
      (!record.dressId)
    )

    if (isAffectingBudget && recordFee > 0) {
      syncToBudget('系统同步', `新增试穿记录：${record.dressName}，费用¥${recordFee.toLocaleString()}`)
    }
  }

  function updateFittingRecord(id: string, updates: Partial<Omit<FittingRecord, 'id'>>) {
    const index = fittingRecords.value.findIndex(r => r.id === id)
    if (index !== -1) {
      const oldRecord = fittingRecords.value[index]
      const oldFee = oldRecord.alterationFee + oldRecord.accessoryFee + oldRecord.cleaningFee + oldRecord.otherFee
      fittingRecords.value[index] = { ...fittingRecords.value[index], ...updates }
      const newRecord = fittingRecords.value[index]
      const newFee = newRecord.alterationFee + newRecord.accessoryFee + newRecord.cleaningFee + newRecord.otherFee

      const hasContracted = contractedDressIds.value.length > 0
      const recordDressId = newRecord.dressId || oldRecord.dressId
      const isAffectingBudget = hasContracted && (
        (recordDressId && contractedDressIds.value.includes(recordDressId)) ||
        (!recordDressId)
      )

      if (isAffectingBudget && oldFee !== newFee) {
        syncToBudget('系统同步', `试穿记录费用变更：${newRecord.dressName}，变动¥${(newFee - oldFee > 0 ? '+' : '')}${(newFee - oldFee).toLocaleString()}`)
      }
    }
  }

  function deleteFittingRecord(id: string) {
    const index = fittingRecords.value.findIndex(r => r.id === id)
    if (index !== -1) {
      const deletedRecord = fittingRecords.value[index]
      const recordFee = deletedRecord.alterationFee + deletedRecord.accessoryFee + deletedRecord.cleaningFee + deletedRecord.otherFee
      fittingRecords.value.splice(index, 1)

      const hasContracted = contractedDressIds.value.length > 0
      const isAffectingBudget = hasContracted && (
        (deletedRecord.dressId && contractedDressIds.value.includes(deletedRecord.dressId)) ||
        (!deletedRecord.dressId)
      )

      if (isAffectingBudget && recordFee > 0) {
        syncToBudget('系统同步', `删除试穿记录：${deletedRecord.dressName}，扣除费用¥${recordFee.toLocaleString()}`)
      }
    }
  }

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
