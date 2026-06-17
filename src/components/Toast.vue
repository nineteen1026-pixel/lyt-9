<template>
  <Teleport to="body">
    <Transition name="toast">
      <div 
        v-if="visible" 
        class="fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl animate-bounce-in"
        :class="[
          type === 'success' ? 'bg-green-500' : '',
          type === 'error' ? 'bg-red-500' : '',
          type === 'warning' ? 'bg-yellow-500' : '',
          type === 'info' ? 'bg-primary-500' : ''
        ]"
      >
        <div class="flex items-center gap-3">
          <component :is="icon" class="w-5 h-5 text-white flex-shrink-0" />
          <div class="text-white">
            <p class="font-medium text-sm">{{ message }}</p>
            <p v-if="description" class="text-xs opacity-90 mt-0.5">{{ description }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
  message: string
  description?: string
  type?: 'success' | 'error' | 'warning' | 'info'
}>()

const icon = computed(() => {
  switch (props.type) {
    case 'success': return CheckCircle
    case 'error': return XCircle
    case 'warning': return AlertTriangle
    case 'info':
    default: return Info
  }
})
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -30px);
}

.animate-bounce-in {
  animation: bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: translate(-50%, -30px) scale(0.8);
  }
  60% {
    transform: translate(-50%, 5px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}
</style>
