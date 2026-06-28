import pool from '../config/db.js'
import { recordCoinTx } from './achievementService.js'

export const VIP_PLANS = [
  {
    id: 'monthly',
    name: '月度会员',
    durationDays: 30,
    priceGems: 680,
    priceCoins: 0,
    priceLabel: '¥12',
    badge: '热门',
    savePercent: 0,
  },
  {
    id: 'quarterly',
    name: '季度会员',
    durationDays: 90,
    priceGems: 1800,
    priceCoins: 0,
    priceLabel: '¥30',
    badge: '省17%',
    savePercent: 17,
  },
  {
    id: 'yearly',
    name: '年度会员',
    durationDays: 365,
    priceGems: 5800,
    priceCoins: 0,
    priceLabel: '¥98',
    badge: '最划算',
    savePercent: 32,
  },
]

export const VIP_BENEFITS = [
  { icon: 'coins', title: '学豆加成', desc: '完成任务学豆 +20%' },
  { icon: 'chart-line', title: '深度报告', desc: '成长报告解锁 VIP 洞察' },
  { icon: 'crown', title: '尊贵标识', desc: '个人页 VIP 皇冠徽章' },
  { icon: 'shirt', title: '专属装扮', desc: '商城限定皮肤优先购' },
  { icon: 'users', title: '自习特权', desc: '自习室广场优先展示' },
  { icon: 'gift', title: '每日礼包', desc: '每日登录额外学豆奖励' },
]

function formatExpireDate(value) {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function addDays(base, days) {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

export async function syncVipStatus(userId) {
  const [[user]] = await pool.query(
    'SELECT vip, vip_expires_at FROM users WHERE id = ?',
    [userId],
  )
  if (!user) return null

  const now = new Date()
  const expires = user.vip_expires_at ? new Date(user.vip_expires_at) : null
  const active = Boolean(user.vip && expires && expires > now)

  if (user.vip && expires && expires <= now) {
    await pool.query('UPDATE users SET vip = 0 WHERE id = ?', [userId])
  }

  return {
    active,
    expiresAt: active && expires ? expires.toISOString() : null,
    expireLabel: active && expires ? formatExpireDate(expires) : null,
    daysLeft: active && expires
      ? Math.max(0, Math.ceil((expires - now) / 86400000))
      : 0,
  }
}

export async function getVipPage(userId) {
  const status = await syncVipStatus(userId)
  const [[user]] = await pool.query('SELECT coins, gems FROM users WHERE id = ?', [userId])

  let orders = []
  try {
    const [rows] = await pool.query(
      'SELECT plan_id, plan_name, pay_method, amount, created_at FROM vip_subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
      [userId],
    )
    orders = rows.map((row) => ({
      planId: row.plan_id,
      planName: row.plan_name,
      payMethod: row.pay_method,
      amount: row.amount,
      date: formatExpireDate(row.created_at),
    }))
  } catch {
    orders = []
  }

  return {
    status,
    plans: VIP_PLANS,
    benefits: VIP_BENEFITS,
    balance: { coins: user?.coins ?? 0, gems: user?.gems ?? 0 },
    recentOrders: orders,
  }
}

export async function subscribeVip(userId, planId, payMethod = 'gems') {
  const plan = VIP_PLANS.find((p) => p.id === planId)
  if (!plan) {
    throw new Error('无效的会员方案')
  }

  const [[user]] = await pool.query('SELECT coins, gems, vip_expires_at FROM users WHERE id = ?', [userId])
  if (!user) throw new Error('用户不存在')

  if (payMethod === 'mock_wechat') {
    // 演示：模拟微信支付成功
  } else if (payMethod === 'gems') {
    if (user.gems < plan.priceGems) throw new Error('钻石不足')
    await pool.query('UPDATE users SET gems = gems - ? WHERE id = ?', [plan.priceGems, userId])
  } else if (payMethod === 'coins') {
    const coinPrice = plan.priceCoins || plan.priceGems * 2
    if (user.coins < coinPrice) throw new Error('学豆不足')
    await pool.query('UPDATE users SET coins = coins - ? WHERE id = ?', [coinPrice, userId])
    await recordCoinTx(userId, -coinPrice, 'vip_subscribe', planId)
  } else {
    throw new Error('不支持的支付方式')
  }

  const now = new Date()
  const currentExpire = user.vip_expires_at && new Date(user.vip_expires_at) > now
    ? new Date(user.vip_expires_at)
    : now
  const newExpire = addDays(currentExpire, plan.durationDays)

  await pool.query(
    'UPDATE users SET vip = 1, vip_expires_at = ? WHERE id = ?',
    [newExpire, userId],
  )

  const amount = payMethod === 'gems' ? plan.priceGems : (plan.priceCoins || plan.priceGems * 2)
  try {
    await pool.query(
      `INSERT INTO vip_subscriptions (user_id, plan_id, plan_name, pay_method, amount, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, plan.id, plan.name, payMethod, amount, newExpire],
    )
  } catch {
    // 表未迁移时仍完成开通
  }

  const status = await syncVipStatus(userId)
  const [[updated]] = await pool.query('SELECT coins, gems FROM users WHERE id = ?', [userId])

  return {
    message: `已成功开通${plan.name}`,
    status,
    coins: updated.coins,
    gems: updated.gems,
  }
}

export function applyVipCoinBonus(baseCoins, isVip) {
  if (!isVip || !baseCoins) return baseCoins
  return Math.round(baseCoins * 1.2)
}
