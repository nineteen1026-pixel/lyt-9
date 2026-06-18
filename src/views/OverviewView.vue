<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBudgetStore } from '@/stores/budget'
import { useGuestsStore } from '@/stores/guests'
import { useVenuesStore } from '@/stores/venues'
import { usePhotographyStore } from '@/stores/photography'
import { useDressStore } from '@/stores/dress'
import { useScheduleStore } from '@/stores/schedule'
import { useRehearsalStore } from '@/stores/rehearsal'
import PieChart from '@/components/PieChart.vue'
import {
  LayoutDashboard,
  Wallet,
  Users,
  Building2,
  Camera,
  Shirt,
  Calendar,
  ListChecks,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Target,
  Bell,
  Gift
} from 'lucide-vue-next'

const router = useRouter()
const budgetStore = useBudgetStore()
const guestsStore = useGuestsStore()
const venuesStore = useVenuesStore()
const photographyStore = usePhotographyStore()
const dressStore = useDressStore()
const scheduleStore = useScheduleStore()
const rehearsalStore = useRehearsalStore()

const currentDate = ref(new Date())

onMounted(() => {
  const timer = setInterval(() => {
    currentDate.value = new Date()
  }, 60000)
  return () => clearInterval(timer)
})

const formatCurrency = (value: number) => {
  return `¥${value.toLocaleString()}`
}

const parseDate = (dateStr: string) => {
  const parts = dateStr.split('-')
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
}

const daysUntil = (dateStr: string) => {
  const target = parseDate(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diff = target.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const weddingDaysLeft = computed(() => daysUntil(scheduleStore.weddingDate))
const rehearsalDaysLeft = computed(() => daysUntil(rehearsalStore.rehearsalInfo.date))

const budgetProgress = computed(() => budgetStore.progress)

const guestsProgress = computed(() => {
  if (guestsStore.totalCount === 0) return 0
  return (guestsStore.confirmedCount / guestsStore.totalCount) * 100
})

const venuesProgress = computed(() => {
  const hasContracted = venuesStore.venues.some(v => v.contracted)
  return hasContracted ? 100 : 0
})

const photographyProgress = computed(() => {
  const hasContracted = photographyStore.items.some(p => p.contracted)
  return hasContracted ? 100 : 0
})

const dressProgress = computed(() => {
  const requiredTypes = ['主纱', '出门纱', '敬酒服']
  const contractedCount = requiredTypes.filter(type =>
    dressStore.dresses.some(d => d.type === type && d.contracted)
  ).length
  return (contractedCount / requiredTypes.length) * 100
})

const scheduleProgress = computed(() => {
  const expectedItems = 7
  return Math.min((scheduleStore.items.length / expectedItems) * 100, 100)
})

const rehearsalProgress = computed(() => {
  const expectedSteps = 6
  return Math.min((rehearsalStore.steps.length / expectedSteps) * 100, 100)
})

interface ModuleProgress {
  id: string
  name: string
  path: string
  icon: any
  progress: number
  color: string
  bgColor: string
}

const modulesProgress = computed<ModuleProgress[]>(() => [
  {
    id: 'budget',
    name: '预算',
    path: '/budget',
    icon: Wallet,
    progress: budgetProgress.value,
    color: 'text-primary-500',
    bgColor: 'bg-primary-100'
  },
  {
    id: 'guests',
    name: '宾客',
    path: '/guests',
    icon: Users,
    progress: guestsProgress.value,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100'
  },
  {
    id: 'venues',
    name: '场地',
    path: '/venues',
    icon: Building2,
    progress: venuesProgress.value,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100'
  },
  {
    id: 'photography',
    name: '摄影',
    path: '/photography',
    icon: Camera,
    progress: photographyProgress.value,
    color: 'text-amber-500',
    bgColor: 'bg-amber-100'
  },
  {
    id: 'dress',
    name: '婚纱',
    path: '/dress',
    icon: Shirt,
    progress: dressProgress.value,
    color: 'text-pink-500',
    bgColor: 'bg-pink-100'
  },
  {
    id: 'schedule',
    name: '流程',
    path: '/schedule',
    icon: Calendar,
    progress: scheduleProgress.value,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-100'
  },
  {
    id: 'rehearsal',
    name: '彩排',
    path: '/rehearsal',
    icon: ListChecks,
    progress: rehearsalProgress.value,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100'
  }
])

const overallProgress = computed(() => {
  const total = modulesProgress.value.reduce((sum, m) => sum + m.progress, 0)
  return total / modulesProgress.value.length
})

const totalBudget = computed(() => budgetStore.totalBudget)
const totalSpent = computed(() => budgetStore.totalSpent)
const remaining = computed(() => budgetStore.remaining)
const budgetExecutionRate = computed(() => budgetStore.progress)

const pieData = computed(() =>
  budgetStore.items.map(item => ({
    name: item.category,
    value: item.actual,
    color: item.color,
    overBudget: item.actual > item.budget
  }))
)

interface TodoItem {
  id: string
  title: string
  description: string
  date: string
  daysLeft: number
  module: string
  modulePath: string
  icon: any
  priority: 'high' | 'medium' | 'low'
  completed: boolean
}

const todoItems = computed<TodoItem[]>(() => {
  const items: TodoItem[] = []

  if (guestsStore.pendingCount > 0) {
    items.push({
      id: 'guests-pending',
      title: `确认 ${guestsStore.pendingCount} 位宾客出席`,
      description: `还有 ${guestsStore.pendingCount} 位宾客待确认`,
      date: '',
      daysLeft: 7,
      module: '宾客',
      modulePath: '/guests',
      icon: Users,
      priority: 'high',
      completed: false
    })
  }

  if (venuesProgress.value < 100) {
    items.push({
      id: 'venues-contract',
      title: '预订婚礼场地',
      description: '请尽快确定并签订场地合同',
      date: '',
      daysLeft: 30,
      module: '场地',
      modulePath: '/venues',
      icon: Building2,
      priority: 'high',
      completed: false
    })
  }

  if (photographyProgress.value < 100) {
    items.push({
      id: 'photography-contract',
      title: '确定摄影团队',
      description: '请选择并签订摄影团队合同',
      date: '',
      daysLeft: 25,
      module: '摄影',
      modulePath: '/photography',
      icon: Camera,
      priority: 'high',
      completed: false
    })
  }

  if (dressProgress.value < 100) {
    const requiredTypes = ['主纱', '出门纱', '敬酒服']
    const missingTypes = requiredTypes.filter(type =>
      !dressStore.dresses.some(d => d.type === type && d.contracted)
    )
    items.push({
      id: 'dress-contract',
      title: `确认${missingTypes.join('、')}`,
      description: '请尽快确定并签订婚纱合同',
      date: '',
      daysLeft: 20,
      module: '婚纱',
      modulePath: '/dress',
      icon: Shirt,
      priority: 'high',
      completed: false
    })
  }

  dressStore.dresses.forEach(dress => {
    if (dress.fittingDate) {
      const days = daysUntil(dress.fittingDate)
      if (days >= 0 && days <= 30) {
        items.push({
          id: `fitting-${dress.id}`,
          title: `${dress.type}试穿`,
          description: `${dress.name} - ${dress.brand}`,
          date: dress.fittingDate,
          daysLeft: days,
          module: '婚纱',
          modulePath: '/dress',
          icon: Gift,
          priority: days <= 7 ? 'high' : 'medium',
          completed: false
        })
      }
    }
  })

  photographyStore.items.forEach(photo => {
    if (photo.shootDate && photo.contracted) {
      const days = daysUntil(photo.shootDate)
      if (days >= 0 && days <= 30) {
        items.push({
          id: `shoot-${photo.id}`,
          title: `婚纱照拍摄`,
          description: `${photo.teamName} - ${photo.packageType}`,
          date: photo.shootDate,
          daysLeft: days,
          module: '摄影',
          modulePath: '/photography',
          icon: Camera,
          priority: days <= 7 ? 'high' : 'medium',
          completed: false
        })
      }
    }
  })

  if (rehearsalDaysLeft.value >= 0 && rehearsalDaysLeft.value <= 30) {
    items.push({
      id: 'rehearsal',
      title: '婚礼彩排',
      description: `${rehearsalStore.rehearsalInfo.location} ${rehearsalStore.rehearsalInfo.time}`,
      date: rehearsalStore.rehearsalInfo.date,
      daysLeft: rehearsalDaysLeft.value,
      module: '彩排',
      modulePath: '/rehearsal',
      icon: ListChecks,
      priority: rehearsalDaysLeft.value <= 7 ? 'high' : 'medium',
      completed: false
    })
  }

  if (weddingDaysLeft.value >= 0) {
    items.push({
      id: 'wedding',
      title: '💒 婚礼之日',
      description: '愿你们携手一生，幸福美满！',
      date: scheduleStore.weddingDate,
      daysLeft: weddingDaysLeft.value,
      module: '流程',
      modulePath: '/schedule',
      icon: Bell,
      priority: 'high',
      completed: weddingDaysLeft.value < 0
    })
  }

  return items.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    return a.daysLeft - b.daysLeft
  })
})

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-600 border-red-200'
    case 'medium': return 'bg-amber-100 text-amber-600 border-amber-200'
    case 'low': return 'bg-green-100 text-green-600 border-green-200'
    default: return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

const getDaysLabel = (days: number) => {
  if (days < 0) return '已过期'
  if (days === 0) return '今天'
  if (days === 1) return '明天'
  return `${days}天后`
}

const getProgressColor = (progress: number) => {
  if (progress >= 80) return 'text-green-500'
  if (progress >= 50) return 'text-primary-500'
  if (progress >= 20) return 'text-amber-500'
  return 'text-red-500'
}

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-ivory to-champagne-100 pb-20">
    <div class="animate-fade-in">
      <div class="bg-gradient-to-r from-primary-400 to-primary-500 px-6 pt-12 pb-20 rounded-b-3xl shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-3xl font-serif font-bold text-white">筹备总览</h1>
            <p class="text-primary-100 mt-1">婚礼筹备进度一目了然</p>
          </div>
          <div class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <LayoutDashboard class="w-6 h-6 text-white" />
          </div>
        </div>

        <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <Clock class="w-4 h-4 text-primary-100" />
              <span class="text-primary-100 text-sm">距离婚礼还有</span>
            </div>
            <span class="text-2xl font-bold text-white">{{ weddingDaysLeft > 0 ? `${weddingDaysLeft} 天` : '🎉 今天' }}</span>
          </div>
          <div class="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-champagne-200 to-champagne-300 rounded-full transition-all duration-1000"
              :style="{ width: `${Math.min(100 - overallProgress, 100)}%` }"
            ></div>
          </div>
          <div class="flex justify-between mt-2">
            <span class="text-xs text-primary-100">整体完成度</span>
            <span class="text-sm font-bold text-white">{{ overallProgress.toFixed(1) }}%</span>
          </div>
        </div>
      </div>

      <div class="px-4 -mt-12">
        <div class="animate-slide-up bg-white rounded-2xl p-4 shadow-lg mb-4" style="animation-delay: 0.1s">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Target class="w-5 h-5 text-primary-500" />
              七模块完成度
            </h2>
            <span class="text-sm text-gray-500">{{ modulesProgress.filter(m => m.progress >= 100).length }}/7 已完成</span>
          </div>
          <div class="grid grid-cols-4 gap-3">
            <div
              v-for="module in modulesProgress"
              :key="module.id"
              @click="navigateTo(module.path)"
              class="flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md"
              :class="module.bgColor"
            >
              <div class="relative w-12 h-12 mb-2">
                <svg class="w-12 h-12 transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="#e5e7eb"
                    stroke-width="4"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="4"
                    stroke-linecap="round"
                    :stroke-dasharray="125.6"
                    :stroke-dashoffset="125.6 - (125.6 * module.progress) / 100"
                    class="transition-all duration-1000"
                    :class="module.color"
                  />
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <component :is="module.icon" class="w-5 h-5" :class="module.color" />
                </div>
              </div>
              <span class="text-xs font-medium text-gray-700">{{ module.name }}</span>
              <span class="text-xs font-bold" :class="module.color">{{ module.progress.toFixed(0) }}%</span>
            </div>
          </div>
        </div>

        <div class="animate-slide-up bg-white rounded-2xl p-4 shadow-lg mb-4" style="animation-delay: 0.2s">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Wallet class="w-5 h-5 text-primary-500" />
              预算执行率
            </h2>
            <div class="flex items-center gap-1" :class="getProgressColor(budgetExecutionRate)">
              <component
                :is="budgetExecutionRate > 80 ? TrendingUp : TrendingDown"
                class="w-4 h-4"
              />
              <span class="text-sm font-bold">{{ budgetExecutionRate.toFixed(1) }}%</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3 mb-4">
            <div class="text-center p-3 bg-primary-50 rounded-xl">
              <p class="text-xs text-gray-500 mb-1">总预算</p>
              <p class="text-sm font-bold text-gray-800">{{ formatCurrency(totalBudget) }}</p>
            </div>
            <div class="text-center p-3 bg-champagne-50 rounded-xl">
              <p class="text-xs text-gray-500 mb-1">已支出</p>
              <p class="text-sm font-bold text-champagne-500">{{ formatCurrency(totalSpent) }}</p>
            </div>
            <div class="text-center p-3 bg-green-50 rounded-xl">
              <p class="text-xs text-gray-500 mb-1">剩余</p>
              <p class="text-sm font-bold" :class="remaining >= 0 ? 'text-green-500' : 'text-red-500'">
                {{ formatCurrency(Math.abs(remaining)) }}
              </p>
            </div>
          </div>

          <div class="w-full bg-gray-100 rounded-full h-3 mb-4 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-1000"
              :class="budgetExecutionRate > 100 ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-primary-400 to-primary-500'"
              :style="{ width: `${Math.min(budgetExecutionRate, 100)}%` }"
            ></div>
          </div>

          <PieChart :data="pieData" class="w-full h-56" />
        </div>

        <div class="animate-slide-up bg-white rounded-2xl p-4 shadow-lg" style="animation-delay: 0.3s">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Bell class="w-5 h-5 text-primary-500" />
              近期待办
            </h2>
            <span class="text-sm text-gray-500">{{ todoItems.length }} 项</span>
          </div>

          <div v-if="todoItems.length === 0" class="text-center py-8">
            <CheckCircle2 class="w-16 h-16 text-green-400 mx-auto mb-3" />
            <p class="text-gray-500">太棒了！暂无待办事项</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(item, index) in todoItems"
              :key="item.id"
              @click="navigateTo(item.modulePath)"
              class="flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 cursor-pointer hover:shadow-md hover:scale-[1.02]"
              :class="[
                item.completed ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-100',
                item.priority === 'high' && !item.completed ? 'ring-1 ring-red-200' : ''
              ]"
              :style="{ animationDelay: `${0.4 + index * 0.05}s` }"
            >
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                :class="getPriorityColor(item.priority)"
              >
                <component :is="item.completed ? CheckCircle2 : item.icon" class="w-5 h-5" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <h3
                    class="font-semibold text-sm truncate"
                    :class="item.completed ? 'text-gray-400 line-through' : 'text-gray-800'"
                  >
                    {{ item.title }}
                  </h3>
                  <span
                    class="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 border"
                    :class="getPriorityColor(item.priority)"
                  >
                    {{ getDaysLabel(item.daysLeft) }}
                  </span>
                </div>
                <p class="text-xs text-gray-500 mt-1 truncate">{{ item.description }}</p>
                <div class="flex items-center gap-2 mt-2">
                  <span class="text-xs text-gray-400">{{ item.module }}</span>
                  <span v-if="item.date" class="text-xs text-gray-400">· {{ item.date }}</span>
                </div>
              </div>
              <ChevronRight class="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
            </div>
          </div>
        </div>

        <div class="h-6"></div>
      </div>
    </div>
  </div>
</template>
