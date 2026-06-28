import { Router } from 'express'
import pool from '../config/db.js'
import { formatMinutes } from '../utils/format.js'
import { resolveUserId } from '../utils/auth.js'
import { syncVipStatus } from '../services/vipService.js'

const router = Router()
const DEFAULT_USER_ID = 1

const REASON_LABELS = {
  task_complete: '完成任务',
  checkin: '每日打卡',
  checkin_streak_7: '7日打卡奖励',
  chest_claim: '宝箱奖励',
  mall_purchase: '商城购买',
  mall_order: '商城结算',
  achievement_unlock: '成就奖励',
  medal_unlock: '勋章奖励',
  vip_subscribe: 'VIP开通',
}

function formatTxTime(value) {
  const d = value instanceof Date ? value : new Date(value)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()
  if (isToday) {
    return `今天 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  if (isYesterday) return '昨天'
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

router.get('/wallet', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const [users] = await pool.query('SELECT coins, gems FROM users WHERE id = ?', [userId])
    if (!users.length) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }

    let transactions = []
    try {
      const [rows] = await pool.query(
        `SELECT amount, reason, ref_id, created_at
         FROM coin_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 8`,
        [userId],
      )
      transactions = rows.map((row) => ({
        amount: row.amount,
        reason: row.reason,
        label: REASON_LABELS[row.reason] || '学豆变动',
        time: formatTxTime(row.created_at),
      }))
    } catch {
      transactions = []
    }

    res.json({
      success: true,
      data: {
        coins: users[0].coins,
        gems: users[0].gems,
        transactions,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/:id?', async (req, res, next) => {
  try {
    const userId = Number(req.params.id) || DEFAULT_USER_ID
    const [rows] = await pool.query(
      `SELECT u.*, p.name AS pet_name, p.level AS pet_level,
              up.avatar_seed, up.avatar_url,
              (SELECT COALESCE(SUM(minutes), 0) FROM focus_records fr WHERE fr.user_id = u.id) AS focus_total_minutes
       FROM users u
       LEFT JOIN pets p ON p.user_id = u.id
       LEFT JOIN user_profiles up ON up.user_id = u.id
       WHERE u.id = ?`,
      [userId],
    )
    if (!rows.length) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    const u = rows[0]
    const vipStatus = await syncVipStatus(u.id)
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
        focusTotalHours: Math.round(u.focus_total_minutes / 60),
        mood: u.mood,
        fullness: u.fullness,
        focus: u.focus_stat,
        petName: u.pet_name,
        petLevel: u.pet_level,
        medals: u.medals,
        totalMedals: u.total_medals,
        vip: vipStatus.active,
        vipExpiresAt: vipStatus.expiresAt,
        vipExpireLabel: vipStatus.expireLabel ? `${vipStatus.expireLabel}到期` : null,
        vipDaysLeft: vipStatus.daysLeft,
        ambientSound: u.ambient_sound || 'rain',
        avatarSeed: u.avatar_seed || 'moon-night',
        avatarUrl: u.avatar_url || '',
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
