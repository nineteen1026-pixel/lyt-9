import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import OverviewView from '@/views/OverviewView.vue'
import BudgetView from '@/views/BudgetView.vue'
import GuestsView from '@/views/GuestsView.vue'
import VenuesView from '@/views/VenuesView.vue'
import PhotographyView from '@/views/PhotographyView.vue'
import DressView from '@/views/DressView.vue'
import ScheduleView from '@/views/ScheduleView.vue'
import RehearsalView from '@/views/RehearsalView.vue'
import EmergencyContactsView from '@/views/EmergencyContactsView.vue'
import { isModuleVisible, getModulePermission } from '@/data/permissions'
import { useRoleStore } from '@/stores/role'

const routes = [
  {
    path: '/',
    redirect: '/overview'
  } as RouteRecordRaw,
  {
    path: '/overview',
    name: 'overview',
    component: OverviewView,
    meta: { moduleId: 'overview' }
  },
  {
    path: '/budget',
    name: 'budget',
    component: BudgetView,
    meta: { moduleId: 'budget' }
  },
  {
    path: '/guests',
    name: 'guests',
    component: GuestsView,
    meta: { moduleId: 'guests' }
  },
  {
    path: '/venues',
    name: 'venues',
    component: VenuesView,
    meta: { moduleId: 'venues' }
  },
  {
    path: '/photography',
    name: 'photography',
    component: PhotographyView,
    meta: { moduleId: 'photography' }
  },
  {
    path: '/dress',
    name: 'dress',
    component: DressView,
    meta: { moduleId: 'dress' }
  },
  {
    path: '/schedule',
    name: 'schedule',
    component: ScheduleView,
    meta: { moduleId: 'schedule' }
  },
  {
    path: '/rehearsal',
    name: 'rehearsal',
    component: RehearsalView,
    meta: { moduleId: 'rehearsal' }
  },
  {
    path: '/emergency-contacts',
    name: 'emergency-contacts',
    component: EmergencyContactsView,
    meta: { moduleId: 'emergency-contacts' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const moduleId = to.meta.moduleId as string | undefined
  if (!moduleId) {
    next()
    return
  }

  const roleStore = useRoleStore()
  const currentRole = roleStore.currentRole

  if (!isModuleVisible(moduleId, currentRole)) {
    const modulePerm = getModulePermission(moduleId)
    const moduleName = modulePerm?.name || '该模块'
    const requiredRole = modulePerm?.visibility === 'groom' ? '新郎' : '新娘'

    console.warn(`[路由守卫] ${currentRole === 'groom' ? '新郎' : '新娘'}视角无权访问「${moduleName}」模块，需要${requiredRole}视角，已拦截并重定向到总览页`)

    if (typeof window !== 'undefined') {
      try {
        const event = new CustomEvent('route-access-denied', {
          detail: { moduleName, requiredRole }
        })
        window.dispatchEvent(event)
      } catch (e) {
        console.warn('无法派发 access-denied 事件:', e)
      }
    }

    next({ path: '/overview', replace: true })
    return
  }

  next()
})

export default router
