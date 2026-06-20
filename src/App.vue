<template>
  <div class="min-h-screen bg-ivory">
    <router-view v-slot="{ Component, route }">
      <transition name="fade" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </transition>
    </router-view>
    <TabBar />
    <Toast
      :visible="toastVisible"
      :message="toastMessage"
      :description="toastDescription"
      :type="toastType"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import TabBar from '@/components/TabBar.vue'
import Toast from '@/components/Toast.vue'
import { useBudgetStore } from '@/stores/budget'

const budgetStore = useBudgetStore()

const toastVisible = ref(false)
const toastMessage = ref('')
const toastDescription = ref('')
const toastType = ref<'success' | 'error' | 'warning' | 'info'>('warning')

let toastTimer: ReturnType<typeof setTimeout> | null = null

const showToast = (message: string, description?: string, type: 'success' | 'error' | 'warning' | 'info' = 'warning', duration = 3500) => {
  if (toastTimer) {
    clearTimeout(toastTimer)
  }
  toastMessage.value = message
  toastDescription.value = description ?? ''
  toastType.value = type
  toastVisible.value = true
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, duration)
}

const handleAccessDenied = (event: Event) => {
  const customEvent = event as CustomEvent
  const { moduleName, requiredRole } = customEvent.detail || {}
  showToast(
    `无权访问「${moduleName || '该'}」模块`,
    `请切换到${requiredRole || '对应'}视角后查看`,
    'warning',
    3500
  )
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    const cacheVersion = localStorage.getItem('cache-version')
    const currentVersion = '1.0.1'
    if (cacheVersion !== currentVersion) {
      localStorage.removeItem('wedding-venues')
      localStorage.removeItem('wedding-photography')
      localStorage.removeItem('wedding-emergency-contacts')
      localStorage.setItem('cache-version', currentVersion)
    }
  }
  budgetStore.syncContractedToBudget()
  if (typeof window !== 'undefined') {
    window.addEventListener('route-access-denied', handleAccessDenied)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('route-access-denied', handleAccessDenied)
  }
  if (toastTimer) {
    clearTimeout(toastTimer)
  }
})
</script>
