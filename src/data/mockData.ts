export interface BudgetItem {
  id: string
  category: string
  planned: number
  actual: number
  color: string
  budget: number
}

export type GuestStatus = 'confirmed' | 'pending' | 'declined'
export type GuestGroup = 'groom' | 'bride' | 'both'

export interface Guest {
  id: string
  name: string
  phone: string
  group: GuestGroup
  status: GuestStatus
  attendance: '已确认' | '待确认' | '未出席'
  tableNumber: number | null
  avatar: string
}

export type VenueStatus = 'booked' | 'alternative'

export interface Venue {
  id: string
  name: string
  address: string
  capacity: number
  price: number
  status: VenueStatus
  image: string
  features: string[]
}

export interface Photography {
  id: string
  teamName: string
  style: string
  packageType: string
  price: number
  shootDate: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
  experience: string
  avatar: string
}

export interface PortfolioItem {
  id: string
  title: string
  image: string
}

export interface PhotographyPackage {
  id: number
  name: string
  price: number
  photographers: number
  photos: number
  videos: number
  albums: number
  includes: string[]
  extras: string[]
}

export type DressCategory = '主纱' | '出门纱' | '敬酒服'

export interface Dress {
  id: string
  type: DressCategory
  category: DressCategory
  style: string
  size: string
  price: number
  fittingDate: string
  image: string
  name: string
  brand: string
  color: string
}

export interface ScheduleItem {
  id: string
  time: string
  title: string
  description: string
  location: string
  personInCharge: string
  icon?: string
}

export interface RehearsalStep {
  id: string
  stepNumber: number
  title: string
  description: string
  personInCharge: string
  notes: string
  duration: string
}

export interface RehearsalInfo {
  date: string
  time: string
  location: string
  address: string
  contact: string
  contactPhone: string
}

export interface StaffMember {
  id: string
  name: string
  role: string
  phone: string
}

export interface SizeChartRow {
  size: string
  bust: number
  waist: number
  hip: number
}

export interface FittingRecord {
  id: string
  date: string
  time: string
  dressName: string
  notes: string
}

export interface Notice {
  id: string
  title: string
  content: string
}

export const mockBudget: BudgetItem[] = [
  { id: '1', category: '场地', planned: 50000, actual: 48000, color: '#FF6B6B', budget: 50000 },
  { id: '2', category: '餐饮', planned: 80000, actual: 78000, color: '#4ECDC4', budget: 80000 },
  { id: '3', category: '婚纱', planned: 15000, actual: 16800, color: '#45B7D1', budget: 15000 },
  { id: '4', category: '摄影', planned: 12000, actual: 11500, color: '#96CEB4', budget: 12000 },
  { id: '5', category: '化妆', planned: 5000, actual: 4800, color: '#FFEAA7', budget: 5000 },
  { id: '6', category: '礼仪', planned: 8000, actual: 7500, color: '#DDA0DD', budget: 8000 },
  { id: '7', category: '其他', planned: 10000, actual: 9200, color: '#98D8C8', budget: 10000 }
]

export const mockGuests: Guest[] = [
  { id: '1', name: '张伟', phone: '13800138001', group: 'groom', status: 'confirmed', attendance: '已确认', tableNumber: 1, avatar: '张' },
  { id: '2', name: '李娜', phone: '13800138002', group: 'bride', status: 'confirmed', attendance: '已确认', tableNumber: 2, avatar: '李' },
  { id: '3', name: '王芳', phone: '13800138003', group: 'both', status: 'pending', attendance: '待确认', tableNumber: null, avatar: '王' },
  { id: '4', name: '刘强', phone: '13800138004', group: 'groom', status: 'confirmed', attendance: '已确认', tableNumber: 1, avatar: '刘' },
  { id: '5', name: '陈静', phone: '13800138005', group: 'bride', status: 'declined', attendance: '未出席', tableNumber: null, avatar: '陈' },
  { id: '6', name: '赵磊', phone: '13800138006', group: 'both', status: 'confirmed', attendance: '已确认', tableNumber: 3, avatar: '赵' },
  { id: '7', name: '孙丽', phone: '13800138007', group: 'groom', status: 'pending', attendance: '待确认', tableNumber: null, avatar: '孙' },
  { id: '8', name: '周杰', phone: '13800138008', group: 'bride', status: 'confirmed', attendance: '已确认', tableNumber: 2, avatar: '周' }
]

export const mockVenues: Venue[] = [
  { id: '1', name: '花园酒店宴会厅', address: '北京市朝阳区建国路88号', capacity: 300, price: 48000, status: 'booked', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800', features: ['草坪婚礼', '中式宴席', '停车场', '化妆间'] },
  { id: '2', name: '海景度假村', address: '青岛市市南区海滨路1号', capacity: 200, price: 68000, status: 'alternative', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800', features: ['海边仪式', '西式自助', '海景套房', '烟花秀'] },
  { id: '3', name: '法式庄园会所', address: '上海市浦东新区法式园区88号', capacity: 150, price: 58000, status: 'alternative', image: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800', features: ['法式花园', '高端定制', '红酒窖', '直升机坪'] }
]

export const mockPhotography: Photography[] = [
  { id: '1', teamName: '光影纪摄影工作室', style: '清新自然', packageType: '全天跟拍', price: 12800, shootDate: '2024-10-01' },
  { id: '2', teamName: '时光影像', style: '复古胶片', packageType: '半天跟拍', price: 6800, shootDate: '2024-09-28' },
  { id: '3', teamName: '唯爱摄影', style: '韩式唯美', packageType: '旅拍套餐', price: 18800, shootDate: '2024-09-15' }
]

export const mockTeam: TeamMember[] = [
  { id: '1', name: '李明', role: '首席摄影师', experience: '8年', avatar: '李' },
  { id: '2', name: '王芳', role: '化妆师', experience: '6年', avatar: '王' },
  { id: '3', name: '张伟', role: '摄像师', experience: '5年', avatar: '张' },
  { id: '4', name: '刘洋', role: '后期修图师', experience: '7年', avatar: '刘' }
]

export const mockPortfolio: PortfolioItem[] = [
  { id: '1', title: '夏日花园', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400' },
  { id: '2', title: '海边誓言', image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400' },
  { id: '3', title: '教堂婚礼', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400' },
  { id: '4', title: '浪漫黄昏', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400' },
  { id: '5', title: '森林秘境', image: 'https://images.unsplash.com/photo-1525772764200-be829a350797?w=400' },
  { id: '6', title: '城市夜景', image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400' }
]

export const mockPackages: PhotographyPackage[] = [
  {
    id: 1,
    name: '基础套系',
    price: 6800,
    photographers: 1,
    photos: 200,
    videos: 0,
    albums: 1,
    includes: ['全程跟拍6小时', '精修30张', '12寸相册一本', '高清电子档'],
    extras: ['免费接机', '酒店一晚']
  },
  {
    id: 2,
    name: '精选套系',
    price: 12800,
    photographers: 2,
    photos: 400,
    videos: 1,
    albums: 2,
    includes: ['全程跟拍10小时', '精修60张', '15寸相册两本', '婚礼MV剪辑', '高清电子档'],
    extras: ['免费接机', '酒店两晚', '父母妆造']
  },
  {
    id: 3,
    name: '尊享套系',
    price: 21800,
    photographers: 3,
    photos: 600,
    videos: 2,
    albums: 3,
    includes: ['全程跟拍12小时', '精修100张', '18寸相册三本', '4K婚礼电影', '航拍服务', '高清电子档'],
    extras: ['免费接机', '豪华套房三晚', '父母妆造', '全天跟妆', '航拍服务']
  }
]

export const mockDress: Dress[] = [
  { id: '1', type: '主纱', category: '主纱', style: '宫廷风拖尾', size: 'S', price: 8800, fittingDate: '2024-09-20', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800', name: '维多利亚女王', brand: 'Pronovias', color: '象牙白' },
  { id: '2', type: '出门纱', category: '出门纱', style: '简约齐地', size: 'S', price: 3800, fittingDate: '2024-09-20', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800', name: '简约优雅', brand: 'Vera Wang', color: '纯白色' },
  { id: '3', type: '敬酒服', category: '敬酒服', style: '中式红旗袍', size: 'M', price: 4200, fittingDate: '2024-09-25', image: 'https://images.unsplash.com/photo-1587239625499-81c5f8717a6b?w=800', name: '东方佳人', brand: '定制', color: '中国红' }
]

export const mockSchedule: ScheduleItem[] = [
  { id: '1', time: '06:00', title: '新娘化妆', description: '新娘开始化妆、做造型', location: '新娘家', personInCharge: '化妆师李明', icon: 'shirt' },
  { id: '2', time: '08:00', title: '新郎接亲', description: '新郎带领接亲队伍出发', location: '新郎家', personInCharge: '伴郎张伟', icon: 'car' },
  { id: '3', time: '09:00', title: '接亲游戏', description: '堵门、玩游戏、找鞋', location: '新娘家', personInCharge: '伴娘李娜', icon: 'heart' },
  { id: '4', time: '10:00', title: '出门', description: '拜别父母，出发去酒店', location: '新娘家', personInCharge: '司仪王老师', icon: 'home' },
  { id: '5', time: '11:00', title: '迎宾', description: '新人在酒店迎宾、合影', location: '酒店宴会厅', personInCharge: '总协调赵姐', icon: 'users' },
  { id: '6', time: '12:00', title: '婚礼仪式', description: '正式婚礼仪式开始', location: '酒店宴会厅', personInCharge: '司仪王老师', icon: 'rings' },
  { id: '7', time: '13:00', title: '婚宴开始', description: '婚宴、敬酒', location: '酒店宴会厅', personInCharge: '总协调赵姐', icon: 'utensils' }
]

export const mockWeddingDate = '2024-10-01'

export const mockRehearsal: RehearsalStep[] = [
  { id: '1', stepNumber: 1, title: '彩排签到', description: '所有相关人员到场签到，熟悉场地', personInCharge: '司仪王老师', notes: '请提前15分钟到场', duration: '15分钟' },
  { id: '2', stepNumber: 2, title: '流程讲解', description: '讲解整个婚礼流程和注意事项', personInCharge: '司仪王老师', notes: '新人认真聆听', duration: '20分钟' },
  { id: '3', stepNumber: 3, title: '入场彩排', description: '新人入场、走红毯、站定位', personInCharge: '司仪王老师', notes: '注意步速要慢，面带微笑', duration: '30分钟' },
  { id: '4', stepNumber: 4, title: '仪式彩排', description: '宣誓、交换戒指、鞠躬', personInCharge: '司仪王老师', notes: '戒指由伴娘保管', duration: '25分钟' },
  { id: '5', stepNumber: 5, title: '敬茶彩排', description: '向双方父母敬茶', personInCharge: '总协调赵姐', notes: '注意礼仪规范', duration: '20分钟' },
  { id: '6', stepNumber: 6, title: '抛捧花彩排', description: '抛捧花环节定位', personInCharge: '司仪王老师', notes: '注意安全，避免误伤', duration: '10分钟' }
]

export const mockRehearsalInfo: RehearsalInfo = {
  date: '2024-09-30',
  time: '14:00',
  location: '花园酒店宴会厅',
  address: '北京市朝阳区建国路88号',
  contact: '司仪王老师',
  contactPhone: '13800138999'
}

export const mockStaff: StaffMember[] = [
  { id: '1', name: '王建国', role: '司仪', phone: '13800138999' },
  { id: '2', name: '李明', role: '摄影师', phone: '13800138001' },
  { id: '3', name: '张伟', role: '摄像师', phone: '13800138002' },
  { id: '4', name: '王芳', role: '化妆师', phone: '13800138003' },
  { id: '5', name: '赵敏', role: '婚礼督导', phone: '13800138004' }
]

export const mockSizeChart: SizeChartRow[] = [
  { size: 'XS', bust: 80, waist: 62, hip: 86 },
  { size: 'S', bust: 84, waist: 66, hip: 90 },
  { size: 'M', bust: 88, waist: 70, hip: 94 },
  { size: 'L', bust: 92, waist: 74, hip: 98 },
  { size: 'XL', bust: 96, waist: 78, hip: 102 }
]

export const mockFittingRecords: FittingRecord[] = [
  { id: '1', date: '2024-09-01', time: '14:00', dressName: '主纱试穿', notes: '整体效果很好，腰部需要修改收紧2cm' },
  { id: '2', date: '2024-09-10', time: '15:30', dressName: '出门纱试穿', notes: '尺码合适，长度刚好' },
  { id: '3', date: '2024-09-20', time: '10:00', dressName: '最终试穿', notes: '全部修改完成，确认无误' }
]

export const mockNotices: Notice[] = [
  { id: '1', title: '彩排当天请穿着舒适的鞋子', content: '由于彩排需要多次走动，建议新人穿着舒适的平底鞋或运动鞋，避免脚部疲劳。正式婚礼当天再穿婚鞋。' },
  { id: '2', title: '请提前准备好仪式所需物品', content: '包括：戒指、誓言卡、敬茶茶具、捧花等。请将这些物品交给专人保管，彩排当天带来。' },
  { id: '3', title: '提醒双方父母准时参加', content: '彩排需要双方父母配合敬茶环节，请务必提醒他们准时到达。如有特殊情况请提前告知司仪。' },
  { id: '4', title: '彩排后确认最终流程', content: '彩排结束后，我们会有15分钟的沟通时间，确认最终的婚礼流程和细节调整，请新人预留时间。' }
]
