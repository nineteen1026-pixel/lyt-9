<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg"
    :style="{ height: '64px', paddingBottom: 'env(safe-area-inset-bottom)' }"
  >
    <div class="flex items-center justify-between h-full px-2 overflow-x-auto scrollbar-hide">
      <button
        v-for="tab in tabs"
        :key="tab.path"
        @click="handleTabClick(tab.path)"
        class="flex flex-col items-center justify-center flex-shrink-0 px-3 py-1 transition-all duration-300 ease-out"
        :class="[
          isActive(tab.path)
            ? 'text-primary-500 scale-105'
            : 'text-gray-400 hover:text-gray-600'
        ]"
      >
        <component
          :is="tab.icon"
          :size="22"
          :stroke-width="isActive(tab.path) ? 2.5 : 1.5"
          class="transition-all duration-300"
        />
        <span
          class="mt-1 text-xs font-medium transition-all duration-300"
          :class="isActive(tab.path) ? 'text-primary-500' : 'text-gray-500'"
        >
          {{ tab.label }}
        </span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRoleStore } from '@/stores/role'
import { isModuleVisible } from '@/data/permissions'
import {
  LayoutDashboard,
  PieChart,
  Users,
  Building2,
  Camera,
  Shirt,
  Calendar,
  ListChecks
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const roleStore = useRoleStore()

const allTabs = [
  { path: '/overview', label: '总览', icon: LayoutDashboard, id: 'overview' },
  { path: '/budget', label: '预算', icon: PieChart, id: 'budget' },
  { path: '/guests', label: '宾客', icon: Users, id: 'guests' },
  { path: '/venues', label: '场地', icon: Building2, id: 'venues' },
  { path: '/photography', label: '摄影', icon: Camera, id: 'photography' },
  { path: '/dress', label: '婚纱', icon: Shirt, id: 'dress' },
  { path: '/schedule', label: '流程', icon: Calendar, id: 'schedule' },
  { path: '/rehearsal', label: '彩排', icon: ListChecks, id: 'rehearsal' }
]

const tabs = computed(() => 
  allTabs.filter(tab => isModuleVisible(tab.id, roleStore.currentRole))
)

const isActive = (path: string) => route.path === path

const handleTabClick = (path: string) => {
  if (!isActive(path)) {
    router.push(path)
  }
}
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
