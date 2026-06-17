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
      steps.value[index] = { ...steps.value[index], ...updates }
      steps.value.sort((a, b) => a.stepNumber - b.stepNumber)
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

  return {
    steps,
    rehearsalInfo,
    staff,
    notices,
    addStep,
    updateStep,
    deleteStep,
    getStepById
  }
})
