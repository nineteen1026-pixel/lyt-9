import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { get, set } from '../utils/storage'
import {
  mockEmergencyContacts,
  type EmergencyContact,
  type EmergencyContactCategory
} from '../data/mockData'
import { useGuestsStore } from './guests'
import { useRehearsalStore } from './rehearsal'
import { useVenuesStore } from './venues'
import { usePhotographyStore } from './photography'

export { type EmergencyContact, type EmergencyContactCategory }

export interface AggregatedContact {
  id: string
  name: string
  phone: string
  category: EmergencyContactCategory
  role: string
  remark: string
  sourceId?: string
}

const isValidPhone = (phone: string): boolean => {
  if (!phone) return false
  if (/[xX*]/.test(phone)) return false
  const clean = phone.replace(/[\s\-]/g, '')
  return /^\d+$/.test(clean) && (clean.length === 11 || (clean.length >= 7 && clean.length <= 8))
}

export const useEmergencyContactsStore = defineStore('emergencyContacts', () => {
  const STORAGE_KEY = 'wedding-emergency-contacts'

  const customContacts = ref<EmergencyContact[]>(get(STORAGE_KEY, mockEmergencyContacts))

  watch(customContacts, (newValue) => {
    set(STORAGE_KEY, newValue)
  }, { deep: true })

  const guestContacts = computed<AggregatedContact[]>(() => {
    const guestsStore = useGuestsStore()
    return guestsStore.guests
      .filter(g => isValidPhone(g.phone) && g.status !== 'declined')
      .map(g => ({
        id: `guest-${g.id}`,
        name: g.name,
        phone: g.phone,
        category: 'guest' as EmergencyContactCategory,
        role: g.group === 'groom' ? '男方宾客' : g.group === 'bride' ? '女方宾客' : '双方宾客',
        remark: g.status === 'confirmed' ? '已确认出席' : '待确认',
        sourceId: g.id
      }))
  })

  const staffContacts = computed<AggregatedContact[]>(() => {
    const rehearsalStore = useRehearsalStore()
    return rehearsalStore.staff
      .filter(s => isValidPhone(s.phone))
      .map(s => ({
        id: `staff-${s.id}`,
        name: s.name,
        phone: s.phone,
        category: 'staff' as EmergencyContactCategory,
        role: s.role,
        remark: '',
        sourceId: s.id
      }))
  })

  const vendorContacts = computed<AggregatedContact[]>(() => {
    const venuesStore = useVenuesStore()
    const photographyStore = usePhotographyStore()
    const contacts: AggregatedContact[] = []

    venuesStore.venues
      .filter(v => v.contracted)
      .forEach(v => {
        const phoneMatch = (v.notes || '').match(/1[3-9]\d{9}|\d{3,4}[-\s]?\d{7,8}/)
        const phone = phoneMatch?.[0] || ''
        if (isValidPhone(phone)) {
          contacts.push({
            id: `venue-${v.id}`,
            name: v.name,
            phone,
            category: 'vendor' as EmergencyContactCategory,
            role: '场地',
            remark: v.address,
            sourceId: v.id
          })
        }
      })

    photographyStore.items
      .filter(p => p.contracted)
      .forEach(p => {
        const phoneMatch = (p.notes || '').match(/1[3-9]\d{9}|\d{3,4}[-\s]?\d{7,8}/)
        const phone = phoneMatch?.[0] || ''
        if (isValidPhone(phone)) {
          contacts.push({
            id: `photo-${p.id}`,
            name: p.teamName,
            phone,
            category: 'vendor' as EmergencyContactCategory,
            role: '摄影',
            remark: p.style,
            sourceId: p.id
          })
        }
      })

    return contacts
  })

  const customAggregated = computed<AggregatedContact[]>(() => {
    return customContacts.value
      .filter(c => c.category === 'custom' && isValidPhone(c.phone))
      .map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        category: c.category,
        role: c.role,
        remark: c.remark,
        sourceId: c.sourceId
      }))
  })

  const allContacts = computed<AggregatedContact[]>(() => {
    return [
      ...staffContacts.value,
      ...vendorContacts.value,
      ...guestContacts.value,
      ...customAggregated.value
    ]
  })

  const contactsByCategory = computed(() => {
    const map = new Map<EmergencyContactCategory, AggregatedContact[]>()
    map.set('staff', staffContacts.value)
    map.set('vendor', vendorContacts.value)
    map.set('guest', guestContacts.value)
    map.set('custom', customAggregated.value)
    return map
  })

  const totalCount = computed(() => allContacts.value.length)

  function addContact(contact: Omit<EmergencyContact, 'id'>) {
    const newContact: EmergencyContact = {
      ...contact,
      id: Date.now().toString()
    }
    customContacts.value.push(newContact)
  }

  function updateContact(id: string, updates: Partial<Omit<EmergencyContact, 'id'>>) {
    const index = customContacts.value.findIndex(c => c.id === id)
    if (index !== -1) {
      customContacts.value[index] = { ...customContacts.value[index], ...updates }
    }
  }

  function deleteContact(id: string) {
    const index = customContacts.value.findIndex(c => c.id === id)
    if (index !== -1) {
      customContacts.value.splice(index, 1)
    }
  }

  function getContactById(id: string) {
    return customContacts.value.find(c => c.id === id)
  }

  return {
    customContacts,
    allContacts,
    contactsByCategory,
    guestContacts,
    staffContacts,
    vendorContacts,
    customAggregated,
    totalCount,
    addContact,
    updateContact,
    deleteContact,
    getContactById
  }
})
