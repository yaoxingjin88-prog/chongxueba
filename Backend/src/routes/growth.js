import { Router } from 'express'
import pool from '../config/db.js'
import { formatMinutes, formatDateLabel } from '../utils/format.js'

const router = Router()
const DEFAULT_USER_ID = 1

router.get('/', async (req, res, next) => {
  try {
    const userId = Number(req.query.userId) || DEFAULT_USER_ID

    const [users] = await pool.query(
      'SELECT streak_days, focus_week_minutes, level, exp FROM users WHERE id = ?',
      [userId],
    )
    if (!users.length) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    const user = users[0]

    const [records] = await pool.query(
      `SELECT record_date, minutes FROM focus_records
       WHERE user_id = ? AND record_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       ORDER BY record_date`,
      [userId],
    )

    const chartData = records.map((r) => ({
      day: formatDateLabel(r.record_date),
      value: Math.round((r.minutes / 60) * 100) / 100,
    }))

    const weekTotalHours = Math.round((user.focus_week_minutes / 60) * 100) / 100

    res.json({
      success: true,
      data: {
        weekLabel: '本周报告',
        focusWeek: formatMinutes(user.focus_week_minutes),
        streakDays: user.streak_days,
        weekChangePercent: 25,
        weekTotalHours,
        chartData,
        level: user.level,
        weekExpGain: 850,
        beatPercent: 92,
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
