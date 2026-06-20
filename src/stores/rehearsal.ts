import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { get, set } from '../utils/storage'
import {
  mockRehearsal,
  mockRehearsalInfo,
  mockStaff,
  mockNotices,
  type RehearsalStep,
  type RehearsalInfo,
  type StaffMember,
  type Notice
} from '../data/mockData'
import { useScheduleStore } from './schedule'

export { type RehearsalStep, type RehearsalInfo, type StaffMember, type Notice }

export const useRehearsalStore = defineStore('rehearsal', () => {
  const STORAGE_KEY_STEPS = 'wedding-rehearsal'
  const STORAGE_KEY_INFO = 'wedding-rehearsal-info'
  const STORAGE_KEY_STAFF = 'wedding-rehearsal-staff'
  const STORAGE_KEY_NOTICES = 'wedding-rehearsal-notices'

  const steps = ref<RehearsalStep[]>(get(STORAGE_KEY_STEPS, mockRehearsal))
  const rehearsalInfo = ref<RehearsalInfo>(get(STORAGE_KEY_INFO, mockRehearsalInfo))
  const staff = ref<StaffMember[]>(get(STORAGE_KEY_STAFF, mockStaff))
  const notices = ref<Notice[]>(get(STORAGE_KEY_NOTICES, mockNotices))

  let isSyncing = false

  watch(steps, (newValue) => {
    set(STORAGE_KEY_STEPS, newValue)
  }, { deep: true })

  watch(rehearsalInfo, (newValue) => {
    set(STORAGE_KEY_INFO, newValue)
  }, { deep: true })

  watch(staff, (newValue) => {
    set(STORAGE_KEY_STAFF, newValue)
  }, { deep: true })

  watch(notices, (newValue) => {
    set(STORAGE_KEY_NOTICES, newValue)
  }, { deep: true })

  function getStaffById(id: string) {
    return staff.value.find(m => m.id === id)
  }

  function getStaffNameById(id?: string): string {
    if (!id) return ''
    const member = getStaffById(id)
    return member ? member.name : ''
  }

  function addStep(step: Omit<RehearsalStep, 'id'>) {
    const newStep: RehearsalStep = {
      ...step,
      id: Date.now().toString()
    }
    if (newStep.personInChargeId && !newStep.personInCharge) {
      newStep.personInCharge = getStaffNameById(newStep.personInChargeId)
    }
    steps.value.push(newStep)
    steps.value.sort((a, b) => a.stepNumber - b.stepNumber)
  }

  function updateStep(id: string, updates: Partial<Omit<RehearsalStep, 'id'>>) {
    const index = steps.value.findIndex(step => step.id === id)
    if (index !== -1) {
      steps.value[index] = { ...steps.value[index], ...updates }

      if (updates.personInChargeId !== undefined) {
        steps.value[index].personInCharge = getStaffNameById(updates.personInChargeId) || updates.personInCharge || steps.value[index].personInCharge
      }

      steps.value.sort((a, b) => a.stepNumber - b.stepNumber)
    }
  }

  function updateStepPerson(stepId: string, personId: string | undefined, personName: string) {
    const index = steps.value.findIndex(s => s.id === stepId)
    if (index === -1) return

    const oldPersonId = steps.value[index].personInChargeId
    const linkedScheduleItemId = steps.value[index].linkedScheduleItemId

    steps.value[index] = {
      ...steps.value[index],
      personInChargeId: personId,
      personInCharge: personName
    }

    if (!isSyncing && oldPersonId !== personId && linkedScheduleItemId) {
      isSyncing = true
      try {
        const scheduleStore = useScheduleStore()
        const itemIndex = scheduleStore.items.findIndex(item => item.id === linkedScheduleItemId)
        if (itemIndex !== -1) {
          scheduleStore.items[itemIndex] = {
            ...scheduleStore.items[itemIndex],
            personInChargeId: personId,
            personInCharge: personName
          }
        }
      } finally {
        isSyncing = false
      }
    }
  }

  function updateStepLinkedScheduleItem(stepId: string, linkedScheduleItemId: string | undefined) {
    const index = steps.value.findIndex(s => s.id === stepId)
    if (index === -1) return

    steps.value[index] = {
      ...steps.value[index],
      linkedScheduleItemId
    }
  }

  function deleteStep(id: string) {
    const index = steps.value.findIndex(step => step.id === id)
    if (index !== -1) {
      steps.value.splice(index, 1)
    }
  }

  function getStepById(id: string) {
    return steps.value.find(step => step.id === id)
  }

  function addStaff(member: Omit<StaffMember, 'id'>) {
    const newMember: StaffMember = {
      ...member,
      id: Date.now().toString()
    }
    staff.value.push(newMember)
    return newMember
  }

  function updateStaff(id: string, updates: Partial<Omit<StaffMember, 'id'>>) {
    const index = staff.value.findIndex(m => m.id === id)
    if (index !== -1) {
      const oldName = staff.value[index].name
      staff.value[index] = { ...staff.value[index], ...updates }
      const newName = staff.value[index].name

      if (oldName !== newName && !isSyncing) {
        cascadeStaffNameChange(id, newName)
      }
    }
  }

  function deleteStaff(id: string) {
    const index = staff.value.findIndex(m => m.id === id)
    if (index !== -1) {
      staff.value.splice(index, 1)

      if (!isSyncing) {
        clearStaffReferences(id)
      }
    }
  }

  function cascadeStaffNameChange(staffId: string, newName: string) {
    if (!staffId) return

    isSyncing = true
    try {
      steps.value.forEach((step, idx) => {
        if (step.personInChargeId === staffId) {
          steps.value[idx] = { ...step, personInCharge: newName }
        }
      })

      const scheduleStore = useScheduleStore()
      scheduleStore.items.forEach((item, idx) => {
        if (item.personInChargeId === staffId) {
          scheduleStore.items[idx] = { ...item, personInCharge: newName }
        }
      })
    } finally {
      isSyncing = false
    }
  }

  function clearStaffReferences(staffId: string) {
    if (!staffId) return

    isSyncing = true
    try {
      steps.value.forEach((step, idx) => {
        if (step.personInChargeId === staffId) {
          steps.value[idx] = { ...step, personInChargeId: undefined, personInCharge: '' }
        }
      })

      const scheduleStore = useScheduleStore()
      scheduleStore.items.forEach((item, idx) => {
        if (item.personInChargeId === staffId) {
          scheduleStore.items[idx] = { ...item, personInChargeId: undefined, personInCharge: '' }
        }
      })
    } finally {
      isSyncing = false
    }
  }

  function syncFromSchedulePersonChange(itemId: string, _oldPersonId: string | undefined, newPersonId: string | undefined, newPersonName: string) {
    if (isSyncing) return

    isSyncing = true
    try {
      if (newPersonId) {
        const existingStaff = staff.value.find(m => m.id === newPersonId)
        if (!existingStaff && newPersonName.trim()) {
          const role = inferRoleFromName(newPersonName)
          addStaff({ name: newPersonName, role, phone: '' })
        }
      }

      steps.value.forEach((step, idx) => {
        if (step.linkedScheduleItemId === itemId) {
          steps.value[idx] = {
            ...step,
            personInChargeId: newPersonId,
            personInCharge: newPersonName
          }
        }
      })
    } finally {
      isSyncing = false
    }
  }

  function inferRoleFromName(name: string): string {
    if (name.includes('司仪')) return '司仪'
    if (name.includes('摄影')) return '摄影师'
    if (name.includes('摄像')) return '摄像师'
    if (name.includes('化妆')) return '化妆师'
    if (name.includes('督导') || name.includes('协调')) return '婚礼督导'
    if (name.includes('伴郎')) return '伴郎'
    if (name.includes('伴娘')) return '伴娘'
    return '工作人员'
  }

  function reorderByLinkedScheduleItems(orderedScheduleIds: string[]) {
    if (isSyncing) return
    if (!orderedScheduleIds || orderedScheduleIds.length === 0) return

    const scheduleOrderMap = new Map<string, number>()
    orderedScheduleIds.forEach((id, idx) => scheduleOrderMap.set(id, idx))

    const linkedSteps: RehearsalStep[] = []
    const unlinkedSteps: RehearsalStep[] = []

    steps.value.forEach(step => {
      if (step.linkedScheduleItemId && scheduleOrderMap.has(step.linkedScheduleItemId)) {
        linkedSteps.push(step)
      } else {
        unlinkedSteps.push(step)
      }
    })

    linkedSteps.sort((a, b) => {
      const orderA = scheduleOrderMap.get(a.linkedScheduleItemId!)!
      const orderB = scheduleOrderMap.get(b.linkedScheduleItemId!)!
      return orderA - orderB
    })

    unlinkedSteps.sort((a, b) => a.stepNumber - b.stepNumber)

    const newSteps = [...linkedSteps, ...unlinkedSteps]
    newSteps.forEach((step, idx) => {
      step.stepNumber = idx + 1
    })

    steps.value = newSteps
  }

  function reorderSteps(orderedStepIds: string[]) {
    if (!orderedStepIds || orderedStepIds.length === 0) return

    const stepOrderMap = new Map<string, number>()
    orderedStepIds.forEach((id, idx) => stepOrderMap.set(id, idx))

    steps.value.sort((a, b) => {
      const orderA = stepOrderMap.get(a.id)
      const orderB = stepOrderMap.get(b.id)
      if (orderA === undefined && orderB === undefined) return a.stepNumber - b.stepNumber
      if (orderA === undefined) return 1
      if (orderB === undefined) return -1
      return orderA - orderB
    })

    steps.value.forEach((step, idx) => {
      step.stepNumber = idx + 1
    })
  }

  return {
    steps,
    rehearsalInfo,
    staff,
    notices,
    addStep,
    updateStep,
    deleteStep,
    getStepById,
    addStaff,
    updateStaff,
    deleteStaff,
    getStaffById,
    getStaffNameById,
    updateStepPerson,
    updateStepLinkedScheduleItem,
    syncFromSchedulePersonChange,
    reorderByLinkedScheduleItems,
    reorderSteps
  }
})
