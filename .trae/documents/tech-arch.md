## 1. 架构设计

```mermaid
graph TD
    subgraph "前端应用层"
        A1["App.vue 主容器"]
        A2["TabBar 底部导航"]
        A3["视图层 (7个页面)"]
        A4["组件层 (通用组件)"]
    end
    
    subgraph "状态管理层 (Pinia)"
        B1["budgetStore (预算)"]
        B2["guestStore (宾客)"]
        B3["venueStore (场地)"]
        B4["photoStore (摄影)"]
        B5["dressStore (婚纱)"]
        B6["scheduleStore (流程)"]
        B7["rehearsalStore (彩排)"]
    end
    
    subgraph "数据持久层"
        C1["LocalStorage"]
    end
    
    A1 --> A2
    A1 --> A3
    A3 --> A4
    A3 --> B1
    A3 --> B2
    A3 --> B3
    A3 --> B4
    A3 --> B5
    A3 --> B6
    A3 --> B7
    B1 <--> C1
    B2 <--> C1
    B3 <--> C1
    B4 <--> C1
    B5 <--> C1
    B6 <--> C1
    B7 <--> C1
```

## 2. 技术描述
- **前端框架**: Vue@3.4 + 组合式API (Composition API)
- **构建工具**: Vite@5
- **样式方案**: TailwindCSS@3
- **状态管理**: Pinia@2 (模块化 store slices)
- **图表库**: ECharts@5 (饼图展示)
- **图标库**: unplugin-icons + iconify/vue (按需引入)
- **数据持久化**: localStorage 本地存储
- **动画**: Vue Transition + CSS Animation
- **数据来源**: 前端 Mock 数据，无需后端

## 3. 路由定义
使用 Vue Router 管理页面路由，通过底部 Tab 切换。

| 路由路径 | 页面组件 | 模块名称 |
|----------|----------|----------|
| / | BudgetView | 预算模块 (默认) |
| /budget | BudgetView | 预算模块 |
| /guests | GuestsView | 宾客模块 |
| /venues | VenuesView | 场地模块 |
| /photography | PhotographyView | 摄影模块 |
| /dress | DressView | 婚纱模块 |
| /schedule | ScheduleView | 流程模块 |
| /rehearsal | RehearsalView | 彩排模块 |

## 4. 数据模型

### 4.1 数据模型定义
```mermaid
erDiagram
    BUDGET {
        string id
        string category
        number planned
        number actual
        string color
    }
    GUEST {
        string id
        string name
        string phone
        string group
        string status
        number table
    }
    VENUE {
        string id
        string name
        string address
        number capacity
        number price
        string status
        string image
    }
    PHOTOGRAPHY {
        string id
        string team
        string style
        string package
        number price
        string date
    }
    DRESS {
        string id
        string type
        string style
        string size
        number price
        string fittingDate
        string image
    }
    SCHEDULE {
        string id
        string time
        string title
        string description
        string location
        string personInCharge
    }
    REHEARSAL {
        string id
        number step
        string title
        string description
        string personInCharge
        string notes
    }
```

### 4.2 目录结构
```
src/
├── main.js                    # 入口文件
├── App.vue                    # 根组件
├── router/
│   └── index.js               # 路由配置
├── stores/                    # Pinia store slices
│   ├── budget.js
│   ├── guests.js
│   ├── venues.js
│   ├── photography.js
│   ├── dress.js
│   ├── schedule.js
│   └── rehearsal.js
├── views/                     # 页面视图
│   ├── BudgetView.vue
│   ├── GuestsView.vue
│   ├── VenuesView.vue
│   ├── PhotographyView.vue
│   ├── DressView.vue
│   ├── ScheduleView.vue
│   └── RehearsalView.vue
├── components/                # 通用组件
│   ├── TabBar.vue
│   ├── PieChart.vue
│   └── Timeline.vue
├── data/                      # Mock 数据
│   └── mockData.js
├── assets/                    # 静态资源
│   └── images/
├── styles/                    # 全局样式
│   └── main.css
└── utils/                     # 工具函数
    └── storage.js
```

## 5. 核心技术点
1. **Store Slice 模式**: 每个模块独立 Pinia store，封装状态、actions、getters
2. **组件化设计**: 饼图、时间轴、TabBar 等可复用组件单独封装
3. **响应式布局**: Tailwind 断点适配，移动端优先
4. **过渡动画**: Vue Transition 实现 Tab 切换和列表项进入动画
5. **本地持久化**: 自动同步 store 数据到 localStorage
6. **按需加载**: Vue Router 路由懒加载，ECharts 按需引入
