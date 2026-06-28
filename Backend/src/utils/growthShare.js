const APP_ORIGIN = process.env.APP_ORIGIN || 'https://chongxueba.app'

export const GROWTH_SHARE_METHODS = [
  { key: 'wechat', label: '微信', color: '#22c55e' },
  { key: 'qq', label: 'QQ', color: '#3b82f6' },
  { key: 'link', label: '复制链接', color: '#6366f1' },
  { key: 'copy', label: '复制文案', color: '#c084fc' },
]

export async function buildGrowthSharePayload(pool, userId, period, buildGrowthReport, buildPetNurturePage) {
  const report = await buildGrowthReport(pool, userId, period)
  if (!report) return null

  const petPage = await buildPetNurturePage(pool, userId)
  const [[userRow]] = await pool.query('SELECT name FROM users WHERE id = ?', [userId])

  const shareLink = `${APP_ORIGIN}/growth?from=${userId}&period=${period}`
  const petName = petPage?.profile?.petName || '小橙'
  const stageLabel = petPage?.evolutionStages?.find((s) => s.active)?.label || '成长中'

  const shareText = [
    `我在宠学霸的${report.periodLabel}出炉啦！`,
    `⏱ 专注 ${report.focusDuration}`,
    `🔥 连续打卡 ${report.streakDays} 天 · ${report.compareLabel} ${report.changePercent >= 0 ? '+' : ''}${report.changePercent}%`,
    `🦊 ${petName} Lv.${petPage?.profile?.level || 1} · ${stageLabel}`,
    `⭐ 本期获得 +${report.periodExpGain} EXP，超过 ${report.beatPercent}% 用户`,
    '一起来养成专属学伴吧 👇',
    shareLink,
  ].join('\n')

  return {
    title: '分享成长报告',
    subtitle: `晒晒${report.periodLabel.replace('报告', '')}的学习成果`,
    shareText,
    shareLink,
    preview: {
      ownerName: userRow?.name || '同学',
      period,
      periodLabel: report.periodLabel,
      focusDuration: report.focusDuration,
      streakDays: report.streakDays,
      changePercent: report.changePercent,
      compareLabel: report.compareLabel,
      totalHours: report.totalHours,
      trendLabel: report.trendLabel,
      periodExpGain: report.periodExpGain,
      beatPercent: report.beatPercent,
      chartData: report.chartData,
      petName,
      petLevel: petPage?.profile?.level || 1,
      stageLabel,
      stageKey: petPage?.evolutionStages?.find((s) => s.active)?.key || 'growth',
      avatarSeed: petPage?.profile?.avatarSeed || 'xiaocheng',
      avatarUrl: petPage?.profile?.avatarUrl || '',
    },
    shareMethods: GROWTH_SHARE_METHODS,
  }
}

export function resolveGrowthShareAction(action, payload) {
  const channelLabels = { wechat: '微信', qq: 'QQ', link: '链接', copy: '文案' }

  if (action === 'share-link') {
    return { copyText: payload.shareLink, message: '成长报告链接已复制' }
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
