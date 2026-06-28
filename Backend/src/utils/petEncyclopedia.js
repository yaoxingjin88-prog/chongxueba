const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'start', label: '入门' },
  { key: 'evolution', label: '进化' },
  { key: 'attr', label: '属性' },
  { key: 'action', label: '互动' },
  { key: 'task', label: '任务' },
]

const ARTICLES = [
  {
    id: 'welcome',
    category: 'start',
    icon: '🌟',
    title: '什么是宠物养成？',
    summary: '专注学习，陪伴成长，小橙会与你一起进步',
    content: '在宠学霸中，宠物是你的专属学伴。完成专注、喂养、陪伴等日常行为，宠物会获得经验与属性成长，并经历从宠物蛋到完全体的四个进化阶段。',
    tags: ['新手必读'],
  },
  {
    id: 'stage-egg',
    category: 'evolution',
    icon: '🥚',
    title: '宠物蛋阶段',
    summary: 'Lv.1 起 · 专注唤醒星光',
    content: '初始形态为星愿蛋。此阶段通过完成首次专注与登录任务积累孵化进度，保持每日上线可加速进入幼宠阶段。',
    unlockLevel: 1,
    stageKey: 'egg',
  },
  {
    id: 'stage-baby',
    category: 'evolution',
    icon: '🦊',
    title: '幼宠阶段',
    summary: 'Lv.5 解锁 · 好奇心旺盛',
    content: '破壳后进入幼宠形态，可开启喂养与陪伴互动。幼宠期建议每日完成至少 1 次喂养，快速提升亲密度与活力。',
    unlockLevel: 5,
    stageKey: 'baby',
  },
  {
    id: 'stage-growth',
    category: 'evolution',
    icon: '✨',
    title: '成长中阶段',
    summary: 'Lv.15 解锁 · 稳定学习节奏',
    content: '成长阶段属性提升加快，训练可显著增加学习力与专注力。配合自习室专注任务，可高效推进进化进度。',
    unlockLevel: 15,
    stageKey: 'growth',
  },
  {
    id: 'stage-mature',
    category: 'evolution',
    icon: '👑',
    title: '完全体阶段',
    summary: 'Lv.30 解锁 · 专属星光装扮',
    content: '达到完全体后解锁高级成长奖励与装扮。需长期保持专注打卡与每日养成任务，维持满属性状态。',
    unlockLevel: 30,
    stageKey: 'mature',
  },
  {
    id: 'attr-study',
    category: 'attr',
    icon: '📚',
    title: '学习力',
    summary: '影响任务完成效率与经验获取',
    content: '学习力通过训练、专注任务与成长奖励提升，上限 500。学习力越高，完成每日任务时获得的宠物经验越多。',
    statKey: 'studyPower',
  },
  {
    id: 'attr-focus',
    category: 'attr',
    icon: '🎯',
    title: '专注力',
    summary: '与自习室专注行为正相关',
    content: '专注力随视频/番茄钟专注时长增长。在自习室开启 AI 专注感知并完成有效专注，可同步提升该属性。',
    statKey: 'focusPower',
  },
  {
    id: 'attr-vitality',
    category: 'attr',
    icon: '⚡',
    title: '活力',
    summary: '反映宠物精神状态',
    content: '活力通过喂养、洗澡、睡眠恢复。活力过低时建议先完成睡眠或洗澡互动，再进行训练。',
    statKey: 'vitality',
  },
  {
    id: 'attr-intimacy',
    category: 'attr',
    icon: '💖',
    title: '亲密度',
    summary: '解锁亲密奖励的关键',
    content: '亲密度通过陪伴、喂养、洗澡积累。达到阶段阈值可领取亲密奖励，获得成长值与宝石加成。',
    statKey: 'intimacy',
  },
  {
    id: 'action-feed',
    category: 'action',
    icon: '🍖',
    title: '喂养',
    summary: '消耗 10 金币 · 提升饱腹与亲密',
    content: '喂养可提升用户饱腹值、宠物亲密度与活力，并完成「进行一次喂养」每日任务。建议每日至少喂养 1 次。',
    actionKey: 'feed',
  },
  {
    id: 'action-accompany',
    category: 'action',
    icon: '🤝',
    title: '陪伴',
    summary: '免费 · 每次 +2 分钟陪伴进度',
    content: '陪伴是最经济的亲密提升方式，累计 10 分钟可完成每日陪伴任务。学习时可间歇点击陪伴，不影响专注。',
    actionKey: 'accompany',
  },
  {
    id: 'action-train',
    category: 'action',
    icon: '🏋️',
    title: '训练',
    summary: '消耗 5 金币 · 提升学习力与专注力',
    content: '训练直接提升学习力与专注力各 2 点，适合在属性接近上限前冲刺阶段使用。',
    actionKey: 'train',
  },
  {
    id: 'action-bath',
    category: 'action',
    icon: '🛁',
    title: '洗澡',
    summary: '消耗 8 金币 · 恢复活力',
    content: '洗澡大幅提升活力与亲密度，适合长时间专注后恢复宠物状态。',
    actionKey: 'bath',
  },
  {
    id: 'action-sleep',
    category: 'action',
    icon: '🌙',
    title: '睡眠',
    summary: '免费 · 恢复活力与心情',
    content: '睡眠免费恢复活力，并提升用户心情值。建议在深夜自习结束后使用，为次日储备状态。',
    actionKey: 'sleep',
  },
  {
    id: 'task-daily',
    category: 'task',
    icon: '📋',
    title: '每日养成任务',
    summary: '全部完成可获得星光与金币',
    content: '每日任务包含：专注 25 分钟、完成 3 个番茄钟、喂养 1 次、陪伴 10 分钟。全部完成后可领取额外星光与金币奖励。',
  },
  {
    id: 'task-reward',
    category: 'task',
    icon: '🎁',
    title: '成长奖励',
    summary: 'Lv.25 起可领取阶段奖励',
    content: '达到指定等级解锁星光结晶、彩虹项圈、云朵小窝等奖励。经验进度条满后可领取当期成长礼包。',
  },
]

const FAQS = [
  {
    id: 'faq-1',
    question: '宠物会降级吗？',
    answer: '不会。进化阶段与等级只升不降，长期不登录也不会丢失进度。',
  },
  {
    id: 'faq-2',
    question: '亲密度奖励如何领取？',
    answer: '当亲密度进度达到 80% 以上时，宠物页左侧「亲密奖励」按钮会亮起，点击即可领取。',
  },
  {
    id: 'faq-3',
    question: '专注和学习力有什么关系？',
    answer: '在自习室完成有效专注会推进每日专注任务，间接提升宠物专注力属性与经验。',
  },
]

function buildEvolutionTimeline(petPage) {
  const stages = petPage?.evolutionStages || []
  return [
    { key: 'egg', label: '宠物蛋', unlockLevel: 1 },
    { key: 'baby', label: '幼宠', unlockLevel: 5 },
    { key: 'growth', label: '成长中', unlockLevel: 15 },
    { key: 'mature', label: '完全体', unlockLevel: 30 },
  ].map((item) => {
    const remote = stages.find((s) => s.key === item.key)
    return {
      ...item,
      active: Boolean(remote?.active),
      locked: remote?.locked ?? item.key === 'mature',
      reached: remote ? !remote.locked || remote.active : false,
    }
  })
}

function buildPersonalTip(petPage) {
  if (!petPage) {
    return '开始专注与喂养，让小橙陪伴你的学习之旅吧～'
  }
  const stage = petPage.evolutionStages?.find((s) => s.active)
  const name = petPage.profile?.petName || '小橙'
  const level = petPage.profile?.level || 1
  const undone = petPage.dailyTasks?.filter((t) => !t.done) || []

  if (undone.length) {
    return `${name} Lv.${level} · 今日还有 ${undone.length} 项养成任务，完成可领额外奖励哦`
  }
  if (stage?.key === 'mature') {
    return `${name}已是完全体！继续保持专注，维持满属性状态吧`
  }
  return `${name}处于「${stage?.label || '成长中'}」，多陪伴和训练可加速进化～`
}

export async function buildPetEncyclopedia(pool, userId, buildPetNurturePage) {
  const petPage = await buildPetNurturePage(pool, userId)

  const articles = ARTICLES.map((article) => {
    let status = 'normal'
    if (article.stageKey && petPage) {
      const stage = petPage.evolutionStages?.find((s) => s.key === article.stageKey)
      if (stage?.active) status = 'current'
      else if (stage?.locked) status = 'locked'
      else status = 'unlocked'
    }
    if (article.unlockLevel && petPage && petPage.profile.level < article.unlockLevel) {
      status = 'locked'
    }
    return { ...article, status }
  })

  return {
    title: '养成百科',
    subtitle: '从小橙蛋到完全体，一篇读懂宠物养成',
    categories: CATEGORIES,
    articles,
    faqs: FAQS,
    evolutionTimeline: buildEvolutionTimeline(petPage),
    featured: articles.filter((a) => a.tags?.includes('新手必读')).slice(0, 2),
    personalize: petPage
      ? {
          petName: petPage.profile.petName,
          level: petPage.profile.level,
          stageLabel: petPage.evolutionStages?.find((s) => s.active)?.label || '成长中',
          stats: petPage.stats,
          tip: buildPersonalTip(petPage),
        }
      : null,
  }
}

export { CATEGORIES, ARTICLES, FAQS }
