import { Router } from 'express'
import pool from '../config/db.js'

const router = Router()
const DEFAULT_USER_ID = 1

const STAGES = [
  { icon: 'egg', label: '蛋', key: 'egg' },
  { icon: 'seedling', label: '幼年', key: 'baby' },
  { icon: 'paw', label: '成长', key: 'growth' },
  { icon: 'dragon', label: '成熟', key: 'mature' },
]

router.get('/', async (req, res, next) => {
  try {
    const userId = Number(req.query.userId) || DEFAULT_USER_ID

    const [rows] = await pool.query(
      `SELECT p.*, u.exp, u.exp_max
       FROM pets p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = ?`,
      [userId],
    )
    if (!rows.length) {
      return res.status(404).json({ success: false, message: '宠物不存在' })
    }
    const pet = rows[0]
    const currentIndex = STAGES.findIndex((s) => s.key === pet.stage)

    res.json({
      success: true,
      data: {
        name: pet.name,
        level: pet.level,
        exp: pet.exp,
        expMax: pet.exp_max,
        evolutionStages: STAGES.map((s, i) => ({
          icon: s.icon,
          label: s.label,
          active: i === currentIndex,
          locked: i > currentIndex,
        })),
        attributes: [
          { label: '学习力', value: pet.study_power, icon: 'book', color: '#a78bfa' },
          { label: '专注力', value: pet.focus_power, icon: 'brain', color: '#60a5fa' },
          { label: '记忆力', value: pet.memory_power, icon: 'eye', color: '#34d399' },
          { label: '自律力', value: pet.discipline_power, icon: 'shield', color: '#f472b6' },
        ],
      },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/feed', async (req, res, next) => {
  try {
    const userId = Number(req.body.userId) || DEFAULT_USER_ID

    await pool.query(
      'UPDATE users SET fullness = LEAST(100, fullness + 15), coins = GREATEST(0, coins - 10) WHERE id = ?',
      [userId],
    )

    const [users] = await pool.query('SELECT fullness, coins FROM users WHERE id = ?', [userId])

    const [tasks] = await pool.query(
      `SELECT t.id, t.target_count FROM tasks t
       WHERE t.type = 'daily' AND t.icon = 'paw' LIMIT 1`,
    )
    if (tasks.length) {
      await pool.query(
        `INSERT INTO user_tasks (user_id, task_id, current_count, done, activity_date)
         VALUES (?, ?, 1, 1, CURDATE())
         ON DUPLICATE KEY UPDATE current_count = 1, done = 1`,
        [userId, tasks[0].id],
      )
    }

    res.json({
      success: true,
      message: '喂养成功',
      data: { fullness: users[0].fullness, coins: users[0].coins },
    })
  } catch (err) {
    next(err)
  }
})

export default router
