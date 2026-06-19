import type { WeddingRole } from '@/stores/role'

export type ModuleVisibility = 'both' | 'groom' | 'bride'

export interface ModulePermission {
  id: string
  name: string
  path: string
  visibility: ModuleVisibility
  description: string
}

export const modulePermissions: ModulePermission[] = [
  {
    id: 'overview',
    name: '总览',
    path: '/overview',
    visibility: 'both',
    description: '婚礼筹备总览，双方共同查看'
  },
  {
    id: 'budget',
    name: '预算',
    path: '/budget',
    visibility: 'both',
    description: '婚礼预算管理，支持按角色分配'
  },
  {
    id: 'guests',
    name: '宾客',
    path: '/guests',
    visibility: 'both',
    description: '宾客名单管理，按男方/女方分类'
  },
  {
    id: 'venues',
    name: '场地',
    path: '/venues',
    visibility: 'both',
    description: '婚礼场地选择，双方共同决策'
  },
  {
    id: 'photography',
    name: '摄影',
    path: '/photography',
    visibility: 'both',
    description: '摄影团队选择，双方共同确认'
  },
  {
    id: 'dress',
    name: '婚纱',
    path: '/dress',
    visibility: 'bride',
    description: '婚纱礼服选择，新娘为主'
  },
  {
    id: 'schedule',
    name: '流程',
    path: '/schedule',
    visibility: 'both',
    description: '婚礼流程安排，双方共同确认'
  },
  {
    id: 'rehearsal',
    name: '彩排',
    path: '/rehearsal',
    visibility: 'both',
    description: '婚礼彩排安排，双方共同参与'
  }
]

export function getModulePermission(moduleId: string): ModulePermission | undefined {
  return modulePermissions.find(m => m.id === moduleId)
}

export function isModuleVisible(moduleId: string, role: WeddingRole): boolean {
  const module = getModulePermission(moduleId)
  if (!module) return true
  if (module.visibility === 'both') return true
  return module.visibility === role
}

export function getVisibleModules(role: WeddingRole): ModulePermission[] {
  return modulePermissions.filter(m => 
    m.visibility === 'both' || m.visibility === role
  )
}

export type BudgetOwner = 'groom' | 'bride' | 'both'

export const budgetCategoryOwners: Record<string, BudgetOwner> = {
  '场地': 'both',
  '餐饮': 'both',
  '婚纱': 'bride',
  '摄影': 'both',
  '化妆': 'bride',
  '礼仪': 'both',
  '其他': 'both'
}

export function getBudgetOwner(category: string): BudgetOwner {
  return budgetCategoryOwners[category] ?? 'both'
}

export function isBudgetVisible(category: string, role: WeddingRole): boolean {
  const owner = getBudgetOwner(category)
  if (owner === 'both') return true
  return owner === role
}
