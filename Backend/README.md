# 宠学霸 Backend API

Express + MySQL 后端服务，为宠学霸前端提供数据接口。

## 环境要求

- Node.js 18+
- MySQL 8.0+

## 快速开始

```bash
cd Backend
npm install
cp .env.example .env
# 编辑 .env 填入 MySQL 密码
npm run init-db
npm run dev
```

服务默认运行在 `http://localhost:3000`

## API 列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/user/:id` | 用户信息 |
| GET | `/api/tasks?type=daily` | 任务列表 |
| PATCH | `/api/tasks/:id/complete` | 完成任务 |
| GET | `/api/mall/items?category=0` | 商城商品 |
| POST | `/api/mall/purchase` | 购买商品 |
| GET | `/api/growth` | 成长报告 |
| GET | `/api/achievements` | 成就数据 |
| GET | `/api/pet` | 宠物信息 |
| POST | `/api/pet/feed` | 喂养宠物 |
| POST | `/api/focus/complete` | 完成专注 |
| GET | `/api/study-room` | 自习室数据 |

## 前端联调

前端 Vite 已配置代理，开发时请求 `/api/*` 会自动转发到后端。

```bash
# 终端 1 - 后端
cd Backend && npm run dev

# 终端 2 - 前端
cd Frontend && npm run dev
```
