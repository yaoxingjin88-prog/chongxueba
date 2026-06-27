import { Router } from 'express'
import pool from '../config/db.js'
import { formatMinutes } from '../utils/format.js'

const router = Router()
const DEFAULT_USER_ID = 1
const APP_ORIGIN = process.env.APP_ORIGIN || 'https://chongxueba.app'

const SHARE_METHODS = [
  { key: 'wechat', label: '微信', color: '#22c55e' },
  { key: 'qq', label: 'QQ', color: '#3b82f6' },
  { key: 'link', label: '复制链接', color: '#6366f1' },
  { key: 'copy', label: '复制文案', color: '#8b5cf6' },
]

function buildFocusSharePayload(userRow, body = {}) {
  const preset = Number(body.preset) || 25
  const displayTime = String(body.displayTime || '25:00')
  const status = String(body.status || '专注中')
  const progress = Math.max(0, Math.min(100, Number(body.progress) || 0))
  const focusToday = formatMinutes(userRow.focus_today_minutes || 0)
  const streakDays = userRow.streak_days || 0
  const userName = userRow.name || '同学'

  const shareLink = `${APP_ORIGIN}/focus?from=${userRow.id}`
  const shareText = [
    `我在宠学霸${status}！`,
    `⏱ ${displayTime} / ${preset}分钟 · 进度 ${Math.round(progress)}%`,
    `📚 今日专注 ${focusToday}`,
    `🔥 连续打卡 ${streakDays} 天`,
    '一起来自习吧 👇',
    shareLink,
  ].join('\n')

  return {
    title: '分享专注时刻',
    subtitle: '邀请好友一起加入宠学霸自习',
    shareText,
    shareLink,
    preview: {
      status,
      timer: displayTime,
      preset,
      progress: Math.round(progress),
      focusToday,
      streakDays,
      userName,
    },
    shareMethods: SHARE_METHODS,
  }
}

async function fetchUserRow(userId) {
  const [rows] = await pool.query(
    `SELECT id, name, streak_days, focus_today_minutes
     FROM users WHERE id = ?`,
    [userId],
  )
  return rows[0] || null
}

router.post('/share', async (req, res, next) => {
  try {
    const userId = Number(req.body.userId) || DEFAULT_USER_ID
    const action = String(req.body.action || 'preview')
    const userRow = await fetchUserRow(userId)

    if (!userRow) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }

    const payload = buildFocusSharePayload(userRow, req.body)

    if (action === 'preview') {
      return res.json({ success: true, data: payload })
    }

    const channelLabels = {
      wechat: '微信',
      qq: 'QQ',
      link: '链接',
      copy: '文案',
    }

    if (action === 'share-link') {
      return res.json({
        success: true,
        data: {
          ...payload,
          copyText: payload.shareLink,
          message: '专注链接已复制',
        },
      })
    }

    if (action === 'share-copy') {
      return res.json({
        success: true,
        data: {
          ...payload,
          copyText: payload.shareText,
          message: '分享文案已复制',
        },
      })
    }

    if (action === 'share-wechat' || action === 'share-qq') {
      const channel = action === 'share-wechat' ? 'wechat' : 'qq'
      return res.json({
        success: true,
        data: {
          ...payload,
          copyText: payload.shareText,
          channel,
          message: `已复制${channelLabels[channel]}分享内容，快去邀请好友吧`,
        },
      })
    }

    return res.status(400).json({ success: false, message: '无效的分享操作' })
  } catch (err) {
    next(err)
  }
})

router.post('/complete', async (req, res, next) => {
  try {
    const userId = Number(req.body.userId) || DEFAULT_USER_ID
    const minutes = Number(req.body.minutes) || 25
    const expReward = Math.round(minutes * 2.4)
    const growthReward = Math.round(minutes * 0.6)

    await pool.query(
      `UPDATE users SET
         exp = exp + ?,
         focus_today_minutes = focus_today_minutes + ?,
         focus_week_minutes = focus_week_minutes + ?,
         focus_stat = LEAST(100, focus_stat + 2)
       WHERE id = ?`,
      [expReward, minutes, minutes, userId],
    )

    await pool.query(
      `INSERT INTO focus_records (user_id, record_date, minutes)
       VALUES (?, CURDATE(), ?)
       ON DUPLICATE KEY UPDATE minutes = minutes + VALUES(minutes)`,
      [userId, minutes],
    )

    const [tasks] = await pool.query(
      `SELECT t.id FROM tasks t WHERE t.type = 'daily' AND t.icon = 'clock' LIMIT 1`,
    )
    if (tasks.length && minutes >= 25) {
      await pool.query(
        `INSERT INTO user_tasks (user_id, task_id, current_count, done, activity_date)
         VALUES (?, ?, 1, 1, CURDATE())
         ON DUPLICATE KEY UPDATE current_count = 1, done = 1`,
        [userId, tasks[0].id],
      )
    }

    const [users] = await pool.query(
      'SELECT exp, focus_today_minutes, focus_week_minutes, focus_stat FROM users WHERE id = ?',
      [userId],
    )

    res.json({
      success: true,
      message: '专注完成',
      data: {
        expReward,
        growthReward,
        user: users[0],
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
