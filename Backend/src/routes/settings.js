import { Router } from 'express'
import pool from '../config/db.js'
import { resolveUserId, maskPhone } from '../utils/auth.js'

const router = Router()

const PET_FREQ_LABELS = { daily: '每日提醒', weekly: '每周提醒', off: '关闭提醒' }
const REPORT_CYCLE_LABELS = { daily: '每日', weekly: '每周', monthly: '每月' }
const THEME_LABELS = { starry: '梦幻星空', light: '清新浅色', dark: '暗夜模式' }

function toSettings(row) {
  return {
    profile: {
      name: row.name,
      level: row.level,
      phone: maskPhone(row.phone),
      petName: row.pet_name || '小狐狸',
      avatarSeed: row.avatar_seed || 'moon-night',
      avatarUrl: row.avatar_url || '',
    },
    study: {
      studyGoal: row.study_goal,
      defaultFocusMinutes: row.default_focus_minutes,
      defaultFocusLabel: `${row.default_focus_minutes}分钟`,
      studyRoomPreference: row.study_room_preference,
      petInteractionFreq: row.pet_interaction_freq,
      petInteractionLabel: PET_FREQ_LABELS[row.pet_interaction_freq] || row.pet_interaction_freq,
      growthReportCycle: row.growth_report_cycle,
      growthReportLabel: REPORT_CYCLE_LABELS[row.growth_report_cycle] || row.growth_report_cycle,
    },
    notifications: {
      focusStart: Boolean(row.notify_focus_start),
      taskComplete: Boolean(row.notify_task_complete),
      petGrowth: Boolean(row.notify_pet_growth),
      dailyCheckin: Boolean(row.notify_daily_checkin),
      achievement: Boolean(row.notify_achievement),
    },
    general: {
      cacheSizeMb: Number(row.cache_size_mb),
      cacheSizeLabel: `${Number(row.cache_size_mb).toFixed(1)}MB`,
      themeAppearance: row.theme_appearance,
      themeLabel: THEME_LABELS[row.theme_appearance] || row.theme_appearance,
      appVersion: row.app_version,
    },
  }
}

async function fetchSettings(userId) {
  const [rows] = await pool.query(
    `SELECT u.name, u.level, s.*, p.name AS pet_name, up.avatar_seed, up.avatar_url
     FROM user_settings s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN pets p ON p.user_id = u.id
     LEFT JOIN user_profiles up ON up.user_id = u.id
     WHERE s.user_id = ?`,
    [userId],
  )
  return rows[0] || null
}

async function ensureSettings(userId) {
  let row = await fetchSettings(userId)
  if (row) return row

  await pool.query(
    `INSERT INTO user_settings (user_id, phone) VALUES (?, '18888888888')`,
    [userId],
  )
  row = await fetchSettings(userId)
  return row
}

const PATCH_MAP = {
  studyGoal: 'study_goal',
  defaultFocusMinutes: 'default_focus_minutes',
  studyRoomPreference: 'study_room_preference',
  petInteractionFreq: 'pet_interaction_freq',
  growthReportCycle: 'growth_report_cycle',
  focusStart: 'notify_focus_start',
  taskComplete: 'notify_task_complete',
  petGrowth: 'notify_pet_growth',
  dailyCheckin: 'notify_daily_checkin',
  achievement: 'notify_achievement',
  themeAppearance: 'theme_appearance',
}

router.get('/', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const row = await ensureSettings(userId)
    if (!row) {
      return res.status(404).json({ success: false, message: '设置不存在' })
    }
    res.json({ success: true, data: toSettings(row) })
  } catch (err) {
    next(err)
  }
})

router.patch('/', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    await ensureSettings(userId)

    const fields = []
    const values = []

    for (const [key, column] of Object.entries(PATCH_MAP)) {
      if (req.body[key] === undefined) continue
      let val = req.body[key]
      if (column.startsWith('notify_')) val = val ? 1 : 0
      fields.push(`${column} = ?`)
      values.push(val)
    }

    if (!fields.length) {
      return res.status(400).json({ success: false, message: '没有可更新的字段' })
    }

    values.push(userId)
    await pool.query(`UPDATE user_settings SET ${fields.join(', ')} WHERE user_id = ?`, values)

    const row = await fetchSettings(userId)
    res.json({ success: true, data: toSettings(row), message: '设置已保存' })
  } catch (err) {
    next(err)
  }
})

router.post('/clear-cache', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    await ensureSettings(userId)
    await pool.query('UPDATE user_settings SET cache_size_mb = 0.5 WHERE user_id = ?', [userId])
    const row = await fetchSettings(userId)
    res.json({ success: true, data: toSettings(row), message: '缓存已清理' })
  } catch (err) {
    next(err)
  }
})

router.post('/check-update', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const row = await ensureSettings(userId)
    res.json({
      success: true,
      data: {
        currentVersion: row.app_version,
        latestVersion: row.app_version,
        hasUpdate: false,
      },
      message: '当前已是最新版本',
    })
  } catch (err) {
    next(err)
  }
})

router.post('/delete-account', async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: '注销申请已提交，客服将在 3 个工作日内处理',
    })
  } catch (err) {
    next(err)
  }
})

export default router
