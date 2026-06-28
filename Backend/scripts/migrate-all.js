import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pool from '../src/config/db.js'
import { syncAllStudyRooms } from '../src/utils/studyRoomUsers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sqlDir = path.join(__dirname, '../sql')

const files = [
  'migrate_search.sql',
  'migrate_plaza.sql',
  'migrate_ambient_sound.sql',
  'migrate_auth_accounts.sql',
  'migrate_settings.sql',
  'migrate_favorites.sql',
  'migrate_profile.sql',
  'migrate_avatar_url.sql',
  'migrate_leaderboard.sql',
  'migrate_study_room_sync.sql',
  'migrate_study_room_accounts.sql',
  'migrate_voice_room_sync.sql',
  'migrate_interact.sql',
  'migrate_voice_room.sql',
  'migrate_video_room.sql',
  'migrate_study_menu.sql',
  'migrate_study_room_info.sql',
  'migrate_study_invite.sql',
  'migrate_video_focus_ai.sql',
  'migrate_pet_nurture.sql',
  'migrate_tasks_center.sql',
  'migrate_mall.sql',
  'migrate_achievements.sql',
  'migrate_vip.sql',
  'migrate_study_room_create.sql',
]

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
  const ignore = [
    'Duplicate column',
    'Duplicate key name',
    'already exists',
    'Duplicate entry',
  ]
  return ignore.some((text) => message.includes(text))
}

async function runFile(file) {
  const filePath = path.join(sqlDir, file)
  if (!fs.existsSync(filePath)) {
    console.log(`跳过（不存在）: ${file}`)
    return
  }

  const statements = splitStatements(fs.readFileSync(filePath, 'utf8'))
  console.log(`\n▶ ${file}（${statements.length} 条语句）`)

  for (const statement of statements) {
    const preview = statement.replace(/\s+/g, ' ').slice(0, 70)
    try {
      await pool.query(statement)
      console.log(`  ✓ ${preview}`)
    } catch (err) {
      if (isIgnorableError(err.message)) {
        console.log(`  ~ 已存在，跳过: ${preview}`)
      } else {
        console.error(`  ✗ 失败: ${preview}`)
        console.error(`    ${err.message}`)
      }
    }
  }
}

async function summary() {
  const checks = [
    ['user_settings', 'SELECT COUNT(*) AS c FROM user_settings'],
    ['user_favorites', 'SELECT COUNT(*) AS c FROM user_favorites'],
    ['user_profiles', 'SELECT COUNT(*) AS c FROM user_profiles'],
    ['study_rooms', 'SELECT COUNT(*) AS c FROM study_rooms'],
    ['study_buddies', 'SELECT COUNT(*) AS c FROM study_buddies'],
  ]

  console.log('\n📊 迁移结果：')
  for (const [name, sql] of checks) {
    try {
      const [rows] = await pool.query(sql)
      console.log(`  ${name}: ${rows[0].c} 条记录`)
    } catch (err) {
      console.log(`  ${name}: 表不存在 (${err.message})`)
    }
  }
}

console.log('开始执行数据库迁移...')
for (const file of files) {
  await runFile(file)
}
const { mainCount, voiceCount } = await syncAllStudyRooms(pool)
console.log(`\n✅ 主自习室已同步 ${mainCount} 位用户，语音自习室已同步 ${voiceCount} 位用户`)
await summary()
await pool.end()
console.log('\n迁移完成。')
