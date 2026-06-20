import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { get, set } from '../utils/storage'
import { mockBudget, mockExpenseChangeLogs, type BudgetItem, type ExpenseChangeLog, type ExpenseChangeType } from '../data/mockData'
import { useVenuesStore } from './venues'
import { usePhotographyStore } from './photography'
import { useDressStore } from './dress'

export { type BudgetItem, type ExpenseChangeLog, type ExpenseChangeType }

export const useBudgetStore = defineStore('budget', () => {
  const STORAGE_KEY = 'wedding-budget'

  const items = ref<BudgetItem[]>(get(STORAGE_KEY, mockBudget))

  const CHANGE_LOG_STORAGE_KEY = 'wedding-expense-change-logs'
  const changeLogs = ref<ExpenseChangeLog[]>(get(CHANGE_LOG_STORAGE_KEY, mockExpenseChangeLogs))

  watch(items, (newValue) => {
    set(STORAGE_KEY, newValue)
  }, { deep: true })

  watch(changeLogs, (newValue) => {
    set(CHANGE_LOG_STORAGE_KEY, newValue)
  }, { deep: true })

  function addItem(item: Omit<BudgetItem, 'id'>) {
    const newItem: BudgetItem = {
      ...item,
      id: Date.now().toString(),
      budget: item.budget ?? item.planned
    }
    items.value.push(newItem)
    addChangeLog({
      category: item.category,
      changeType: 'add',
      sourceModule: '预算',
      description: `新增预算分类「${item.category}」`,
      oldAmount: 0,
      newAmount: item.actual,
      difference: item.actual,
      operator: '用户'
    })
  }

  function updateItem(id: string, updates: Partial<Omit<BudgetItem, 'id'>>) {
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      if (items.value[index].locked && (updates.budget !== undefined || updates.planned !== undefined)) {
        return
      }
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

  function updateActualByCategory(category: string, actual: number, sourceModule: string = '预算', description: string = '', operator: string = '系统', changeType: ExpenseChangeType = 'update') {
    const index = items.value.findIndex(item => item.category === category)
    if (index !== -1) {
      const oldAmount = items.value[index].actual
      items.value[index].actual = actual
      addChangeLog({
        category,
        changeType,
        sourceModule,
        description: description || `${category}实际支出变更`,
        oldAmount,
        newAmount: actual,
        difference: actual - oldAmount,
        operator
      })
    }
  }

  function lockCategory(category: string) {
    const index = items.value.findIndex(item => item.category === category)
    if (index !== -1) {
      items.value[index].locked = true
    }
  }

  function unlockCategory(category: string) {
    const index = items.value.findIndex(item => item.category === category)
    if (index !== -1) {
      items.value[index].locked = false
    }
  }

  function isCategoryLocked(category: string) {
    const item = items.value.find(item => item.category === category)
    return item?.locked ?? false
  }

  function getItemByCategory(category: string) {
    return items.value.find(item => item.category === category)
  }

  function confirmCategory(category: string) {
    const index = items.value.findIndex(item => item.category === category)
    if (index !== -1) {
      items.value[index].confirmed = true
    }
  }

  function unconfirmCategory(category: string) {
    const index = items.value.findIndex(item => item.category === category)
    if (index !== -1) {
      items.value[index].confirmed = false
    }
  }

  function isCategoryConfirmed(category: string) {
    const item = items.value.find(item => item.category === category)
    return item?.confirmed ?? false
  }

  const totalBudget = computed(() => items.value.reduce((sum, item) => sum + (item.budget ?? item.planned), 0))
  const totalSpent = computed(() => items.value.reduce((sum, item) => sum + item.actual, 0))
  const remaining = computed(() => totalBudget.value - totalSpent.value)
  const progress = computed(() => totalBudget.value > 0 ? (totalSpent.value / totalBudget.value) * 100 : 0)

  const confirmedBudget = computed(() =>
    items.value.filter(item => item.confirmed).reduce((sum, item) => sum + (item.budget ?? item.planned), 0)
  )
  const confirmedCount = computed(() => items.value.filter(item => item.confirmed).length)
  const confirmationProgress = computed(() => items.value.length > 0 ? (confirmedCount.value / items.value.length) * 100 : 0)
  const executionProgress = computed(() => totalBudget.value > 0 ? (confirmedBudget.value / totalBudget.value) * 100 : 0)

  const totalPlanned = () => items.value.reduce((sum, item) => sum + item.planned, 0)
  const totalActual = () => items.value.reduce((sum, item) => sum + item.actual, 0)

  function addChangeLog(log: Omit<ExpenseChangeLog, 'id' | 'timestamp'>) {
    const newLog: ExpenseChangeLog = {
      ...log,
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      timestamp: Date.now()
    }
    changeLogs.value.unshift(newLog)
  }

  function recordContractChange(
    category: '场地' | '摄影' | '婚纱',
    newAmount: number,
    operator: string = '系统同步',
    itemName: string = ''
  ) {
    const current = getItemByCategory(category)
    const oldAmount = current?.actual ?? 0
    const sourceModule = `${category}签约`

    let changeType: ExpenseChangeType
    let action: string

    if (oldAmount === 0 && newAmount > 0) {
      changeType = 'add'
      action = '新增签约入账'
    } else if (oldAmount > 0 && newAmount === 0) {
      changeType = 'update'
      action = '取消签约'
    } else if (newAmount > 0) {
      changeType = 'sync'
      action = '签约金额同步'
    } else {
      changeType = 'update'
      action = '金额变更'
    }

    const description = itemName ? `${action}：${itemName}` : action

    updateActualByCategory(
      category,
      newAmount,
      sourceModule,
      description,
      operator,
      changeType
    )
  }

  const changeLogsByDate = computed(() => {
    const grouped: Record<string, ExpenseChangeLog[]> = {}
    for (const log of changeLogs.value) {
      const date = new Date(log.timestamp)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(log)
    }
    return grouped
  })

  const changeLogsGroupedByModule = computed(() => {
    const grouped: Record<string, ExpenseChangeLog[]> = {}
    for (const log of changeLogs.value) {
      if (!grouped[log.sourceModule]) grouped[log.sourceModule] = []
      grouped[log.sourceModule].push(log)
    }
    return grouped
  })

  const totalChangeAmount = computed(() =>
    changeLogs.value.reduce((sum, log) => sum + log.difference, 0)
  )

  function syncContractedToBudget() {
    const venuesStore = useVenuesStore()
    const photographyStore = usePhotographyStore()
    const dressStore = useDressStore()

    const totalVenuesContracted = venuesStore.venues
      .filter(v => v.contracted)
      .reduce((sum, v) => sum + v.contractPrice, 0)
    const venueNames = venuesStore.venues.filter(v => v.contracted).map(v => v.name).join('、')
    recordContractChange('场地', totalVenuesContracted, '系统同步', venueNames || '无')

    const totalPhotographyContracted = photographyStore.items
      .filter(p => p.contracted)
      .reduce((sum, p) => sum + p.contractPrice, 0)
    const photoNames = photographyStore.items.filter(p => p.contracted).map(p => p.teamName).join('、')
    recordContractChange('摄影', totalPhotographyContracted, '系统同步', photoNames || '无')

    const totalDressContracted = dressStore.dresses
      .filter(d => d.contracted)
      .reduce((sum, d) => sum + d.contractPrice, 0)
    const dressNames = dressStore.dresses.filter(d => d.contracted).map(d => d.name).join('、')
    recordContractChange('婚纱', totalDressContracted, '系统同步', dressNames || '无')
  }

  return {
    items,
    changeLogs,
    addItem,
    updateItem,
    deleteItem,
    getItemById,
    updateActualByCategory,
    lockCategory,
    unlockCategory,
    isCategoryLocked,
    getItemByCategory,
    confirmCategory,
    unconfirmCategory,
    isCategoryConfirmed,
    syncContractedToBudget,
    addChangeLog,
    recordContractChange,
    changeLogsByDate,
    changeLogsGroupedByModule,
    totalChangeAmount,
    totalBudget,
    totalSpent,
    remaining,
    progress,
    confirmedBudget,
    confirmedCount,
    confirmationProgress,
    executionProgress,
    totalPlanned,
    totalActual
  }
})
