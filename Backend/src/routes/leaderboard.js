import { Router } from 'express'
import pool from '../config/db.js'
import { resolveUserId } from '../utils/auth.js'

const router = Router()

const BOARD_CONFIG = {
  focus: {
    label: '专注榜',
    metricLabel: '专注时长',
    columns: { today: 'focus_today', week: 'focus_week', month: 'focus_month' },
  },
  study: {
    label: '自习榜',
    metricLabel: '自习时长',
    columns: { today: 'study_today', week: 'study_week', month: 'study_month' },
  },
  growth: {
    label: '成长榜',
    metricLabel: '成长值',
    columns: { today: 'growth_today', week: 'growth_week', month: 'growth_month' },
  },
}

const PERIOD_LABELS = {
  today: '今日',
  week: '本周',
  month: '本月',
}

const STATUS_LABELS = {
  online: '在线',
  focusing: '专注中',
  offline: '离线',
}

function formatDuration(minutes, board) {
  if (board === 'growth') return `${minutes} 成长值`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function buildEntry(row, board, period, rank) {
  const column = BOARD_CONFIG[board].columns[period]
  const score = Number(row[column] || 0)
  return {
    rank,
    id: row.id,
    name: row.name,
    avatarSeed: row.avatar_seed || 'moon-night',
    avatarUrl: row.avatar_url || '',
    level: row.level,
    petEmoji: row.pet_emoji || '🦊',
    status: row.status || 'offline',
    statusLabel: STATUS_LABELS[row.status] || '离线',
    score,
    scoreLabel: formatDuration(score, board),
    isMe: Boolean(row.is_me),
  }
}

async function fetchCurrentUserEntry(userId, board, period) {
  const column = BOARD_CONFIG[board].columns[period]
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.level, u.streak_days,
            up.avatar_seed, up.avatar_url,
            p.name AS pet_name,
            CASE
              WHEN u.focus_today_minutes > 0 THEN 'focusing'
              WHEN u.streak_days >= 7 THEN 'online'
              ELSE 'offline'
            END AS status,
            u.focus_today_minutes AS focus_today,
            u.focus_week_minutes AS focus_week,
            (SELECT COALESCE(SUM(minutes), 0) FROM focus_records fr
             WHERE fr.user_id = u.id AND fr.record_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) AS focus_month,
            ROUND(u.focus_week_minutes * 0.82) AS study_today,
            ROUND(u.focus_week_minutes * 1.05) AS study_week,
            ROUND(u.focus_week_minutes * 4.2) AS study_month,
            ROUND(u.exp * 0.04) AS growth_today,
            ROUND(u.exp * 0.28) AS growth_week,
            ROUND(u.exp * 1.15) AS growth_month
     FROM users u
     LEFT JOIN user_profiles up ON up.user_id = u.id
     LEFT JOIN pets p ON p.user_id = u.id
     WHERE u.id = ?`,
    [userId],
  )
  if (!rows.length) return null

  const row = rows[0]
  const petEmojiMap = { 小橙: '🦊', 小狐狸: '🦊' }
  return {
    id: `me-${row.id}`,
    name: row.name,
    avatar_seed: row.avatar_seed || 'moon-night',
    avatar_url: row.avatar_url || '',
    level: row.level,
    pet_emoji: petEmojiMap[row.pet_name] || '🦊',
    status: row.status,
    focus_today: Number(row.focus_today || 0),
    focus_week: Number(row.focus_week || 0),
    focus_month: Number(row.focus_month || 0),
    study_today: Number(row.study_today || 0),
    study_week: Number(row.study_week || 0),
    study_month: Number(row.study_month || 0),
    growth_today: Number(row.growth_today || 0),
    growth_week: Number(row.growth_week || 0),
    growth_month: Number(row.growth_month || 0),
    streak_days: row.streak_days,
    is_me: true,
  }
}

router.get('/', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const board = BOARD_CONFIG[req.query.board] ? req.query.board : 'focus'
    const period = ['today', 'week', 'month'].includes(req.query.period) ? req.query.period : 'today'
    const column = BOARD_CONFIG[board].columns[period]

    const [rows] = await pool.query(
      `SELECT id, name, avatar_seed, level, pet_emoji, status,
              focus_today, focus_week, focus_month,
              study_today, study_week, study_month,
              growth_today, growth_week, growth_month
       FROM leaderboard_users
       ORDER BY ${column} DESC, level DESC, id ASC`,
    )

    const me = await fetchCurrentUserEntry(userId, board, period)
    const combined = [...rows]
    if (me) combined.push(me)

    combined.sort((a, b) => {
      const diff = Number(b[column] || 0) - Number(a[column] || 0)
      if (diff !== 0) return diff
      return Number(b.level || 0) - Number(a.level || 0)
    })

    const ranked = combined.map((row, index) => buildEntry(row, board, period, index + 1))
    const meRank = ranked.find((item) => item.isMe)
    const top3 = ranked.slice(0, 3)
    const list = ranked.slice(3)

    res.json({
      success: true,
      data: {
        board,
        period,
        boardLabel: BOARD_CONFIG[board].label,
        periodLabel: PERIOD_LABELS[period],
        metricLabel: BOARD_CONFIG[board].metricLabel,
        tabs: Object.entries(BOARD_CONFIG).map(([key, value]) => ({
          key,
          label: value.label,
        })),
        periods: Object.entries(PERIOD_LABELS).map(([key, label]) => ({
          key,
          label,
        })),
        top3,
        list,
        myRank: meRank
          ? {
              ...meRank,
              rankChange: 5,
              streakDays: me?.streak_days || 0,
              focusTodayLabel: formatDuration(Number(me?.focus_today || 0), 'focus'),
            }
          : null,
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
