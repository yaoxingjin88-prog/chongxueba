import { formatMinutes, formatDateLabel } from './format.js'

function dateKey(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildDateRange(days) {
  const result = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    result.push(dateKey(d))
  }
  return result
}

async function sumFocusMinutes(pool, userId, startDate, endDate) {
  const [[row]] = await pool.query(
    `SELECT COALESCE(SUM(minutes), 0) AS total
     FROM focus_records
     WHERE user_id = ? AND record_date >= ? AND record_date <= ?`,
    [userId, startDate, endDate],
  )
  return Number(row?.total || 0)
}

async function fetchFocusMap(pool, userId, startDate, endDate) {
  const [rows] = await pool.query(
    `SELECT record_date, minutes FROM focus_records
     WHERE user_id = ? AND record_date >= ? AND record_date <= ?
     ORDER BY record_date`,
    [userId, startDate, endDate],
  )
  const map = new Map()
  rows.forEach((row) => {
    const key = dateKey(row.record_date)
    map.set(key, Number(row.minutes || 0))
  })
  return map
}

function calcChangePercent(current, previous) {
  if (previous <= 0) {
    return current > 0 ? 100 : 0
  }
  return Math.round(((current - previous) / previous) * 100)
}

async function estimateBeatPercent(pool, userId, totalMinutes, days) {
  const [[row]] = await pool.query(
    `SELECT
       COUNT(CASE WHEN user_id != ? THEN 1 END) AS others,
       SUM(CASE WHEN user_id != ? AND total < ? THEN 1 ELSE 0 END) AS beaten
     FROM (
       SELECT user_id, COALESCE(SUM(minutes), 0) AS total
       FROM focus_records
       WHERE record_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY user_id
     ) period_totals`,
    [userId, userId, totalMinutes, days - 1],
  )
  const others = Number(row?.others || 0)
  const beaten = Number(row?.beaten || 0)
  if (others <= 0) return 92
  return Math.min(99, Math.max(55, Math.round((beaten / others) * 100)))
}

export async function buildGrowthReport(pool, userId, period = 'week') {
  const isMonth = period === 'month'
  const days = isMonth ? 30 : 7
  const range = buildDateRange(days)
  const startDate = range[0]
  const endDate = range[range.length - 1]

  const prevEnd = new Date(startDate)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - (days - 1))

  const [users] = await pool.query(
    'SELECT streak_days, level, exp FROM users WHERE id = ?',
    [userId],
  )
  if (!users.length) return null
  const user = users[0]

  const focusMap = await fetchFocusMap(pool, userId, startDate, endDate)
  const chartData = range.map((day) => ({
    day: formatDateLabel(day),
    value: Math.round((focusMap.get(day) || 0) / 60 * 100) / 100,
  }))

  const totalMinutes = range.reduce((sum, day) => sum + (focusMap.get(day) || 0), 0)
  const prevTotalMinutes = await sumFocusMinutes(
    pool,
    userId,
    dateKey(prevStart),
    dateKey(prevEnd),
  )

  const periodExpGain = Math.round(totalMinutes * 0.45)
  const beatPercent = await estimateBeatPercent(pool, userId, totalMinutes, days)

  return {
    period,
    periodLabel: isMonth ? '本月报告' : '本周报告',
    compareLabel: isMonth ? '较上月' : '较上周',
    trendLabel: isMonth ? '本月' : '本周',
    focusDuration: formatMinutes(totalMinutes),
    focusDurationMinutes: totalMinutes,
    streakDays: user.streak_days,
    maxStreakDays: user.streak_days,
    changePercent: calcChangePercent(totalMinutes, prevTotalMinutes),
    totalHours: Math.round(totalMinutes / 60 * 100) / 100,
    chartData,
    level: user.level,
    periodExpGain,
    beatPercent,
  }
}
