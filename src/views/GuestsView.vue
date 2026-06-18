<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGuestsStore, type Guest, type GuestStatus, type GuestGroup, type ImportDedupeMode, type PerTableValidationResult } from '@/stores/guests'
import {
  Search, Users, CheckCircle, Clock, XCircle, Utensils, Edit3, X, AlertTriangle, Info,
  Upload, Download, FileSpreadsheet, ChevronDown, ChevronUp, Layers, RefreshCw, SkipForward, Plus,
  LayoutGrid, List, GripVertical, Settings2
} from 'lucide-vue-next'
import Toast from '@/components/Toast.vue'

const guestsStore = useGuestsStore()
const searchQuery = ref('')
const activeFilter = ref<GuestStatus | 'all'>('all')
const activeGroup = ref<GuestGroup | 'all'>('all')
const viewMode = ref<'list' | 'table'>('list')

const draggedGuestId = ref<string | null>(null)
const dragOverGuestId = ref<string | null>(null)

const showTableModal = ref(false)
const selectedGuest = ref<Guest | null>(null)
const editingTableNumber = ref<number | null>(null)

const showTableStats = ref(false)
const showMaxPerTableSetting = ref(false)
const editingMaxPerTable = ref(guestsStore.maxGuestsPerTable)
const isImporting = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const pendingFile = ref<File | null>(null)
const showDedupeModal = ref(false)
const dedupeMode = ref<ImportDedupeMode>('skip')

const toastVisible = ref(false)
const toastMessage = ref('')
const toastDescription = ref('')
const toastType = ref<'success' | 'error' | 'warning' | 'info'>('success')

const showToast = (message: string, description?: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', duration = 3000) => {
  toastMessage.value = message
  toastDescription.value = description ?? ''
  toastType.value = type
  toastVisible.value = true
  setTimeout(() => {
    toastVisible.value = false
  }, duration)
}

const dedupeOptions: { key: ImportDedupeMode; label: string; desc: string; icon: typeof Plus }[] = [
  { key: 'skip', label: '跳过重复', desc: '按电话号码匹配，相同电话则跳过不导入', icon: SkipForward },
  { key: 'overwrite', label: '覆盖更新', desc: '按电话号码匹配，相同电话则更新原有信息', icon: RefreshCw },
  { key: 'append', label: '全部追加', desc: '不做去重，直接全部新增导入', icon: Plus },
]

const statusFilters: { key: GuestStatus | 'all'; label: string; icon: typeof Users }[] = [
  { key: 'all', label: '全部', icon: Users },
  { key: 'confirmed', label: '已确认', icon: CheckCircle },
  { key: 'pending', label: '待定', icon: Clock },
  { key: 'declined', label: '缺席', icon: XCircle },
]

const groupFilters: { key: GuestGroup | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'groom', label: '男方' },
  { key: 'bride', label: '女方' },
  { key: 'both', label: '双方' },
]

const nextStatusMap: Record<GuestStatus, GuestStatus> = {
  confirmed: 'pending',
  pending: 'declined',
  declined: 'confirmed'
}

const filteredGuests = computed(() => {
  return guestsStore.guests.filter(guest => {
    const matchesSearch = guest.name.includes(searchQuery.value) || guest.phone.includes(searchQuery.value)
    const matchesStatus = activeFilter.value === 'all' || guest.status === activeFilter.value
    const matchesGroup = activeGroup.value === 'all' || guest.group === activeGroup.value
    return matchesSearch && matchesStatus && matchesGroup
  })
})

const getStatusConfig = (status: GuestStatus) => {
  switch (status) {
    case 'confirmed':
      return { label: '已确认', class: 'bg-green-100 text-green-600' }
    case 'pending':
      return { label: '待定', class: 'bg-yellow-100 text-yellow-600' }
    case 'declined':
      return { label: '缺席', class: 'bg-red-100 text-red-500' }
  }
}

const getGroupLabel = (group: GuestGroup) => {
  switch (group) {
    case 'groom': return '男方'
    case 'bride': return '女方'
    case 'both': return '双方'
  }
}

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-primary-400',
    'bg-champagne-300',
    'bg-morandi-purple',
    'bg-morandi-green',
    'bg-morandi-blue',
  ]
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

const filteredTableStats = computed(() => {
  return guestsStore.tableStats
    .map(table => ({
      ...table,
      guests: table.guests.filter(guest => {
        const matchesSearch = guest.name.includes(searchQuery.value) || guest.phone.includes(searchQuery.value)
        const matchesStatus = activeFilter.value === 'all' || guest.status === activeFilter.value
        const matchesGroup = activeGroup.value === 'all' || guest.group === activeGroup.value
        return matchesSearch && matchesStatus && matchesGroup
      })
    }))
    .filter(table => table.guests.length > 0)
    .map(table => ({
      ...table,
      count: table.guests.length
    }))
})

const unassignedFilteredGuests = computed(() => {
  return guestsStore.guests.filter(guest => {
    const matchesSearch = guest.name.includes(searchQuery.value) || guest.phone.includes(searchQuery.value)
    const matchesStatus = activeFilter.value === 'all' || guest.status === activeFilter.value
    const matchesGroup = activeGroup.value === 'all' || guest.group === activeGroup.value
    const isUnassigned = guest.tableNumber === null || guest.status === 'declined'
    return matchesSearch && matchesStatus && matchesGroup && isUnassigned
  })
})

const onDragStart = (guestId: string, event: DragEvent) => {
  draggedGuestId.value = guestId
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', guestId)
  }
}

const onDragOver = (guestId: string, event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  dragOverGuestId.value = guestId
}

const onDragLeave = () => {
  dragOverGuestId.value = null
}

const onDrop = (targetGuestId: string, event: DragEvent) => {
  event.preventDefault()
  dragOverGuestId.value = null

  if (!draggedGuestId.value || draggedGuestId.value === targetGuestId) {
    draggedGuestId.value = null
    return
  }

  const sourceGuest = guestsStore.guests.find(g => g.id === draggedGuestId.value)
  const targetGuest = guestsStore.guests.find(g => g.id === targetGuestId)

  if (!sourceGuest || !targetGuest) {
    draggedGuestId.value = null
    return
  }

  if (sourceGuest.tableNumber !== targetGuest.tableNumber) {
    showToast('仅支持同桌内调位', '拖拽调位仅限同一桌号的宾客之间', 'warning')
    draggedGuestId.value = null
    return
  }

  const success = guestsStore.swapGuestSeat(draggedGuestId.value, targetGuestId)
  if (success) {
    showToast('座位已调换', `${sourceGuest.name} ↔ ${targetGuest.name}`, 'success')
  }
  draggedGuestId.value = null
}

const onDragEnd = () => {
  draggedGuestId.value = null
  dragOverGuestId.value = null
}

const saveMaxPerTable = () => {
  const val = editingMaxPerTable.value
  if (val >= 1) {
    guestsStore.setMaxGuestsPerTable(val)
    showMaxPerTableSetting.value = false
    showToast('每桌人数上限已更新', `当前上限：${val}人/桌`, 'success')
  }
}

const getTableOverflowTables = computed(() => {
  return guestsStore.tableStats.filter(t => {
    const v = guestsStore.perTableValidationMap.get(t.tableNumber)
    return v && !v.valid
  })
})

const previewValidation = computed(() => {
  if (!selectedGuest.value) return null
  return guestsStore.validateTableAssignment(selectedGuest.value.id, editingTableNumber.value)
})

const canSave = computed(() => {
  if (!selectedGuest.value) return false
  if (editingTableNumber.value === selectedGuest.value.tableNumber) return false
  return previewValidation.value?.valid ?? false
})

const previewAssignedCount = computed(() => {
  return previewValidation.value?.assignedCount ?? guestsStore.assignedGuestsCount
})

const openTableModal = (guest: Guest) => {
  selectedGuest.value = guest
  editingTableNumber.value = guest.tableNumber
  showTableModal.value = true
}

const closeTableModal = () => {
  showTableModal.value = false
  selectedGuest.value = null
  editingTableNumber.value = null
}

const saveTableNumber = () => {
  if (!selectedGuest.value || !canSave.value) return

  const tableNum = editingTableNumber.value
  const result = guestsStore.updateGuestTable(selectedGuest.value.id, tableNum)

  if (!result.valid) {
    showToast('分桌保存失败', result.message, 'error', 4000)
    return
  }

  if (tableNum === null) {
    showToast('已取消分桌', `${selectedGuest.value.name} 的分桌已取消`, 'info')
  } else {
    showToast('分桌保存成功', `${selectedGuest.value.name} 已分配到 ${tableNum}号桌`, 'success')
  }
  closeTableModal()
}

const clearTableNumber = () => {
  editingTableNumber.value = null
}

const cycleStatus = (guest: Guest) => {
  const nextStatus = nextStatusMap[guest.status]
  const oldTableNumber = guest.tableNumber
  guestsStore.updateGuest(guest.id, { status: nextStatus })

  const nextConfig = getStatusConfig(nextStatus)
  if (nextStatus === 'declined' && oldTableNumber !== null) {
    showToast('状态已更新', `${guest.name} 状态变更为「${nextConfig.label}」，已自动取消 ${oldTableNumber}号桌分桌`, 'info', 3500)
  } else {
    showToast('状态已更新', `${guest.name} 状态变更为「${nextConfig.label}」`, 'success')
  }
}

const handleExport = () => {
  guestsStore.exportToExcel()
  showToast('导出成功', `已导出 ${guestsStore.totalCount} 位宾客信息`, 'success')
}

const handleDownloadTemplate = () => {
  guestsStore.downloadTemplate()
  showToast('模板已下载', '请按模板格式填写后导入', 'info')
}

const handleImportClick = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  pendingFile.value = file
  dedupeMode.value = 'skip'
  showDedupeModal.value = true
  input.value = ''
}

const closeDedupeModal = () => {
  showDedupeModal.value = false
  pendingFile.value = null
}

const executeImport = async () => {
  const file = pendingFile.value
  if (!file) return

  isImporting.value = true
  showDedupeModal.value = false
  try {
    const result = await guestsStore.importFromExcel(file, dedupeMode.value)
    const parts: string[] = []
    if (result.added > 0) parts.push(`新增 ${result.added}`)
    if (result.updated > 0) parts.push(`更新 ${result.updated}`)
    if (result.skipped > 0) parts.push(`跳过 ${result.skipped}`)
    if (result.failed > 0) parts.push(`失败 ${result.failed}`)
    const summary = parts.join('，') || '无数据'

    const totalOK = result.added + result.updated + result.skipped
    const type: 'success' | 'warning' | 'info' | 'error' =
      result.failed > 0 ? 'warning' :
        (result.added + result.updated > 0 ? 'success' : 'info')
    const duration = result.failed > 0 ? 5000 : 3500

    showToast(
      `导入完成：${summary}`,
      result.failed > 0
        ? (result.errors.slice(0, 3).join('；') + (result.errors.length > 3 ? '...' : ''))
        : (totalOK === 0 && result.failed === 0 ? '所有数据均已存在，已按策略跳过' : ''),
      type,
      duration
    )
  } catch (err: any) {
    showToast('导入失败', err.message || '请检查文件格式', 'error', 4000)
  } finally {
    isImporting.value = false
    pendingFile.value = null
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-ivory to-champagne-100 pb-20">
    <div class="animate-fade-in">
      <div class="bg-gradient-to-r from-primary-400 to-primary-500 px-6 pt-12 pb-16 rounded-b-3xl shadow-lg">
        <h1 class="text-3xl font-serif font-bold text-white text-center">宾客名单</h1>
        <p class="text-primary-100 text-center mt-2">共邀挚爱，见证幸福</p>
      </div>

      <div class="px-4 -mt-10">
        <div class="grid grid-cols-4 gap-3 mb-6">
          <div class="animate-slide-up bg-white rounded-2xl p-3 shadow-md text-center" style="animation-delay: 0.1s">
            <p class="text-2xl font-bold text-primary-500">{{ guestsStore.totalCount }}</p>
            <p class="text-xs text-gray-500">总人数</p>
          </div>
          <div class="animate-slide-up bg-white rounded-2xl p-3 shadow-md text-center" style="animation-delay: 0.2s">
            <p class="text-2xl font-bold text-green-500">{{ guestsStore.confirmedCount }}</p>
            <p class="text-xs text-gray-500">已确认</p>
          </div>
          <div class="animate-slide-up bg-white rounded-2xl p-3 shadow-md text-center" style="animation-delay: 0.25s">
            <p class="text-2xl font-bold" :class="guestsStore.isOverCapacity ? 'text-red-500' : (guestsStore.hasBookedVenue ? 'text-primary-500' : 'text-yellow-500')">
              <template v-if="guestsStore.hasBookedVenue">
                {{ guestsStore.assignedGuestsCount }}/{{ guestsStore.bookedVenueCapacity }}
              </template>
              <template v-else>
                未预订
              </template>
            </p>
            <p class="text-xs text-gray-500">已分配/场地容量</p>
          </div>
          <div class="animate-slide-up bg-white rounded-2xl p-3 shadow-md text-center cursor-pointer hover:shadow-lg transition-shadow" style="animation-delay: 0.3s" @click="showTableStats = !showTableStats">
            <div class="flex items-center justify-center gap-1">
              <p class="text-2xl font-bold text-champagne-500">{{ guestsStore.tableCount }}</p>
              <component :is="showTableStats ? ChevronUp : ChevronDown" class="w-4 h-4 text-champagne-400" />
            </div>
            <p class="text-xs text-gray-500">桌次</p>
          </div>
        </div>

        <div v-if="showTableStats && guestsStore.tableStats.length > 0" class="animate-fade-in bg-white rounded-2xl p-4 shadow-md mb-4">
          <div class="flex items-center gap-2 mb-3">
            <Layers class="w-5 h-5 text-champagne-500" />
            <h3 class="font-bold text-gray-800">桌次分布</h3>
            <span class="text-xs text-gray-400">共 {{ guestsStore.tableCount }} 桌 / {{ guestsStore.assignedGuestsCount }} 人</span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            <div
              v-for="table in guestsStore.tableStats"
              :key="table.tableNumber"
              class="bg-champagne-50 rounded-xl p-2 border border-champagne-100"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-bold text-primary-600">{{ table.tableNumber }}号桌</span>
                <span class="text-xs bg-champagne-200 text-champagne-300 px-2 py-0.5 rounded-full">{{ table.count }}人</span>
              </div>
              <p class="text-xs text-gray-500 truncate">
                {{ table.guests.map(g => g.name).join('、') }}
              </p>
            </div>
          </div>
        </div>

        <div v-if="guestsStore.capacityWarning" class="animate-slide-up mb-4 rounded-2xl p-4 shadow-sm" style="animation-delay: 0.35s"
          :class="guestsStore.hasBookedVenue ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'">
          <div class="flex items-start gap-3">
            <component :is="guestsStore.hasBookedVenue ? AlertTriangle : Info" class="w-6 h-6 flex-shrink-0 mt-0.5" :class="guestsStore.hasBookedVenue ? 'text-red-500' : 'text-yellow-500'" />
            <div>
              <p class="font-medium" :class="guestsStore.hasBookedVenue ? 'text-red-700' : 'text-yellow-700'">{{ guestsStore.capacityWarning.title }}</p>
              <p class="text-sm mt-1" :class="guestsStore.hasBookedVenue ? 'text-red-600' : 'text-yellow-600'">{{ guestsStore.capacityWarning.content }}</p>
            </div>
          </div>
        </div>

        <div class="animate-slide-up grid grid-cols-3 gap-2 mb-4" style="animation-delay: 0.38s">
          <button
            @click="handleImportClick"
            :disabled="isImporting"
            class="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium text-primary-600 border border-primary-100 hover:bg-primary-50 disabled:opacity-60"
          >
            <Upload class="w-4 h-4" />
            {{ isImporting ? '导入中...' : '导入' }}
          </button>
          <input
            ref="fileInputRef"
            type="file"
            accept=".xlsx,.xls"
            class="hidden"
            @change="handleFileChange"
          />
          <button
            @click="handleExport"
            class="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium text-green-600 border border-green-100 hover:bg-green-50"
          >
            <Download class="w-4 h-4" />
            导出
          </button>
          <button
            @click="handleDownloadTemplate"
            class="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium text-champagne-500 border border-champagne-200 hover:bg-champagne-50"
          >
            <FileSpreadsheet class="w-4 h-4" />
            模板
          </button>
        </div>

        <div class="animate-slide-up bg-white rounded-2xl p-3 shadow-md mb-4 flex items-center gap-3" style="animation-delay: 0.4s">
          <Search class="w-5 h-5 text-gray-400" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="搜索宾客姓名或电话..." 
            class="flex-1 outline-none text-gray-700 placeholder-gray-400"
          />
        </div>

        <div class="animate-slide-up mb-4 flex items-center gap-2" style="animation-delay: 0.45s">
          <div class="flex gap-2 overflow-x-auto pb-2 flex-1">
            <button 
              v-for="filter in statusFilters" 
              :key="filter.key"
              @click="activeFilter = filter.key"
              class="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300"
              :class="activeFilter === filter.key 
                ? 'bg-primary-500 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-primary-50'"
            >
              <component :is="filter.icon" class="w-4 h-4" />
              {{ filter.label }}
            </button>
          </div>
          <div class="flex bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-shrink-0">
            <button
              @click="viewMode = 'list'"
              class="p-2 transition-colors"
              :class="viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-gray-600'"
              title="列表视图"
            >
              <List class="w-5 h-5" />
            </button>
            <button
              @click="viewMode = 'table'"
              class="p-2 transition-colors"
              :class="viewMode === 'table' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-gray-600'"
              title="桌号聚合视图"
            >
              <LayoutGrid class="w-5 h-5" />
            </button>
          </div>
        </div>

        <div class="animate-slide-up mb-4 flex gap-2 overflow-x-auto pb-2" style="animation-delay: 0.6s">
          <button 
            v-for="filter in groupFilters" 
            :key="filter.key"
            @click="activeGroup = filter.key"
            class="px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 border"
            :class="activeGroup === filter.key 
              ? 'bg-champagne-200 text-champagne-300 border-champagne-200' 
              : 'bg-white text-gray-500 border-gray-200 hover:border-champagne-200'"
          >
            {{ filter.label }}
          </button>
        </div>

        <div v-if="viewMode === 'table'" class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Layers class="w-5 h-5 text-champagne-500" />
              <span class="text-sm font-medium text-gray-600">桌号聚合视图</span>
              <span class="text-xs text-gray-400">拖拽宾客可同桌内调位</span>
            </div>
            <button
              @click="showMaxPerTableSetting = !showMaxPerTableSetting"
              class="flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg shadow-sm text-xs font-medium text-gray-500 hover:text-primary-500 transition-colors border border-gray-100"
            >
              <Settings2 class="w-3.5 h-3.5" />
              每桌上限 {{ guestsStore.maxGuestsPerTable }}人
            </button>
          </div>

          <div v-if="showMaxPerTableSetting" class="animate-fade-in bg-white rounded-2xl p-4 shadow-md border border-primary-100">
            <div class="flex items-center gap-3">
              <label class="text-sm font-medium text-gray-700 whitespace-nowrap">每桌人数上限</label>
              <input
                v-model.number="editingMaxPerTable"
                type="number"
                min="1"
                class="w-20 px-3 py-2 border-2 rounded-xl text-center font-medium focus:outline-none transition-colors"
                :class="editingMaxPerTable < 1 ? 'border-red-300' : 'border-gray-200 focus:border-primary-400'"
              />
              <button
                @click="saveMaxPerTable"
                :disabled="editingMaxPerTable < 1"
                class="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存
              </button>
              <button
                @click="showMaxPerTableSetting = false; editingMaxPerTable = guestsStore.maxGuestsPerTable"
                class="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
            </div>
          </div>

          <div v-if="getTableOverflowTables.length > 0" class="animate-fade-in rounded-2xl p-4 bg-red-50 border border-red-200">
            <div class="flex items-start gap-3">
              <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p class="font-medium text-red-700 text-sm">部分桌次超出人数上限</p>
                <div class="mt-1 space-y-1">
                  <p v-for="t in getTableOverflowTables" :key="t.tableNumber" class="text-xs text-red-600">
                    {{ t.tableNumber }}号桌：{{ t.count }}/{{ guestsStore.maxGuestsPerTable }}人
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            v-for="table in filteredTableStats"
            :key="table.tableNumber"
            class="animate-fade-in bg-white rounded-2xl shadow-md overflow-hidden"
          >
            <div class="px-4 py-3 flex items-center justify-between"
              :class="guestsStore.perTableValidationMap.get(table.tableNumber)?.valid ? 'bg-champagne-50' : 'bg-red-50'"
            >
              <div class="flex items-center gap-2">
                <Utensils class="w-5 h-5" :class="guestsStore.perTableValidationMap.get(table.tableNumber)?.valid ? 'text-champagne-500' : 'text-red-400'" />
                <span class="font-bold" :class="guestsStore.perTableValidationMap.get(table.tableNumber)?.valid ? 'text-primary-600' : 'text-red-600'">
                  {{ table.tableNumber }}号桌
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span
                  class="text-xs px-2.5 py-1 rounded-full font-medium"
                  :class="guestsStore.perTableValidationMap.get(table.tableNumber)?.valid
                    ? 'bg-champagne-200 text-champagne-400'
                    : 'bg-red-100 text-red-600'"
                >
                  {{ table.count }}/{{ guestsStore.maxGuestsPerTable }}人
                </span>
                <div v-if="guestsStore.perTableValidationMap.get(table.tableNumber)?.valid && table.count > 0" class="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-300"
                    :class="table.count / guestsStore.maxGuestsPerTable > 0.8 ? 'bg-yellow-400' : 'bg-primary-400'"
                    :style="{ width: `${Math.min((table.count / guestsStore.maxGuestsPerTable) * 100, 100)}%` }"
                  ></div>
                </div>
                <AlertTriangle v-if="!guestsStore.perTableValidationMap.get(table.tableNumber)?.valid" class="w-4 h-4 text-red-500" />
              </div>
            </div>

            <div class="p-3 space-y-2">
              <div
                v-for="guest in table.guests"
                :key="guest.id"
                draggable="true"
                @dragstart="onDragStart(guest.id, $event)"
                @dragover="onDragOver(guest.id, $event)"
                @dragleave="onDragLeave"
                @drop="onDrop(guest.id, $event)"
                @dragend="onDragEnd"
                class="flex items-center gap-2.5 p-2.5 rounded-xl transition-all duration-200 cursor-grab active:cursor-grabbing"
                :class="[
                  dragOverGuestId === guest.id && draggedGuestId !== guest.id
                    ? 'bg-primary-50 ring-2 ring-primary-300 scale-[1.02]'
                    : 'bg-gray-50 hover:bg-gray-100',
                  draggedGuestId === guest.id ? 'opacity-40 scale-95' : ''
                ]"
              >
                <GripVertical class="w-4 h-4 text-gray-300 flex-shrink-0" />
                <div
                  class="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  :class="getAvatarColor(guest.name)"
                >
                  {{ guest.avatar }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5">
                    <p class="text-sm font-medium text-gray-800 truncate">{{ guest.name }}</p>
                    <span
                      class="px-1.5 py-0.5 rounded-full text-[10px]"
                      :class="getStatusConfig(guest.status).class"
                    >
                      {{ getStatusConfig(guest.status).label }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-xs text-gray-400">{{ getGroupLabel(guest.group) }}</span>
                    <span class="text-xs text-gray-400">{{ guest.phone }}</span>
                  </div>
                </div>
                <button
                  @click="openTableModal(guest)"
                  class="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-400 hover:bg-primary-100 hover:text-primary-600 transition-colors flex-shrink-0"
                  :disabled="guest.status === 'declined'"
                  :class="{ 'opacity-50 cursor-not-allowed': guest.status === 'declined' }"
                  title="编辑分桌"
                >
                  <Edit3 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div v-if="unassignedFilteredGuests.length > 0" class="animate-fade-in bg-white rounded-2xl shadow-md overflow-hidden">
            <div class="px-4 py-3 bg-gray-50 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Users class="w-5 h-5 text-gray-400" />
                <span class="font-bold text-gray-500">未分桌</span>
              </div>
              <span class="text-xs bg-gray-200 text-gray-400 px-2.5 py-1 rounded-full font-medium">
                {{ unassignedFilteredGuests.length }}人
              </span>
            </div>
            <div class="p-3 space-y-2">
              <div
                v-for="guest in unassignedFilteredGuests"
                :key="guest.id"
                class="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50"
              >
                <div
                  class="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  :class="getAvatarColor(guest.name)"
                >
                  {{ guest.avatar }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5">
                    <p class="text-sm font-medium text-gray-800 truncate">{{ guest.name }}</p>
                    <span
                      class="px-1.5 py-0.5 rounded-full text-[10px]"
                      :class="getStatusConfig(guest.status).class"
                    >
                      {{ getStatusConfig(guest.status).label }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-xs text-gray-400">{{ getGroupLabel(guest.group) }}</span>
                    <span class="text-xs text-gray-400">{{ guest.phone }}</span>
                  </div>
                </div>
                <button
                  v-if="guest.status !== 'declined'"
                  @click="openTableModal(guest)"
                  class="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-400 hover:bg-primary-100 hover:text-primary-600 transition-colors flex-shrink-0"
                  title="编辑分桌"
                >
                  <Edit3 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div v-if="filteredTableStats.length === 0 && unassignedFilteredGuests.length === 0" class="animate-fade-in text-center py-16">
            <LayoutGrid class="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p class="text-gray-400">暂无分桌数据</p>
          </div>
        </div>

        <div v-else class="space-y-3">
          <div 
            v-for="(guest, index) in filteredGuests" 
            :key="guest.id"
            class="animate-slide-up bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300"
            :style="{ animationDelay: `${0.7 + index * 0.1}s` }"
          >
            <div class="flex items-center gap-3">
              <div 
                class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                :class="getAvatarColor(guest.name)"
              >
                {{ guest.avatar }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="font-medium text-gray-800">{{ guest.name }}</p>
                  <button
                    @click="cycleStatus(guest)"
                    class="px-2 py-0.5 rounded-full text-xs cursor-pointer transition-all hover:scale-105 active:scale-95"
                    :class="getStatusConfig(guest.status).class"
                    :title="'点击切换状态：已确认 → 待定 → 缺席 → 已确认'"
                  >
                    {{ getStatusConfig(guest.status).label }}
                  </button>
                </div>
                <p class="text-sm text-gray-400 mt-0.5">{{ guest.phone }}</p>
                <div class="flex items-center gap-3 mt-1">
                  <span class="text-xs text-gray-400">{{ getGroupLabel(guest.group) }}</span>
                  <span v-if="guest.tableNumber" class="flex items-center gap-1 text-xs text-primary-500">
                    <Utensils class="w-3 h-3" />
                    {{ guest.tableNumber }}号桌
                  </span>
                </div>
              </div>
              <button 
                @click="openTableModal(guest)"
                class="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-500 hover:bg-primary-100 transition-colors"
                :disabled="guest.status === 'declined'"
                :class="{ 'opacity-50 cursor-not-allowed': guest.status === 'declined' }"
                :title="guest.status === 'declined' ? '缺席宾客无需分桌' : '编辑分桌'"
              >
                <Edit3 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="filteredGuests.length === 0" class="animate-fade-in text-center py-16">
          <Users class="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p class="text-gray-400">暂无符合条件的宾客</p>
          <button
            v-if="guestsStore.totalCount === 0"
            @click="handleDownloadTemplate"
            class="mt-4 px-4 py-2 bg-primary-500 text-white rounded-full text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            下载模板批量导入
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showTableModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeTableModal"></div>
        <div class="relative bg-white rounded-3xl p-6 w-full max-w-md animate-fade-in shadow-2xl">
          <button 
            @click="closeTableModal"
            class="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X class="w-5 h-5 text-gray-500" />
          </button>
          
          <div class="text-center mb-6">
            <div class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <Utensils class="w-8 h-8 text-primary-500" />
            </div>
            <h3 class="text-xl font-bold text-gray-800">编辑分桌</h3>
            <p class="text-sm text-gray-500 mt-1">{{ selectedGuest?.name }}</p>
          </div>

          <div class="space-y-4">
            <div v-if="selectedGuest?.status === 'declined'" class="p-4 bg-red-50 rounded-xl">
              <p class="text-sm text-red-700">
                <AlertTriangle class="w-4 h-4 inline mr-1" />
                该宾客状态为「缺席」，无需分桌。
              </p>
            </div>

            <div v-if="!guestsStore.hasBookedVenue" class="p-4 bg-yellow-50 rounded-xl">
              <p class="text-sm text-yellow-700">
                <Info class="w-4 h-4 inline mr-1" />
                尚未预订场地，请先预订场地后再进行分桌安排。
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">桌号</label>
              <input 
                v-model.number="editingTableNumber"
                type="number"
                min="1"
                class="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors text-lg font-medium text-center"
                :class="previewValidation && !previewValidation.valid ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-primary-400'"
                placeholder="输入桌号，留空表示取消分桌"
              />
              <button 
                v-if="editingTableNumber !== null"
                @click="clearTableNumber"
                class="mt-2 w-full py-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                清除桌号，取消分桌
              </button>
            </div>

            <div v-if="previewValidation && !previewValidation.valid" class="p-4 bg-red-50 rounded-xl border border-red-200">
              <p class="text-sm text-red-700">
                <AlertTriangle class="w-4 h-4 inline mr-1" />
                {{ previewValidation.message }}
              </p>
            </div>

            <div class="bg-gray-50 rounded-xl p-4">
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">
                  <template v-if="guestsStore.hasBookedVenue">保存后已分配人数</template>
                  <template v-else>已分配人数</template>
                </span>
                <span class="font-medium" :class="(previewValidation && previewValidation.overflow > 0) ? 'text-red-500' : 'text-gray-800'">
                  <template v-if="guestsStore.hasBookedVenue">
                    {{ previewAssignedCount }} / {{ guestsStore.bookedVenueCapacity }} 人
                  </template>
                  <template v-else>
                    {{ guestsStore.assignedGuestsCount }} / 未预订
                  </template>
                </span>
              </div>
              <div v-if="guestsStore.hasBookedVenue" class="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all duration-300"
                  :class="(previewValidation && previewValidation.overflow > 0) ? 'bg-red-500' : 'bg-primary-500'"
                  :style="{ width: `${Math.min((previewAssignedCount / guestsStore.bookedVenueCapacity) * 100, 100)}%` }"
                ></div>
              </div>
              <p v-if="previewValidation && previewValidation.overflow > 0" class="text-xs text-red-500 mt-2">
                <AlertTriangle class="w-3 h-3 inline mr-1" />
                保存后将超出场地容量 {{ previewValidation.overflow }} 人
              </p>
            </div>

            <div class="flex gap-3 pt-4">
              <button 
                @click="closeTableModal"
                class="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button 
                @click="saveTableNumber"
                :disabled="!canSave"
                class="flex-1 py-3 bg-gradient-to-r from-primary-400 to-primary-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showDedupeModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeDedupeModal"></div>
        <div class="relative bg-white rounded-3xl p-6 w-full max-w-md animate-fade-in shadow-2xl">
          <button
            @click="closeDedupeModal"
            class="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X class="w-5 h-5 text-gray-500" />
          </button>

          <div class="text-center mb-6">
            <div class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <Upload class="w-8 h-8 text-primary-500" />
            </div>
            <h3 class="text-xl font-bold text-gray-800">选择导入策略</h3>
            <p class="text-sm text-gray-500 mt-1">{{ pendingFile?.name }}</p>
          </div>

          <div class="space-y-3 mb-6">
            <button
              v-for="opt in dedupeOptions"
              :key="opt.key"
              @click="dedupeMode = opt.key"
              class="w-full text-left p-4 rounded-2xl border-2 transition-all"
              :class="dedupeMode === opt.key
                ? 'border-primary-400 bg-primary-50 shadow-sm'
                : 'border-gray-100 bg-white hover:border-gray-200'"
            >
              <div class="flex items-start gap-3">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  :class="dedupeMode === opt.key ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'"
                >
                  <component :is="opt.icon" class="w-5 h-5" />
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <p class="font-semibold" :class="dedupeMode === opt.key ? 'text-primary-600' : 'text-gray-800'">
                      {{ opt.label }}
                    </p>
                    <div
                      class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                      :class="dedupeMode === opt.key ? 'border-primary-500' : 'border-gray-300'"
                    >
                      <div v-if="dedupeMode === opt.key" class="w-2.5 h-2.5 rounded-full bg-primary-500"></div>
                    </div>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">{{ opt.desc }}</p>
                </div>
              </div>
            </button>
          </div>

          <div class="flex gap-3">
            <button
              @click="closeDedupeModal"
              class="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              @click="executeImport"
              :disabled="isImporting"
              class="flex-1 py-3 bg-gradient-to-r from-primary-400 to-primary-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              {{ isImporting ? '导入中...' : '开始导入' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Toast 
      :visible="toastVisible" 
      :message="toastMessage" 
      :description="toastDescription"
      :type="toastType" 
    />
  </div>
</template>
