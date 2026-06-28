# 宠学霸 Frontend

Vue 3 + Vite 移动端 H5 应用，对接 [Backend](../Backend) API。

## 技术栈

- Vue 3（Composition API）
- Vue Router 4（Hash 模式）
- Pinia 状态管理
- Font Awesome 6 图标
- Pixi.js + Live2D（宠物展示）
- CSS 变量 + 玻璃拟态 UI

## 快速开始

```bash
npm install
npm run dev
```

浏览器访问 `http://localhost:5173`，建议使用 Chrome 开发者工具切换移动端视图（375px）。

需同时启动后端（`cd Backend && npm run dev`），否则登录与数据接口不可用。

## 页面与路由

| 页面 | 路由 | 说明 |
|------|------|------|
| 登录 | `/login` | 手机号 / 账号密码登录（默认入口） |
| 启动页 | `/splash` | 品牌展示与加载动画 |
| 首页 | `/home` | 宠物展示、快捷入口、排行榜入口 |
| 专注计时 | `/focus` | 番茄钟、白噪音、完成奖励 |
| 星光自习室 | `/study-room` | 主自习室，真实在线同学 |
| 自习室广场 | `/study-room/plaza` | 推荐房间、轮播 Banner |
| 自习室搜索 | `/study-room/search` | 关键词搜索、历史记录 |
| 语音连麦 | `/study-room/voice` | 连麦自习、orbit 布局 |
| 视频自习 | `/study-room/video` | 摄像头自习 |
| 邀请好友 | `/study-room/invite` | 分享房间、邀请记录 |
| 排行榜 | `/leaderboard` | 专注时长排行 |
| 成长报告 | `/growth` | 数据统计、趋势图表 |
| 宠物养成 | `/pet` | 进化路线、属性、喂养 |
| 任务中心 | `/tasks` | 每日任务、活跃度宝箱 |
| 宠物商城 | `/mall` | 商品分类、三列网格 |
| 个人中心 | `/profile` | 用户信息、成就预览 |
| 编辑资料 | `/settings/profile` | 昵称、签名、本地头像上传 |
| 成就系统 | `/achievement` | 勋章墙、限定勋章 |
| 我的收藏 | `/favorites` | 收藏内容管理 |
| 设置 | `/settings` | 通知、隐私、缓存、注销 |

底部 Tab：**首页 / 自习室 / 成长 / 商城 / 我的**

未登录访问受保护页面会自动跳转到 `/login`。

## 项目结构

```
src/
├── api/              # 后端 API 封装
├── assets/           # 静态图片资源
├── components/       # 公共组件（TabBar、自习室面板、AI 吉祥物等）
├── plugins/          # Font Awesome 配置
├── router/           # 路由与登录守卫
├── stores/           # Pinia（用户会话、Token）
├── styles/           # 全局样式与 CSS 变量
├── utils/            # 工具（avatarUrl、图片压缩等）
└── views/            # 页面组件
public/
├── sounds/           # 白噪音音频
└── *.png             # 自习室、首页等 UI 素材
```

## 常用脚本

```bash
npm run dev       # 开发服务器
npm run build     # 生产构建
npm run preview   # 预览构建结果
```

## 设计规范

- 主色调：深紫 `#1a1033` ~ 薰衣草 `#8b6fd4`
- 圆角：12px ~ 32px
- 头像：优先使用用户上传的 `avatar_url`，否则 DiceBear 预设

## 联调说明

- API 基址：`/api`（见 `vite.config.js` 代理到 `http://localhost:3000`）
- Token 存储：`localStorage` / `sessionStorage` 键名 `chong-xueba-token`
- 测试账号见 [doc/test-accounts.md](../doc/test-accounts.md)
