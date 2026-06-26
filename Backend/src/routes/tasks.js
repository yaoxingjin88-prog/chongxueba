import { Router } from 'express'
import pool from '../config/db.js'

const router = Router()
const DEFAULT_USER_ID = 1

router.get('/', async (req, res, next) => {
  try {
    const userId = Number(req.query.userId) || DEFAULT_USER_ID
    const type = req.query.type || 'daily'
    const [rows] = await pool.query(
      `SELECT t.*, ut.current_count, ut.done
       FROM tasks t
       LEFT JOIN user_tasks ut ON ut.task_id = t.id
         AND ut.user_id = ? AND ut.activity_date = CURDATE()
       WHERE t.type = ?
       ORDER BY t.sort_order`,
      [userId, type],
    )

    const tasks = rows.map((t) => ({
      id: t.id,
      icon: t.icon,
      title: t.title,
      progress: `${t.current_count || 0}/${t.target_count}`,
      exp: t.exp_reward,
      coins: t.coin_reward,
      done: Boolean(t.done),
      color: t.color,
    }))

    const activity = rows.reduce((sum, t) => {
      if (t.done) return sum + 20
      return sum + Math.min((t.current_count || 0) / t.target_count, 1) * 15
    }, 0)

    res.json({
      success: true,
      data: {
        tasks,
        currentActivity: Math.min(100, Math.round(activity)),
      },
    })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/complete', async (req, res, next) => {
  try {
    const taskId = Number(req.params.id)
    const userId = Number(req.body.userId) || DEFAULT_USER_ID

    const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId])
    if (!tasks.length) {
      return res.status(404).json({ success: false, message: '任务不存在' })
    }
    const task = tasks[0]

    await pool.query(
      `INSERT INTO user_tasks (user_id, task_id, current_count, done, activity_date)
       VALUES (?, ?, ?, 1, CURDATE())
       ON DUPLICATE KEY UPDATE current_count = ?, done = 1`,
      [userId, taskId, task.target_count, task.target_count],
    )

    await pool.query(
      'UPDATE users SET exp = exp + ?, coins = coins + ? WHERE id = ?',
      [task.exp_reward, task.coin_reward, userId],
    )

    res.json({ success: true, message: '任务已完成', data: { exp: task.exp_reward, coins: task.coin_reward } })
  } catch (err) {
    next(err)
  }
})

export default router
