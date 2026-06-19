import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { get, set } from '../utils/storage'

export type WeddingRole = 'groom' | 'bride'

export const useRoleStore = defineStore('role', () => {
  const STORAGE_KEY = 'wedding-current-role'

  const currentRole = ref<WeddingRole>(get(STORAGE_KEY, 'groom'))

  watch(currentRole, (newValue) => {
    set(STORAGE_KEY, newValue)
  })

  const roleLabel = computed(() => {
    return currentRole.value === 'groom' ? '新郎' : '新娘'
  })

  const oppositeRole = computed(() => {
    return currentRole.value === 'groom' ? 'bride' : 'groom'
  })

  const oppositeRoleLabel = computed(() => {
    return oppositeRole.value === 'groom' ? '新郎' : '新娘'
  })

  const isGroom = computed(() => currentRole.value === 'groom')
  const isBride = computed(() => currentRole.value === 'bride')

  function setRole(role: WeddingRole) {
    currentRole.value = role
  }

  function toggleRole() {
    currentRole.value = currentRole.value === 'groom' ? 'bride' : 'groom'
  }

  return {
    currentRole,
    roleLabel,
    oppositeRole,
    oppositeRoleLabel,
    isGroom,
    isBride,
    setRole,
    toggleRole
  }
})
