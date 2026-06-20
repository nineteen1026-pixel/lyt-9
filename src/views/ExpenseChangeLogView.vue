<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBudgetStore } from '@/stores/budget'
import { storeToRefs } from 'pinia'
import { ArrowLeft, Filter, TrendingUp, TrendingDown, Minus, RefreshCw, Edit2, Plus, FileText, Calendar, ChevronDown, ChevronUp } from 'lucide-vue-next'

const router = useRouter()
const budgetStore = useBudgetStore()
const { changeLogs, changeLogsByDate, totalChangeAmount } = storeToRefs(budgetStore)

const activeFilter = ref<string>('all')
const expandedDate = ref<string | null>(null)

const filters = [
  { key: 'all', label: '全部' },
  { key: 'sync', label: '选型同步' },
  { key: 'update', label: '手动修改' },
  { key: 'add', label: '新增' }
]

const filteredLogsByDate = computed(() => {
  const grouped = changeLogsByDate.value
  const result: Record<string, typeof changeLogs.value> = {}
  for (const [date, logs] of Object.entries(grouped)) {
    const filtered = logs.filter(log =>
      activeFilter.value === 'all' || log.changeType === activeFilter.value
    )
    if (filtered.length > 0) {
      result[date] = filtered
    }
  }
  return result
})

const sortedDates = computed(() =>
  Object.keys(filteredLogsByDate.value).sort((a, b) => b.localeCompare(a))
)

const formatCurrency = (value: number) => `¥${value.toLocaleString()}`

const formatDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-')
  return `${y}年${parseInt(m)}月${parseInt(d)}日`
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const getChangeTypeIcon = (type: string) => {
  switch (type) {
    case 'add': return Plus
    case 'update': return Edit2
    case 'sync': return RefreshCw
    default: return FileText
  }
}

const getChangeTypeLabel = (type: string) => {
  switch (type) {
    case 'add': return '新增'
    case 'update': return '修改'
    case 'sync': return '同步'
    default: return '未知'
  }
}

const getChangeTypeClass = (type: string) => {
  switch (type) {
    case 'add': return 'bg-green-100 text-green-600'
    case 'update': return 'bg-primary-100 text-primary-600'
    case 'sync': return 'bg-champagne-100 text-champagne-600'
    default: return 'bg-gray-100 text-gray-600'
  }
}

const getChangeTypeIconBg = (type: string) => {
  switch (type) {
    case 'add': return 'bg-green-500'
    case 'update': return 'bg-primary-500'
    case 'sync': return 'bg-champagne-300'
    default: return 'bg-gray-400'
  }
}

const getDifferenceInfo = (diff: number) => {
  if (diff > 0) return { icon: TrendingUp, text: `+${formatCurrency(diff)}`, class: 'text-red-500' }
  if (diff < 0) return { icon: TrendingDown, text: formatCurrency(diff), class: 'text-green-500' }
  return { icon: Minus, text: '无变化', class: 'text-gray-400' }
}

const toggleDate = (date: string) => {
  expandedDate.value = expandedDate.value === date ? null : date
}

const getDateTotal = (logs: typeof changeLogs.value) => {
  return logs.reduce((sum, log) => sum + log.difference, 0)
}

const syncCount = computed(() => changeLogs.value.filter(l => l.changeType === 'sync').length)
const updateCount = computed(() => changeLogs.value.filter(l => l.changeType === 'update').length)
const addCount = computed(() => changeLogs.value.filter(l => l.changeType === 'add').length)

const goBack = () => {
  router.push('/budget')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-ivory to-champagne-100 pb-20">
    <div class="animate-fade-in">
      <div class="bg-gradient-to-r from-primary-400 to-primary-500 px-6 pt-12 pb-8 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div class="absolute inset-0 opacity-10">
          <div class="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white"></div>
          <div class="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white"></div>
        </div>
        <div class="relative z-10">
          <div class="flex items-center justify-between mb-4">
            <button
              @click="goBack"
              class="p-2 -ml-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft class="w-6 h-6" />
            </button>
            <div class="text-center">
              <h1 class="text-2xl font-serif font-bold text-white">费用变动流水</h1>
              <p class="text-primary-100 text-sm mt-1">汇总各模块支出变动记录</p>
            </div>
            <div class="w-10"></div>
          </div>
        </div>
      </div>

      <div class="px-4 -mt-4">
        <div class="grid grid-cols-3 gap-3 mb-5">
          <div class="animate-slide-up bg-white rounded-2xl p-3 shadow-md text-center" style="animation-delay: 0.1s">
            <div class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-1.5">
              <Plus class="w-4 h-4 text-green-500" />
            </div>
            <p class="text-lg font-bold text-gray-800">{{ addCount }}</p>
            <p class="text-xs text-gray-400">新增</p>
          </div>
          <div class="animate-slide-up bg-white rounded-2xl p-3 shadow-md text-center" style="animation-delay: 0.15s">
            <div class="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center mx-auto mb-1.5">
              <Edit2 class="w-4 h-4 text-primary-500" />
            </div>
            <p class="text-lg font-bold text-gray-800">{{ updateCount }}</p>
            <p class="text-xs text-gray-400">修改</p>
          </div>
          <div class="animate-slide-up bg-white rounded-2xl p-3 shadow-md text-center" style="animation-delay: 0.2s">
            <div class="w-8 h-8 rounded-lg bg-champagne-100 flex items-center justify-center mx-auto mb-1.5">
              <RefreshCw class="w-4 h-4 text-champagne-300" />
            </div>
            <p class="text-lg font-bold text-gray-800">{{ syncCount }}</p>
            <p class="text-xs text-gray-400">同步</p>
          </div>
        </div>

        <div class="animate-slide-up mb-5" style="animation-delay: 0.25s">
          <div class="flex items-center gap-2 mb-3">
            <Filter class="w-4 h-4 text-gray-400" />
            <span class="text-sm text-gray-500">筛选类型</span>
          </div>
          <div class="flex gap-2">
            <button
              v-for="f in filters"
              :key="f.key"
              @click="activeFilter = f.key"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
              :class="activeFilter === f.key
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-white text-gray-500 shadow-sm hover:bg-primary-50'"
            >
              {{ f.label }}
            </button>
          </div>
        </div>

        <div class="animate-slide-up" style="animation-delay: 0.3s">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-800">变动记录</h2>
            <span class="text-xs text-gray-400">共 {{ changeLogs.length }} 条</span>
          </div>

          <div v-if="sortedDates.length === 0" class="text-center py-12">
            <FileText class="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p class="text-sm text-gray-400">暂无变动记录</p>
          </div>

          <div class="space-y-3">
            <div
              v-for="(date, dIdx) in sortedDates"
              :key="date"
              class="animate-slide-up bg-white rounded-xl shadow-sm overflow-hidden"
              :style="{ animationDelay: `${0.35 + dIdx * 0.05}s` }"
            >
              <button
                @click="toggleDate(date)"
                class="w-full flex items-center justify-between p-4"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <Calendar class="w-5 h-5 text-primary-400" />
                  </div>
                  <div class="text-left">
                    <p class="font-medium text-gray-800 text-sm">{{ formatDate(date) }}</p>
                    <p class="text-xs text-gray-400">{{ filteredLogsByDate[date].length }} 条记录</p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span
                    class="text-sm font-medium"
                    :class="getDateTotal(filteredLogsByDate[date]) > 0
                      ? 'text-red-500'
                      : getDateTotal(filteredLogsByDate[date]) < 0
                        ? 'text-green-500'
                        : 'text-gray-400'"
                  >
                    {{ getDateTotal(filteredLogsByDate[date]) > 0 ? '+' : '' }}{{ formatCurrency(getDateTotal(filteredLogsByDate[date])) }}
                  </span>
                  <component
                    :is="expandedDate === date ? ChevronUp : ChevronDown"
                    class="w-4 h-4 text-gray-400"
                  />
                </div>
              </button>

              <div
                v-if="expandedDate === date"
                class="border-t border-gray-100 px-4 pb-3 animate-fade-in"
              >
                <div
                  v-for="log in filteredLogsByDate[date]"
                  :key="log.id"
                  class="flex items-start gap-3 py-3 border-b border-gray-50 last:border-b-0"
                >
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    :class="getChangeTypeIconBg(log.changeType)"
                  >
                    <component
                      :is="getChangeTypeIcon(log.changeType)"
                      class="w-4 h-4 text-white"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        class="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        :class="getChangeTypeClass(log.changeType)"
                      >
                        {{ getChangeTypeLabel(log.changeType) }}
                      </span>
                      <span class="text-xs text-gray-400">{{ log.sourceModule }}</span>
                      <span class="text-xs text-gray-300">{{ formatTime(log.timestamp) }}</span>
                    </div>
                    <p class="text-sm text-gray-700 mb-1">{{ log.description }}</p>
                    <div class="flex items-center gap-2 text-xs">
                      <span class="text-gray-400">{{ log.category }}</span>
                      <span class="text-gray-300">|</span>
                      <span class="text-gray-400">{{ formatCurrency(log.oldAmount) }} → {{ formatCurrency(log.newAmount) }}</span>
                    </div>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <div class="flex items-center gap-1" :class="getDifferenceInfo(log.difference).class">
                      <component :is="getDifferenceInfo(log.difference).icon" class="w-3.5 h-3.5" />
                      <span class="text-sm font-medium">{{ getDifferenceInfo(log.difference).text }}</span>
                    </div>
                    <p class="text-xs text-gray-400 mt-1">{{ log.operator }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
