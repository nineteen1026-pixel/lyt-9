import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import OverviewView from '@/views/OverviewView.vue'
import BudgetView from '@/views/BudgetView.vue'
import GuestsView from '@/views/GuestsView.vue'
import VenuesView from '@/views/VenuesView.vue'
import PhotographyView from '@/views/PhotographyView.vue'
import DressView from '@/views/DressView.vue'
import ScheduleView from '@/views/ScheduleView.vue'
import RehearsalView from '@/views/RehearsalView.vue'

const routes = [
  {
    path: '/',
    redirect: '/overview'
  } as RouteRecordRaw,
  {
    path: '/overview',
    name: 'overview',
    component: OverviewView
  },
  {
    path: '/budget',
    name: 'budget',
    component: BudgetView
  },
  {
    path: '/guests',
    name: 'guests',
    component: GuestsView
  },
  {
    path: '/venues',
    name: 'venues',
    component: VenuesView
  },
  {
    path: '/photography',
    name: 'photography',
    component: PhotographyView
  },
  {
    path: '/dress',
    name: 'dress',
    component: DressView
  },
  {
    path: '/schedule',
    name: 'schedule',
    component: ScheduleView
  },
  {
    path: '/rehearsal',
    name: 'rehearsal',
    component: RehearsalView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
