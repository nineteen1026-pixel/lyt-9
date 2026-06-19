<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRehearsalStore } from '@/stores/rehearsal'
import { useScheduleStore } from '@/stores/schedule'
import { useRoleStore } from '@/stores/role'
import RoleSwitcher from '@/components/RoleSwitcher.vue'
import { Calendar, Clock, MapPin, Phone, Users, ChevronDown, ChevronUp, AlertCircle, Edit2, Check, X, Plus, Trash2, Link2 } from 'lucide-vue-next'
import type { StaffMember, RehearsalStep } from '@/data/mockData'
import { storeToRefs } from 'pinia'

const roleStore = useRoleStore()
const rehearsalStore = useRehearsalStore()
const scheduleStore = useScheduleStore()
const { staff } = storeToRefs(rehearsalStore)
const { items: scheduleItems } = storeToRefs(scheduleStore)
const expandedNotice = ref<string | null>('1')

const editingStaffId = ref<string | null>(null)
const editStaffForm = ref<Partial<StaffMember>>({ name: '', role: '', phone: '' })

const showAddStaff = ref(false)
const addStaffForm = ref({ name: '', role: '', phone: '' })

const editingStepId = ref<string | null>(null)
const editStepPersonId = ref<string>('')

const editingStepLinkId = ref<string | null>(null)
const editStepLinkedId = ref<string>('')

const staffOptions = computed(() => {
  return staff.value.map(m => ({ id: m.id, name: m.name, role: m.role }))
})

const scheduleOptions = computed(() => {
  return scheduleItems.value.map(item => ({ id: item.id, title: item.title, time: item.time }))
})

const getLinkedScheduleTitle = (linkedId?: string): string => {
  if (!linkedId) return ''
  const item = scheduleItems.value.find(i => i.id === linkedId)
  return item ? `${item.time} ${item.title}` : ''
}

const toggleNotice = (id: string) => {
  expandedNotice.value = expandedNotice.value === id ? null : id
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

const getStepNumberColor = (index: number) => {
  const colors = [
    'bg-primary-500',
    'bg-primary-400',
    'bg-champagne-300',
    'bg-morandi-purple',
    'bg-morandi-green',
    'bg-morandi-blue',
  ]
  return colors[index % colors.length]
}

const startEditStaff = (member: StaffMember) => {
  editingStaffId.value = member.id
  editStaffForm.value = { ...member }
}

const cancelEditStaff = () => {
  editingStaffId.value = null
  editStaffForm.value = { name: '', role: '', phone: '' }
}

const saveEditStaff = () => {
  if (editingStaffId.value && editStaffForm.value.name?.trim()) {
    rehearsalStore.updateStaff(editingStaffId.value, editStaffForm.value)
  }
  cancelEditStaff()
}

const openAddStaff = () => {
  showAddStaff.value = true
  addStaffForm.value = { name: '', role: '', phone: '' }
}

const cancelAddStaff = () => {
  showAddStaff.value = false
  addStaffForm.value = { name: '', role: '', phone: '' }
}

const saveAddStaff = () => {
  if (addStaffForm.value.name.trim()) {
    rehearsalStore.addStaff({
      name: addStaffForm.value.name.trim(),
      role: addStaffForm.value.role || '工作人员',
      phone: addStaffForm.value.phone
    })
  }
  cancelAddStaff()
}

const removeStaff = (id: string) => {
  if (confirm('确定要删除该人员吗？相关流程中的负责人将被清空。')) {
    rehearsalStore.deleteStaff(id)
  }
}

const startEditStep = (step: RehearsalStep) => {
  editingStepId.value = step.id
  editStepPersonId.value = step.personInChargeId || ''
}

const cancelEditStep = () => {
  editingStepId.value = null
  editStepPersonId.value = ''
}

const saveEditStep = () => {
  if (editingStepId.value) {
    const selected = staff.value.find(m => m.id === editStepPersonId.value)
    rehearsalStore.updateStepPerson(
      editingStepId.value,
      selected?.id,
      selected?.name || ''
    )
  }
  cancelEditStep()
}

const startEditStepLink = (step: RehearsalStep) => {
  editingStepLinkId.value = step.id
  editStepLinkedId.value = step.linkedScheduleItemId || ''
}

const cancelEditStepLink = () => {
  editingStepLinkId.value = null
  editStepLinkedId.value = ''
}

const saveEditStepLink = () => {
  if (editingStepLinkId.value) {
    rehearsalStore.updateStepLinkedScheduleItem(
      editingStepLinkId.value,
      editStepLinkedId.value || undefined
    )
  }
  cancelEditStepLink()
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-ivory to-champagne-100 pb-20">
    <div class="animate-fade-in">
      <div class="bg-gradient-to-r from-primary-400 to-primary-500 px-6 pt-12 pb-16 rounded-b-3xl shadow-lg">
        <div class="flex items-center justify-between mb-2">
          <div class="w-24"></div>
          <div class="text-center">
            <h1 class="text-3xl font-serif font-bold text-white">婚礼彩排</h1>
            <p class="text-primary-100 mt-2">预演完美，确保顺利</p>
          </div>
          <RoleSwitcher />
        </div>
      </div>

      <div class="px-4 -mt-10">
        <div class="animate-slide-up bg-white rounded-2xl p-5 shadow-md mb-6" style="animation-delay: 0.1s">
          <h2 class="text-lg font-bold text-gray-800 mb-4">彩排信息</h2>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Calendar class="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p class="text-xs text-gray-400">彩排日期</p>
                <p class="font-medium text-gray-800">{{ formatDate(rehearsalStore.rehearsalInfo.date) }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-champagne-100 flex items-center justify-center flex-shrink-0">
                <Clock class="w-5 h-5 text-champagne-300" />
              </div>
              <div>
                <p class="text-xs text-gray-400">彩排时间</p>
                <p class="font-medium text-gray-800">{{ rehearsalStore.rehearsalInfo.time }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-morandi-purple/20 flex items-center justify-center flex-shrink-0">
                <MapPin class="w-5 h-5 text-morandi-purple" />
              </div>
              <div>
                <p class="text-xs text-gray-400">彩排地点</p>
                <p class="font-medium text-gray-800">{{ rehearsalStore.rehearsalInfo.location }}</p>
                <p class="text-sm text-gray-500">{{ rehearsalStore.rehearsalInfo.address }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-morandi-green/20 flex items-center justify-center flex-shrink-0">
                <Phone class="w-5 h-5 text-morandi-green" />
              </div>
              <div>
                <p class="text-xs text-gray-400">联系人</p>
                <p class="font-medium text-gray-800">{{ rehearsalStore.rehearsalInfo.contact }} · {{ rehearsalStore.rehearsalInfo.contactPhone }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="animate-slide-up mb-6" style="animation-delay: 0.2s">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-800">流程步骤</h2>
            <span class="text-xs text-primary-400">点击负责人可编辑</span>
          </div>
          <div class="space-y-3">
            <div 
              v-for="(step, index) in rehearsalStore.steps" 
              :key="step.id"
              class="animate-slide-up bg-white rounded-xl p-4 shadow-sm flex gap-4"
              :style="{ animationDelay: `${0.3 + index * 0.1}s` }"
            >
              <div 
                class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                :class="getStepNumberColor(index)"
              >
                {{ step.stepNumber }}
              </div>
              <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                  <h3 class="font-medium text-gray-800">{{ step.title }}</h3>
                </div>
                <p class="text-sm text-gray-500 mb-2">{{ step.description }}</p>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400">
                  <template v-if="editingStepId === step.id">
                    <div class="flex items-center gap-2">
                      <span class="text-gray-500">负责人:</span>
                      <select
                        v-model="editStepPersonId"
                        class="px-2 py-1 border border-primary-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-300 bg-white"
                      >
                        <option value="">请选择</option>
                        <option v-for="opt in staffOptions" :key="opt.id" :value="opt.id">
                          {{ opt.name }}（{{ opt.role }}）
                        </option>
                      </select>
                      <button @click="saveEditStep" class="p-1 text-morandi-green hover:bg-morandi-green/10 rounded">
                        <Check class="w-4 h-4" />
                      </button>
                      <button @click="cancelEditStep" class="p-1 text-red-400 hover:bg-red-50 rounded">
                        <X class="w-4 h-4" />
                      </button>
                    </div>
                  </template>
                  <template v-else>
                    <button 
                      @click="startEditStep(step)"
                      class="flex items-center gap-1 hover:text-primary-500 transition-colors"
                    >
                      <span>负责人: {{ step.personInCharge || '未分配' }}</span>
                      <Edit2 class="w-3 h-3" />
                    </button>
                  </template>
                  <template v-if="editingStepLinkId === step.id">
                    <div class="flex items-center gap-2">
                      <Link2 class="w-3.5 h-3.5 text-morandi-purple" />
                      <select
                        v-model="editStepLinkedId"
                        class="px-2 py-1 border border-morandi-purple/30 rounded-lg text-sm outline-none focus:ring-2 focus:ring-morandi-purple/30 bg-white"
                      >
                        <option value="">不关联</option>
                        <option v-for="opt in scheduleOptions" :key="opt.id" :value="opt.id">
                          {{ opt.time }} {{ opt.title }}
                        </option>
                      </select>
                      <button @click="saveEditStepLink" class="p-1 text-morandi-green hover:bg-morandi-green/10 rounded">
                        <Check class="w-4 h-4" />
                      </button>
                      <button @click="cancelEditStepLink" class="p-1 text-red-400 hover:bg-red-50 rounded">
                        <X class="w-4 h-4" />
                      </button>
                    </div>
                  </template>
                  <template v-else>
                    <button 
                      @click="startEditStepLink(step)"
                      class="flex items-center gap-1 hover:text-morandi-purple transition-colors"
                      :class="step.linkedScheduleItemId ? 'text-morandi-purple' : 'text-gray-300'"
                    >
                      <Link2 class="w-3.5 h-3.5" />
                      <span v-if="step.linkedScheduleItemId">关联: {{ getLinkedScheduleTitle(step.linkedScheduleItemId) }}</span>
                      <span v-else>未关联流程</span>
                    </button>
                  </template>
                  <span v-if="step.notes" class="text-gray-500">备注: {{ step.notes }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="animate-slide-up bg-white rounded-2xl p-5 shadow-md mb-6" style="animation-delay: 0.5s">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Users class="w-5 h-5 text-primary-400" />
              人员分工
            </h2>
            <button
              @click="openAddStaff"
              class="flex items-center gap-1 px-3 py-1.5 bg-primary-100 text-primary-500 rounded-lg text-sm font-medium hover:bg-primary-200 transition-colors"
            >
              <Plus class="w-4 h-4" />
              添加
            </button>
          </div>

          <div v-if="showAddStaff" class="mb-4 p-4 bg-primary-50/50 rounded-xl border border-primary-100">
            <div class="space-y-3">
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">姓名 *</label>
                  <input
                    v-model="addStaffForm.name"
                    type="text"
                    placeholder="输入姓名"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">角色</label>
                  <input
                    v-model="addStaffForm.role"
                    type="text"
                    placeholder="如：司仪、摄影"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">电话</label>
                  <input
                    v-model="addStaffForm.phone"
                    type="text"
                    placeholder="联系电话"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
              </div>
              <div class="flex justify-end gap-2">
                <button
                  @click="cancelAddStaff"
                  class="px-4 py-2 text-gray-500 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                >
                  取消
                </button>
                <button
                  @click="saveAddStaff"
                  class="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
                >
                  确认添加
                </button>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <div 
              v-for="(person, index) in rehearsalStore.staff" 
              :key="person.id"
              class="rounded-xl"
              :class="[
                editingStaffId === person.id ? 'bg-primary-50 border border-primary-200 p-3' : 'flex items-center justify-between p-3 bg-primary-50/50',
              ]"
              :style="{ animationDelay: `${0.6 + index * 0.1}s` }"
            >
              <template v-if="editingStaffId === person.id">
                <div class="space-y-3 w-full">
                  <div class="grid grid-cols-3 gap-3">
                    <div>
                      <label class="text-xs text-gray-500 mb-1 block">姓名 *</label>
                      <input
                        v-model="editStaffForm.name"
                        type="text"
                        placeholder="输入姓名"
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-300 bg-white"
                      />
                    </div>
                    <div>
                      <label class="text-xs text-gray-500 mb-1 block">角色</label>
                      <input
                        v-model="editStaffForm.role"
                        type="text"
                        placeholder="如：司仪、摄影"
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-300 bg-white"
                      />
                    </div>
                    <div>
                      <label class="text-xs text-gray-500 mb-1 block">电话</label>
                      <input
                        v-model="editStaffForm.phone"
                        type="text"
                        placeholder="联系电话"
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-300 bg-white"
                      />
                    </div>
                  </div>
                  <div class="flex justify-end gap-2">
                    <button
                      @click="cancelEditStaff"
                      class="flex items-center gap-1 px-3 py-1.5 text-gray-500 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                    >
                      <X class="w-4 h-4" />
                      取消
                    </button>
                    <button
                      @click="saveEditStaff"
                      class="flex items-center gap-1 px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
                    >
                      <Check class="w-4 h-4" />
                      保存
                    </button>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="flex items-center gap-3">
                  <div 
                    class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    :class="[
                      person.role.includes('司仪') ? 'bg-primary-400' :
                      person.role.includes('摄影') ? 'bg-champagne-300' :
                      person.role.includes('摄像') ? 'bg-morandi-purple' :
                      person.role.includes('化妆') ? 'bg-morandi-green' :
                      person.role.includes('督导') ? 'bg-morandi-blue' :
                      'bg-primary-400'
                    ]"
                  >
                    {{ person.name.charAt(0) }}
                  </div>
                  <div>
                    <p class="font-medium text-gray-800 text-sm">{{ person.name }}</p>
                    <p class="text-xs text-gray-500">{{ person.role }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-sm text-gray-400">{{ person.phone }}</span>
                  <div class="flex items-center gap-1">
                    <button
                      @click="startEditStaff(person)"
                      class="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>
                    <button
                      @click="removeStaff(person.id)"
                      class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <div class="animate-slide-up mb-6" style="animation-delay: 0.7s">
          <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle class="w-5 h-5 text-primary-400" />
            注意事项
          </h2>
          <div class="space-y-2">
            <div 
              v-for="(notice, index) in rehearsalStore.notices" 
              :key="notice.id"
              class="animate-slide-up bg-white rounded-xl overflow-hidden shadow-sm"
              :style="{ animationDelay: `${0.8 + index * 0.1}s` }"
            >
              <button 
                @click="toggleNotice(notice.id)"
                class="w-full flex items-center justify-between p-4 text-left"
              >
                <span class="font-medium text-gray-800">{{ notice.title }}</span>
                <component 
                  :is="expandedNotice === notice.id ? ChevronUp : ChevronDown" 
                  class="w-5 h-5 text-gray-400 transition-transform duration-300" 
                />
              </button>
              <div 
                class="overflow-hidden transition-all duration-300"
                :class="expandedNotice === notice.id ? 'max-h-40' : 'max-h-0'"
              >
                <div class="px-4 pb-4">
                  <p class="text-sm text-gray-500 leading-relaxed">{{ notice.content }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
