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
import TabBar from '@/components/TabBar.vue'
</script>