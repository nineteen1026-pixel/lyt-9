import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import * as XLSX from 'xlsx'
import { get, set } from '../utils/storage'
import { mockGuests, type Guest, type GuestStatus, type GuestGroup } from '../data/mockData'
import { useVenuesStore } from './venues'

export { type Guest, type GuestStatus, type GuestGroup }

export interface TableInfo {
  tableNumber: number
  guests: Guest[]
  count: number
}

export type ImportDedupeMode = 'skip' | 'overwrite' | 'append'

export interface ImportResult {
  added: number
  updated: number
  skipped: number
  failed: number
  errors: string[]
}

export interface TableValidationResult {
  valid: boolean
  message: string
  assignedCount: number
  venueCapacity: number
  overflow: number
}

export interface PerTableValidationResult {
  valid: boolean
  message: string
  currentCount: number
  maxGuestsPerTable: number
  overflow: number
}

export const useGuestsStore = defineStore('guests', () => {
  const STORAGE_KEY = 'wedding-guests'
  const MAX_PER_TABLE_KEY = 'wedding-max-per-table'
  const venuesStore = useVenuesStore()

  const guests = ref<Guest[]>(get(STORAGE_KEY, mockGuests))
  const maxGuestsPerTable = ref<number>(get(MAX_PER_TABLE_KEY, 10))

  watch(guests, (newValue) => {
    set(STORAGE_KEY, newValue)
  }, { deep: true })

  watch(maxGuestsPerTable, (newValue) => {
    set(MAX_PER_TABLE_KEY, newValue)
  })

  function addGuest(guest: Omit<Guest, 'id'>) {
    const newGuest: Guest = {
      ...guest,
      id: Date.now().toString(),
      seatIndex: guest.seatIndex ?? 0
    }
    guests.value.push(newGuest)
  }

  function updateGuest(id: string, updates: Partial<Omit<Guest, 'id'>>) {
    const index = guests.value.findIndex(guest => guest.id === id)
    if (index !== -1) {
      const finalUpdates = { ...updates }
      if (finalUpdates.status === 'declined') {
        finalUpdates.tableNumber = null
        finalUpdates.attendance = '未出席'
      } else if (finalUpdates.status === 'confirmed') {
        finalUpdates.attendance = '已确认'
      } else if (finalUpdates.status === 'pending') {
        finalUpdates.attendance = '待确认'
      }
      guests.value[index] = { ...guests.value[index], ...finalUpdates }
    }
  }

  function deleteGuest(id: string) {
    const index = guests.value.findIndex(guest => guest.id === id)
    if (index !== -1) {
      guests.value.splice(index, 1)
    }
  }

  function getGuestById(id: string) {
    return guests.value.find(guest => guest.id === id)
  }

  const totalCount = computed(() => guests.value.length)
  const confirmedCount = computed(() => guests.value.filter(g => g.status === 'confirmed').length)
  const pendingCount = computed(() => guests.value.filter(g => g.status === 'pending').length)
  const declinedCount = computed(() => guests.value.filter(g => g.status === 'declined').length)

  const groomGuests = computed(() => guests.value.filter(g => g.group === 'groom'))
  const brideGuests = computed(() => guests.value.filter(g => g.group === 'bride'))
  const bothGuests = computed(() => guests.value.filter(g => g.group === 'both'))

  const assignedGuestsCount = computed(() =>
    guests.value.filter(g => g.tableNumber !== null && g.status !== 'declined').length
  )

  const bookedVenueCapacity = computed(() =>
    venuesStore.bookedVenues.reduce((sum, v) => sum + v.capacity, 0)
  )

  const hasBookedVenue = computed(() => bookedVenueCapacity.value > 0)

  const isOverCapacity = computed(() =>
    hasBookedVenue.value && assignedGuestsCount.value > bookedVenueCapacity.value
  )

  const capacityOverflow = computed(() =>
    Math.max(0, assignedGuestsCount.value - bookedVenueCapacity.value)
  )

  function validatePerTableCapacity(tableNumber: number): PerTableValidationResult {
    const tableGuests = guests.value.filter(g => g.tableNumber === tableNumber && g.status !== 'declined')
    const count = tableGuests.length
    const overflow = Math.max(0, count - maxGuestsPerTable.value)
    return {
      valid: count <= maxGuestsPerTable.value,
      message: overflow > 0 ? `${tableNumber}号桌已坐${count}人，超出每桌上限${maxGuestsPerTable.value}人${overflow}人` : '',
      currentCount: count,
      maxGuestsPerTable: maxGuestsPerTable.value,
      overflow
    }
  }

  function swapGuestSeat(guestId1: string, guestId2: string): boolean {
    const index1 = guests.value.findIndex(g => g.id === guestId1)
    const index2 = guests.value.findIndex(g => g.id === guestId2)
    if (index1 === -1 || index2 === -1) return false

    const g1 = guests.value[index1]
    const g2 = guests.value[index2]
    if (g1.tableNumber !== g2.tableNumber || g1.tableNumber === null) return false

    const tmpSeat = g1.seatIndex
    guests.value[index1] = { ...g1, seatIndex: g2.seatIndex }
    guests.value[index2] = { ...g2, seatIndex: tmpSeat }
    return true
  }

  function setMaxGuestsPerTable(max: number) {
    if (max >= 1) {
      maxGuestsPerTable.value = max
    }
  }

  const perTableValidationMap = computed(() => {
    const map = new Map<number, PerTableValidationResult>()
    const tableNumbers = new Set(
      guests.value
        .filter(g => g.tableNumber !== null && g.status !== 'declined')
        .map(g => g.tableNumber!)
    )
    tableNumbers.forEach(tn => {
      map.set(tn, validatePerTableCapacity(tn))
    })
    return map
  })

  function validateTableAssignment(guestId: string, newTableNumber: number | null): TableValidationResult {
    const guest = getGuestById(guestId)
    if (!guest) {
      return { valid: false, message: '宾客不存在', assignedCount: 0, venueCapacity: 0, overflow: 0 }
    }

    if (guest.status === 'declined') {
      return { valid: false, message: '缺席宾客无需分桌', assignedCount: assignedGuestsCount.value, venueCapacity: bookedVenueCapacity.value, overflow: 0 }
    }

    if (!hasBookedVenue.value && newTableNumber !== null) {
      return {
        valid: false,
        message: '尚未预订场地，请先预订场地后再进行分桌。',
        assignedCount: assignedGuestsCount.value,
        venueCapacity: 0,
        overflow: 0
      }
    }

    const currentAssigned = assignedGuestsCount.value
    const wasAssigned = guest.tableNumber !== null
    const willBeAssigned = newTableNumber !== null

    let newAssignedCount = currentAssigned
    let isIncreasing = false
    if (!wasAssigned && willBeAssigned) {
      newAssignedCount = currentAssigned + 1
      isIncreasing = true
    } else if (wasAssigned && !willBeAssigned) {
      newAssignedCount = currentAssigned - 1
      isIncreasing = false
    }

    const capacity = bookedVenueCapacity.value
    const overflow = Math.max(0, newAssignedCount - capacity)

    if (isIncreasing && overflow > 0) {
      const venueNames = venuesStore.bookedVenues.map(v => v.name).join('、')
      return {
        valid: false,
        message: `场地席位数不足！已预订场地「${venueNames}」总容量为${capacity}人，当前已分配${newAssignedCount}人，超出${overflow}人。`,
        assignedCount: newAssignedCount,
        venueCapacity: capacity,
        overflow
      }
    }

    if (newTableNumber !== null && guest.tableNumber !== newTableNumber) {
      const targetTableGuests = guests.value.filter(
        g => g.tableNumber === newTableNumber && g.status !== 'declined' && g.id !== guest.id
      )
      const targetCount = targetTableGuests.length + 1
      const perTableOverflow = Math.max(0, targetCount - maxGuestsPerTable.value)
      if (perTableOverflow > 0) {
        return {
          valid: false,
          message: `${newTableNumber}号桌人数超出上限！该桌当前已有${targetTableGuests.length}人，最多容纳${maxGuestsPerTable.value}人，添加后将超出${perTableOverflow}人。`,
          assignedCount: newAssignedCount,
          venueCapacity: capacity,
          overflow
        }
      }
    }

    return {
      valid: true,
      message: '',
      assignedCount: newAssignedCount,
      venueCapacity: capacity,
      overflow: 0
    }
  }

  function updateGuestTable(guestId: string, tableNumber: number | null): TableValidationResult {
    const validation = validateTableAssignment(guestId, tableNumber)
    if (!validation.valid) {
      return validation
    }

    updateGuest(guestId, { tableNumber })
    return validation
  }

  const capacityWarning = computed(() => {
    if (!hasBookedVenue.value) {
      if (assignedGuestsCount.value > 0) {
        return {
          title: '未预订场地预警',
          content: '当前尚未预订场地，请先预订场地后再进行分桌安排。'
        }
      }
      return {
        title: '未预订场地提示',
        content: '请先预订场地，以便进行宾客分桌安排。'
      }
    }
    if (isOverCapacity.value) {
      const venueNames = venuesStore.bookedVenues.map(v => v.name).join('、')
      return {
        title: '场地席位超员预警',
        content: `已预订场地「${venueNames}」总容量为${bookedVenueCapacity.value}人，当前已分配${assignedGuestsCount.value}人，超出${capacityOverflow.value}人。请调整分桌安排或更换更大容量的场地。`
      }
    }
    return null
  })

  const tableStats = computed<TableInfo[]>(() => {
    const tableMap = new Map<number, Guest[]>()
    guests.value
      .filter(g => g.tableNumber !== null && g.status !== 'declined')
      .forEach(g => {
        const tableNum = g.tableNumber!
        if (!tableMap.has(tableNum)) {
          tableMap.set(tableNum, [])
        }
        tableMap.get(tableNum)!.push(g)
      })
    return Array.from(tableMap.entries())
      .map(([tableNumber, tableGuests]) => ({
        tableNumber,
        guests: tableGuests.sort((a, b) => a.seatIndex - b.seatIndex),
        count: tableGuests.length
      }))
      .sort((a, b) => a.tableNumber - b.tableNumber)
  })

  const tableCount = computed(() => tableStats.value.length)

  function parseStatus(statusStr: string): GuestStatus {
    const map: Record<string, GuestStatus> = {
      '已确认': 'confirmed',
      'confirmed': 'confirmed',
      '待确认': 'pending',
      '待定': 'pending',
      'pending': 'pending',
      '未出席': 'declined',
      '缺席': 'declined',
      'declined': 'declined'
    }
    return map[statusStr] ?? 'pending'
  }

  function parseGroup(groupStr: string): GuestGroup {
    const map: Record<string, GuestGroup> = {
      '男方': 'groom',
      '新郎': 'groom',
      'groom': 'groom',
      '女方': 'bride',
      '新娘': 'bride',
      'bride': 'bride',
      '双方': 'both',
      '共同': 'both',
      'both': 'both'
    }
    return map[groupStr] ?? 'both'
  }

  function parseAttendance(status: GuestStatus): Guest['attendance'] {
    switch (status) {
      case 'confirmed': return '已确认'
      case 'pending': return '待确认'
      case 'declined': return '未出席'
    }
  }

  function findGuestByPhone(phone: string): Guest | undefined {
    if (!phone) return undefined
    return guests.value.find(g => g.phone === phone)
  }

  function validateTableAssignmentForImport(
    currentAssignedCount: number,
    currentGuestWasAssigned: boolean,
    newTableNumber: number | null,
    status: GuestStatus,
    guestId: string | null
  ): { valid: boolean; message: string; finalTableNumber: number | null; newAssignedCount: number } {
    let tableNumber = newTableNumber
    if (status === 'declined') {
      tableNumber = null
    }

    if (!hasBookedVenue.value && tableNumber !== null) {
      return {
        valid: false,
        message: '尚未预订场地，请先预订场地后再进行分桌。',
        finalTableNumber: null,
        newAssignedCount: currentAssignedCount
      }
    }

    const willBeAssigned = tableNumber !== null
    let newAssignedCount = currentAssignedCount
    if (!currentGuestWasAssigned && willBeAssigned) {
      newAssignedCount = currentAssignedCount + 1
    } else if (currentGuestWasAssigned && !willBeAssigned) {
      newAssignedCount = currentAssignedCount - 1
    }

    const capacity = bookedVenueCapacity.value
    const overflow = Math.max(0, newAssignedCount - capacity)

    if (hasBookedVenue.value && overflow > 0) {
      const venueNames = venuesStore.bookedVenues.map(v => v.name).join('、')
      return {
        valid: false,
        message: `场地席位数不足！已预订场地「${venueNames}」总容量为${capacity}人，导入后将分配${newAssignedCount}人，超出${overflow}人。`,
        finalTableNumber: null,
        newAssignedCount: currentAssignedCount
      }
    }

    if (tableNumber !== null) {
      const currentTablesCount = guests.value.filter(
        g => g.tableNumber === tableNumber && g.status !== 'declined' && g.id !== guestId
      ).length
      const willAdd = !currentGuestWasAssigned ? 1 : 0
      const newCount = currentTablesCount + willAdd
      const perTableOverflow = Math.max(0, newCount - maxGuestsPerTable.value)
      if (perTableOverflow > 0) {
        return {
          valid: false,
          message: `${tableNumber}号桌人数超出上限！该桌当前已有${currentTablesCount}人，最多容纳${maxGuestsPerTable.value}人，导入后将超出${perTableOverflow}人。`,
          finalTableNumber: null,
          newAssignedCount: currentAssignedCount
        }
      }
    }

    return {
      valid: true,
      message: '',
      finalTableNumber: tableNumber,
      newAssignedCount
    }
  }

  function importFromExcel(file: File, dedupeMode: ImportDedupeMode = 'skip'): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const rows = XLSX.utils.sheet_to_json<any>(worksheet)

          const result: ImportResult = {
            added: 0,
            updated: 0,
            skipped: 0,
            failed: 0,
            errors: []
          }

          let runningAssignedCount = assignedGuestsCount.value

          rows.forEach((row, index) => {
            const rowNum = index + 2
            try {
              const name = String(row['姓名'] ?? row['name'] ?? '').trim()
              const phone = String(row['电话'] ?? row['phone'] ?? row['手机'] ?? '').trim()

              if (!name) {
                throw new Error(`第${rowNum}行：姓名不能为空`)
              }

              const statusStr = String(row['状态'] ?? row['出席状态'] ?? row['status'] ?? 'pending').trim()
              const status = parseStatus(statusStr)
              const groupStr = String(row['分组'] ?? row['归属'] ?? row['group'] ?? 'both').trim()
              const group = parseGroup(groupStr)
              const tableRaw = row['桌号'] ?? row['桌次'] ?? row['tableNumber'] ?? row['table']
              let parsedTableNumber: number | null = null
              if (tableRaw !== undefined && tableRaw !== null && tableRaw !== '') {
                const num = Number(tableRaw)
                if (!isNaN(num) && num > 0) {
                  parsedTableNumber = Math.floor(num)
                }
              }

              const avatar = name.charAt(0)
              const seatIndex = 0
              const existingGuest = findGuestByPhone(phone)

              if (existingGuest) {
                if (dedupeMode === 'skip') {
                  result.skipped++
                  return
                }

                if (dedupeMode === 'overwrite') {
                  const wasAssigned = existingGuest.tableNumber !== null && existingGuest.status !== 'declined'
                  const validation = validateTableAssignmentForImport(
                    runningAssignedCount,
                    wasAssigned,
                    parsedTableNumber,
                    status,
                    existingGuest.id
                  )

                  let finalTableNumber: number | null
                  if (status === 'declined') {
                    finalTableNumber = null
                  } else if (!validation.valid && parsedTableNumber !== null) {
                    throw new Error(`第${rowNum}行（${name}）：${validation.message}`)
                  } else {
                    finalTableNumber = validation.finalTableNumber
                  }
                  runningAssignedCount = validation.newAssignedCount

                  updateGuest(existingGuest.id, {
                    name,
                    phone,
                    group,
                    status,
                    attendance: parseAttendance(status),
                    tableNumber: finalTableNumber,
                    avatar,
                    seatIndex
                  })
                  result.updated++
                  return
                }
              }

              const validation = validateTableAssignmentForImport(
                runningAssignedCount,
                false,
                parsedTableNumber,
                status,
                null
              )

              let finalTableNumber: number | null
              if (status === 'declined') {
                finalTableNumber = null
              } else if (!validation.valid && parsedTableNumber !== null) {
                throw new Error(`第${rowNum}行（${name}）：${validation.message}`)
              } else {
                finalTableNumber = validation.finalTableNumber
              }
              runningAssignedCount = validation.newAssignedCount

              addGuest({
                name,
                phone,
                group,
                status,
                attendance: parseAttendance(status),
                tableNumber: finalTableNumber,
                avatar,
                seatIndex
              })
              result.added++
            } catch (err: any) {
              result.failed++
              result.errors.push(err.message || `第${rowNum}行：导入失败`)
            }
          })

          resolve(result)
        } catch (err: any) {
          reject(new Error('Excel 文件解析失败：' + (err.message || '格式不正确')))
        }
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsArrayBuffer(file)
    })
  }

  function exportToExcel(): void {
    const exportData = guests.value.map(g => ({
      '姓名': g.name,
      '电话': g.phone,
      '分组': g.group === 'groom' ? '男方' : g.group === 'bride' ? '女方' : '双方',
      '状态': g.status === 'confirmed' ? '已确认' : g.status === 'pending' ? '待确认' : '未出席',
      '桌号': g.tableNumber ?? ''
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 8 }
    ]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '宾客名单')

    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    XLSX.writeFile(workbook, `宾客名单_${dateStr}.xlsx`)
  }

  function downloadTemplate(): void {
    const templateData = [
      { '姓名': '张三', '电话': '13800138000', '分组': '男方', '状态': '已确认', '桌号': 1 },
      { '姓名': '李四', '电话': '13800138001', '分组': '女方', '状态': '待确认', '桌号': '' },
      { '姓名': '王五', '电话': '13800138002', '分组': '双方', '状态': '未出席', '桌号': '' }
    ]
    const worksheet = XLSX.utils.json_to_sheet(templateData)
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 8 }
    ]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '导入模板')
    XLSX.writeFile(workbook, '宾客名单导入模板.xlsx')
  }

  function batchUpdateStatus(guestIds: string[], status: GuestStatus): void {
    guestIds.forEach(id => {
      updateGuest(id, { status })
    })
  }

  return {
    guests,
    maxGuestsPerTable,
    addGuest,
    updateGuest,
    deleteGuest,
    getGuestById,
    totalCount,
    confirmedCount,
    pendingCount,
    declinedCount,
    groomGuests,
    brideGuests,
    bothGuests,
    assignedGuestsCount,
    bookedVenueCapacity,
    hasBookedVenue,
    isOverCapacity,
    capacityOverflow,
    validateTableAssignment,
    validatePerTableCapacity,
    swapGuestSeat,
    setMaxGuestsPerTable,
    perTableValidationMap,
    updateGuestTable,
    capacityWarning,
    tableStats,
    tableCount,
    importFromExcel,
    exportToExcel,
    downloadTemplate,
    batchUpdateStatus
  }
})
