# 婚礼管家 H5

一款基于 Vue 3 + TypeScript + Vite + TailwindCSS 的婚礼规划管理 H5 应用。

## 功能模块

| 模块 | 说明 | 可视化 |
|------|------|--------|
| 预算管理 | 预算总额、已支出、剩余、进度、支出明细 | 玫瑰饼图展示支出分布 |
| 宾客管理 | 搜索、筛选、分组、出席状态、桌号 | 列表 + 状态徽章 |
| 场地管理 | 场地信息、容纳人数、价格、状态 | 卡片式展示 |
| 摄影管理 | 团队介绍、作品展示、套系选择 | 网格 + 选项卡 |
| 婚纱管理 | 礼服分类、试穿记录、尺寸参数 | 分类标签 + 卡片 |
| 流程管理 | 时间节点、地点、负责人、按时段分组 | 垂直时间轴 + 滚动动画 |
| 彩排管理 | 流程步骤、人员分工、注意事项 | 步骤序号 + 折叠面板 |

## 技术栈

- **框架**: Vue 3.4 + 组合式 API (Composition API)
- **构建工具**: Vite 5
- **样式方案**: TailwindCSS 3
- **状态管理**: Pinia 2 (模块化 store slices)
- **图表库**: ECharts 5
- **图标库**: Lucide Vue Next
- **语言**: TypeScript
- **数据持久化**: localStorage

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

启动后访问 http://localhost:5173 预览应用。

### 类型检查

```bash
npm run check
```

### 生产构建

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

### 预览构建结果

```bash
npm run preview
```

## 静态部署

构建完成后，`dist` 目录包含了所有可部署的静态资源，可以部署到任意静态资源服务器：

### Nginx 部署

将 `dist` 目录上传到服务器，配置 Nginx：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 部署到静态托管平台

- **Vercel**: 直接 import 项目，无需额外配置
- **Netlify**: 将 `dist` 目录设置为发布目录
- **GitHub Pages**: 将 `dist` 内容推送到 `gh-pages` 分支
- **阿里云 OSS / 腾讯云 COS**: 上传 `dist` 目录到存储桶，开启静态网站托管

### 本地启动命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查
npm run check

# 代码检查
npm run lint

# 生产构建
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
src/
├── main.ts                    # 入口文件
├── App.vue                    # 根组件
├── router/index.ts            # 路由配置
├── stores/                    # Pinia store slices
│   ├── budget.ts             # 预算管理
│   ├── guests.ts             # 宾客管理
│   ├── venues.ts              # 场地管理
│   ├── photography.ts        # 摄影管理
│   ├── dress.ts               # 婚纱管理
│   ├── schedule.ts            # 流程管理
│   └── rehearsal.ts           # 彩排管理
├── views/                     # 页面视图
│   ├── BudgetView.vue
│   ├── GuestsView.vue
│   ├── VenuesView.vue
│   ├── PhotographyView.vue
│   ├── DressView.vue
│   ├── ScheduleView.vue
│   └── RehearsalView.vue
├── components/                # 通用组件
│   ├── TabBar.vue             # 底部导航
│   ├── PieChart.vue           # 饼图组件
│   └── Timeline.vue          # 时间轴组件
├── data/mockData.ts           # Mock 数据
├── utils/storage.ts         # localStorage 工具
└── style.css                # 全局样式
```

## 设计特色

- **浪漫色调**: 玫瑰粉 + 象牙白 + 香槟金
- **优雅字体**: Playfair Display (标题) + Noto Sans SC (正文)
- **精致动效**: Tab 切换淡入淡出、列表错峰进入、饼图弹性加载
- **移动端优先**: 底部固定 Tab 栏、安全区适配、触摸优化
- **数据持久化**: 所有数据自动保存到 localStorage
