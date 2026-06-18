<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { X, Plus, Minus, Star, Image as ImageIcon } from 'lucide-vue-next'

interface FormData {
  id?: string
  [key: string]: any
}

const props = defineProps<{
  visible: boolean
  title: string
  category: 'venue' | 'photography' | 'dress'
  editData?: any | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', data: FormData): void
}>()

const defaultVenue = {
  name: '',
  address: '',
  capacity: 100,
  price: 0,
  status: 'alternative' as const,
  image: '',
  features: [] as string[],
  contracted: false,
  contractPrice: 0,
  pros: [] as string[],
  cons: [] as string[],
  rating: 4.0,
  notes: ''
}

const defaultPhotography = {
  teamName: '',
  style: '',
  packageType: '',
  price: 0,
  shootDate: '',
  contracted: false,
  contractPrice: 0,
  pros: [] as string[],
  cons: [] as string[],
  rating: 4.0,
  notes: ''
}

const defaultDress = {
  type: '主纱' as const,
  category: '主纱' as const,
  style: '',
  size: 'M',
  price: 0,
  fittingDate: '',
  image: '',
  name: '',
  brand: '',
  color: '白色',
  contracted: false,
  contractPrice: 0,
  pros: [] as string[],
  cons: [] as string[],
  rating: 4.0,
  notes: ''
}

const formData = ref<any>({})
const newTag = ref('')
const newPro = ref('')
const newCon = ref('')
const newFeature = ref('')

watch(() => props.visible, (val) => {
  if (val) {
    if (props.editData) {
      formData.value = { ...props.editData }
    } else {
      switch (props.category) {
        case 'venue':
          formData.value = { ...defaultVenue }
          break
        case 'photography':
          formData.value = { ...defaultPhotography }
          break
        case 'dress':
          formData.value = { ...defaultDress }
          break
      }
    }
  }
})

const formatPrice = (price: number) => `¥${price.toLocaleString()}`

const addItem = (list: string[], value: string, inputRef: { value: string }) => {
  if (value.trim()) {
    list.push(value.trim())
    inputRef.value = ''
  }
}

const removeItem = (list: string[], index: number) => {
  list.splice(index, 1)
}

const setRating = (value: number) => {
  formData.value.rating = value
}

const canSubmit = computed(() => {
  switch (props.category) {
    case 'venue':
      return formData.value.name && formData.value.address && formData.value.price > 0
    case 'photography':
      return formData.value.teamName && formData.value.price > 0
    case 'dress':
      return formData.value.name && formData.value.price > 0
    default:
      return false
  }
})

const handleSubmit = () => {
  if (!canSubmit.value) return
  emit('submit', { ...formData.value })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="emit('close')"></div>
      <div class="relative bg-white rounded-3xl p-6 w-full max-w-2xl animate-fade-in shadow-2xl my-8">
        <button
          @click="emit('close')"
          class="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors z-10"
        >
          <X class="w-5 h-5 text-gray-500" />
        </button>

        <h3 class="text-2xl font-bold text-gray-800 mb-6 pr-8">{{ title }}</h3>

        <div class="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
          <template v-if="category === 'venue'">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">场地名称 *</label>
                <input
                  v-model="formData.name"
                  type="text"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors"
                  placeholder="请输入场地名称"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">地址 *</label>
                <input
                  v-model="formData.address"
                  type="text"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors"
                  placeholder="请输入详细地址"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">容纳人数</label>
                <input
                  v-model.number="formData.capacity"
                  type="number"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors"
                  placeholder="容纳人数"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">价格 (¥) *</label>
                <input
                  v-model.number="formData.price"
                  type="number"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors"
                  placeholder="场地报价"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <ImageIcon class="w-4 h-4" />
                  图片链接
                </label>
                <input
                  v-model="formData.image"
                  type="text"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors"
                  placeholder="请输入图片URL"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">特色标签</label>
                <div class="flex flex-wrap gap-2 mb-2">
                  <span
                    v-for="(tag, i) in formData.features"
                    :key="i"
                    class="px-2.5 py-1 bg-primary-50 text-primary-400 rounded-full text-xs flex items-center gap-1"
                  >
                    {{ tag }}
                    <button @click="removeItem(formData.features, i)" class="w-3 h-3 rounded-full bg-primary-200 text-primary-500 flex items-center justify-center">×</button>
                  </span>
                </div>
                <div class="flex gap-2">
                  <input
                    v-model="newFeature"
                    type="text"
                    class="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors text-sm"
                    placeholder="输入特色，如：草坪婚礼"
                    @keyup.enter="addItem(formData.features, newFeature, { value: newFeature } as any)"
                  />
                  <button
                    @click="addItem(formData.features, newFeature, newFeature as any)"
                    class="px-4 py-2 bg-primary-100 text-primary-500 rounded-xl hover:bg-primary-200 transition-colors"
                  >
                    <Plus class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </template>

          <template v-if="category === 'photography'">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">团队/工作室名称 *</label>
                <input
                  v-model="formData.teamName"
                  type="text"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors"
                  placeholder="如：光影纪摄影"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">拍摄风格</label>
                <input
                  v-model="formData.style"
                  type="text"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors"
                  placeholder="如：清新自然"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">套餐类型</label>
                <input
                  v-model="formData.packageType"
                  type="text"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors"
                  placeholder="如：全天跟拍"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">价格 (¥) *</label>
                <input
                  v-model.number="formData.price"
                  type="number"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors"
                  placeholder="套餐报价"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">拍摄日期</label>
                <input
                  v-model="formData.shootDate"
                  type="date"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </template>

          <template v-if="category === 'dress'">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">礼服名称 *</label>
                <input
                  v-model="formData.name"
                  type="text"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors"
                  placeholder="如：维多利亚女王"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">品牌</label>
                <input
                  v-model="formData.brand"
                  type="text"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors"
                  placeholder="如：Pronovias"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">类别</label>
                <select
                  v-model="formData.type"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors bg-white"
                  @change="formData.category = formData.type"
                >
                  <option value="主纱">主纱</option>
                  <option value="出门纱">出门纱</option>
                  <option value="敬酒服">敬酒服</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">款式风格</label>
                <input
                  v-model="formData.style"
                  type="text"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors"
                  placeholder="如：宫廷风拖尾"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">尺码</label>
                <select
                  v-model="formData.size"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors bg-white"
                >
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">颜色</label>
                <input
                  v-model="formData.color"
                  type="text"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors"
                  placeholder="如：象牙白"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">价格 (¥) *</label>
                <input
                  v-model.number="formData.price"
                  type="number"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors"
                  placeholder="租赁/定制价"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">试纱日期</label>
                <input
                  v-model="formData.fittingDate"
                  type="date"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <ImageIcon class="w-4 h-4" />
                  图片链接
                </label>
                <input
                  v-model="formData.image"
                  type="text"
                  class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors"
                  placeholder="请输入图片URL"
                />
              </div>
            </div>
          </template>

          <div class="border-t border-gray-100 pt-5 mt-2">
            <label class="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
              <Star class="w-4 h-4 text-amber-400 fill-amber-400" />
              综合评分
            </label>
            <div class="flex items-center gap-2">
              <div class="flex gap-1">
                <button
                  v-for="i in 5"
                  :key="i"
                  @click="setRating(i)"
                  class="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    class="w-7 h-7 transition-colors"
                    :class="i <= Math.round(formData.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'"
                  />
                </button>
              </div>
              <span class="text-sm font-medium text-gray-600 ml-2">{{ (formData.rating ?? 0).toFixed(1) }} 分</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                <Plus class="w-4 h-4 text-green-500" />
                优点
              </label>
              <div class="space-y-2 mb-2 max-h-36 overflow-y-auto">
                <div
                  v-for="(item, i) in formData.pros"
                  :key="i"
                  class="flex items-center gap-2 p-2 bg-green-50 rounded-lg"
                >
                  <span class="text-sm text-green-700 flex-1">{{ item }}</span>
                  <button @click="removeItem(formData.pros, i)" class="text-green-400 hover:text-green-600">
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div class="flex gap-2">
                <input
                  v-model="newPro"
                  type="text"
                  class="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-green-400 focus:outline-none transition-colors"
                  placeholder="输入优点..."
                  @keyup.enter="addItem(formData.pros, newPro, newPro as any)"
                />
                <button
                  @click="addItem(formData.pros, newPro, newPro as any)"
                  class="px-3 py-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-colors"
                >
                  <Plus class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                <Minus class="w-4 h-4 text-red-500" />
                缺点/注意事项
              </label>
              <div class="space-y-2 mb-2 max-h-36 overflow-y-auto">
                <div
                  v-for="(item, i) in formData.cons"
                  :key="i"
                  class="flex items-center gap-2 p-2 bg-red-50 rounded-lg"
                >
                  <span class="text-sm text-red-700 flex-1">{{ item }}</span>
                  <button @click="removeItem(formData.cons, i)" class="text-red-400 hover:text-red-600">
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div class="flex gap-2">
                <input
                  v-model="newCon"
                  type="text"
                  class="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-red-400 focus:outline-none transition-colors"
                  placeholder="输入缺点..."
                  @keyup.enter="addItem(formData.cons, newCon, newCon as any)"
                />
                <button
                  @click="addItem(formData.cons, newCon, newCon as any)"
                  class="px-3 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                >
                  <Plus class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">备注信息</label>
            <textarea
              v-model="formData.notes"
              rows="3"
              class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors resize-none"
              placeholder="记录联系人、电话、特殊条款、折扣信息等..."
            ></textarea>
          </div>
        </div>

        <div class="flex gap-3 pt-6 mt-4 border-t border-gray-100">
          <button
            @click="emit('close')"
            class="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            @click="handleSubmit"
            :disabled="!canSubmit"
            class="flex-1 py-3 bg-gradient-to-r from-primary-400 to-primary-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ editData ? '保存修改' : '添加方案' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
