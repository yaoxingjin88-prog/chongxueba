# 宠学霸 - AI电子宠物自律养成平台

基于 Vue 3 + Vite 的 H5 小程序 UI 复刻项目，使用 Font Awesome 图标。

## 页面列表

| 页面 | 路由 | 说明 |
|------|------|------|
| 启动页 | `/splash` | 品牌展示与加载动画 |
| 首页 | `/home` | 宠物展示、状态值、快捷入口 |
| 专注计时 | `/focus` | 番茄钟倒计时、奖励展示 |
| AI自习室 | `/study-room` | 在线自习、AI检测、环境音效 |
| 成长报告 | `/growth` | 数据统计、趋势图表 |
| 宠物养成 | `/pet` | 进化路线、属性、喂养 |
| 任务中心 | `/tasks` | 每日任务、活跃度宝箱 |
| 宠物商城 | `/mall` | 商品分类、三列网格 |
| 个人中心 | `/profile` | 用户信息、成就预览 |
| 成就系统 | `/achievement` | 勋章墙、限定勋章 |

## 技术栈

- Vue 3 (Composition API)
- Vue Router 4 (Hash 模式，适配 H5 小程序)
- Pinia 状态管理
- Font Awesome 6 图标
- CSS 变量 + 玻璃拟态设计

## 快速开始

```bash
npm install
npm run dev
```

浏览器访问 `http://localhost:5173`，建议使用 Chrome 开发者工具切换移动端视图（375px）。

## 项目结构

```
src/
├── components/     # TabBar、PageHeader、ProgressBar
├── views/          # 10 个页面组件
├── stores/         # Pinia 用户数据
├── router/         # 路由配置
├── styles/         # 全局样式与 CSS 变量
└── plugins/        # Font Awesome 配置
```

## 设计规范

- 主色调：深紫 `#1a1033` ~ 薰衣草 `#8b6fd4`
- 圆角：12px ~ 32px
- 底部 Tab 导航：首页 / 自习室 / 成长 / 商城 / 我的
