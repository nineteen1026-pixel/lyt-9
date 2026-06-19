import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useGuestsStore } from './guests'
import { useBudgetStore } from './budget'
import { useChecklistStore } from './checklist'
import { useVenuesStore } from './venues'
import { usePhotographyStore } from './photography'
import { useDressStore } from './dress'
import { useRehearsalStore } from './rehearsal'

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

export const useTodoStore = defineStore('todo', () => {
  const guestsStore = useGuestsStore()
  const budgetStore = useBudgetStore()
  const checklistStore = useChecklistStore()
  const venuesStore = useVenuesStore()
  const photographyStore = usePhotographyStore()
  const dressStore = useDressStore()
  const rehearsalStore = useRehearsalStore()

  const guestsTodoCount = computed(() => {
    let count = 0
    count += guestsStore.pendingCount
    count += guestsStore.confirmedUnassignedCount
    if (guestsStore.isOverCapacity) {
      count += guestsStore.capacityOverflow
    }
    return count
  })

  const budgetTodoCount = computed(() => {
    let count = 0
    const overBudgetItems = budgetStore.items.filter(
      item => item.actual > (item.budget ?? item.planned)
    )
    count += overBudgetItems.length
    const unconfirmedItems = budgetStore.items.filter(item => !item.confirmed)
    count += unconfirmedItems.length
    return count
  })

  const checklistTodoCount = computed(() => {
    return checklistStore.totalCount - checklistStore.completedCount
  })

  const venuesTodoCount = computed(() => {
    const hasBooked = venuesStore.bookedVenues.length > 0
    if (!hasBooked && guestsStore.totalNonDeclinedCount > 0) {
      return 1
    }
    return 0
  })

  const photographyTodoCount = computed(() => {
    const hasContracted = photographyStore.items.some(p => p.contracted)
    return hasContracted ? 0 : 1
  })

  const dressTodoCount = computed(() => {
    const hasContracted = dressStore.dresses.some(d => d.contracted)
    return hasContracted ? 0 : 1
  })

  const rehearsalTodoCount = computed(() => {
    const unassignedSteps = rehearsalStore.steps.filter(
      step => !step.personInChargeId || !step.personInCharge
    )
    return unassignedSteps.length
  })

  const scheduleTodoCount = computed(() => {
    return checklistTodoCount.value
  })

  const overviewTodoCount = computed(() => {
    return (
      guestsTodoCount.value +
      budgetTodoCount.value +
      venuesTodoCount.value +
      photographyTodoCount.value +
      dressTodoCount.value +
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
    checklistTodoCount,
    venuesTodoCount,
    photographyTodoCount,
    dressTodoCount,
    rehearsalTodoCount,
    scheduleTodoCount,
    getTodoCount
  }
})
