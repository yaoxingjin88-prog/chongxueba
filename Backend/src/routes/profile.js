import { Router } from 'express'
import pool from '../config/db.js'
import { resolveUserId, maskPhone } from '../utils/auth.js'

const router = Router()

const GENDER_LABELS = { female: '女', male: '男', other: '保密' }

function formatBirthday(value) {
  if (!value) return ''
  if (value instanceof Date) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return String(value).slice(0, 10)
}

function toProfile(row) {
  const signature = row.signature || ''
  return {
    avatarSeed: row.avatar_seed || 'moon-night',
    avatarUrl: row.avatar_url || '',
    nickname: row.name,
    level: row.level,
    userId: row.phone || '',
    userIdMasked: maskPhone(row.phone),
    petName: row.pet_name || '小狐狸',
    birthday: formatBirthday(row.birthday),
    gender: row.gender || 'female',
    genderLabel: GENDER_LABELS[row.gender] || '女',
    region: row.region || '',
    studyGoal: row.study_goal || '',
    interests: row.interests || '',
    focusPreference: row.default_focus_minutes,
    focusPreferenceLabel: `${row.default_focus_minutes} 分钟`,
    signature,
    signatureLength: signature.length,
    signatureMax: 60,
  }
}

async function fetchProfile(userId) {
  const [rows] = await pool.query(
    `SELECT u.name, u.level, s.phone, s.study_goal, s.default_focus_minutes,
            p.name AS pet_name, up.*
     FROM users u
     LEFT JOIN user_settings s ON s.user_id = u.id
     LEFT JOIN pets p ON p.user_id = u.id
     LEFT JOIN user_profiles up ON up.user_id = u.id
     WHERE u.id = ?`,
    [userId],
  )
  return rows[0] || null
}

async function ensureProfile(userId) {
  let row = await fetchProfile(userId)
  if (!row) return null

  if (!row.user_id) {
    await pool.query(
      `INSERT INTO user_profiles (user_id) VALUES (?)
       ON DUPLICATE KEY UPDATE user_id = user_id`,
      [userId],
    )
    row = await fetchProfile(userId)
  }

  if (!row.phone) {
    await pool.query(
      `INSERT INTO user_settings (user_id, phone) VALUES (?, '18888888888')
       ON DUPLICATE KEY UPDATE user_id = user_id`,
      [userId],
    )
    row = await fetchProfile(userId)
  }

  return row
}

router.get('/', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const row = await ensureProfile(userId)
    if (!row) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    res.json({ success: true, data: toProfile(row) })
  } catch (err) {
    next(err)
  }
})

router.patch('/', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    await ensureProfile(userId)

    const {
      nickname,
      avatarSeed,
      avatarUrl,
      birthday,
      gender,
      region,
      studyGoal,
      interests,
      focusPreference,
      signature,
    } = req.body

    if (nickname !== undefined) {
      await pool.query('UPDATE users SET name = ? WHERE id = ?', [nickname, userId])
    }

    const profileFields = []
    const profileValues = []
    if (avatarSeed !== undefined) {
      profileFields.push('avatar_seed = ?')
      profileValues.push(avatarSeed)
    }
    if (avatarUrl !== undefined) {
      const nextUrl = avatarUrl ? String(avatarUrl) : null
      if (nextUrl && (!nextUrl.startsWith('data:image/') || nextUrl.length > 600000)) {
        return res.status(400).json({ success: false, message: '头像图片格式或大小无效' })
      }
      profileFields.push('avatar_url = ?')
      profileValues.push(nextUrl)
    }
    if (birthday !== undefined) {
      profileFields.push('birthday = ?')
      profileValues.push(birthday)
    }
    if (gender !== undefined) {
      profileFields.push('gender = ?')
      profileValues.push(gender)
    }
    if (region !== undefined) {
      profileFields.push('region = ?')
      profileValues.push(region)
    }
    if (interests !== undefined) {
      profileFields.push('interests = ?')
      profileValues.push(interests)
    }
    if (signature !== undefined) {
      profileFields.push('signature = ?')
      profileValues.push(String(signature).slice(0, 60))
    }

    if (profileFields.length) {
      profileValues.push(userId)
      await pool.query(
        `UPDATE user_profiles SET ${profileFields.join(', ')} WHERE user_id = ?`,
        profileValues,
      )
    }

    const settingFields = []
    const settingValues = []
    if (studyGoal !== undefined) {
      settingFields.push('study_goal = ?')
      settingValues.push(studyGoal)
    }
    if (focusPreference !== undefined) {
      settingFields.push('default_focus_minutes = ?')
      settingValues.push(focusPreference)
    }

    if (settingFields.length) {
      settingValues.push(userId)
      await pool.query(
        `UPDATE user_settings SET ${settingFields.join(', ')} WHERE user_id = ?`,
        settingValues,
      )
    }

    const row = await fetchProfile(userId)
    res.json({ success: true, data: toProfile(row), message: '资料已保存' })
  } catch (err) {
    next(err)
  }
})

export default router
