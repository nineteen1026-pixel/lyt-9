<template>
  <div class="relative pl-8 py-2">
    <div
      class="absolute left-[17px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary-200 via-primary-300 to-primary-200 pointer-events-none"
    ></div>

    <draggable
      v-model="localItems"
      item-key="_dragKey"
      :animation="250"
      :disabled="!draggable"
      handle=".drag-handle"
      ghost-class="opacity-50 scale-95"
      chosen-class="shadow-2xl ring-2 ring-primary-300"
      drag-class="cursor-grabbing"
      group="timeline-events"
      @end="onDragEnd"
    >
      <template #item="{ element, index }">
        <div
          class="relative"
          :class="[
            isEvent(element) ? 'mb-10' : 'mb-8',
            'last:mb-0',
            element.type === 'separator' ? 'pointer-events-none' : '',
            { 'opacity-0 translate-y-4': !visibleItems[index] },
            highlightId && isEvent(element) && element.id === highlightId ? 'ring-2 ring-primary-400 rounded-xl' : ''
          ]"
          :style="{
            transition: `all 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.08}s`,
            opacity: visibleItems[index] ? 1 : 0,
            transform: visibleItems[index] ? 'translateY(0)' : 'translateY(18px)'
          }"
        >
          <template v-if="isSeparator(element)">
            <div class="relative flex items-center -ml-2 mb-2">
              <div class="absolute -left-[7px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-primary-300 shadow-sm z-20"></div>
              <div class="flex items-center gap-2 ml-6">
                <div class="h-px w-6 bg-gradient-to-r from-primary-200 to-primary-300"></div>
                <span class="px-4 py-1.5 bg-gradient-to-r from-primary-100 to-champagne-50 text-primary-500 rounded-full text-sm font-semibold shadow-sm border border-primary-100">{{ element.label }}</span>
                <div class="h-px flex-1 bg-gradient-to-r from-primary-300 via-primary-200 to-transparent"></div>
              </div>
            </div>
          </template>

          <template v-else>
            <div
              :data-timeline-id="element.id"
              class="absolute -left-[22px] top-6 w-5 h-5 rounded-full border-4 border-white shadow-md z-20"
              :class="[
                index === 0 || isFirstEvent(index) ? 'bg-primary-500' : 'bg-primary-400',
                'ring-2 ring-primary-200'
              ]"
            ></div>

            <div class="bg-white rounded-xl shadow-lg border border-gray-100 p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group">
              <div class="flex items-start justify-between mb-3">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-600 ring-1 ring-primary-100">
                  <svg class="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ element.time }}
                </span>
                <div class="flex items-center gap-2">
                  <template v-if="draggable">
                    <button class="drag-handle p-1.5 text-gray-300 hover:text-primary-500 hover:bg-primary-50 rounded-lg cursor-grab active:cursor-grabbing transition-all opacity-0 group-hover:opacity-100" title="拖拽排序">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                      </svg>
                    </button>
                  </template>
                  <template v-if="editable && editingId === element.id">
                    <div class="flex items-center gap-2">
                      <select
                        v-model="editingPersonId"
                        class="px-2 py-1 text-xs border border-primary-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-300 bg-white"
                        @change="handlePersonChange"
                      >
                        <option value="">请选择负责人</option>
                        <option v-for="opt in staffOptions" :key="opt.id" :value="opt.id">
                          {{ opt.name }}（{{ opt.role }}）
                        </option>
                      </select>
                      <button @click="cancelEdit" class="p-1 text-gray-400 hover:text-red-500 rounded">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </template>
                  <template v-else-if="editable && element.personInCharge">
                    <button
                      @click="startEdit(element)"
                      class="text-xs text-gray-400 flex items-center gap-1 hover:text-primary-500 transition-colors"
                    >
                      <svg class="w-3.5 h-3.5 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {{ element.personInCharge }}
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </template>
                  <template v-else-if="editable">
                    <button
                      @click="startEdit(element)"
                      class="text-xs text-gray-300 flex items-center gap-1 hover:text-primary-400 transition-colors"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                      添加负责人
                    </button>
                  </template>
                  <template v-else-if="element.personInCharge">
                    <span class="text-xs text-gray-400 flex items-center gap-1">
                      <svg class="w-3.5 h-3.5 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {{ element.personInCharge }}
                    </span>
                  </template>
                </div>
              </div>
              <h3 class="text-lg font-bold text-gray-800 mb-2">{{ element.title }}</h3>
              <p class="text-sm text-gray-600 mb-3 leading-relaxed">{{ element.description }}</p>
              <div v-if="element.location" class="flex items-center text-xs text-gray-500">
                <svg class="w-4 h-4 mr-1 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {{ element.location }}
              </div>
            </div>
          </template>
        </div>
      </template>
    </draggable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import draggable from 'vuedraggable'
import { useRoute, useRouter } from 'vue-router'

type SeparatorItem = { type: 'separator'; label: string }
type EventItem = {
  type: 'event'
  id?: string
  time: string
  title: string
  description: string
  location?: string
  personInCharge?: string
  personInChargeId?: string
}
type TimelineItem = SeparatorItem | EventItem
type TimelineItemWithKey = TimelineItem & { _dragKey: string }

type StaffOption = { id: string; name: string; role: string }

const props = withDefaults(defineProps<{
  items: TimelineItem[]
  editable?: boolean
  draggable?: boolean
  staffOptions?: StaffOption[]
  highlightId?: string
}>(), {
  editable: false,
  draggable: false,
  staffOptions: () => [],
  highlightId: ''
})

const emit = defineEmits<{
  'update:personInCharge': [id: string, personId: string | undefined, personName: string]
  'update:order': [orderedIds: string[]]
}>()

function isSeparator(item: TimelineItem): item is SeparatorItem {
  return item.type === 'separator'
}
function isEvent(item: TimelineItem): item is EventItem {
  return item.type === 'event'
}
function isFirstEvent(index: number): boolean {
  for (let i = 0; i < index; i++) {
    if (isEvent(localItems.value[i])) return false
  }
  return true
}

const localItems = ref<TimelineItemWithKey[]>([])

const buildLocalItems = (items: TimelineItem[]): TimelineItemWithKey[] => {
  return items.map((item, idx) => ({
    ...item,
    _dragKey: isEvent(item) ? `event-${item.id ?? idx}` : `sep-${idx}-${(item as SeparatorItem).label}`
  }))
}

watch(() => props.items, (newItems) => {
  localItems.value = buildLocalItems(newItems)
  visibleItems.value = newItems.map(() => false)
  nextTick(() => {
    newItems.forEach((_, i) => {
      setTimeout(() => {
        visibleItems.value[i] = true
      }, 50 + i * 60)
    })
  })
}, { immediate: true, deep: true })

const visibleItems = ref<boolean[]>([])
const editingId = ref<string | undefined>(undefined)
const editingPersonId = ref<string>('')

const startEdit = (item: EventItem) => {
  if (!item.id) return
  editingId.value = item.id
  editingPersonId.value = item.personInChargeId || ''
}

const cancelEdit = () => {
  editingId.value = undefined
  editingPersonId.value = ''
}

const handlePersonChange = () => {
  if (!editingId.value) return
  const selected = props.staffOptions.find(opt => opt.id === editingPersonId.value)
  emit('update:personInCharge', editingId.value, selected?.id, selected?.name || '')
  cancelEdit()
}

const onDragEnd = () => {
  const orderedIds: string[] = []
  localItems.value.forEach(item => {
    if (isEvent(item) && item.id) {
      orderedIds.push(item.id)
    }
  })
  emit('update:order', orderedIds)
}

const route = useRoute()
const router = useRouter()

const scrollToHighlight = (id: string) => {
  if (!id) return
  nextTick(() => {
    setTimeout(() => {
      const el = document.querySelector(`[data-timeline-id="${id}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const eventItem = localItems.value.find(item => isEvent(item) && item.id === id)
        if (eventItem && props.editable) {
          startEdit(eventItem as EventItem)
        }
      }
    }, 600)
  })
}

watch(() => props.highlightId, (newId) => {
  if (newId) {
    scrollToHighlight(newId)
  }
}, { immediate: true })

onMounted(() => {
  if (props.highlightId) {
    scrollToHighlight(props.highlightId)
  }
})

onUnmounted(() => {
})
</script>
