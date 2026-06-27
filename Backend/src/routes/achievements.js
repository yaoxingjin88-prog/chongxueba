import { Router } from 'express'
import pool from '../config/db.js'

const router = Router()
const DEFAULT_USER_ID = 1

router.get('/', async (req, res, next) => {
  try {
    const userId = Number(req.query.userId) || DEFAULT_USER_ID

    const [users] = await pool.query('SELECT medals, total_medals FROM users WHERE id = ?', [userId])
    if (!users.length) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }

    const [allRows] = await pool.query(
      `SELECT a.*, ua.earned_at
       FROM achievements a
       LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = ?
       ORDER BY a.id`,
      [userId],
    )

    const recentMedals = allRows
      .filter((a) => a.earned_at)
      .sort((a, b) => new Date(b.earned_at) - new Date(a.earned_at))
      .slice(0, 4)
      .map((a) => ({
        name: a.name,
        date: formatEarnedDate(a.earned_at),
        theme: a.badge_theme,
      }))

    const allMedals = allRows.map((a) => ({
      id: a.id,
      name: a.name,
      desc: a.description,
      earned: Boolean(a.earned_at),
      theme: a.theme,
    }))

    res.json({
      success: true,
      data: {
        medals: users[0].medals,
        totalMedals: users[0].total_medals,
        recentMedals,
        allMedals,
      },
    })
  } catch (err) {
    next(err)
  }
})

function formatEarnedDate(date) {
  const d = new Date(date)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default router
