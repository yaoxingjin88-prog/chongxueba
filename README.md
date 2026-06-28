# 宠学霸

AI 电子宠物自律养成平台 —— Vue 3 前端 + Express/MySQL 后端全栈项目。

## 功能概览

- **登录认证**：手机号验证码 / 账号密码 / 微信演示登录
- **专注计时**：番茄钟、白噪音（雨声 / 森林 / 咖啡馆 / 篝火）
- **AI 自习室**：星光自习室、广场、搜索、语音连麦、视频自习、房间资料、邀请好友
- **宠物养成**：喂养、进化、属性成长
- **任务 & 商城**：每日任务、活跃度、宠物商城
- **成长 & 排行榜**：数据统计、专注时长排行
- **个人中心**：资料编辑、本地头像上传、成就、收藏、设置

## 项目结构

```
宠学霸/
├── Frontend/          # Vue 3 + Vite 前端
├── Backend/           # Express + MySQL API
├── doc/               # 测试账号、开发文档
└── README.md
```

## 环境要求

- Node.js 18+
- MySQL 8.0+

## 快速开始

### 1. 数据库与后端

```bash
cd Backend
npm install
cp .env.example .env
# 编辑 .env 填入 MySQL 密码
npm run init-db
npm run dev
```

后端默认地址：`http://localhost:3000`

### 2. 前端

```bash
cd Frontend
npm install
npm run dev
```

前端默认地址：`http://localhost:5173`（Vite 已将 `/api` 代理到后端）

### 3. 测试账号

开发环境可使用 6 个预设账号登录，详见 [doc/test-accounts.md](doc/test-accounts.md)。

```bash
cd Backend
npm run seed-accounts      # 导入/更新测试账号
npm run sync-study-room    # 同步用户到自习室成员列表
```

已有数据库增量升级：

```bash
cd Backend
node scripts/migrate-all.js
```

## 文档

| 文档 | 说明 |
|------|------|
| [Frontend/README.md](Frontend/README.md) | 前端页面、路由、技术栈 |
| [Backend/README.md](Backend/README.md) | API 接口、脚本、环境变量 |
| [doc/test-accounts.md](doc/test-accounts.md) | 测试账号与登录方式 |

## 仓库

Gitee: https://gitee.com/yaoxingjin/chongxueba
