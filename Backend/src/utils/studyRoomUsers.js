export const STUDY_ROOM_POSITIONS = [
  { x: 13, y: 45 },
  { x: 87, y: 44 },
  { x: 33, y: 62 },
  { x: 62, y: 60 },
  { x: 16, y: 78 },
  { x: 47, y: 80 },
  { x: 82, y: 76 },
  { x: 50, y: 38 },
  { x: 24, y: 58 },
  { x: 76, y: 58 },
]

export const VOICE_ORBIT_POSITIONS = [
  { x: 18, y: 24 },
  { x: 82, y: 22 },
  { x: 12, y: 52 },
  { x: 88, y: 50 },
  { x: 28, y: 78 },
  { x: 72, y: 76 },
  { x: 50, y: 18 },
  { x: 24, y: 38 },
  { x: 76, y: 38 },
  { x: 50, y: 86 },
]

const VOICE_STATUS_CYCLE = ['focusing', 'speaking', 'focusing', 'muted', 'focusing', 'hand_raise']
const VOICE_MIC_CYCLE = [1, 1, 1, 0, 1, 1]

async function fetchAllUsers(pool) {
  const [users] = await pool.query(
    `SELECT u.id, u.name, COALESCE(up.avatar_seed, 'moon-night') AS avatar_seed
     FROM users u
     LEFT JOIN user_profiles up ON up.user_id = u.id
     ORDER BY u.id ASC`,
  )
  return users
}

export async function syncStudyRoomUsers(pool) {
  const users = await fetchAllUsers(pool)

  await pool.query('DELETE FROM study_room_users')

  if (!users.length) return 0

  const values = users.map((user, index) => {
    const slot = STUDY_ROOM_POSITIONS[index % STUDY_ROOM_POSITIONS.length]
    return [user.id, user.name, user.avatar_seed, slot.x, slot.y, 1]
  })

  await pool.query(
    `INSERT INTO study_room_users (user_id, name, avatar_seed, pos_x, pos_y, is_online)
     VALUES ?`,
    [values],
  )

  return users.length
}

export async function syncVoiceRoomParticipants(pool, roomCode = 'SR-DEFAULT') {
  const users = await fetchAllUsers(pool)

  await pool.query('DELETE FROM study_voice_participants WHERE room_code = ?', [roomCode])

  const rows = [
    [roomCode, 'center', null, '自习猫', 'study-cat', null, null, 2700, 'focusing', 0, 0],
  ]

  users.forEach((user, index) => {
    const slot = VOICE_ORBIT_POSITIONS[index % VOICE_ORBIT_POSITIONS.length]
    rows.push([
      roomCode,
      'orbit',
      user.id,
      user.name,
      user.avatar_seed,
      slot.x,
      slot.y,
      Math.max(2400, 2700 - index * 60),
      VOICE_STATUS_CYCLE[index % VOICE_STATUS_CYCLE.length],
      VOICE_MIC_CYCLE[index % VOICE_MIC_CYCLE.length],
      index + 1,
    ])
  })

  users.forEach((user, index) => {
    rows.push([
      roomCode,
      'list',
      user.id,
      user.name,
      user.avatar_seed,
      null,
      null,
      Math.max(2400, 2700 - index * 60),
      VOICE_STATUS_CYCLE[index % VOICE_STATUS_CYCLE.length],
      VOICE_MIC_CYCLE[index % VOICE_MIC_CYCLE.length],
      index + 1,
    ])
  })

  await pool.query(
    `INSERT INTO study_voice_participants
      (room_code, role, user_id, name, avatar_seed, pos_x, pos_y, focus_seconds, status, mic_on, list_sort)
     VALUES ?`,
    [rows],
  )

  return users.length
}

export async function syncAllStudyRooms(pool) {
  const mainCount = await syncStudyRoomUsers(pool)
  const voiceCount = await syncVoiceRoomParticipants(pool)
  return { mainCount, voiceCount }
}
