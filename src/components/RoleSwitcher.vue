<script setup lang="ts">
import { useRoleStore } from '@/stores/role'
import { User, Heart } from 'lucide-vue-next'

const roleStore = useRoleStore()

const handleToggle = () => {
  roleStore.toggleRole()
}
</script>

<template>
  <button
    @click="handleToggle"
    class="relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
    :class="[
      roleStore.isGroom
        ? 'bg-white/20 backdrop-blur-sm border border-white/30'
        : 'bg-pink-100/30 backdrop-blur-sm border border-pink-200/30'
    ]"
  >
    <div
      class="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
      :class="roleStore.isGroom ? 'bg-blue-500' : 'bg-pink-400'"
    >
      <User v-if="roleStore.isGroom" class="w-4 h-4 text-white" />
      <Heart v-else class="w-4 h-4 text-white" />
    </div>
    <span class="text-sm font-medium text-white">{{ roleStore.roleLabel }}视角</span>
    <div class="w-px h-5 bg-white/30"></div>
    <span class="text-xs text-white/70">切换到{{ roleStore.oppositeRoleLabel }}</span>
  </button>
</template>
