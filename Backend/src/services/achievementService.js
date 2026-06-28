import pool from '../config/db.js'

function toDateKey(value) {
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
  }
  return String(value).slice(0, 10)
}

export async function recordCoinTx(userId, amount, reason, refId = null) {
  try {
    await pool.query(
      'INSERT INTO coin_transactions (user_id, amount, reason, ref_id) VALUES (?, ?, ?, ?)',
      [userId, amount, reason, refId],
    )
  } catch {
    // coin_transactions 表未迁移时忽略
  }
}

async function unlockAchievement(userId, achievementName) {
  const [achievements] = await pool.query(
    'SELECT id, name FROM achievements WHERE name = ?',
    [achievementName],
  )
  if (!achievements.length) return null

  const achievementId = achievements[0].id
  const [existing] = await pool.query(
    'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
    [userId, achievementId],
  )
  if (existing.length) return null

  await pool.query(
    'INSERT INTO user_achievements (user_id, achievement_id, earned_at) VALUES (?, ?, CURDATE())',
    [userId, achievementId],
  )
  await pool.query(
    'UPDATE users SET medals = medals + 1, coins = coins + 50 WHERE id = ?',
    [userId],
  )
  await recordCoinTx(userId, 50, 'achievement_unlock', String(achievementId))

  return achievements[0]
}

async function getFocusTotalMinutes(userId) {
  const [[row]] = await pool.query(
    'SELECT COALESCE(SUM(minutes), 0) AS total FROM focus_records WHERE user_id = ?',
    [userId],
  )
  return Number(row?.total || 0)
}

async function getTodayFocusMinutes(userId) {
  const [[row]] = await pool.query(
    'SELECT COALESCE(SUM(minutes), 0) AS total FROM focus_records WHERE user_id = ? AND record_date = CURDATE()',
    [userId],
  )
  return Number(row?.total || 0)
}

async function getFocusSessionCount(userId) {
  const [[row]] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM focus_records WHERE user_id = ? AND minutes >= 25',
    [userId],
  )
  return Number(row?.cnt || 0)
}

async function getStreakDays(userId) {
  const [[row]] = await pool.query('SELECT streak_days FROM users WHERE id = ?', [userId])
  return Number(row?.streak_days || 0)
}

async function getCompletedTaskRate(userId) {
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS total, SUM(CASE WHEN done = 1 THEN 1 ELSE 0 END) AS done_count
     FROM user_tasks WHERE user_id = ?`,
    [userId],
  )
  const total = Number(row?.total || 0)
  if (!total) return 0
  return Number(row.done_count || 0) / total
}

export async function checkAndUnlockAchievements(userId) {
  const unlocked = []
  const focusTotal = await getFocusTotalMinutes(userId)
  const todayFocus = await getTodayFocusMinutes(userId)
  const focusSessions = await getFocusSessionCount(userId)
  const streakDays = await getStreakDays(userId)
  const taskRate = await getCompletedTaskRate(userId)

  const rules = [
    { name: '初露锋芒', when: focusSessions >= 1 },
    { name: '专注大师', when: focusTotal >= 6000 },
    { name: '学霸之星', when: focusTotal >= 12000 },
    { name: '自律达人', when: streakDays >= 30 },
    { name: '百发百中', when: taskRate >= 1 && taskRate > 0 },
    {
      name: '飞速成长',
      when: async () => {
        const [[user]] = await pool.query('SELECT level FROM users WHERE id = ?', [userId])
        return Number(user?.level || 0) >= 30
      },
    },
    { name: '博览群书', when: focusSessions >= 50 },
  ]

  for (const rule of rules) {
    const passed = typeof rule.when === 'function' ? await rule.when() : rule.when
    if (!passed) continue
    const item = await unlockAchievement(userId, rule.name)
    if (item) unlocked.push(item)
  }

  if (todayFocus >= 480) {
    const item = await unlockAchievement(userId, '专注大师')
    if (item) unlocked.push(item)
  }

  return unlocked
}

export async function updateStreakDays(userId) {
  let dates = []
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT check_date AS d FROM check_ins
       WHERE user_id = ? ORDER BY d DESC`,
      [userId],
    )
    dates = rows
  } catch {
    await pool.query('UPDATE users SET streak_days = 0 WHERE id = ?', [userId])
    return 0
  }

  if (!dates.length) {
    await pool.query('UPDATE users SET streak_days = 0 WHERE id = ?', [userId])
    return 0
  }

  const dateSet = new Set(dates.map((row) => toDateKey(row.d)))
  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  while (true) {
    const key = toDateKey(cursor)
    if (!dateSet.has(key)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  await pool.query('UPDATE users SET streak_days = ? WHERE id = ?', [streak, userId])
  return streak
}

export async function unlockMedal(userId, medalId) {
  try {
    const [rows] = await pool.query(
      'SELECT id, earned FROM medals WHERE id = ? AND user_id = ?',
      [medalId, userId],
    )
    if (!rows.length || rows[0].earned) return null

    const now = new Date()
    const earnedDate = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    await pool.query(
      'UPDATE medals SET earned = 1, earned_date = ? WHERE id = ? AND user_id = ?',
      [earnedDate, medalId, userId],
    )
    await pool.query('UPDATE users SET medals = medals + 1 WHERE id = ?', [userId])
    await recordCoinTx(userId, 50, 'medal_unlock', medalId)

    return medalId
  } catch {
    return null
  }
}
