<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEmergencyContactsStore, type AggregatedContact, type EmergencyContactCategory } from '@/stores/emergencyContacts'
import RoleSwitcher from '@/components/RoleSwitcher.vue'
import {
  Phone,
  Users,
  Truck,
  UserCheck,
  Plus,
  X,
  Check,
  Edit2,
  Trash2,
  Search,
  PhoneCall,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-vue-next'

const store = useEmergencyContactsStore()

const activeCategory = ref<EmergencyContactCategory | 'all'>('all')
const searchQuery = ref('')
const expandedCategories = ref<Set<string>>(new Set(['staff', 'vendor', 'guest', 'custom']))

const showAddForm = ref(false)
const addForm = ref({ name: '', phone: '', role: '', remark: '' })

const editingId = ref<string | null>(null)
const editForm = ref({ name: '', phone: '', role: '', remark: '' })

const categoryConfig: Record<EmergencyContactCategory, { label: string; icon: any; color: string; bgColor: string }> = {
  staff: { label: '负责人', icon: UserCheck, color: 'text-primary-500', bgColor: 'bg-primary-100' },
  vendor: { label: '供应商', icon: Truck, color: 'text-morandi-purple', bgColor: 'bg-morandi-purple/20' },
  guest: { label: '宾客', icon: Users, color: 'text-morandi-green', bgColor: 'bg-morandi-green/20' },
  custom: { label: '自定义', icon: Star, color: 'text-champagne-300', bgColor: 'bg-champagne-100' }
}

const filteredContacts = computed(() => {
  let contacts = store.allContacts

  if (activeCategory.value !== 'all') {
    contacts = contacts.filter(c => c.category === activeCategory.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    contacts = contacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.role.toLowerCase().includes(q) ||
      c.remark.toLowerCase().includes(q)
    )
  }

  return contacts
})

const groupedContacts = computed(() => {
  const groups = new Map<EmergencyContactCategory, AggregatedContact[]>()
  for (const contact of filteredContacts.value) {
    if (!groups.has(contact.category)) {
      groups.set(contact.category, [])
    }
    groups.get(contact.category)!.push(contact)
  }
  return groups
})

const categoryCounts = computed(() => {
  const counts: Record<string, number> = { all: store.totalCount }
  for (const [cat, contacts] of store.contactsByCategory) {
    counts[cat] = contacts.length
  }
  return counts
})

const toggleCategory = (cat: string) => {
  if (expandedCategories.value.has(cat)) {
    expandedCategories.value.delete(cat)
  } else {
    expandedCategories.value.add(cat)
  }
}

const getCategoryColorClass = (category: EmergencyContactCategory) => {
  const config = categoryConfig[category]
  return config?.color || 'text-gray-500'
}

const getCategoryBgClass = (category: EmergencyContactCategory) => {
  const config = categoryConfig[category]
  return config?.bgColor || 'bg-gray-100'
}

const getAvatarColorClass = (category: EmergencyContactCategory) => {
  const map: Record<EmergencyContactCategory, string> = {
    staff: 'bg-primary-400',
    vendor: 'bg-morandi-purple',
    guest: 'bg-morandi-green',
    custom: 'bg-champagne-300'
  }
  return map[category] || 'bg-gray-400'
}

const callContact = (phone: string) => {
  window.open(`tel:${phone}`, '_self')
}

const openAddForm = () => {
  showAddForm.value = true
  addForm.value = { name: '', phone: '', role: '', remark: '' }
}

const cancelAdd = () => {
  showAddForm.value = false
  addForm.value = { name: '', phone: '', role: '', remark: '' }
}

const saveAdd = () => {
  if (addForm.value.name.trim() && addForm.value.phone.trim()) {
    store.addContact({
      name: addForm.value.name.trim(),
      phone: addForm.value.phone.trim(),
      category: 'custom',
      role: addForm.value.role.trim() || '其他',
      remark: addForm.value.remark.trim()
    })
  }
  cancelAdd()
}

const startEdit = (contact: AggregatedContact) => {
  if (contact.category !== 'custom') return
  const original = store.getContactById(contact.id)
  if (!original) return
  editingId.value = contact.id
  editForm.value = {
    name: original.name,
    phone: original.phone,
    role: original.role,
    remark: original.remark
  }
}

const cancelEdit = () => {
  editingId.value = null
  editForm.value = { name: '', phone: '', role: '', remark: '' }
}

const saveEdit = () => {
  if (editingId.value && editForm.value.name.trim() && editForm.value.phone.trim()) {
    store.updateContact(editingId.value, {
      name: editForm.value.name.trim(),
      phone: editForm.value.phone.trim(),
      role: editForm.value.role.trim() || '其他',
      remark: editForm.value.remark.trim()
    })
  }
  cancelEdit()
}

const removeContact = (id: string) => {
  if (confirm('确定要删除该联系人吗？')) {
    store.deleteContact(id)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-ivory to-champagne-100 pb-20">
    <div class="animate-fade-in">
      <div class="bg-gradient-to-r from-primary-400 to-primary-500 px-6 pt-12 pb-16 rounded-b-3xl shadow-lg">
        <div class="flex items-center justify-between mb-2">
          <div class="w-24"></div>
          <div class="text-center">
            <h1 class="text-3xl font-serif font-bold text-white">应急通讯录</h1>
            <p class="text-primary-100 mt-2">婚礼日 · 一键联系</p>
          </div>
          <RoleSwitcher />
        </div>
      </div>

      <div class="px-4 -mt-10">
        <div class="animate-slide-up bg-white rounded-2xl p-4 shadow-md mb-4" style="animation-delay: 0.1s">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索姓名、电话、角色..."
              class="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-300 transition-all"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="animate-slide-up mb-4" style="animation-delay: 0.15s">
          <div class="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            <button
              @click="activeCategory = 'all'"
              class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
              :class="activeCategory === 'all'
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-white text-gray-500 hover:bg-primary-50'"
            >
              全部 ({{ categoryCounts.all }})
            </button>
            <button
              v-for="(config, cat) in categoryConfig"
              :key="cat"
              @click="activeCategory = cat"
              class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5"
              :class="activeCategory === cat
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-white text-gray-500 hover:bg-primary-50'"
            >
              <component :is="config.icon" class="w-3.5 h-3.5" />
              {{ config.label }} ({{ categoryCounts[cat] || 0 }})
            </button>
          </div>
        </div>

        <div class="animate-slide-up bg-white rounded-2xl p-4 shadow-md mb-4" style="animation-delay: 0.2s">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
              <PhoneCall class="w-5 h-5 text-primary-400" />
              联系人
            </h2>
            <button
              @click="openAddForm"
              class="flex items-center gap-1 px-3 py-1.5 bg-primary-100 text-primary-500 rounded-lg text-sm font-medium hover:bg-primary-200 transition-colors"
            >
              <Plus class="w-4 h-4" />
              添加
            </button>
          </div>

          <div v-if="showAddForm" class="mb-4 p-4 bg-primary-50/50 rounded-xl border border-primary-100">
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">姓名 *</label>
                  <input
                    v-model="addForm.name"
                    type="text"
                    placeholder="输入姓名"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">电话 *</label>
                  <input
                    v-model="addForm.phone"
                    type="tel"
                    placeholder="联系电话"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">角色</label>
                  <input
                    v-model="addForm.role"
                    type="text"
                    placeholder="如：婚车、花艺"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">备注</label>
                  <input
                    v-model="addForm.remark"
                    type="text"
                    placeholder="备注信息"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
              </div>
              <div class="flex justify-end gap-2">
                <button
                  @click="cancelAdd"
                  class="px-4 py-2 text-gray-500 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                >
                  取消
                </button>
                <button
                  @click="saveAdd"
                  class="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
                >
                  确认添加
                </button>
              </div>
            </div>
          </div>

          <div v-if="filteredContacts.length === 0" class="text-center py-10">
            <Phone class="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p class="text-gray-400 text-sm">暂无联系人</p>
            <p class="text-gray-300 text-xs mt-1">点击上方"添加"按钮添加自定义联系人</p>
          </div>

          <div v-else class="space-y-2">
            <template v-for="[cat, contacts] in groupedContacts" :key="cat">
              <button
                @click="toggleCategory(cat)"
                class="w-full flex items-center justify-between py-2 px-1 text-left"
              >
                <div class="flex items-center gap-2">
                  <component
                    :is="categoryConfig[cat as EmergencyContactCategory]?.icon"
                    class="w-4 h-4"
                    :class="getCategoryColorClass(cat as EmergencyContactCategory)"
                  />
                  <span class="font-medium text-gray-700 text-sm">
                    {{ categoryConfig[cat as EmergencyContactCategory]?.label }}
                  </span>
                  <span class="text-xs text-gray-400">({{ contacts.length }})</span>
                </div>
                <component
                  :is="expandedCategories.has(cat) ? ChevronUp : ChevronDown"
                  class="w-4 h-4 text-gray-400"
                />
              </button>

              <div v-if="expandedCategories.has(cat)" class="space-y-2 mb-2">
                <div
                  v-for="contact in contacts"
                  :key="contact.id"
                  class="flex items-center gap-3 p-3 rounded-xl transition-colors"
                  :class="editingId === contact.id ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50/70 hover:bg-primary-50/50'"
                >
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                    :class="getAvatarColorClass(contact.category)"
                  >
                    {{ contact.name.charAt(0) }}
                  </div>

                  <template v-if="editingId === contact.id">
                    <div class="flex-1 space-y-2">
                      <div class="grid grid-cols-2 gap-2">
                        <input
                          v-model="editForm.name"
                          type="text"
                          placeholder="姓名"
                          class="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-300 bg-white"
                        />
                        <input
                          v-model="editForm.phone"
                          type="tel"
                          placeholder="电话"
                          class="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-300 bg-white"
                        />
                      </div>
                      <div class="grid grid-cols-2 gap-2">
                        <input
                          v-model="editForm.role"
                          type="text"
                          placeholder="角色"
                          class="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-300 bg-white"
                        />
                        <input
                          v-model="editForm.remark"
                          type="text"
                          placeholder="备注"
                          class="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-300 bg-white"
                        />
                      </div>
                      <div class="flex justify-end gap-2">
                        <button
                          @click="cancelEdit"
                          class="p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
                          <X class="w-4 h-4" />
                        </button>
                        <button
                          @click="saveEdit"
                          class="p-1 text-morandi-green hover:bg-morandi-green/10 rounded"
                        >
                          <Check class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </template>

                  <template v-else>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <p class="font-medium text-gray-800 text-sm truncate">{{ contact.name }}</p>
                        <span
                          class="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                          :class="[getCategoryBgClass(contact.category), getCategoryColorClass(contact.category)]"
                        >
                          {{ contact.role }}
                        </span>
                      </div>
                      <p class="text-xs text-gray-400 mt-0.5 truncate">{{ contact.phone }}{{ contact.remark ? ' · ' + contact.remark : '' }}</p>
                    </div>

                    <div class="flex items-center gap-1 flex-shrink-0">
                      <a
                        :href="`tel:${contact.phone}`"
                        class="flex items-center gap-1 px-3 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                        @click.prevent="callContact(contact.phone)"
                      >
                        <Phone class="w-4 h-4" />
                        拨号
                      </a>
                      <template v-if="contact.category === 'custom'">
                        <button
                          @click="startEdit(contact)"
                          class="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Edit2 class="w-4 h-4" />
                        </button>
                        <button
                          @click="removeContact(contact.id)"
                          class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </template>
                    </div>
                  </template>
                </div>
              </div>
            </template>
          </div>
        </div>

        <div class="animate-slide-up bg-white rounded-2xl p-5 shadow-md mb-6" style="animation-delay: 0.3s">
          <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Star class="w-5 h-5 text-champagne-300" />
            应急提示
          </h2>
          <div class="space-y-3">
            <div class="flex items-start gap-3 p-3 bg-primary-50/50 rounded-xl">
              <div class="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Phone class="w-4 h-4 text-primary-500" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-700">一键拨号</p>
                <p class="text-xs text-gray-500 mt-0.5">点击联系人右侧"拨号"按钮可直接拨打对方电话，节省婚礼当天查找联系方式的时间</p>
              </div>
            </div>
            <div class="flex items-start gap-3 p-3 bg-morandi-purple/10 rounded-xl">
              <div class="w-8 h-8 rounded-lg bg-morandi-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Truck class="w-4 h-4 text-morandi-purple" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-700">自动聚合</p>
                <p class="text-xs text-gray-500 mt-0.5">负责人、供应商、已确认宾客的联系方式自动从各模块聚合，无需重复录入</p>
              </div>
            </div>
            <div class="flex items-start gap-3 p-3 bg-morandi-green/10 rounded-xl">
              <div class="w-8 h-8 rounded-lg bg-morandi-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Plus class="w-4 h-4 text-morandi-green" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-700">自定义联系人</p>
                <p class="text-xs text-gray-500 mt-0.5">可手动添加婚车、花艺、甜品等其他供应商或紧急联系人</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
