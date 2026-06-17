<template>
  <div class="relative pl-8">
    <div
      class="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary-200 via-primary-300 to-primary-200"
    ></div>
    <div
      v-for="(item, index) in items"
      :key="index"
      ref="itemRefs"
      class="relative mb-8 last:mb-0"
      :class="{ 'opacity-0 translate-y-4': !visibleItems[index] }"
      :style="{
        transition: `all 0.6s ease-out ${index * 0.1}s`,
        opacity: visibleItems[index] ? 1 : 0,
        transform: visibleItems[index] ? 'translateY(0)' : 'translateY(16px)'
      }"
    >
      <div
        class="absolute -left-[22px] top-6 w-4 h-4 rounded-full border-4 border-white shadow-md z-10"
        :class="index === 0 ? 'bg-primary-500' : 'bg-primary-400'"
      ></div>
      <div
        class="absolute -left-[18px] top-8 w-0.5 h-12 bg-gradient-to-b from-primary-300 to-transparent"
        v-if="index < items.length - 1"
        :style="{
          height: visibleItems[index] ? '48px' : '0px',
          transition: `height 0.5s ease-out ${index * 0.1 + 0.3}s`
        }"
      ></div>

      <div class="bg-white rounded-xl shadow-lg border border-gray-100 p-5 hover:shadow-xl transition-shadow duration-300">
        <div class="flex items-center justify-between mb-3">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-600">
            {{ item.time }}
          </span>
          <span v-if="item.personInCharge" class="text-xs text-gray-400">
            负责人: {{ item.personInCharge }}
          </span>
        </div>
        <h3 class="text-lg font-bold text-gray-800 mb-2">{{ item.title }}</h3>
        <p class="text-sm text-gray-600 mb-3 leading-relaxed">{{ item.description }}</p>
        <div v-if="item.location" class="flex items-center text-xs text-gray-500">
          <svg class="w-4 h-4 mr-1 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {{ item.location }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

interface TimelineItem {
  time: string
  title: string
  description: string
  location?: string
  personInCharge?: string
}

const props = defineProps<{
  items: TimelineItem[]
}>()

const itemRefs = ref<(HTMLElement | null)[]>([])
const visibleItems = ref<boolean[]>([])

let observer: IntersectionObserver | null = null

const initObserver = () => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const index = itemRefs.value.indexOf(entry.target as HTMLElement)
        if (index !== -1 && entry.isIntersecting) {
          visibleItems.value[index] = true
        }
      })
    },
    {
      threshold: 0.2,
      rootMargin: '0px 0px -50px 0px'
    }
  )

  nextTick(() => {
    itemRefs.value.forEach((el) => {
      if (el) observer?.observe(el)
    })
  })
}

onMounted(() => {
  visibleItems.value = props.items.map(() => false)
  initObserver()
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>
