import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pool from '../src/config/db.js'
import { syncAllStudyRooms } from '../src/utils/studyRoomUsers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sqlDir = path.join(__dirname, '../sql')

function splitStatements(sql) {
  return sql
    .split('\n')
    .filter((line) => !/^\s*USE\s+/i.test(line))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

function isIgnorableError(message) {
  return [
    'Duplicate column',
    'Duplicate key name',
    'already exists',
    'Duplicate entry',
  ].some((text) => message.includes(text))
}

async function runFile(file) {
  const filePath = path.join(sqlDir, file)
  const statements = splitStatements(fs.readFileSync(filePath, 'utf8'))
  console.log(`\n▶ ${file}`)

  for (const statement of statements) {
    const preview = statement.replace(/\s+/g, ' ').slice(0, 70)
    try {
      await pool.query(statement)
      console.log(`  ✓ ${preview}`)
    } catch (err) {
      if (isIgnorableError(err.message)) {
        console.log(`  ~ 已存在，跳过: ${preview}`)
      } else {
        throw err
      }
    }
  }
}

async function printAccounts() {
  const [rows] = await pool.query(
    `SELECT id, name, phone, login_account FROM users
     WHERE phone IS NOT NULL ORDER BY id ASC`,
  )
  console.log('\n✅ 测试账号已就绪：')
  console.table(rows.map((row) => ({
    ID: row.id,
    昵称: row.name,
    手机号: row.phone,
    账号: row.login_account,
  })))
  console.log('密码明细见 doc/test-accounts.md')
}

async function main() {
  await runFile('migrate_auth_accounts.sql')
  await runFile('seed_test_accounts.sql')
  const { mainCount, voiceCount } = await syncAllStudyRooms(pool)
  await printAccounts()
  console.log(`\n✅ 主自习室已同步 ${mainCount} 位，语音自习室已同步 ${voiceCount} 位`)
  await pool.end()
}

main().catch(async (err) => {
  console.error('测试账号导入失败:', err.message)
  await pool.end()
  process.exit(1)
})
