import { buildPetNurturePage } from './petNurture.js'

const STAGE_LABELS = {
  egg: '宠物蛋',
  baby: '幼宠',
  growth: '成长中',
  mature: '完全体',
}

const NURTURE_LABELS = {
  feed: '喂养',
  accompany_minutes: '陪伴',
  pomodoro: '番茄钟',
  train: '训练',
  bath: '洗澡',
  sleep: '睡眠',
}

function formatDate(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function daysSince(value) {
  const start = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(start.getTime())) return 0
  const now = new Date()
  start.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.max(1, Math.round((now - start) / 86400000) + 1)
}

function buildPersonalityTags(stats = {}) {
  const tags = []
  if (stats.studyPower >= 220) tags.push({ label: '好学', color: '#4ade80' })
  if (stats.focusPower >= 200) tags.push({ label: '专注', color: '#60a5fa' })
  if (stats.vitality >= 180) tags.push({ label: '活泼', color: '#fbbf24' })
  if (stats.intimacy >= 200) tags.push({ label: '粘人', color: '#f472b6' })
  if (!tags.length) tags.push({ label: '温柔', color: '#c084fc' })
  return tags.slice(0, 4)
}

function buildMilestones(pet, stage, level) {
  const items = [
    { key: 'meet', title: '初次相遇', desc: `领养了${pet.name}，开启学习伙伴之旅`, icon: 'heart', done: true },
    { key: 'baby', title: '破壳成长', desc: '从宠物蛋孵化成为幼宠', icon: 'egg', done: ['baby', 'growth', 'mature'].includes(stage) },
    { key: 'growth', title: '进入成长期', desc: '体态逐渐长大，属性全面提升', icon: 'paw', done: ['growth', 'mature'].includes(stage) },
    { key: 'lv10', title: 'Lv.10 里程碑', desc: '完成第一阶段成长', icon: 'star', done: level >= 10 },
    { key: 'lv20', title: 'Lv.20 里程碑', desc: '解锁更多互动与奖励', icon: 'trophy', done: level >= 20 },
    { key: 'mature', title: '完全体进化', desc: '达到最终形态（Lv.30）', icon: 'dragon', done: stage === 'mature' || level >= 30 },
  ]
  return items
}

export async function buildPetProfile(pool, userId) {
  const page = await buildPetNurturePage(pool, userId)
  if (!page) return null

  const [[user]] = await pool.query(
    'SELECT created_at, streak_days, mood FROM users WHERE id = ?',
    [userId],
  )

  const [[petRow]] = await pool.query(
    'SELECT stage, level, name FROM pets WHERE user_id = ?',
    [userId],
  )

  let nurtureTotals = []
  try {
    const [rows] = await pool.query(
      `SELECT nurture_key, SUM(count_value) AS total
       FROM pet_nurture_daily WHERE user_id = ? GROUP BY nurture_key`,
      [userId],
    )
    nurtureTotals = rows
  } catch {
    nurtureTotals = []
  }

  let focusTotal = 0
  try {
    const [[row]] = await pool.query(
      'SELECT COALESCE(SUM(minutes), 0) AS total FROM focus_records WHERE user_id = ?',
      [userId],
    )
    focusTotal = Number(row?.total || 0)
  } catch {
    focusTotal = 0
  }

  let memories = []
  try {
    const [rows] = await pool.query(
      `SELECT memory_date, title, description, icon, color
       FROM growth_memories WHERE user_id = ?
       AND (title LIKE '%宠物%' OR title LIKE '%小橙%' OR description LIKE '%宠物%')
       ORDER BY memory_date DESC LIMIT 5`,
      [userId],
    )
    memories = rows.map((row) => ({
      date: formatDate(row.memory_date),
      title: row.title,
      desc: row.description,
      icon: row.icon,
      color: row.color,
    }))
  } catch {
    memories = []
  }

  const adoptDate = user?.created_at
  const companionDays = daysSince(adoptDate)
  const stage = petRow?.stage || 'growth'
  const level = petRow?.level || page.profile.level

  const interactions = nurtureTotals.map((row) => ({
    key: row.nurture_key,
    label: NURTURE_LABELS[row.nurture_key] || row.nurture_key,
    count: Number(row.total) || 0,
  })).filter((item) => item.count > 0)

  const totalInteractions = interactions.reduce((sum, item) => sum + item.count, 0)

  return {
    ...page,
    archive: {
      species: '星光灵狐',
      speciesDesc: '擅长陪伴学习的幻想系灵宠，会随着主人专注成长而进化。',
      stageLabel: STAGE_LABELS[stage] || '成长中',
      adoptDate: formatDate(adoptDate),
      companionDays,
      streakDays: user?.streak_days ?? 0,
      mood: user?.mood ?? page.mood,
      focusTotalHours: Math.round(focusTotal / 60),
      totalInteractions,
      personalityTags: buildPersonalityTags(page.stats),
      milestones: buildMilestones(petRow || page.profile, stage, level),
      interactions,
      memories,
      bio: `${page.profile.petName}是一只${STAGE_LABELS[stage] || '成长中'}的星光灵狐，已陪伴${page.profile.ownerName || '你'} ${companionDays} 天。累计专注 ${Math.round(focusTotal / 60)} 小时，是最可靠的学习搭子。`,
    },
  }
}
