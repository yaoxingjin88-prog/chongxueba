import { Router } from 'express'
import pool from '../config/db.js'
import { formatMinutes } from '../utils/format.js'

const router = Router()
const DEFAULT_USER_ID = 1

router.get('/:id?', async (req, res, next) => {
  try {
    const userId = Number(req.params.id) || DEFAULT_USER_ID
    const [rows] = await pool.query(
      `SELECT u.*, p.name AS pet_name, p.level AS pet_level
       FROM users u
       LEFT JOIN pets p ON p.user_id = u.id
       WHERE u.id = ?`,
      [userId],
    )
    if (!rows.length) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    const u = rows[0]
    res.json({
      success: true,
      data: {
        id: u.id,
        name: u.name,
        level: u.level,
        exp: u.exp,
        expMax: u.exp_max,
        coins: u.coins,
        gems: u.gems,
        streakDays: u.streak_days,
        focusToday: formatMinutes(u.focus_today_minutes),
        focusWeek: formatMinutes(u.focus_week_minutes),
        mood: u.mood,
        fullness: u.fullness,
        focus: u.focus_stat,
        petName: u.pet_name,
        petLevel: u.pet_level,
        medals: u.medals,
        totalMedals: u.total_medals,
        vip: Boolean(u.vip),
        ambientSound: u.ambient_sound || 'rain',
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
