const APP_ORIGIN = process.env.APP_ORIGIN || 'https://chongxueba.app'

export const PET_SHARE_METHODS = [
  { key: 'wechat', label: '微信', color: '#22c55e' },
  { key: 'qq', label: 'QQ', color: '#3b82f6' },
  { key: 'link', label: '复制链接', color: '#6366f1' },
  { key: 'copy', label: '复制文案', color: '#c084fc' },
]

export async function buildPetSharePayload(pool, userId, buildPetNurturePage) {
  const page = await buildPetNurturePage(pool, userId)
  if (!page) return null

  const [[userRow]] = await pool.query('SELECT id, name FROM users WHERE id = ?', [userId])
  const activeStage = page.evolutionStages.find((s) => s.active)
    || page.evolutionStages.find((s) => !s.locked)
    || page.evolutionStages[2]

  const shareLink = `${APP_ORIGIN}/pet?from=${userId}`
  const shareText = [
    `我在宠学霸养了一只超可爱的${page.profile.petName}！`,
    `🌟 Lv.${page.profile.level} · ${activeStage?.label || '成长中'}`,
    `📚 学习力 ${page.stats.studyPower} · 专注力 ${page.stats.focusPower}`,
    `💪 活力 ${page.stats.vitality} · 💖 亲密度 ${page.stats.intimacy}`,
    `⭐ 成长值 ${page.profile.growthStars}`,
    '一起来养成专属学伴吧 👇',
    shareLink,
  ].join('\n')

  return {
    title: '分享我的宠物',
    subtitle: '晒晒小橙的成长，邀请好友一起养宠',
    shareText,
    shareLink,
    preview: {
      ownerName: userRow?.name || '同学',
      petName: page.profile.name,
      petShortName: page.profile.petName,
      level: page.profile.level,
      exp: page.profile.exp,
      expMax: page.profile.expMax,
      growthStars: page.profile.growthStars,
      stageLabel: activeStage?.label || '成长中',
      stageKey: activeStage?.key || 'growth',
      stats: page.stats,
      intimacyLevel: page.intimacy.level,
      avatarSeed: page.profile.avatarSeed,
      avatarUrl: page.profile.avatarUrl,
    },
    shareMethods: PET_SHARE_METHODS,
  }
}

export function resolvePetShareAction(action, payload) {
  const channelLabels = { wechat: '微信', qq: 'QQ', link: '链接', copy: '文案' }

  if (action === 'share-link') {
    return { copyText: payload.shareLink, message: '宠物链接已复制' }
  }
  if (action === 'share-copy') {
    return { copyText: payload.shareText, message: '分享文案已复制' }
  }
  if (action === 'share-wechat' || action === 'share-qq') {
    const channel = action === 'share-wechat' ? 'wechat' : 'qq'
    return {
      copyText: payload.shareText,
      channel,
      message: `已复制${channelLabels[channel]}分享内容`,
    }
  }
  return null
}
