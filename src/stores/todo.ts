import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useGuestsStore } from './guests'
import { useBudgetStore } from './budget'
import { useChecklistStore } from './checklist'
import { useVenuesStore } from './venues'
import { usePhotographyStore } from './photography'
import { useDressStore } from './dress'
import { useRehearsalStore } from './rehearsal'
import { useScheduleStore } from './schedule'
import { useRoleStore } from './role'
import { isModuleVisible, isBudgetVisible } from '@/data/permissions'

export interface TodoCounts {
  overview: number
  budget: number
  guests: number
  venues: number
  photography: number
  dress: number
  schedule: number
  rehearsal: number
}

const TAB_IDS: (keyof TodoCounts)[] = [
  'overview',
  'budget',
  'guests',
  'venues',
  'photography',
  'dress',
  'schedule',
  'rehearsal'
]

export const useTodoStore = defineStore('todo', () => {
  const guestsStore = useGuestsStore()
  const budgetStore = useBudgetStore()
  const checklistStore = useChecklistStore()
  const venuesStore = useVenuesStore()
  const photographyStore = usePhotographyStore()
  const dressStore = useDressStore()
  const rehearsalStore = useRehearsalStore()
  const scheduleStore = useScheduleStore()
  const roleStore = useRoleStore()

  const guestsTodoCount = computed(() => {
    if (!isModuleVisible('guests', roleStore.currentRole)) {
      return 0
    }
    let count = 0
    count += guestsStore.pendingCount
    count += guestsStore.confirmedUnassignedCount
    if (guestsStore.isOverCapacity) {
      count += guestsStore.capacityOverflow
    }
    return count
  })

  const budgetTodoCount = computed(() => {
    if (!isModuleVisible('budget', roleStore.currentRole)) {
      return 0
    }
    const role = roleStore.currentRole
    const visibleItems = budgetStore.items.filter(item => 
      isBudgetVisible(item.category, role)
    )
    
    const todoSet = new Set<string>()
    
    visibleItems.forEach(item => {
      const isOverBudget = item.actual > (item.budget ?? item.planned)
      const isUnconfirmed = !item.confirmed
      
      if (isOverBudget || isUnconfirmed) {
        todoSet.add(item.id)
      }
    })
    
    return todoSet.size
  })

  const venuesTodoCount = computed(() => {
    if (!isModuleVisible('venues', roleStore.currentRole)) {
      return 0
    }
    const hasBooked = venuesStore.bookedVenues.length > 0
    if (!hasBooked && guestsStore.totalNonDeclinedCount > 0) {
      return 1
    }
    return 0
  })

  const photographyTodoCount = computed(() => {
    if (!isModuleVisible('photography', roleStore.currentRole)) {
      return 0
    }
    const hasContracted = photographyStore.items.some(p => p.contracted)
    return hasContracted ? 0 : 1
  })

  const dressTodoCount = computed(() => {
    if (!isModuleVisible('dress', roleStore.currentRole)) {
      return 0
    }
    const hasContracted = dressStore.dresses.some(d => d.contracted)
    return hasContracted ? 0 : 1
  })

  const rehearsalTodoCount = computed(() => {
    if (!isModuleVisible('rehearsal', roleStore.currentRole)) {
      return 0
    }
    const unassignedSteps = rehearsalStore.steps.filter(
      step => !step.personInChargeId || !step.personInCharge
    )
    return unassignedSteps.length
  })

  const scheduleTodoCount = computed(() => {
    if (!isModuleVisible('schedule', roleStore.currentRole)) {
      return 0
    }
    const unassignedItems = scheduleStore.items.filter(
      item => !item.personInChargeId || !item.personInCharge
    )
    return unassignedItems.length
  })

  const overviewTodoCount = computed(() => {
    return (
      guestsTodoCount.value +
      budgetTodoCount.value +
      venuesTodoCount.value +
      photographyTodoCount.value +
      dressTodoCount.value +
      scheduleTodoCount.value +
      rehearsalTodoCount.value
    )
  })

  const todoCounts = computed<TodoCounts>(() => ({
    overview: overviewTodoCount.value,
    budget: budgetTodoCount.value,
    guests: guestsTodoCount.value,
    venues: venuesTodoCount.value,
    photography: photographyTodoCount.value,
    dress: dressTodoCount.value,
    schedule: scheduleTodoCount.value,
    rehearsal: rehearsalTodoCount.value
  }))

  function getTodoCount(tabId: string): number {
    return todoCounts.value[tabId as keyof TodoCounts] ?? 0
  }

  return {
    todoCounts,
    overviewTodoCount,
    guestsTodoCount,
    budgetTodoCount,
    venuesTodoCount,
    photographyTodoCount,
    dressTodoCount,
    rehearsalTodoCount,
    scheduleTodoCount,
    getTodoCount
  }
})
