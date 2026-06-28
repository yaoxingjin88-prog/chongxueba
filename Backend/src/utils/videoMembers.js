const ADJ = ['好学', '努力', '自律', '专注', '奋进', '勤奋', '刻苦', '认真', '沉稳', '阳光']
const ANIMAL = ['狐', '猫', '熊', '鹿', '兔', '鸭', '犬', '鹰', '鲸', '星']
const SUFFIX = ['同学', '学霸', '小伙伴', '学友']

export function formatFocusTime(sec) {
  const s = Math.max(0, Number(sec) || 0)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

function virtualName(index) {
  const adj = ADJ[index % ADJ.length]
  const animal = ANIMAL[Math.floor(index / ADJ.length) % ANIMAL.length]
  const suffix = SUFFIX[Math.floor(index / (ADJ.length * ANIMAL.length)) % SUFFIX.length]
  const num = index > 0 ? String((index % 99) + 1).padStart(2, '0') : ''
  return `${adj}${animal}${suffix}${num}`
}

function virtualFocusScore(index) {
  return 62 + ((index * 17 + 31) % 36)
}

function virtualFocusSec(index) {
  const base = 1200 + (index * 137) % 1800
  return base
}

export function formatVideoMember(row, index = 0) {
  const focusSec = row.focus_remaining_sec ?? row.focusRemainingSec ?? virtualFocusSec(index)
  const focusScore = row.focus_score ?? row.focusScore ?? virtualFocusScore(index)
  return {
    id: row.id ?? `v-${index}`,
    userId: row.user_id ?? row.userId ?? null,
    name: row.name,
    seed: row.avatar_seed ?? row.seed ?? `vr-${index}`,
    avatarUrl: row.avatar_url ?? row.avatarUrl ?? '',
    micOn: row.mic_on != null ? Boolean(row.mic_on) : (row.micOn != null ? Boolean(row.micOn) : true),
    cameraOn: row.camera_on != null ? Boolean(row.camera_on) : (row.cameraOn != null ? Boolean(row.cameraOn) : true),
    focusScore: Math.round(Number(focusScore) || 0),
    focusLabel: formatFocusTime(focusSec),
    statusLabel: row.status_label ?? (row.mic_on === 0 || row.micOn === false ? '已静音' : '专注中'),
    isVirtual: Boolean(row.is_virtual ?? row.isVirtual),
  }
}

export function buildVirtualMember(index, roomCode = 'SR-DEFAULT') {
  return formatVideoMember({
    id: `virtual-${roomCode}-${index}`,
    name: virtualName(index),
    avatar_seed: `video-peer-${roomCode}-${index}`,
    mic_on: index % 6 !== 0 ? 1 : 0,
    camera_on: index % 4 !== 0 ? 1 : 0,
    focus_remaining_sec: virtualFocusSec(index),
    focus_score: virtualFocusScore(index),
    is_virtual: true,
  }, index)
}

/**
 * 合并真实参与者 + 在线用户 + 虚拟同学，支持搜索与分页
 */
export async function buildVideoMembersList(pool, userId, roomCode, options = {}) {
  const page = Math.max(1, Number(options.page) || 1)
  const pageSize = Math.min(60, Math.max(12, Number(options.pageSize) || 24))
  const q = String(options.q || '').trim().toLowerCase()

  const [[roomRow]] = await pool.query(
    'SELECT online_count FROM study_rooms WHERE room_code = ? LIMIT 1',
    [roomCode],
  )
  const [[sessionCnt]] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM study_interact_sessions WHERE mode = 'video'`,
  )

  const [dbParticipants] = await pool.query(
    `SELECT p.id, p.name, p.avatar_seed, p.mic_on, p.camera_on, p.sort_order
     FROM study_video_participants p
     WHERE p.room_code = ?
     ORDER BY p.sort_order ASC, p.id ASC`,
    [roomCode],
  )

  const [liveUsers] = await pool.query(
    `SELECT u.id AS user_id, u.name,
            COALESCE(up.avatar_seed, 'moon-night') AS avatar_seed,
            up.avatar_url,
            COALESCE(vs.mic_enabled, 1) AS mic_on,
            COALESCE(vs.camera_enabled, 1) AS camera_on,
            COALESCE(vs.focus_remaining_sec, 2700) AS focus_remaining_sec,
            COALESCE(fs.focus_score_avg, 88) AS focus_score
     FROM study_interact_sessions si
     INNER JOIN users u ON u.id = si.user_id
     LEFT JOIN user_profiles up ON up.user_id = u.id
     LEFT JOIN study_video_user_state vs ON vs.user_id = u.id
     LEFT JOIN study_video_focus_sessions fs ON fs.user_id = u.id AND fs.ended_at IS NULL
     WHERE si.mode = 'video' AND u.id != ?
     ORDER BY u.id ASC`,
    [userId],
  )

  const seen = new Set()
  const merged = []

  for (const row of dbParticipants) {
    const key = `p-${row.id}`
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(formatVideoMember({ ...row, is_virtual: false }))
  }

  for (const row of liveUsers) {
    const key = `u-${row.user_id}`
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(formatVideoMember({ ...row, is_virtual: false }))
  }

  const targetTotal = Math.max(
    Number(roomRow?.online_count || 0),
    merged.length + 120,
    Number(sessionCnt?.cnt || 0) + dbParticipants.length + 120,
  )

  let virtualIndex = 0
  while (merged.length < targetTotal) {
    merged.push(buildVirtualMember(virtualIndex, roomCode))
    virtualIndex += 1
  }

  let filtered = merged
  if (q) {
    filtered = merged.filter((m) => m.name.toLowerCase().includes(q))
  }

  const total = filtered.length
  const start = (page - 1) * pageSize
  const members = filtered.slice(start, start + pageSize)

  return {
    roomCode,
    roomName: '星光自习室',
    onlineCount: targetTotal,
    total,
    page,
    pageSize,
    hasMore: start + pageSize < total,
    members,
  }
}

export async function getVideoOnlineCount(pool, roomCode) {
  const [[roomRow]] = await pool.query(
    'SELECT online_count FROM study_rooms WHERE room_code = ? LIMIT 1',
    [roomCode],
  )
  const [[sessionCnt]] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM study_interact_sessions WHERE mode = 'video'`,
  )
  const [dbParticipants] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM study_video_participants WHERE room_code = ?',
    [roomCode],
  )
  return Math.max(
    Number(roomRow?.online_count || 0),
    Number(sessionCnt?.cnt || 0) + Number(dbParticipants[0]?.cnt || 0) + 120,
  )
}
