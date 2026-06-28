const EVOLUTION_STAGES = [
  { key: 'egg', label: '宠物蛋', icon: 'egg' },
  { key: 'baby', label: '幼宠', icon: 'seedling' },
  { key: 'growth', label: '成长中', icon: 'paw' },
  { key: 'mature', label: '完全体', icon: 'dragon' },
]

const NURTURE_TASKS = [
  { key: 'focus25', title: '专注学习25分钟', target: 25, unit: 'min' },
  { key: 'pomodoro3', title: '完成3个番茄钟', target: 3, unit: 'count' },
  { key: 'feed1', title: '进行一次喂养', target: 1, unit: 'count' },
  { key: 'accompany10', title: '陪伴宠物10分钟', target: 10, unit: 'min' },
]

const GROWTH_REWARDS = [
  { key: 'crystal', name: '星光结晶', amount: 20, icon: '✨', locked: false },
  { key: 'collar', name: '彩虹项圈', amount: 1, icon: '🎀', locked: true },
  { key: 'nest', name: '云朵小窝', amount: 1, icon: '☁️', locked: true },
]

const ACTION_CONFIG = {
  feed: { label: '喂养', coinCost: 10, intimacy: 8, vitality: 5, fullness: 15 },
  accompany: { label: '陪伴', coinCost: 0, intimacy: 12, vitality: 3, minutes: 2 },
  train: { label: '训练', coinCost: 5, studyPower: 2, focusPower: 2 },
  bath: { label: '洗澡', coinCost: 8, vitality: 10, intimacy: 5 },
  sleep: { label: '睡眠', coinCost: 0, vitality: 15, mood: 5 },
}

async function getNurtureCounts(pool, userId) {
  const [rows] = await pool.query(
    `SELECT nurture_key, count_value FROM pet_nurture_daily
     WHERE user_id = ? AND activity_date = CURDATE()`,
    [userId],
  )
  const map = {}
  for (const row of rows) {
    map[row.nurture_key] = Number(row.count_value) || 0
  }
  return map
}

async function bumpNurture(pool, userId, key, delta = 1) {
  await pool.query(
    `INSERT INTO pet_nurture_daily (user_id, nurture_key, count_value, activity_date)
     VALUES (?, ?, ?, CURDATE())
     ON DUPLICATE KEY UPDATE count_value = count_value + VALUES(count_value)`,
    [userId, key, delta],
  )
}

async function getFeedTaskDone(pool, userId) {
  const [[row]] = await pool.query(
    `SELECT ut.done FROM user_tasks ut
     INNER JOIN tasks t ON t.id = ut.task_id
     WHERE ut.user_id = ? AND ut.activity_date = CURDATE()
       AND t.type = 'daily' AND t.icon = 'paw'
     LIMIT 1`,
    [userId],
  )
  return Boolean(row?.done)
}

function buildEvolutionStages(currentKey) {
  const currentIndex = EVOLUTION_STAGES.findIndex((s) => s.key === currentKey)
  const idx = currentIndex >= 0 ? currentIndex : 2
  return EVOLUTION_STAGES.map((stage, i) => ({
    ...stage,
    active: i === idx,
    locked: i > idx,
  }))
}

function buildAttributes(pet) {
  return [
    { key: 'study', label: '学习力', value: pet.study_power, max: 500, color: '#4ade80', icon: 'book' },
    { key: 'focus', label: '专注力', value: pet.focus_power, max: 500, color: '#60a5fa', icon: 'brain' },
    { key: 'vitality', label: '活力', value: pet.vitality ?? pet.memory_power, max: 500, color: '#fbbf24', icon: 'bolt' },
    { key: 'intimacy', label: '亲密度', value: pet.discipline_power, max: 500, color: '#f472b6', icon: 'heart' },
  ]
}

async function buildDailyTasks(pool, userId, userRow, nurtureCounts) {
  const feedDone = await getFeedTaskDone(pool, userId)
  const focusMinutes = Number(userRow.focus_today_minutes) || 0
  const pomodoro = nurtureCounts.pomodoro || 0
  const accompany = nurtureCounts.accompany_minutes || 0

  const defs = [
    { key: 'focus25', current: Math.min(25, focusMinutes) },
    { key: 'pomodoro3', current: Math.min(3, pomodoro) },
    { key: 'feed1', current: feedDone ? 1 : (nurtureCounts.feed || 0) },
    { key: 'accompany10', current: Math.min(10, accompany) },
  ]

  return NURTURE_TASKS.map((task, i) => {
    const current = defs[i]?.current ?? 0
    const done = current >= task.target
    return {
      key: task.key,
      title: task.title,
      current,
      target: task.target,
      done,
      progressLabel: task.unit === 'min' ? `${current}/${task.target}` : `${current}/${task.target}`,
    }
  })
}

function buildGrowthRewards(pet, userRow) {
  const targetLevel = 25
  const progress = pet.exp ?? 1260
  const progressMax = pet.exp_max ?? 2000
  const claimable = pet.level >= targetLevel
  return {
    targetLevel,
    claimable,
    claimLabel: claimable ? '可领取' : `Lv.${targetLevel} 可领取`,
    progress,
    progressMax,
    progressLabel: `${progress}/${progressMax}`,
    items: GROWTH_REWARDS.map((item) => ({
      ...item,
      locked: item.locked || pet.level < targetLevel,
    })),
  }
}

const CATEGORY_TO_INT = { skin: 1, furniture: 2, prop: 3, limited: 4, all: 0 }

async function getEquippedOutfit(pool, userId) {
  try {
    const [rows] = await pool.query(
      `SELECT m.icon AS image, m.name, m.category
       FROM mall_outfit_items oi
       JOIN mall_items m ON m.id = oi.item_id
       WHERE oi.outfit_id = (
         SELECT id FROM mall_outfits WHERE user_id = ? AND name = 'default' LIMIT 1
       )`,
      [userId],
    )
    return rows.map((row) => ({
      name: row.name,
      image: row.image,
      category: CATEGORY_TO_INT[row.category] ?? 0,
    }))
  } catch {
    return []
  }
}

export async function buildPetNurturePage(pool, userId) {
  const [[pet]] = await pool.query(
    `SELECT p.*, u.exp AS user_exp, u.exp_max AS user_exp_max, u.coins, u.gems,
            u.fullness, u.mood, u.focus_today_minutes, u.name AS owner_name
     FROM pets p
     JOIN users u ON u.id = p.user_id
     WHERE p.user_id = ?`,
    [userId],
  )
  if (!pet) return null

  const [[profile]] = await pool.query(
    'SELECT avatar_seed, avatar_url, gender FROM user_profiles WHERE user_id = ?',
    [userId],
  )

  const nurtureCounts = await getNurtureCounts(pool, userId)
  const dailyTasks = await buildDailyTasks(pool, userId, pet, nurtureCounts)
  const allTasksDone = dailyTasks.every((t) => t.done)

  const intimacyExp = pet.intimacy_exp ?? 320
  const intimacyMax = pet.intimacy_exp_max ?? 500
  const rewardAvailable = intimacyExp >= intimacyMax * 0.8

  return {
    profile: {
      name: `${pet.name}同学`,
      petName: pet.name,
      gender: profile?.gender || 'male',
      level: pet.level,
      exp: pet.exp ?? 1260,
      expMax: pet.exp_max ?? 2000,
      growthStars: pet.growth_stars ?? pet.level,
      avatarSeed: profile?.avatar_seed || 'xiaocheng',
      avatarUrl: profile?.avatar_url || '',
      ownerName: pet.owner_name,
    },
    stats: {
      studyPower: pet.study_power,
      focusPower: pet.focus_power,
      vitality: pet.vitality ?? pet.memory_power,
      intimacy: pet.discipline_power,
    },
    intimacy: {
      level: pet.intimacy_level ?? 4,
      current: intimacyExp,
      max: intimacyMax,
      rewardAvailable,
    },
    evolutionStages: buildEvolutionStages(pet.stage || 'growth'),
    attributes: buildAttributes(pet),
    actions: Object.entries(ACTION_CONFIG).map(([key, cfg]) => ({
      key,
      label: cfg.label,
      coinCost: cfg.coinCost,
    })),
    dailyTasks,
    taskBonus: {
      stars: 60,
      coins: 50,
      allComplete: allTasksDone,
      label: allTasksDone ? '今日奖励已就绪' : '全部完成可获得',
    },
    growthRewards: buildGrowthRewards(pet, pet),
    equippedOutfit: await getEquippedOutfit(pool, userId),
    coins: pet.coins,
    gems: pet.gems,
    fullness: pet.fullness,
    mood: pet.mood,
  }
}

export async function performPetAction(pool, userId, actionType) {
  const cfg = ACTION_CONFIG[actionType]
  if (!cfg) throw new Error('未知互动类型')

  const [[pet]] = await pool.query(
    `SELECT p.*, u.coins, u.fullness, u.mood FROM pets p
     JOIN users u ON u.id = p.user_id WHERE p.user_id = ?`,
    [userId],
  )
  if (!pet) throw new Error('宠物不存在')

  if (cfg.coinCost > 0 && pet.coins < cfg.coinCost) {
    throw new Error('金币不足')
  }

  const updates = []
  const userUpdates = []
  const params = []
  const userParams = []

  if (cfg.coinCost > 0) {
    userUpdates.push('coins = coins - ?')
    userParams.push(cfg.coinCost)
  }
  if (cfg.fullness) {
    userUpdates.push('fullness = LEAST(100, fullness + ?)')
    userParams.push(cfg.fullness)
  }
  if (cfg.mood) {
    userUpdates.push('mood = LEAST(100, mood + ?)')
    userParams.push(cfg.mood)
  }
  if (cfg.studyPower) {
    updates.push('study_power = LEAST(500, study_power + ?)')
    params.push(cfg.studyPower)
  }
  if (cfg.focusPower) {
    updates.push('focus_power = LEAST(500, focus_power + ?)')
    params.push(cfg.focusPower)
  }
  if (cfg.vitality) {
    updates.push('vitality = LEAST(500, COALESCE(vitality, memory_power) + ?)')
    params.push(cfg.vitality)
  }
  if (cfg.intimacy) {
    updates.push('intimacy_exp = LEAST(COALESCE(intimacy_exp_max, 500), COALESCE(intimacy_exp, 0) + ?)')
    updates.push('discipline_power = LEAST(500, discipline_power + ?)')
    params.push(cfg.intimacy, Math.ceil(cfg.intimacy / 2))
  }

  if (updates.length) {
    await pool.query(
      `UPDATE pets SET ${updates.join(', ')} WHERE user_id = ?`,
      [...params, userId],
    )
  }
  if (userUpdates.length) {
    await pool.query(
      `UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`,
      [...userParams, userId],
    )
  }

  if (actionType === 'feed') {
    await bumpNurture(pool, userId, 'feed', 1)
    const [[feedTask]] = await pool.query(
      `SELECT id FROM tasks WHERE type = 'daily' AND icon = 'paw' LIMIT 1`,
    )
    if (feedTask) {
      await pool.query(
        `INSERT INTO user_tasks (user_id, task_id, current_count, done, activity_date)
         VALUES (?, ?, 1, 1, CURDATE())
         ON DUPLICATE KEY UPDATE current_count = 1, done = 1`,
        [userId, feedTask.id],
      )
    }
  }
  if (actionType === 'accompany') {
    await bumpNurture(pool, userId, 'accompany_minutes', cfg.minutes || 2)
  }

  return buildPetNurturePage(pool, userId)
}

export async function claimIntimacyReward(pool, userId) {
  const [[pet]] = await pool.query('SELECT intimacy_exp, intimacy_exp_max, growth_stars FROM pets WHERE user_id = ?', [userId])
  if (!pet) throw new Error('宠物不存在')

  const max = pet.intimacy_exp_max ?? 500
  if ((pet.intimacy_exp ?? 0) < max * 0.8) {
    throw new Error('亲密度还不够，继续陪伴小橙吧')
  }

  await pool.query(
    `UPDATE pets SET
       intimacy_exp = 0,
       intimacy_level = intimacy_level + 1,
       growth_stars = growth_stars + 5,
       exp = LEAST(COALESCE(exp_max, 2000), COALESCE(exp, 0) + 80)
     WHERE user_id = ?`,
    [userId],
  )
  await pool.query(
    'UPDATE users SET gems = gems + 3, coins = coins + 30 WHERE id = ?',
    [userId],
  )

  return buildPetNurturePage(pool, userId)
}

export { ACTION_CONFIG, EVOLUTION_STAGES }
