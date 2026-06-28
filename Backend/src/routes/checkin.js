import { Router } from 'express'
import pool from '../config/db.js'
import { resolveUserId } from '../utils/auth.js'
import { checkAndUnlockAchievements, recordCoinTx, updateStreakDays } from '../services/achievementService.js'
import { getCheckInDayReward } from '../services/taskService.js'

const router = Router()

function toDateKey(value) {
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
  }
  return String(value).slice(0, 10)
}

async function ensurePresetItems(userId) {
  const [rows] = await pool.query('SELECT id FROM check_in_items WHERE user_id = ? LIMIT 1', [userId])
  if (rows.length) return

  await pool.query(
    `INSERT INTO check_in_items (user_id, title, icon, is_preset, sort_order) VALUES
     (?, '早起学习', 'sun', 1, 1),
     (?, '完成专注', 'clock', 1, 2),
     (?, '阅读30分钟', 'book', 1, 3),
     (?, '运动锻炼', 'heart', 1, 4)`,
    [userId, userId, userId, userId],
  )
}

router.get('/items', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    await ensurePresetItems(userId)

    const [items] = await pool.query(
      'SELECT * FROM check_in_items WHERE user_id = ? ORDER BY sort_order, id',
      [userId],
    )

    const [checked] = await pool.query(
      'SELECT item_id FROM check_ins WHERE user_id = ? AND check_date = CURDATE()',
      [userId],
    )
    const checkedSet = new Set(checked.map((r) => r.item_id))

    res.json({
      success: true,
      data: items.map((item) => ({
        id: item.id,
        title: item.title,
        icon: item.icon,
        isPreset: Boolean(item.is_preset),
        checked: checkedSet.has(item.id),
      })),
    })
  } catch (err) {
    next(err)
  }
})

router.post('/items', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const title = String(req.body.title || '').trim()
    const icon = String(req.body.icon || 'check').trim()

    if (!title) {
      return res.status(400).json({ success: false, message: '打卡项名称不能为空' })
    }

    const [result] = await pool.query(
      'INSERT INTO check_in_items (user_id, title, icon, is_preset, sort_order) VALUES (?, ?, ?, 0, 99)',
      [userId, title, icon],
    )

    res.json({
      success: true,
      data: { id: result.insertId, title, icon, isPreset: false, checked: false },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const itemId = Number(req.body.itemId)

    const [items] = await pool.query(
      'SELECT * FROM check_in_items WHERE id = ? AND user_id = ?',
      [itemId, userId],
    )
    if (!items.length) {
      return res.status(404).json({ success: false, message: '打卡项不存在' })
    }

    const [existing] = await pool.query(
      'SELECT id FROM check_ins WHERE user_id = ? AND item_id = ? AND check_date = CURDATE()',
      [userId, itemId],
    )
    if (existing.length) {
      return res.status(400).json({ success: false, message: '今日已打卡' })
    }

    await pool.query(
      'INSERT INTO check_ins (user_id, item_id, check_date) VALUES (?, ?, CURDATE())',
      [userId, itemId],
    )

    const coinReward = 20
    const expReward = 30
    await pool.query(
      'UPDATE users SET coins = coins + ?, exp = exp + ?, mood = LEAST(100, mood + 3) WHERE id = ?',
      [coinReward, expReward, userId],
    )
    await recordCoinTx(userId, coinReward, 'checkin', String(itemId))

    const streakDays = await updateStreakDays(userId)

    if (streakDays === 7) {
      await pool.query('UPDATE users SET coins = coins + 200, exp = exp + 300 WHERE id = ?', [userId])
      await recordCoinTx(userId, 200, 'checkin_streak_7', null)
    }

    const unlocked = await checkAndUnlockAchievements(userId)

    res.json({
      success: true,
      message: '打卡成功',
      data: { coinReward, expReward, streakDays, unlocked },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/calendar', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const month = req.query.month || new Date().toISOString().slice(0, 7)

    const [rows] = await pool.query(
      `SELECT check_date AS d, COUNT(*) AS count
       FROM check_ins
       WHERE user_id = ? AND DATE_FORMAT(check_date, '%Y-%m') = ?
       GROUP BY check_date`,
      [userId, month],
    )

    const [[userRow]] = await pool.query('SELECT streak_days FROM users WHERE id = ?', [userId])

    res.json({
      success: true,
      data: {
        month,
        streakDays: userRow?.streak_days || 0,
        todayReward: { exp: 30, coins: 20 },
        days: rows.map((r) => {
          const dateStr = toDateKey(r.d)
          const dayNum = Number(dateStr.split('-')[2])
          return {
            date: dateStr,
            count: r.count,
            reward: getCheckInDayReward(dayNum),
          }
        }),
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
