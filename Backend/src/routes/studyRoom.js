import { Router } from 'express'
import pool from '../config/db.js'
import { buildSoundList, DEFAULT_AMBIENT_KEY } from '../config/ambientSounds.js'

const router = Router()
const DEFAULT_USER_ID = 1

router.get('/', async (req, res, next) => {
  try {
    const userId = Number(req.query.userId) || DEFAULT_USER_ID

    const [users] = await pool.query(
      'SELECT name, avatar_seed, pos_x, pos_y FROM study_room_users WHERE is_online = 1',
    )

    const [userRows] = await pool.query(
      'SELECT ambient_sound FROM users WHERE id = ?',
      [userId],
    )
    const activeKey = userRows[0]?.ambient_sound || DEFAULT_AMBIENT_KEY

    res.json({
      success: true,
      data: {
        onlineCount: 128,
        atmosphere: 95,
        ambientSound: activeKey,
        classmates: users.map((u) => ({
          name: u.name,
          seed: u.avatar_seed,
          x: Number(u.pos_x),
          y: Number(u.pos_y),
        })),
        sounds: buildSoundList(activeKey),
      },
    })
  } catch (err) {
    next(err)
  }
})

router.put('/ambient-sound', async (req, res, next) => {
  try {
    const userId = Number(req.body.userId) || DEFAULT_USER_ID
    const { key } = req.body
    const validKeys = ['rain', 'cafe', 'forest', 'fire', null, '']

    if (!validKeys.includes(key)) {
      return res.status(400).json({ success: false, message: '无效的环境音类型' })
    }

    const soundKey = key || DEFAULT_AMBIENT_KEY
    await pool.query('UPDATE users SET ambient_sound = ? WHERE id = ?', [soundKey, userId])

    res.json({
      success: true,
      message: '环境音偏好已保存',
      data: { ambientSound: soundKey, sounds: buildSoundList(soundKey) },
    })
  } catch (err) {
    next(err)
  }
})

export default router
