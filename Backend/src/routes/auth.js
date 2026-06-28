import { Router } from 'express'
import crypto from 'node:crypto'
import 'dotenv/config'
import pool from '../config/db.js'
import { formatMinutes } from '../utils/format.js'
import { verifyPassword } from '../utils/password.js'
import { syncVipStatus } from '../services/vipService.js'

const router = Router()
const CODE_TTL = 5 * 60 * 1000
const AUTH_SECRET = process.env.AUTH_SECRET || 'chong-xueba-local-dev-secret'
const IS_DEV = process.env.NODE_ENV !== 'production'
const verificationCodes = new Map()

function generateCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
}

function normalizeCode(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.padStart(6, '0')
}

function logDevCode(phone, code) {
  if (!IS_DEV) return
  console.log('\n📱 [宠学霸] 登录验证码')
  console.log(`   手机号: ${phone}`)
  console.log(`   验证码: ${code}（6 位，含前导 0 请完整输入）`)
  console.log(`   有效期: ${Math.round(CODE_TTL / 60000)} 分钟\n`)
}

function formatExpireLabel(value) {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function vipFieldsFromRow(u) {
  const now = new Date()
  const expires = u.vip_expires_at ? new Date(u.vip_expires_at) : null
  const active = Boolean(u.vip && (!expires || expires > now))
  return {
    vip: active,
    vipExpiresAt: active && expires ? expires.toISOString() : null,
    vipExpireLabel: active && expires ? `${formatExpireLabel(expires)}到期` : null,
    vipDaysLeft: active && expires
      ? Math.max(0, Math.ceil((expires - now) / 86400000))
      : 0,
  }
}

function toUser(u) {
  const vipInfo = vipFieldsFromRow(u)
  return {
    id: u.id,
    name: u.name,
    level: u.level,
    exp: u.exp,
    expMax: u.exp_max,
    coins: u.coins,
    gems: u.gems,
    streakDays: u.streak_days,
    focusToday: formatMinutes(u.focus_today_minutes),
    focusWeek: formatMinutes(u.focus_week_minutes),
    focusTotalHours: Math.round((u.focus_total_minutes || 0) / 60),
    mood: u.mood,
    fullness: u.fullness,
    focus: u.focus_stat,
    petName: u.pet_name,
    petLevel: u.pet_level,
    medals: u.medals,
    totalMedals: u.total_medals,
    ...vipInfo,
    ambientSound: u.ambient_sound || 'rain',
    avatarSeed: u.avatar_seed || 'moon-night',
    avatarUrl: u.avatar_url || '',
  }
}

async function getUser(userId) {
  const [rows] = await pool.query(
    `SELECT u.*, p.name AS pet_name, p.level AS pet_level,
            up.avatar_seed, up.avatar_url,
            (SELECT COALESCE(SUM(minutes), 0) FROM focus_records fr WHERE fr.user_id = u.id) AS focus_total_minutes
     FROM users u
     LEFT JOIN pets p ON p.user_id = u.id
     LEFT JOIN user_profiles up ON up.user_id = u.id
     WHERE u.id = ?`,
    [userId],
  )
  if (!rows[0]) return null
  await syncVipStatus(rows[0].id)
  const [fresh] = await pool.query(
    `SELECT u.*, p.name AS pet_name, p.level AS pet_level,
            up.avatar_seed, up.avatar_url,
            (SELECT COALESCE(SUM(minutes), 0) FROM focus_records fr WHERE fr.user_id = u.id) AS focus_total_minutes
     FROM users u
     LEFT JOIN pets p ON p.user_id = u.id
     LEFT JOIN user_profiles up ON up.user_id = u.id
     WHERE u.id = ?`,
    [userId],
  )
  return fresh[0] ? toUser(fresh[0]) : null
}

async function findUserByPhone(phone) {
  const [rows] = await pool.query(
    `SELECT u.*, p.name AS pet_name, p.level AS pet_level,
            up.avatar_seed, up.avatar_url,
            (SELECT COALESCE(SUM(minutes), 0) FROM focus_records fr WHERE fr.user_id = u.id) AS focus_total_minutes
     FROM users u
     LEFT JOIN pets p ON p.user_id = u.id
     LEFT JOIN user_profiles up ON up.user_id = u.id
     WHERE u.phone = ?`,
    [phone],
  )
  return rows[0] || null
}

async function findUserByAccount(account) {
  const [rows] = await pool.query(
    `SELECT u.*, p.name AS pet_name, p.level AS pet_level,
            up.avatar_seed, up.avatar_url,
            (SELECT COALESCE(SUM(minutes), 0) FROM focus_records fr WHERE fr.user_id = u.id) AS focus_total_minutes
     FROM users u
     LEFT JOIN pets p ON p.user_id = u.id
     LEFT JOIN user_profiles up ON up.user_id = u.id
     WHERE u.login_account = ?`,
    [account],
  )
  return rows[0] || null
}

function createToken(userId) {
  const payload = Buffer.from(JSON.stringify({
    userId,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  })).toString('base64url')
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

function readToken(token) {
  const [payload, signature] = String(token || '').split('.')
  if (!payload || !signature) return null

  const expected = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url')
  if (signature.length !== expected.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null

  const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  return data.expiresAt > Date.now() ? data : null
}

router.post('/send-code', async (req, res, next) => {
  try {
    const phone = String(req.body.phone || '').trim()
    if (!/^1\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: '请输入正确的手机号' })
    }

    const userRow = await findUserByPhone(phone)
    if (!userRow) {
      return res.status(404).json({ success: false, message: '该手机号未注册' })
    }

    const code = generateCode()
    verificationCodes.set(phone, { code, expiresAt: Date.now() + CODE_TTL })
    logDevCode(phone, code)

    res.json({
      success: true,
      data: {
        expiresIn: Math.round(CODE_TTL / 1000),
        devHint: IS_DEV ? '验证码已输出到后端控制台' : undefined,
      },
      message: IS_DEV ? '验证码已发送，请在后端控制台查看' : '验证码已发送',
    })
  } catch (err) {
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const mode = req.body.mode === 'account' ? 'account' : 'phone'
    const password = String(req.body.password || '')

    let userRow = null

    if (mode === 'phone') {
      const phone = String(req.body.phone || '').trim()
      const code = normalizeCode(req.body.code)
      const saved = verificationCodes.get(phone)
      if (!/^1\d{10}$/.test(phone)) {
        return res.status(400).json({ success: false, message: '请输入正确的手机号' })
      }
      if (!code) {
        return res.status(400).json({ success: false, message: '请输入验证码' })
      }
      if (!saved || saved.expiresAt < Date.now() || saved.code !== code) {
        return res.status(401).json({ success: false, message: '验证码错误或已过期' })
      }
      verificationCodes.delete(phone)
      userRow = await findUserByPhone(phone)
      if (!userRow) {
        return res.status(404).json({ success: false, message: '该手机号未注册' })
      }
    } else {
      const account = String(req.body.account || '').trim()
      if (!account) {
        return res.status(400).json({ success: false, message: '请输入账号' })
      }
      userRow = await findUserByAccount(account)
      if (!userRow) {
        return res.status(404).json({ success: false, message: '账号不存在' })
      }
    }

    if (!verifyPassword(password, userRow.password_hash)) {
      return res.status(401).json({ success: false, message: '密码错误' })
    }

    const user = toUser(userRow)
    res.json({
      success: true,
      data: { token: createToken(user.id), user },
      message: '登录成功',
    })
  } catch (err) {
    next(err)
  }
})

router.post('/wechat', async (_req, res, next) => {
  try {
    const user = await getUser(1)
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    res.json({
      success: true,
      data: { token: createToken(user.id), user },
      message: '微信登录成功',
    })
  } catch (err) {
    next(err)
  }
})

router.get('/me', async (req, res, next) => {
  try {
    const auth = req.headers.authorization || ''
    const data = readToken(auth.startsWith('Bearer ') ? auth.slice(7) : '')
    if (!data) {
      return res.status(401).json({ success: false, message: '登录状态已失效' })
    }

    const user = await getUser(data.userId)
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    res.json({ success: true, data: user })
  } catch (err) {
    next(err)
  }
})

export default router
