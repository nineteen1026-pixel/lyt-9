<template>
  <div class="relative pl-8 py-2">
    <div
      class="absolute left-[17px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary-200 via-primary-300 to-primary-200 pointer-events-none"
    ></div>

    <div
      v-for="(item, index) in items"
      :key="index"
      ref="itemRefs"
      class="relative"
      :class="[
        isEvent(item) ? 'mb-10' : 'mb-8',
        'last:mb-0',
        { 'opacity-0 translate-y-4': !visibleItems[index] }
      ]"
      :style="{
        transition: `all 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.08}s`,
        opacity: visibleItems[index] ? 1 : 0,
        transform: visibleItems[index] ? 'translateY(0)' : 'translateY(18px)'
      }"
    >
      <template v-if="isSeparator(item)">
        <div class="relative flex items-center -ml-2 mb-2">
          <div class="absolute -left-[7px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-primary-300 shadow-sm z-20"></div>
          <div class="flex items-center gap-2 ml-6">
            <div class="h-px w-6 bg-gradient-to-r from-primary-200 to-primary-300"></div>
            <span class="px-4 py-1.5 bg-gradient-to-r from-primary-100 to-champagne-50 text-primary-500 rounded-full text-sm font-semibold shadow-sm border border-primary-100">{{ item.label }}</span>
            <div class="h-px flex-1 bg-gradient-to-r from-primary-300 via-primary-200 to-transparent"></div>
          </div>
        </div>
      </template>

      <template v-else>
        <div
          class="absolute -left-[22px] top-6 w-5 h-5 rounded-full border-4 border-white shadow-md z-20"
          :class="[
            index === 0 || isFirstEvent(index) ? 'bg-primary-500' : 'bg-primary-400',
            'ring-2 ring-primary-200'
          ]"
        ></div>

        <div class="bg-white rounded-xl shadow-lg border border-gray-100 p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div class="flex items-center justify-between mb-3">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-600 ring-1 ring-primary-100">
              <svg class="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ item.time }}
            </span>
            <span v-if="item.personInCharge" class="text-xs text-gray-400 flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {{ item.personInCharge }}
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
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

type SeparatorItem = { type: 'separator'; label: string }
type EventItem = {
  type: 'event'
  time: string
  title: string
  description: string
  location?: string
  personInCharge?: string
}
type TimelineItem = SeparatorItem | EventItem

const props = defineProps<{
  items: TimelineItem[]
}>()

function isSeparator(item: TimelineItem): item is SeparatorItem {
  return item.type === 'separator'
}
function isEvent(item: TimelineItem): item is EventItem {
  return item.type === 'event'
}
function isFirstEvent(index: number): boolean {
  for (let i = 0; i < index; i++) {
    if (isEvent(props.items[i])) return false
  }
  return true
}

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
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px'
    }
  )

  nextTick(() => {
    itemRefs.value.forEach((el) => {
      if (el) observer?.observe(el)
    })
    props.items.forEach((_, i) => {
      setTimeout(() => {
        visibleItems.value[i] = true
      }, 150 + i * 100)
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
