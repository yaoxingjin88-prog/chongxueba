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
| POST | `/api/auth/send-code` | 发送登录验证码（开发环境固定为 123456） |
| POST | `/api/auth/login` | 手机号/账号密码登录 |
| POST | `/api/auth/wechat` | 微信快捷登录（演示接口） |
| GET | `/api/auth/me` | 获取当前登录用户 |
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
| GET | `/api/settings` | 获取设置中心数据 |
| PATCH | `/api/settings` | 更新设置项 |
| POST | `/api/settings/clear-cache` | 清理缓存 |
| POST | `/api/settings/check-update` | 检查更新 |
| POST | `/api/settings/delete-account` | 注销账号申请 |
| GET | `/api/favorites?category=all` | 收藏列表 |
| DELETE | `/api/favorites/:id` | 取消收藏 |

## 前端联调

前端 Vite 已配置代理，开发时请求 `/api/*` 会自动转发到后端。

开发环境默认登录密码为 `123456`，短信验证码为 `123456`。生产部署时请在 `.env`
中设置高强度 `AUTH_SECRET`，替换演示密码，并接入真实短信与微信 OAuth 服务。

**测试账号**（手机号 / 账号 / 密码）见 [doc/test-accounts.md](../doc/test-accounts.md)。
已有数据库可执行 `npm run seed-accounts` 导入。

```bash
# 终端 1 - 后端
cd Backend && npm run dev

# 终端 2 - 前端
cd Frontend && npm run dev
```
