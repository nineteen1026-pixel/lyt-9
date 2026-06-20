import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { get, set } from '../utils/storage'
import { mockPhotoShots, type PhotoShot } from '../data/mockData'

export { type PhotoShot }

export const usePhotoShotsStore = defineStore('photoShots', () => {
  const STORAGE_KEY = 'wedding-photo-shots'

  const shots = ref<PhotoShot[]>(get(STORAGE_KEY, mockPhotoShots))

  watch(shots, (newValue) => {
    set(STORAGE_KEY, newValue)
  }, { deep: true })

  const getShotsByScheduleItem = (scheduleItemId: string) => {
    return shots.value
      .filter(s => s.scheduleItemId === scheduleItemId)
      .sort((a, b) => a.order - b.order)
  }

  const getStatsByScheduleItem = (scheduleItemId: string) => {
    const itemShots = shots.value.filter(s => s.scheduleItemId === scheduleItemId)
    const total = itemShots.length
    const completed = itemShots.filter(s => s.completed).length
    return { total, completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  const toggleShot = (id: string) => {
    const shot = shots.value.find(s => s.id === id)
    if (shot) {
      shot.completed = !shot.completed
      shot.completedAt = shot.completed ? Date.now() : undefined
    }
  }

  const addShot = (shot: Omit<PhotoShot, 'id'>) => {
    const newShot: PhotoShot = {
      ...shot,
      id: Date.now().toString()
    }
    shots.value.push(newShot)
    return newShot
  }

  const updateShot = (id: string, updates: Partial<Omit<PhotoShot, 'id'>>) => {
    const index = shots.value.findIndex(s => s.id === id)
    if (index !== -1) {
      shots.value[index] = { ...shots.value[index], ...updates }
    }
  }

  const deleteShot = (id: string) => {
    const index = shots.value.findIndex(s => s.id === id)
    if (index !== -1) {
      shots.value.splice(index, 1)
    }
  }

  const deleteShotsByScheduleItem = (scheduleItemId: string) => {
    shots.value = shots.value.filter(s => s.scheduleItemId !== scheduleItemId)
  }

  const reorderShots = (scheduleItemId: string, orderedIds: string[]) => {
    orderedIds.forEach((id, idx) => {
      const shot = shots.value.find(s => s.id === id)
      if (shot && shot.scheduleItemId === scheduleItemId) {
        shot.order = idx + 1
      }
    })
  }

  const totalStats = computed(() => {
    const total = shots.value.length
    const completed = shots.value.filter(s => s.completed).length
    return {
      total,
      completed,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  })

  const getShotById = (id: string) => {
    return shots.value.find(s => s.id === id)
  }

  const resetAll = () => {
    shots.value.forEach(shot => {
      shot.completed = false
      shot.completedAt = undefined
    })
  }

  return {
    shots,
    getShotsByScheduleItem,
    getStatsByScheduleItem,
    toggleShot,
    addShot,
    updateShot,
    deleteShot,
    deleteShotsByScheduleItem,
    reorderShots,
    totalStats,
    getShotById,
    resetAll
  }
})
