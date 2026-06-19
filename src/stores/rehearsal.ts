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

  function addStep(step: Omit<RehearsalStep, 'id'>) {
    const newStep: RehearsalStep = {
      ...step,
      id: Date.now().toString()
    }
    steps.value.push(newStep)
    steps.value.sort((a, b) => a.stepNumber - b.stepNumber)
  }

  function updateStep(id: string, updates: Partial<Omit<RehearsalStep, 'id'>>) {
    const index = steps.value.findIndex(step => step.id === id)
    if (index !== -1) {
      const oldPerson = steps.value[index].personInCharge
      const newPerson = updates.personInCharge
      steps.value[index] = { ...steps.value[index], ...updates }
      steps.value.sort((a, b) => a.stepNumber - b.stepNumber)

      if (newPerson !== undefined && newPerson !== oldPerson && !isSyncing) {
        syncStepPersonChange(oldPerson, newPerson)
      }
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
  }

  function updateStaff(id: string, updates: Partial<Omit<StaffMember, 'id'>>) {
    const index = staff.value.findIndex(m => m.id === id)
    if (index !== -1) {
      const oldName = staff.value[index].name
      staff.value[index] = { ...staff.value[index], ...updates }
      const newName = staff.value[index].name

      if (oldName !== newName && !isSyncing) {
        syncStaffNameChange(oldName, newName)
      }
    }
  }

  function deleteStaff(id: string) {
    const index = staff.value.findIndex(m => m.id === id)
    if (index !== -1) {
      const member = staff.value[index]
      staff.value.splice(index, 1)

      if (!isSyncing) {
        syncStaffNameChange(member.name, '')
      }
    }
  }

  function getStaffById(id: string) {
    return staff.value.find(m => m.id === id)
  }

  function syncStaffNameChange(oldName: string, newName: string) {
    if (!oldName || oldName === newName) return

    isSyncing = true
    try {
      steps.value.forEach((step, idx) => {
        if (step.personInCharge === oldName) {
          steps.value[idx] = { ...step, personInCharge: newName }
        }
      })

      const scheduleStore = useScheduleStore()
      scheduleStore.items.forEach((item, idx) => {
        if (item.personInCharge === oldName) {
          scheduleStore.items[idx] = { ...item, personInCharge: newName }
        }
      })
    } finally {
      isSyncing = false
    }
  }

  function syncStepPersonChange(oldPerson: string, newPerson: string) {
    if (oldPerson === newPerson) return

    isSyncing = true
    try {
      steps.value.forEach((step, idx) => {
        if (step.personInCharge === oldPerson) {
          steps.value[idx] = { ...step, personInCharge: newPerson }
        }
      })

      const scheduleStore = useScheduleStore()
      scheduleStore.items.forEach((item, idx) => {
        if (item.personInCharge === oldPerson) {
          scheduleStore.items[idx] = { ...item, personInCharge: newPerson }
        }
      })

      const existingStaff = staff.value.find(m => m.name === newPerson)
      if (!existingStaff && newPerson.trim() !== '') {
        const role = inferRoleFromName(newPerson)
        addStaff({ name: newPerson, role, phone: '' })
      }
    } finally {
      isSyncing = false
    }
  }

  function syncFromSchedulePersonChange(oldPerson: string, newPerson: string) {
    if (isSyncing || oldPerson === newPerson) return

    isSyncing = true
    try {
      steps.value.forEach((step, idx) => {
        if (step.personInCharge === oldPerson) {
          steps.value[idx] = { ...step, personInCharge: newPerson }
        }
      })

      const existingStaff = staff.value.find(m => m.name === newPerson)
      if (!existingStaff && newPerson.trim() !== '') {
        const role = inferRoleFromName(newPerson)
        addStaff({ name: newPerson, role, phone: '' })
      }
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
    syncFromSchedulePersonChange
  }
})
