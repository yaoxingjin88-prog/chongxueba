import crypto from 'node:crypto'

export function hashPassword(password) {
  return crypto.createHash('sha256').update(`${password}:chong-xueba`).digest('hex')
}

export function verifyPassword(password, passwordHash) {
  if (!passwordHash) return false
  const input = hashPassword(password)
  if (input.length !== passwordHash.length) return false
  return crypto.timingSafeEqual(Buffer.from(input), Buffer.from(passwordHash))
}
