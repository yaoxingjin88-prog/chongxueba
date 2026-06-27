import { Router } from 'express'
import pool from '../config/db.js'
import { buildSoundList, DEFAULT_AMBIENT_KEY } from '../config/ambientSounds.js'
import { resolveUserId } from '../utils/auth.js'

const router = Router()
const DEFAULT_USER_ID = 1

function parseTags(raw) {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }
  return []
}

function parseJsonArray(raw) {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }
  return []
}

function formatRoom(row) {
  return {
    id: row.id,
    roomCode: row.room_code,
    name: row.name,
    subtitle: row.subtitle,
    coverSeed: row.cover_seed,
    onlineCount: row.online_count,
    focusRate: row.focus_rate,
    tags: parseTags(row.tags),
  }
}

function formatPlazaRoom(row) {
  return {
    ...formatRoom(row),
    category: row.category,
    roomLabel: row.room_label,
    memberAvatars: parseJsonArray(row.member_avatars),
    extraMembers: row.extra_members,
    openedAt: row.opened_at,
  }
}

const PLAZA_CATEGORIES = [
  { key: 'recommend', label: '推荐' },
  { key: 'hot', label: '热门' },
  { key: 'kaoyan', label: '考研' },
  { key: 'cet', label: '四六级' },
  { key: 'code', label: '编程' },
  { key: 'language', label: '语言' },
]

const PLAZA_SORTS = {
  online: 'online_count DESC, sort_order ASC',
  focus: 'focus_rate DESC, sort_order ASC',
  latest: 'opened_at DESC, sort_order ASC',
}

function formatBuddy(row) {
  return {
    id: row.id,
    name: row.name,
    seed: row.avatar_seed,
    level: row.level,
    studyGoal: row.study_goal,
    status: row.status,
  }
}

router.get('/', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)

    const [rows] = await pool.query(
      `SELECT u.id, u.name, up.avatar_seed, up.avatar_url,
              sru.pos_x, sru.pos_y
       FROM study_room_users sru
       INNER JOIN users u ON u.id = sru.user_id
       LEFT JOIN user_profiles up ON up.user_id = u.id
       WHERE sru.is_online = 1
       ORDER BY u.id ASC`,
    )

    const [userRows] = await pool.query(
      'SELECT ambient_sound FROM users WHERE id = ?',
      [userId],
    )
    const activeKey = userRows[0]?.ambient_sound || DEFAULT_AMBIENT_KEY

    const classmates = rows.map((row) => ({
      id: row.id,
      name: row.name,
      seed: row.avatar_seed || 'moon-night',
      avatarUrl: row.avatar_url || '',
      x: Number(row.pos_x),
      y: Number(row.pos_y),
    }))

    res.json({
      success: true,
      data: {
        onlineCount: classmates.length,
        atmosphere: 95,
        ambientSound: activeKey,
        classmates,
        sounds: buildSoundList(activeKey),
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/plaza', async (req, res, next) => {
  try {
    const category = String(req.query.category || 'recommend')
    const sort = PLAZA_SORTS[req.query.sort] ? req.query.sort : 'latest'
    const orderBy = PLAZA_SORTS[sort]

    let sql = `SELECT id, room_code, name, subtitle, cover_seed, online_count, focus_rate, tags,
                      category, room_label, member_avatars, extra_members, opened_at
               FROM study_rooms`
    const params = []

    if (category !== 'all' && PLAZA_CATEGORIES.some((item) => item.key === category)) {
      sql += ' WHERE category = ?'
      params.push(category)
    }

    sql += ` ORDER BY ${orderBy} LIMIT 30`

    const [rows] = await pool.query(sql, params)

    res.json({
      success: true,
      data: {
        categories: PLAZA_CATEGORIES,
        banner: {
          title: '今晚一起高效学习吧',
          subtitle: '星光相伴 · 专注每一刻',
          coverSeed: 'wizard-cat',
        },
        filters: [
          { key: 'online', label: '人数' },
          { key: 'focus', label: '专注率' },
          { key: 'latest', label: '最新开启' },
        ],
        activeCategory: category,
        activeSort: sort,
        rooms: rows.map(formatPlazaRoom),
      },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/plaza/create', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim()
    const subtitle = String(req.body.subtitle || '一起专注，互相陪伴').trim()
    const category = PLAZA_CATEGORIES.some((item) => item.key === req.body.category)
      ? req.body.category
      : 'recommend'
    const roomLabel = String(req.body.roomLabel || '新建').trim().slice(0, 10)
    const coverSeed = String(req.body.coverSeed || 'new-room').trim().slice(0, 50)
    const roomCode = `SR-${Date.now().toString().slice(-6)}`

    if (!name) {
      return res.status(400).json({ success: false, message: '自习室名称不能为空' })
    }

    const [result] = await pool.query(
      `INSERT INTO study_rooms
        (room_code, name, subtitle, cover_seed, online_count, focus_rate, tags,
         category, room_label, member_avatars, extra_members, sort_order, opened_at)
       VALUES (?, ?, ?, ?, 1, 100, ?, ?, ?, ?, 0, 999, NOW())`,
      [
        roomCode,
        name,
        subtitle,
        coverSeed,
        JSON.stringify([roomLabel]),
        category,
        roomLabel,
        JSON.stringify(['xiaocheng']),
      ],
    )

    const [rows] = await pool.query(
      `SELECT id, room_code, name, subtitle, cover_seed, online_count, focus_rate, tags,
              category, room_label, member_avatars, extra_members, opened_at
       FROM study_rooms WHERE id = ?`,
      [result.insertId],
    )

    res.json({
      success: true,
      message: `「${name}」创建成功`,
      data: {
        room: formatPlazaRoom(rows[0]),
        message: `「${name}」创建成功`,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/search-page', async (req, res, next) => {
  try {
    const userId = Number(req.query.userId) || DEFAULT_USER_ID

    const [historyRows] = await pool.query(
      `SELECT keyword, search_type AS searchType
       FROM study_search_history
       WHERE user_id = ?
       ORDER BY searched_at DESC
       LIMIT 8`,
      [userId],
    )

    const [roomRows] = await pool.query(
      `SELECT id, room_code, name, subtitle, cover_seed, online_count, focus_rate, tags
       FROM study_rooms
       WHERE is_hot = 1
       ORDER BY sort_order ASC
       LIMIT 6`,
    )

    const [buddyRows] = await pool.query(
      `SELECT id, name, avatar_seed, level, study_goal, status
       FROM study_buddies
       WHERE is_recommended = 1
       ORDER BY sort_order ASC
       LIMIT 6`,
    )

    res.json({
      success: true,
      data: {
        recentSearches: historyRows,
        hotRooms: roomRows.map(formatRoom),
        buddies: buddyRows.map(formatBuddy),
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim()
    const type = String(req.query.type || 'room')
    const limit = Math.min(Number(req.query.limit) || 20, 50)

    if (!q) {
      return res.json({ success: true, data: { rooms: [], buddies: [] } })
    }

    const like = `%${q}%`

    if (type === 'buddy') {
      const [rows] = await pool.query(
        `SELECT id, name, avatar_seed, level, study_goal, status
         FROM study_buddies
         WHERE name LIKE ? OR study_goal LIKE ?
         ORDER BY sort_order ASC
         LIMIT ?`,
        [like, like, limit],
      )
      return res.json({ success: true, data: { rooms: [], buddies: rows.map(formatBuddy) } })
    }

    if (type === 'code') {
      const [rows] = await pool.query(
        `SELECT id, room_code, name, subtitle, cover_seed, online_count, focus_rate, tags
         FROM study_rooms
         WHERE room_code LIKE ?
         ORDER BY sort_order ASC
         LIMIT ?`,
        [like, limit],
      )
      return res.json({ success: true, data: { rooms: rows.map(formatRoom), buddies: [] } })
    }

    const [roomRows] = await pool.query(
      `SELECT id, room_code, name, subtitle, cover_seed, online_count, focus_rate, tags
       FROM study_rooms
       WHERE name LIKE ? OR subtitle LIKE ?
       ORDER BY sort_order ASC
       LIMIT ?`,
      [like, like, limit],
    )

    const [buddyRows] = await pool.query(
      `SELECT id, name, avatar_seed, level, study_goal, status
       FROM study_buddies
       WHERE name LIKE ? OR study_goal LIKE ?
       ORDER BY sort_order ASC
       LIMIT ?`,
      [like, like, limit],
    )

    res.json({
      success: true,
      data: {
        rooms: roomRows.map(formatRoom),
        buddies: buddyRows.map(formatBuddy),
      },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/search-history', async (req, res, next) => {
  try {
    const userId = Number(req.body.userId) || DEFAULT_USER_ID
    const keyword = String(req.body.keyword || '').trim()
    const searchType = ['room', 'buddy', 'code'].includes(req.body.searchType)
      ? req.body.searchType
      : 'room'

    if (!keyword) {
      return res.status(400).json({ success: false, message: '搜索关键词不能为空' })
    }

    await pool.query(
      'DELETE FROM study_search_history WHERE user_id = ? AND keyword = ?',
      [userId, keyword],
    )

    await pool.query(
      'INSERT INTO study_search_history (user_id, keyword, search_type) VALUES (?, ?, ?)',
      [userId, keyword, searchType],
    )

    const [rows] = await pool.query(
      `SELECT keyword, search_type AS searchType
       FROM study_search_history
       WHERE user_id = ?
       ORDER BY searched_at DESC
       LIMIT 8`,
      [userId],
    )

    res.json({ success: true, data: { recentSearches: rows } })
  } catch (err) {
    next(err)
  }
})

router.delete('/search-history', async (req, res, next) => {
  try {
    const userId = Number(req.query.userId) || DEFAULT_USER_ID
    await pool.query('DELETE FROM study_search_history WHERE user_id = ?', [userId])
    res.json({ success: true, data: { recentSearches: [] } })
  } catch (err) {
    next(err)
  }
})

router.post('/rooms/:id/join', async (req, res, next) => {
  try {
    const roomId = Number(req.params.id)
    const [rows] = await pool.query(
      'SELECT id, name, room_code FROM study_rooms WHERE id = ?',
      [roomId],
    )

    if (!rows.length) {
      return res.status(404).json({ success: false, message: '自习室不存在' })
    }

    res.json({
      success: true,
      message: `已加入「${rows[0].name}」`,
      data: {
        roomId: rows[0].id,
        roomCode: rows[0].room_code,
        name: rows[0].name,
        message: `已加入「${rows[0].name}」`,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/buddies/:id/greet', async (req, res, next) => {
  try {
    const buddyId = Number(req.params.id)
    const [rows] = await pool.query('SELECT id, name FROM study_buddies WHERE id = ?', [buddyId])

    if (!rows.length) {
      return res.status(404).json({ success: false, message: '搭子不存在' })
    }

    res.json({
      success: true,
      message: `已向「${rows[0].name}」打招呼`,
      data: { buddyId: rows[0].id, name: rows[0].name, message: `已向「${rows[0].name}」打招呼` },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/buddies/:id/invite', async (req, res, next) => {
  try {
    const buddyId = Number(req.params.id)
    const [rows] = await pool.query('SELECT id, name FROM study_buddies WHERE id = ?', [buddyId])

    if (!rows.length) {
      return res.status(404).json({ success: false, message: '搭子不存在' })
    }

    res.json({
      success: true,
      message: `已邀请「${rows[0].name}」一起学习`,
      data: { buddyId: rows[0].id, name: rows[0].name, message: `已邀请「${rows[0].name}」一起学习` },
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

const INTERACT_MODES = ['voice', 'video', 'spectate']
const MODE_LABELS = {
  none: '未加入',
  voice: '语音连麦中',
  video: '视频自习中',
  spectate: '仅围观中',
}

async function ensureInteractSession(userId) {
  await pool.query(
    `INSERT INTO study_interact_sessions (user_id, room_code, mode)
     VALUES (?, 'SR-DEFAULT', 'none')
     ON DUPLICATE KEY UPDATE user_id = user_id`,
    [userId],
  )
}

async function buildInteractPayload(userId) {
  await ensureInteractSession(userId)

  const [[session]] = await pool.query(
    'SELECT mode, room_code AS roomCode, joined_at AS joinedAt FROM study_interact_sessions WHERE user_id = ?',
    [userId],
  )

  const [counts] = await pool.query(
    `SELECT mode, COUNT(*) AS cnt FROM study_interact_sessions
     WHERE mode IN ('voice', 'video') GROUP BY mode`,
  )
  const countMap = Object.fromEntries(counts.map((r) => [r.mode, r.cnt]))
  const voiceOnline = Number(countMap.voice || 0) + 12
  const videoOnline = Number(countMap.video || 0) + 8

  return {
    title: '互动功能',
    subtitle: '选择你想要的互动方式',
    currentMode: session?.mode || 'none',
    currentModeLabel: MODE_LABELS[session?.mode] || MODE_LABELS.none,
    roomCode: session?.roomCode || 'SR-DEFAULT',
    modes: [
      {
        key: 'voice',
        title: '语音连麦',
        subtitle: '开麦交流 一起学习更专注',
        onlineCount: voiceOnline,
      },
      {
        key: 'video',
        title: '视频自习',
        subtitle: '视频陪伴 见面学习更有动力',
        onlineCount: videoOnline,
      },
    ],
    utilities: [
      { key: 'rules', title: '房间规则', subtitle: '了解规则', icon: 'clipboard-list' },
      { key: 'privacy', title: '权限说明', subtitle: '隐私与安全', icon: 'shield' },
      { key: 'spectate', title: '仅围观', subtitle: '不进麦不出镜', icon: 'eye' },
    ],
    rules: '请保持安静专注，禁止广告与无关话题；连麦时请开启文明用语，尊重他人学习节奏。',
    privacy: '语音/视频仅在同自习室内可见，不会录制或对外分享。你可随时退出连麦并关闭麦克风与摄像头权限。',
  }
}

router.get('/interact', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    res.json({ success: true, data: await buildInteractPayload(userId) })
  } catch (err) {
    next(err)
  }
})

router.post('/interact/join', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const mode = String(req.body.mode || '').trim()

    if (!INTERACT_MODES.includes(mode)) {
      return res.status(400).json({ success: false, message: '无效的互动方式' })
    }

    await ensureInteractSession(userId)
    await pool.query(
      `UPDATE study_interact_sessions
       SET mode = ?, joined_at = NOW(), room_code = 'SR-DEFAULT'
       WHERE user_id = ?`,
      [mode, userId],
    )

    const labels = { voice: '语音连麦', video: '视频自习', spectate: '仅围观' }
    const payload = await buildInteractPayload(userId)

    res.json({
      success: true,
      message: `已进入${labels[mode]}`,
      data: {
        ...payload,
        message: `已进入${labels[mode]}`,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/interact/leave', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    await ensureInteractSession(userId)
    await pool.query(
      `UPDATE study_interact_sessions SET mode = 'none', joined_at = NULL WHERE user_id = ?`,
      [userId],
    )
    await pool.query(
      `UPDATE study_voice_user_state SET is_speaking = 0, hand_raised = 0 WHERE user_id = ?`,
      [userId],
    )
    try {
      await pool.query(
        `UPDATE study_video_user_state SET camera_enabled = 0, mic_enabled = 0 WHERE user_id = ?`,
        [userId],
      )
    } catch {
      /* video table may not exist yet */
    }
    res.json({
      success: true,
      message: '已退出互动',
      data: await buildInteractPayload(userId),
    })
  } catch (err) {
    next(err)
  }
})

const VOICE_STATUS_LABELS = {
  focusing: '专注中',
  speaking: '发言中',
  hand_raise: '举手发言',
  muted: '已静音',
}

function formatFocusTime(seconds) {
  const sec = Math.max(0, Number(seconds) || 0)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

async function ensureVoiceState(userId, roomCode = 'SR-DEFAULT') {
  await ensureInteractSession(userId)
  await pool.query(
    `INSERT INTO study_voice_user_state (user_id, room_code)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE room_code = VALUES(room_code)`,
    [userId, roomCode],
  )
}

function formatParticipant(row, extra = {}) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    seed: row.avatar_seed,
    avatarUrl: row.avatar_url || '',
    x: row.pos_x != null ? Number(row.pos_x) : null,
    y: row.pos_y != null ? Number(row.pos_y) : null,
    focusSeconds: row.focus_seconds,
    focusLabel: formatFocusTime(row.focus_seconds),
    status: row.status,
    statusLabel: VOICE_STATUS_LABELS[row.status] || row.status,
    micOn: Boolean(row.mic_on),
    isCenter: row.role === 'center',
    listSort: row.list_sort != null ? Number(row.list_sort) : null,
    ...extra,
  }
}

function buildPartnerList(participants) {
  return participants
    .filter((p) => p.role === 'list')
    .sort((a, b) => {
      const focusDiff = Number(b.focus_seconds) - Number(a.focus_seconds)
      if (focusDiff !== 0) return focusDiff
      return Number(a.list_sort) - Number(b.list_sort)
    })
    .map((row, index) => formatParticipant(row, { rank: index + 1 }))
}

async function buildVoiceRoom(userId) {
  const roomCode = 'SR-DEFAULT'
  await ensureVoiceState(userId, roomCode)

  const [[userRow]] = await pool.query('SELECT name FROM users WHERE id = ?', [userId])
  const [[state]] = await pool.query(
    `SELECT mic_enabled, speaker_enabled, headphone_mode, is_speaking, hand_raised, focus_remaining_sec
     FROM study_voice_user_state WHERE user_id = ?`,
    [userId],
  )
  const [[profile]] = await pool.query(
    'SELECT avatar_seed, avatar_url FROM user_profiles WHERE user_id = ?',
    [userId],
  )

  const [participants] = await pool.query(
    `SELECT p.id, p.role, p.user_id, p.name, p.avatar_seed, up.avatar_url,
            p.pos_x, p.pos_y, p.focus_seconds, p.status, p.mic_on, p.list_sort
     FROM study_voice_participants p
     LEFT JOIN user_profiles up ON up.user_id = p.user_id
     WHERE p.room_code = ?
     ORDER BY p.list_sort ASC, p.id ASC`,
    [roomCode],
  )

  const listPartners = participants.filter((p) => p.role === 'list')
  const onlineCount = listPartners.length + (participants.some((p) => p.role === 'center') ? 1 : 0)

  const orbit = participants.filter((p) => p.role === 'orbit').map((row) => formatParticipant(row))
  const center = participants.find((p) => p.role === 'center')
  const partners = buildPartnerList(participants)

  const selfStatus = state.hand_raised ? 'hand_raise' : state.is_speaking ? 'speaking' : 'focusing'

  return {
    roomName: '星光自习室',
    roomCode,
    onlineCount,
    rules: '请保持安静专注，连麦时文明用语；按住说话松开发送，尊重他人学习节奏。',
    focusRemainingSec: state.focus_remaining_sec,
    focusLabel: formatFocusTime(state.focus_remaining_sec),
    center: center ? formatParticipant(center) : null,
    orbit,
    partners,
    self: {
      name: userRow?.name || '我',
      seed: profile?.avatar_seed || 'xiaogun',
      avatarUrl: profile?.avatar_url || '',
      micEnabled: Boolean(state.mic_enabled),
      speakerEnabled: Boolean(state.speaker_enabled),
      headphoneMode: Boolean(state.headphone_mode),
      isSpeaking: Boolean(state.is_speaking),
      handRaised: Boolean(state.hand_raised),
      status: selfStatus,
      statusLabel: VOICE_STATUS_LABELS[selfStatus],
      focusLabel: formatFocusTime(state.focus_remaining_sec),
    },
    speakingHint: state.is_speaking ? '你正在说话...' : '',
  }
}

router.get('/voice', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const [[session]] = await pool.query(
      'SELECT mode FROM study_interact_sessions WHERE user_id = ?',
      [userId],
    )
    if (session?.mode !== 'voice') {
      return res.status(403).json({ success: false, message: '请先进入语音连麦' })
    }
    res.json({ success: true, data: await buildVoiceRoom(userId) })
  } catch (err) {
    next(err)
  }
})

router.patch('/voice/settings', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    await ensureVoiceState(userId)

    const fields = []
    const values = []
    const map = {
      micEnabled: 'mic_enabled',
      speakerEnabled: 'speaker_enabled',
      headphoneMode: 'headphone_mode',
    }

    for (const [key, column] of Object.entries(map)) {
      if (req.body[key] === undefined) continue
      fields.push(`${column} = ?`)
      values.push(req.body[key] ? 1 : 0)
    }

    if (!fields.length) {
      return res.status(400).json({ success: false, message: '没有可更新的设置' })
    }

    if (req.body.micEnabled === false) {
      fields.push('is_speaking = 0')
    }

    values.push(userId)
    await pool.query(`UPDATE study_voice_user_state SET ${fields.join(', ')} WHERE user_id = ?`, values)

    res.json({ success: true, data: await buildVoiceRoom(userId), message: '设置已更新' })
  } catch (err) {
    next(err)
  }
})

router.post('/voice/speak', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const active = Boolean(req.body.active)
    await ensureVoiceState(userId)

    const [[state]] = await pool.query(
      'SELECT mic_enabled FROM study_voice_user_state WHERE user_id = ?',
      [userId],
    )
    if (!state?.mic_enabled) {
      return res.status(400).json({ success: false, message: '麦克风已关闭' })
    }

    await pool.query(
      'UPDATE study_voice_user_state SET is_speaking = ?, hand_raised = 0 WHERE user_id = ?',
      [active ? 1 : 0, userId],
    )

    res.json({
      success: true,
      message: active ? '正在发言' : '发言结束',
      data: await buildVoiceRoom(userId),
    })
  } catch (err) {
    next(err)
  }
})

router.post('/voice/hand-raise', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    await ensureVoiceState(userId)

    const [[state]] = await pool.query(
      'SELECT hand_raised FROM study_voice_user_state WHERE user_id = ?',
      [userId],
    )
    const nextRaised = state?.hand_raised ? 0 : 1

    await pool.query(
      'UPDATE study_voice_user_state SET hand_raised = ?, is_speaking = 0 WHERE user_id = ?',
      [nextRaised, userId],
    )

    res.json({
      success: true,
      message: nextRaised ? '已举手发言' : '已取消举手',
      data: await buildVoiceRoom(userId),
    })
  } catch (err) {
    next(err)
  }
})

router.post('/voice/end-focus', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    await ensureVoiceState(userId)
    await pool.query(
      `UPDATE study_voice_user_state SET focus_remaining_sec = 0, is_speaking = 0, hand_raised = 0 WHERE user_id = ?`,
      [userId],
    )
    res.json({
      success: true,
      message: '专注已结束',
      data: await buildVoiceRoom(userId),
    })
  } catch (err) {
    next(err)
  }
})

async function ensureVideoState(userId, roomCode = 'SR-DEFAULT') {
  await ensureInteractSession(userId)
  await pool.query(
    `INSERT INTO study_video_user_state (user_id, room_code)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE room_code = VALUES(room_code)`,
    [userId, roomCode],
  )
}

function formatVideoTile(row) {
  return {
    id: row.id,
    name: row.name,
    seed: row.avatar_seed,
    micOn: Boolean(row.mic_on),
    cameraOn: Boolean(row.camera_on),
  }
}

async function buildVideoRoom(userId) {
  const roomCode = 'SR-DEFAULT'
  await ensureVideoState(userId, roomCode)

  const [[userRow]] = await pool.query('SELECT name FROM users WHERE id = ?', [userId])
  const [[state]] = await pool.query(
    `SELECT mic_enabled, camera_enabled, camera_facing, beauty_filter, background_blur,
            privacy_mode, screen_brightness, focus_remaining_sec
     FROM study_video_user_state WHERE user_id = ?`,
    [userId],
  )
  const [[profile]] = await pool.query(
    'SELECT avatar_seed FROM user_profiles WHERE user_id = ?',
    [userId],
  )

  const [tiles] = await pool.query(
    `SELECT id, name, avatar_seed, mic_on, camera_on
     FROM study_video_participants WHERE room_code = ? ORDER BY sort_order ASC, id ASC`,
    [roomCode],
  )

  const [[onlineRow]] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM study_interact_sessions WHERE mode = 'video'`,
  )
  const onlineCount = Number(onlineRow?.cnt || 0) + tiles.length + 120

  const gridTiles = tiles.slice(0, 3).map(formatVideoTile)
  const moreCount = Math.max(0, onlineCount - gridTiles.length)

  return {
    roomName: '星光自习室',
    roomCode,
    onlineCount,
    moreCount,
    rules: '视频自习请衣着得体、保持专注；禁止录屏传播他人画面，尊重隐私。',
    focusRemainingSec: state.focus_remaining_sec,
    focusLabel: formatFocusTime(state.focus_remaining_sec),
    gridTiles,
    self: {
      name: userRow?.name || '我',
      seed: profile?.avatar_seed || 'xiaogun',
      videoSeed: profile?.avatar_seed || 'study-girl',
      micEnabled: Boolean(state.mic_enabled),
      cameraEnabled: Boolean(state.camera_enabled),
      cameraFacing: state.camera_facing || 'front',
      beautyFilter: Boolean(state.beauty_filter),
      backgroundBlur: Boolean(state.background_blur),
      privacyMode: Boolean(state.privacy_mode),
      screenBrightness: Boolean(state.screen_brightness),
    },
  }
}

router.get('/video', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const [[session]] = await pool.query(
      'SELECT mode FROM study_interact_sessions WHERE user_id = ?',
      [userId],
    )
    if (session?.mode !== 'video') {
      return res.status(403).json({ success: false, message: '请先进入视频自习' })
    }
    res.json({ success: true, data: await buildVideoRoom(userId) })
  } catch (err) {
    next(err)
  }
})

router.patch('/video/settings', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    await ensureVideoState(userId)

    const map = {
      micEnabled: 'mic_enabled',
      cameraEnabled: 'camera_enabled',
      beautyFilter: 'beauty_filter',
      backgroundBlur: 'background_blur',
      privacyMode: 'privacy_mode',
      screenBrightness: 'screen_brightness',
    }

    const fields = []
    const values = []
    for (const [key, column] of Object.entries(map)) {
      if (req.body[key] === undefined) continue
      fields.push(`${column} = ?`)
      values.push(req.body[key] ? 1 : 0)
    }

    if (!fields.length) {
      return res.status(400).json({ success: false, message: '没有可更新的设置' })
    }

    values.push(userId)
    await pool.query(`UPDATE study_video_user_state SET ${fields.join(', ')} WHERE user_id = ?`, values)

    res.json({ success: true, data: await buildVideoRoom(userId), message: '设置已更新' })
  } catch (err) {
    next(err)
  }
})

router.post('/video/switch-camera', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    await ensureVideoState(userId)
    const [[state]] = await pool.query(
      'SELECT camera_facing FROM study_video_user_state WHERE user_id = ?',
      [userId],
    )
    const nextFacing = state?.camera_facing === 'front' ? 'back' : 'front'
    await pool.query(
      'UPDATE study_video_user_state SET camera_facing = ? WHERE user_id = ?',
      [nextFacing, userId],
    )
    res.json({
      success: true,
      message: nextFacing === 'front' ? '已切换前置镜头' : '已切换后置镜头',
      data: await buildVideoRoom(userId),
    })
  } catch (err) {
    next(err)
  }
})

router.post('/video/end-focus', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    await ensureVideoState(userId)
    await pool.query(
      'UPDATE study_video_user_state SET focus_remaining_sec = 0 WHERE user_id = ?',
      [userId],
    )
    res.json({
      success: true,
      message: '专注已结束',
      data: await buildVideoRoom(userId),
    })
  } catch (err) {
    next(err)
  }
})

const STUDY_MENU_ITEMS = [
  { key: 'members', title: '房间成员', subtitle: '查看成员与状态', icon: 'users' },
  { key: 'info', title: '房间资料', subtitle: '查看房间详情', icon: 'book' },
  { key: 'invite', title: '邀请好友', subtitle: '邀请好友一起学习', icon: 'user-plus' },
  { key: 'rules', title: '房间规则', subtitle: '了解房间规则', icon: 'shield' },
  { key: 'notify', title: '消息提醒', subtitle: '通知与提醒设置', icon: 'bell' },
  { key: 'report', title: '举报反馈', subtitle: '问题反馈与举报', icon: 'triangle-exclamation' },
]

async function getNotifyEnabled(userId) {
  try {
    const [[row]] = await pool.query(
      'SELECT notify_enabled FROM study_interact_sessions WHERE user_id = ?',
      [userId],
    )
    if (row?.notify_enabled == null) return true
    return Boolean(row.notify_enabled)
  } catch {
    return true
  }
}

function buildMenuMembers(mode, roomData) {
  if (mode === 'video') {
    return (roomData.gridTiles || []).map((tile, index) => ({
      id: tile.id,
      userId: tile.userId,
      name: tile.name,
      seed: tile.seed,
      avatarUrl: tile.avatarUrl || '',
      statusLabel: tile.micOn ? '在线' : '已静音',
      focusLabel: '45:00',
      micOn: tile.micOn !== false,
      rank: index + 1,
    }))
  }

  return (roomData.partners || []).map((member) => ({
    id: member.id,
    userId: member.userId,
    name: member.name,
    seed: member.seed,
    avatarUrl: member.avatarUrl || '',
    statusLabel: member.statusLabel,
    focusLabel: member.focusLabel,
    rank: member.rank,
    micOn: member.micOn,
  }))
}

async function fetchHostProfile() {
  const [[row]] = await pool.query(
    `SELECT u.id, u.name, COALESCE(up.avatar_seed, 'moon-night') AS avatar_seed, up.avatar_url
     FROM users u
     LEFT JOIN user_profiles up ON up.user_id = u.id
     WHERE u.id = 1`,
  )
  return row || null
}

async function buildStudyMenu(userId, mode) {
  const roomData = mode === 'video' ? await buildVideoRoom(userId) : await buildVoiceRoom(userId)
  const notifyEnabled = await getNotifyEnabled(userId)

  return {
    title: '功能菜单',
    footerText: '与你一起，专注成长 ✨',
    notifyEnabled,
    items: STUDY_MENU_ITEMS,
    room: {
      name: roomData.roomName,
      code: roomData.roomCode,
      onlineCount: roomData.onlineCount,
      rules: roomData.rules,
      focusLabel: roomData.focusLabel,
      description:
        mode === 'video'
          ? '视频自习室，开启摄像头与伙伴一起专注学习。'
          : '语音连麦自习室，按住说话，与伙伴互相陪伴成长。',
    },
    members: buildMenuMembers(mode, roomData),
  }
}

async function fetchStudyRoomRow(roomCode) {
  try {
    const [[row]] = await pool.query(
      `SELECT room_code, name, subtitle, room_intro, entry_method, rules_summary,
              host_name, host_seed, display_number, cover_seed, online_count, focus_rate, tags
       FROM study_rooms WHERE room_code = ? LIMIT 1`,
      [roomCode],
    )
    return row || null
  } catch {
    return null
  }
}

async function buildRoomInfo(userId, mode) {
  const roomCode = 'SR-DEFAULT'
  const roomData = mode === 'video' ? await buildVideoRoom(userId) : await buildVoiceRoom(userId)
  const dbRow = await fetchStudyRoomRow(roomCode)
  const hostProfile = await fetchHostProfile()
  const members = buildMenuMembers(mode, roomData)

  const hostName = hostProfile?.name || dbRow?.host_name || members[0]?.name || '小棍同学'
  const hostSeed = hostProfile?.avatar_seed || dbRow?.host_seed || members[0]?.seed || 'moon-night'
  const hostAvatarUrl = hostProfile?.avatar_url || members[0]?.avatarUrl || ''

  const allMembers = members.map((member) => ({
    ...member,
    isHost: member.userId === hostProfile?.id || member.name === hostName,
    micOn: member.micOn !== false,
  }))

  const onlineCount = allMembers.length

  return {
    tab: 'info',
    name: dbRow?.name || roomData.roomName || '星光自习室',
    slogan: dbRow?.subtitle || '在星光下专注，在陪伴中成长',
    coverSeed: dbRow?.cover_seed || 'night-deer',
    onlineCount,
    onlineLabel: `${onlineCount}人在线`,
    focusRate: dbRow?.focus_rate || 96,
    host: {
      name: hostName,
      seed: hostSeed,
      avatarUrl: hostAvatarUrl,
      isHost: true,
    },
    tags: parseTags(dbRow?.tags) || ['专注学习', '自习打卡', '考研备考', '自律成长'],
    intro:
      dbRow?.room_intro ||
      '一起专注学习，互相陪伴，共同进步，让每一天都成为更好的自己！✨',
    entryMethod: dbRow?.entry_method || '自由加入',
    displayNumber: dbRow?.display_number || '123456',
    entryLabel: `自由加入（房间号：${dbRow?.display_number || '123456'}）`,
    rulesSummary: dbRow?.rules_summary || '友善交流 | 禁止广告 | 专注学习',
    rulesDetail: roomData.rules,
    inviteLink: `https://chongxueba.app/study/join?room=${roomCode}&mode=${mode}`,
    roomCode,
    mode,
    modeLabel: mode === 'video' ? '视频自习' : '语音连麦',
    members: allMembers,
    membersPreview: allMembers.slice(0, 5),
    totalMembers: allMembers.length,
    hasMoreMembers: allMembers.length > 5,
  }
}

router.get('/menu/room-info', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const mode = req.query.mode === 'video' ? 'video' : 'voice'
    const [[session]] = await pool.query(
      'SELECT mode FROM study_interact_sessions WHERE user_id = ?',
      [userId],
    )
    if (!session || session.mode === 'none') {
      return res.status(403).json({ success: false, message: '请先进入自习室' })
    }
    if (session.mode !== mode && session.mode !== 'spectate') {
      return res.status(403).json({ success: false, message: '当前互动模式不匹配' })
    }
    res.json({ success: true, data: await buildRoomInfo(userId, mode) })
  } catch (err) {
    next(err)
  }
})

router.get('/menu', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const mode = req.query.mode === 'video' ? 'video' : 'voice'
    const [[session]] = await pool.query(
      'SELECT mode FROM study_interact_sessions WHERE user_id = ?',
      [userId],
    )
    if (!session || session.mode === 'none') {
      return res.status(403).json({ success: false, message: '请先进入自习室' })
    }
    if (session.mode !== mode && session.mode !== 'spectate') {
      return res.status(403).json({ success: false, message: '当前互动模式不匹配' })
    }
    res.json({ success: true, data: await buildStudyMenu(userId, mode) })
  } catch (err) {
    next(err)
  }
})

router.post('/menu/action', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const action = String(req.body?.action || '')
    const mode = req.body?.mode === 'video' ? 'video' : 'voice'
    const message = String(req.body?.message || '').trim().slice(0, 500)

    if (action === 'invite') {
      const inviteLink = `https://chongxueba.app/study/join?room=SR-DEFAULT&mode=${mode}`
      return res.json({
        success: true,
        data: { inviteLink, message: '邀请链接已生成' },
      })
    }

    if (action === 'toggle-notify') {
      const enabled = await getNotifyEnabled(userId)
      const nextEnabled = enabled ? 0 : 1
      try {
        await pool.query(
          'UPDATE study_interact_sessions SET notify_enabled = ? WHERE user_id = ?',
          [nextEnabled, userId],
        )
      } catch {
        /* column may not exist yet */
      }
      return res.json({
        success: true,
        data: {
          notifyEnabled: Boolean(nextEnabled),
          message: nextEnabled ? '已开启消息提醒' : '已关闭消息提醒',
        },
      })
    }

    if (action === 'report') {
      if (!message) {
        return res.status(400).json({ success: false, message: '请填写反馈内容' })
      }
      try {
        await pool.query(
          `INSERT INTO study_room_reports (user_id, room_code, mode, message)
           VALUES (?, 'SR-DEFAULT', ?, ?)`,
          [userId, mode, message],
        )
      } catch {
        /* table may not exist yet */
      }
      return res.json({
        success: true,
        data: { message: '反馈已提交，感谢你的举报' },
      })
    }

    return res.status(400).json({ success: false, message: '未知操作' })
  } catch (err) {
    next(err)
  }
})

const INVITE_MILESTONES = [
  { target: 1, reward: 10, icon: 'star', label: '邀请1人' },
  { target: 3, reward: 30, icon: 'gift', label: '邀请3人' },
  { target: 5, reward: 60, icon: 'chest', label: '邀请5人' },
]

function buildInviteCode(userId, profileCode, userName) {
  if (profileCode) return profileCode
  const prefix = String(userName || 'XG').slice(0, 2).toUpperCase()
  return `${prefix}ZY-${2020 + (userId % 10)}`
}

async function fetchInviteStats(userId) {
  try {
    const [[row]] = await pool.query(
      'SELECT invited_count, total_stars FROM study_invite_stats WHERE user_id = ?',
      [userId],
    )
    return row || { invited_count: 0, total_stars: 0 }
  } catch {
    return { invited_count: 0, total_stars: 0 }
  }
}

async function buildInvitePage(userId, mode = 'voice') {
  const roomCode = 'SR-DEFAULT'
  const [[userRow]] = await pool.query('SELECT name FROM users WHERE id = ?', [userId])
  const [[profile]] = await pool.query(
    'SELECT avatar_seed, invite_code FROM user_profiles WHERE user_id = ?',
    [userId],
  )
  const [[roomRow]] = await pool.query(
    `SELECT name, display_number, room_code FROM study_rooms WHERE room_code = ? LIMIT 1`,
    [roomCode],
  )

  const stats = await fetchInviteStats(userId)
  const invitedCount = stats.invited_count || 0

  const [buddies] = await pool.query(
    `SELECT id, name, avatar_seed, study_goal, status
     FROM study_buddies
     WHERE is_recommended = 1
     ORDER BY sort_order ASC, id ASC
     LIMIT 6`,
  )

  const inviteCode = buildInviteCode(userId, profile?.invite_code, userRow?.name)
  const displayNumber = roomRow?.display_number || '123456'
  const inviteLink = `https://chongxueba.app/study/join?room=${roomCode}&mode=${mode}&code=${encodeURIComponent(inviteCode)}`

  return {
    heroTitle: '邀请好友 一起自习',
    heroSubtitle: '每邀请1位好友可得星光奖励',
    inviteCode,
    room: {
      name: roomRow?.name || '星光自习室',
      displayNumber,
      roomCode,
      inviteLink,
    },
    shareMethods: [
      { key: 'wechat', label: '微信', color: '#22c55e' },
      { key: 'qq', label: 'QQ', color: '#3b82f6' },
      { key: 'link', label: '链接分享', color: '#6366f1' },
      { key: 'qrcode', label: '二维码', color: '#8b5cf6' },
    ],
    rewardProgress: {
      invitedCount,
      totalStars: stats.total_stars || 0,
      milestones: INVITE_MILESTONES.map((item) => ({
        ...item,
        reached: invitedCount >= item.target,
        current: invitedCount,
      })),
      rulesSummary: '好友通过你的邀请码或链接注册并进入自习室，即计为有效邀请；奖励星光会自动发放。',
    },
    recommendedFriends: buddies.map((buddy) => ({
      id: buddy.id,
      name: buddy.name,
      seed: buddy.avatar_seed,
      message: buddy.study_goal ? `一起${buddy.study_goal}` : '我们一起专注成长吧~',
      status: buddy.status,
    })),
    mode,
  }
}

router.get('/invite', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const mode = req.query.mode === 'video' ? 'video' : 'voice'
    res.json({ success: true, data: await buildInvitePage(userId, mode) })
  } catch (err) {
    next(err)
  }
})

router.get('/invite/records', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    let rows = []
    try {
      ;[rows] = await pool.query(
        `SELECT id, invitee_name AS name, invite_channel AS channel, reward_stars AS rewardStars,
                DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS createdAt
         FROM study_invite_records
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 50`,
        [userId],
      )
    } catch {
      rows = []
    }
    const stats = await fetchInviteStats(userId)
    res.json({
      success: true,
      data: {
        records: rows,
        invitedCount: stats.invited_count || 0,
        totalStars: stats.total_stars || 0,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/invite/action', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const action = String(req.body?.action || '')
    const mode = req.body?.mode === 'video' ? 'video' : 'voice'
    const buddyId = Number(req.body?.buddyId) || 0
    const page = await buildInvitePage(userId, mode)

    async function recordInvite(name, channel, stars = 10) {
      try {
        await pool.query(
          `INSERT INTO study_invite_records (user_id, invitee_name, invite_channel, reward_stars)
           VALUES (?, ?, ?, ?)`,
          [userId, name, channel, stars],
        )
        await pool.query(
          `INSERT INTO study_invite_stats (user_id, invited_count, total_stars)
           VALUES (?, 1, ?)
           ON DUPLICATE KEY UPDATE
             invited_count = invited_count + 1,
             total_stars = total_stars + ?`,
          [userId, stars, stars],
        )
      } catch {
        /* tables may not exist yet */
      }
    }

    if (action === 'copy-code') {
      return res.json({
        success: true,
        data: { inviteCode: page.inviteCode, message: '邀请码已复制' },
      })
    }

    if (action === 'share-link' || action === 'share-wechat' || action === 'share-qq' || action === 'share-qrcode') {
      const channelMap = {
        'share-wechat': 'wechat',
        'share-qq': 'qq',
        'share-link': 'link',
        'share-qrcode': 'qrcode',
      }
      const channel = channelMap[action] || 'link'
      const labels = { wechat: '微信', qq: 'QQ', link: '链接', qrcode: '二维码' }
      return res.json({
        success: true,
        data: {
          inviteLink: page.room.inviteLink,
          inviteCode: page.inviteCode,
          channel,
          message: `已生成${labels[channel] || '分享'}内容，快去邀请好友吧`,
        },
      })
    }

    if (action === 'share-room') {
      const shareText = `${page.room.name}（房间号：${page.room.displayNumber}）\n${page.room.inviteLink}`
      return res.json({
        success: true,
        data: { shareText, inviteLink: page.room.inviteLink, message: '房间信息已复制' },
      })
    }

    if (action === 'invite-friend' && buddyId) {
      const [[buddy]] = await pool.query('SELECT id, name FROM study_buddies WHERE id = ?', [buddyId])
      if (!buddy) {
        return res.status(404).json({ success: false, message: '好友不存在' })
      }
      await recordInvite(buddy.name, 'buddy', 10)
      return res.json({
        success: true,
        data: {
          buddyId: buddy.id,
          name: buddy.name,
          inviteLink: page.room.inviteLink,
          message: `已向「${buddy.name}」发送邀请`,
        },
      })
    }

    if (action === 'invite-now') {
      return res.json({
        success: true,
        data: {
          inviteLink: page.room.inviteLink,
          inviteCode: page.inviteCode,
          message: '邀请链接已复制，快去分享给好友吧',
        },
      })
    }

    return res.status(400).json({ success: false, message: '未知操作' })
  } catch (err) {
    next(err)
  }
})

export default router
