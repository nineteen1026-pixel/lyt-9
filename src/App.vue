<template>
  <div class="min-h-screen bg-ivory">
    <router-view v-slot="{ Component, route }">
      <transition name="fade" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </transition>
    </router-view>
    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import TabBar from '@/components/TabBar.vue'
import { useBudgetStore } from '@/stores/budget'

const budgetStore = useBudgetStore()

onMounted(() => {
  budgetStore.syncContractedToBudget()
})
</script>