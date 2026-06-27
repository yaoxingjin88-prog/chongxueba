import pool from '../src/config/db.js'
import { syncAllStudyRooms } from '../src/utils/studyRoomUsers.js'

const { mainCount, voiceCount } = await syncAllStudyRooms(pool)
console.log(`✅ 主自习室已同步 ${mainCount} 位用户`)
console.log(`✅ 语音自习室已同步 ${voiceCount} 位用户`)
await pool.end()
