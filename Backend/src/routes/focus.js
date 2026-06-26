import { Router } from 'express'
import pool from '../config/db.js'

const router = Router()
const DEFAULT_USER_ID = 1

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
