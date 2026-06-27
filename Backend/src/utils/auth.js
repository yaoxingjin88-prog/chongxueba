import crypto from 'node:crypto'
import 'dotenv/config'

const AUTH_SECRET = process.env.AUTH_SECRET || 'chong-xueba-local-dev-secret'

export const DEFAULT_USER_ID = 1

export function readToken(token) {
  const [payload, signature] = String(token || '').split('.')
  if (!payload || !signature) return null

  const expected = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url')
  if (signature.length !== expected.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null

  const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  return data.expiresAt > Date.now() ? data : null
}

export function resolveUserId(req) {
  const auth = req.headers.authorization || ''
  const data = readToken(auth.startsWith('Bearer ') ? auth.slice(7) : '')
  return data?.userId || DEFAULT_USER_ID
}

export function maskPhone(phone) {
  const raw = String(phone || '').replace(/\D/g, '')
  if (raw.length !== 11) return '未绑定'
  return `${raw.slice(0, 3)}****${raw.slice(7)}`
}
