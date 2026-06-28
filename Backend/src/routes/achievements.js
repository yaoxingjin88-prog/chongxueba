import { Router } from 'express'
import pool from '../config/db.js'
import { resolveUserId } from '../utils/auth.js'

const router = Router()

const MEDAL_ORDER = [
  'first_study', 'study_10h', 'study_50h', 'study_100h', 'perfect_week', 'night_owl',
  'first_focus', 'focus_1h', 'focus_3h', 'focus_marathon', 'flow_state',
  'streak_3', 'streak_7', 'streak_30', 'streak_100',
  'first_pet', 'pet_master', 'mall_first', 'collector',
]

router.get('/', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)

    const [users] = await pool.query('SELECT medals, total_medals FROM users WHERE id = ?', [userId])
    if (!users.length) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }

    const [medalRows] = await pool.query(
      'SELECT * FROM medals WHERE user_id = ?',
      [userId],
    )

    const orderMap = Object.fromEntries(MEDAL_ORDER.map((id, i) => [id, i]))
    medalRows.sort((a, b) => (orderMap[a.id] ?? 99) - (orderMap[b.id] ?? 99))

    const medals = medalRows.map((m) => ({
      id: m.id,
      name: m.name,
      desc: m.description,
      icon: m.icon,
      category: m.category,
      earned: Boolean(m.earned),
      earnedDate: m.earned_date || undefined,
      rarity: m.rarity,
      color: m.color,
      progress: m.progress_current != null
        ? { current: Number(m.progress_current), total: Number(m.progress_total) }
        : undefined,
    }))

    const [petRows] = await pool.query('SELECT * FROM pet_catalog WHERE user_id = ?', [userId])
    const pets = petRows.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      unlocked: Boolean(p.unlocked),
      level: p.level,
      desc: p.description,
      condition: p.unlock_condition || undefined,
    }))

    const [memoryRows] = await pool.query(
      'SELECT * FROM growth_memories WHERE user_id = ? ORDER BY memory_date DESC, id DESC',
      [userId],
    )
    const memories = memoryRows.map((m) => ({
      id: m.id,
      date: m.memory_date instanceof Date
        ? m.memory_date.toISOString().slice(0, 10)
        : String(m.memory_date).slice(0, 10),
      title: m.title,
      desc: m.description,
      icon: m.icon,
      color: m.color,
    }))

    const earnedCount = medals.filter((m) => m.earned).length
    const recentMedals = medals
      .filter((m) => m.earned && m.earnedDate)
      .slice(0, 3)
      .map((m) => ({
        name: m.name,
        date: m.earnedDate,
        theme: m.color,
      }))

    res.json({
      success: true,
      data: {
        medals,
        pets,
        memories,
        earnedCount,
        totalMedals: users[0].total_medals,
        recentMedals,
        allMedals: medals.map(({ id, name, desc, earned, color }) => ({
          id,
          name,
          desc,
          earned,
          theme: color,
        })),
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
