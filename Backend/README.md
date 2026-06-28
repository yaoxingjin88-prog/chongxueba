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

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | `3000` |
| `DB_HOST` | MySQL 主机 | `localhost` |
| `DB_PORT` | MySQL 端口 | `3306` |
| `DB_USER` | 数据库用户 | `root` |
| `DB_PASSWORD` | 数据库密码 | — |
| `DB_NAME` | 数据库名 | `chong_xueba` |
| `AUTH_SECRET` | JWT 签名密钥 | 需自行设置 |
| `DEMO_LOGIN_PASSWORD` | 开发环境演示密码 | `123456` |

## NPM 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式（热重载） |
| `npm start` | 生产启动 |
| `npm run init-db` | 初始化数据库（schema + seed） |
| `npm run seed-accounts` | 导入 6 个测试账号 |
| `npm run sync-study-room` | 将 `users` 同步到自习室 / 语音房成员 |

增量迁移（已有数据库）：

```bash
node scripts/migrate-all.js
```

## API 列表

### 通用

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |

### 认证 `/api/auth`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/send-code` | 发送登录验证码（控制台输出） |
| POST | `/login` | 手机号 / 账号密码登录 |
| POST | `/wechat` | 微信快捷登录（演示） |
| GET | `/me` | 获取当前登录用户 |

### 用户与资料

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/user/:id` | 用户信息 |
| GET | `/api/profile` | 个人资料 |
| PATCH | `/api/profile` | 更新资料（含 `avatar_url`） |

### 专注 / 任务 / 商城 / 成长

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/focus/complete` | 完成专注 |
| POST | `/api/focus/share` | 专注分享预览 / 操作 |
| GET | `/api/tasks?type=daily` | 任务列表 |
| PATCH | `/api/tasks/:id/complete` | 完成任务 |
| GET | `/api/mall/items?category=0` | 商城商品 |
| POST | `/api/mall/purchase` | 购买商品 |
| GET | `/api/growth` | 成长报告 |
| GET | `/api/achievements` | 成就数据 |
| GET | `/api/pet` | 宠物信息 |
| POST | `/api/pet/feed` | 喂养宠物 |
| GET | `/api/leaderboard` | 排行榜 |

### 宠物语音 `/api/tts`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/pet/config` | 百度卡通音色列表与当前配置 |
| POST | `/pet` | 宠物台词转 MP3（`{ text, voice? }`，voice: `xiaolu`/`xiaoshi`/`duoduo`） |

默认使用 **百度智能云 TTS**（度米朵/度小鹿/度小童）。配置见 [doc/baidu-tts.md](../doc/baidu-tts.md)。

### 设置与收藏

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/settings` | 获取设置 |
| PATCH | `/api/settings` | 更新设置项 |
| POST | `/api/settings/clear-cache` | 清理缓存 |
| POST | `/api/settings/check-update` | 检查更新 |
| POST | `/api/settings/delete-account` | 注销账号申请 |
| GET | `/api/favorites?category=all` | 收藏列表 |
| DELETE | `/api/favorites/:id` | 取消收藏 |

### 自习室 `/api/study-room`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 星光自习室（主房间） |
| GET | `/plaza` | 自习室广场列表 |
| POST | `/plaza/create` | 创建房间 |
| GET | `/search-page` | 搜索页初始数据 |
| GET | `/search` | 搜索房间 / 学友 |
| POST | `/search-history` | 保存搜索历史 |
| DELETE | `/search-history` | 清空搜索历史 |
| POST | `/rooms/:id/join` | 加入房间 |
| POST | `/buddies/:id/greet` | 打招呼 |
| POST | `/buddies/:id/invite` | 邀请学友 |
| PUT | `/ambient-sound` | 保存白噪音偏好 |
| GET | `/interact` | 互动模式状态 |
| POST | `/interact/join` | 进入语音 / 视频模式 |
| POST | `/interact/leave` | 离开互动 |
| GET | `/voice` | 语音连麦房间数据 |
| PATCH | `/voice/settings` | 语音设置（麦克风等） |
| POST | `/voice/speak` | 按住说话 |
| POST | `/voice/hand-raise` | 举手 |
| POST | `/voice/end-focus` | 结束专注 |
| GET | `/video` | 视频自习房间数据 |
| PATCH | `/video/settings` | 视频设置 |
| POST | `/video/switch-camera` | 切换摄像头 |
| POST | `/video/end-focus` | 结束专注 |
| GET | `/menu` | 功能菜单 |
| GET | `/menu/room-info` | 房间资料 / 成员列表 |
| POST | `/menu/action` | 菜单操作 |
| GET | `/invite` | 邀请页数据 |
| GET | `/invite/records` | 邀请记录 |
| POST | `/invite/action` | 邀请操作 |

## 前端联调

前端 Vite 已配置代理，开发时请求 `/api/*` 会自动转发到后端。

```bash
# 终端 1 - 后端
cd Backend && npm run dev

# 终端 2 - 前端
cd Frontend && npm run dev
```

**测试账号**（手机号 / 账号 / 密码）见 [doc/test-accounts.md](../doc/test-accounts.md)。

```bash
npm run seed-accounts      # 导入测试账号
npm run sync-study-room    # 同步自习室成员（含真实头像）
```

## 安全说明

开发环境验证码在后端控制台输出；生产部署时请：

- 设置高强度 `AUTH_SECRET`
- 替换演示密码，接入真实短信与微信 OAuth
