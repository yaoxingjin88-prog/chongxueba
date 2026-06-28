import pool from '../config/db.js'

export const DEFAULT_USER_ID = 1
export const MAX_CHEST_OPENS_PER_DAY = 3

const UNIT_LABELS = {
  minutes: '分钟',
  days: '天',
  times: '次',
  次: '次',
}

export const CHEST_TIERS = [
  {
    tier: 1, threshold: 20, label: '新手', exp: 30, coins: 20, gems: 0,
    preview: [
      { icon: 'bolt', label: 'EXP', amount: 30 },
      { icon: 'coins', label: '学豆', amount: 20 },
    ],
  },
  {
    tier: 2, threshold: 40, label: '进阶', exp: 50, coins: 40, gems: 0,
    preview: [
      { icon: 'bolt', label: 'EXP', amount: 50 },
      { icon: 'coins', label: '学豆', amount: 40 },
      { icon: 'star', label: '星尘', amount: 5 },
    ],
  },
  {
    tier: 3, threshold: 60, label: '精英', exp: 80, coins: 60, gems: 5,
    preview: [
      { icon: 'bolt', label: 'EXP', amount: 80 },
      { icon: 'coins', label: '学豆', amount: 60 },
      { icon: 'gem', label: '宝石', amount: 5 },
      { icon: 'paw', label: '宠物粮', amount: 3 },
    ],
  },
  {
    tier: 4, threshold: 80, label: '大师', exp: 120, coins: 100, gems: 10,
    preview: [
      { icon: 'bolt', label: 'EXP', amount: 120 },
      { icon: 'coins', label: '学豆', amount: 100 },
      { icon: 'gem', label: '宝石', amount: 10 },
      { icon: 'paw', label: '宠物饼干', amount: 5 },
    ],
  },
]

export const DIFFICULTY_LABELS = ['', '简单', '普通', '中等', '困难', '挑战']

function localDateStr(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getPeriodDate(type) {
  const now = new Date()
  if (type === 'daily') return localDateStr(now)
  if (type === 'weekly') {
    const day = now.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const monday = new Date(now)
    monday.setDate(now.getDate() + diff)
    return localDateStr(monday)
  }
  if (type === 'event') {
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}-01`
  }
  return '1970-01-01'
}

export function getWeekEndCountdown() {
  const now = new Date()
  const day = now.getDay()
  const daysUntilSunday = day === 0 ? 0 : 7 - day
  const end = new Date(now)
  end.setDate(now.getDate() + daysUntilSunday)
  end.setHours(23, 59, 59, 999)
  const ms = end - now
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms % 86400000) / 3600000),
    minutes: Math.floor((ms % 3600000) / 60000),
    seconds: Math.floor((ms % 60000) / 1000),
    totalMs: ms,
  }
}

export function getEventEndCountdown() {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  const ms = Math.max(0, end - now)
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms % 86400000) / 3600000),
    minutes: Math.floor((ms % 3600000) / 60000),
    seconds: Math.floor((ms % 60000) / 1000),
    totalMs: ms,
  }
}

export function parseJsonField(value, fallback = null) {
  if (!value) return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function formatProgress(current, target, unit = 'times') {
  const label = UNIT_LABELS[unit] || unit || '次'
  if (unit === 'minutes') return `${current}/${target} ${label}`
  if (unit === 'days') return `${current}/${target} ${label}`
  return `${current}/${target}`
}

export function calcActivity(rows) {
  return Math.min(
    100,
    Math.round(
      rows.filter((t) => t.type === 'daily').reduce((sum, t) => {
        if (t.done) return sum + 20
        return sum + Math.min((t.current_count || 0) / t.target_count, 1) * 15
      }, 0),
    ),
  )
}

export function mapTaskRow(t) {
  const current = t.current_count || 0
  const target = t.target_count
  const unit = t.progress_unit || 'times'
  const progressPercent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0

  return {
    id: t.id,
    type: t.type,
    icon: t.icon,
    title: t.title,
    description: t.description || '',
    difficulty: t.difficulty || 3,
    difficultyLabel: DIFFICULTY_LABELS[t.difficulty] || '中等',
    progress: formatProgress(current, target, unit),
    progressUnit: unit,
    currentCount: current,
    targetCount: target,
    progressPercent,
    exp: t.exp_reward,
    coins: t.coin_reward,
    done: Boolean(t.done),
    color: t.color,
    steps: parseJsonField(t.steps, []),
    petRewards: parseJsonField(t.pet_rewards, {}),
    actionRoute: t.action_route || null,
  }
}

export async function syncFocusTaskProgress(userId, rows) {
  const [users] = await pool.query(
    'SELECT focus_today_minutes FROM users WHERE id = ?',
    [userId],
  )
  const minutes = users[0]?.focus_today_minutes || 0
  for (const row of rows) {
    if (row.type === 'daily' && row.icon === 'clock') {
      row.current_count = Math.min(minutes, row.target_count)
      row.done = minutes >= row.target_count ? 1 : 0
    }
  }
  return rows
}

export async function fetchTasksWithProgress(userId, type) {
  const periodDate = getPeriodDate(type)
  const [rows] = await pool.query(
    `SELECT t.*, ut.current_count, ut.done, ut.completed_at
     FROM tasks t
     LEFT JOIN user_tasks ut ON ut.task_id = t.id
       AND ut.user_id = ? AND ut.activity_date = ?
     WHERE t.type = ?
     ORDER BY t.sort_order`,
    [userId, periodDate, type],
  )
  if (type === 'daily') await syncFocusTaskProgress(userId, rows)
  return rows
}

export async function fetchTaskDetail(userId, taskId) {
  const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId])
  if (!tasks.length) return null

  const task = tasks[0]
  const periodDate = getPeriodDate(task.type)

  const [progress] = await pool.query(
    `SELECT current_count, done FROM user_tasks
     WHERE user_id = ? AND task_id = ? AND activity_date = ?`,
    [userId, taskId, periodDate],
  )

  const row = {
    ...task,
    current_count: progress[0]?.current_count || 0,
    done: progress[0]?.done || 0,
  }

  if (task.type === 'daily') await syncFocusTaskProgress(userId, [row])
  return row
}

export async function applyPetRewards(userId, petRewards) {
  if (!petRewards || typeof petRewards !== 'object') return
  const focus = petRewards.focus || 0
  const study = petRewards.study || 0
  const memory = petRewards.memory || 0
  const discipline = petRewards.discipline || 0
  const intimacy = petRewards.intimacy || 0

  if (focus || study || memory || discipline) {
    await pool.query(
      `UPDATE pets SET
         focus_power = focus_power + ?,
         study_power = study_power + ?,
         memory_power = memory_power + ?,
         discipline_power = discipline_power + ?
       WHERE user_id = ?`,
      [focus, study, memory, discipline, userId],
    )
  }
  if (intimacy) {
    await pool.query(
      'UPDATE users SET mood = LEAST(100, mood + ?) WHERE id = ?',
      [Math.min(intimacy, 20), userId],
    )
  }
}

export async function completeTaskForUser(userId, taskId) {
  const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId])
  if (!tasks.length) return null

  const task = tasks[0]
  const periodDate = getPeriodDate(task.type)

  const [existing] = await pool.query(
    `SELECT done FROM user_tasks
     WHERE user_id = ? AND task_id = ? AND activity_date = ?`,
    [userId, taskId, periodDate],
  )
  if (existing.length && existing[0].done) {
    return { alreadyDone: true, task }
  }

  await pool.query(
    `INSERT INTO user_tasks (user_id, task_id, current_count, done, activity_date, completed_at)
     VALUES (?, ?, ?, 1, ?, NOW())
     ON DUPLICATE KEY UPDATE current_count = ?, done = 1, completed_at = NOW()`,
    [userId, taskId, task.target_count, periodDate, task.target_count],
  )

  await pool.query(
    'UPDATE users SET exp = exp + ?, coins = coins + ? WHERE id = ?',
    [task.exp_reward, task.coin_reward, userId],
  )

  const petRewards = parseJsonField(task.pet_rewards, {})
  await applyPetRewards(userId, petRewards)

  return { task, petRewards, periodDate }
}

export function getChestStatusMessage(currentActivity, chests, remainingOpens) {
  const claimable = chests.find((c) => c.canClaim)
  if (claimable) return `可开启「${claimable.label}」宝箱`
  if (remainingOpens <= 0) return '今日开启次数已用完'
  const next = chests.find((c) => !c.reached && !c.claimed)
  if (next) {
    const need = next.threshold - currentActivity
    return `还差 ${need} 活跃度开启「${next.label}」宝箱`
  }
  if (chests.every((c) => c.claimed)) return '今日宝箱已全部领取'
  return '完成任务提升活跃度'
}

export function getCheckInDayReward(dayOfMonth) {
  const cycle = [10, 10, 20, 20, 30, 30, 50]
  const coins = cycle[(dayOfMonth - 1) % 7]
  const hasStar = dayOfMonth % 7 === 0
  return { coins, exp: 30, hasStar, hasCoin: true }
}
