import { Router } from 'express'
import pool from '../config/db.js'
import { resolveUserId } from '../utils/auth.js'
import { computeSessionRewards, applyVideoFocusRewards } from '../utils/videoFocusRewards.js'

const router = Router()

async function ensureVideoState(userId, roomCode = 'SR-DEFAULT') {
  await pool.query(
    `INSERT INTO study_video_user_state (user_id, room_code)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE room_code = VALUES(room_code)`,
    [userId, roomCode],
  )
}

async function getActiveSession(userId) {
  const [[row]] = await pool.query(
    `SELECT id, started_at, sample_count, focus_score_avg, effective_seconds,
            distracted_count, away_seconds, phone_suspect_count
     FROM study_video_focus_sessions
     WHERE user_id = ? AND ended_at IS NULL
     ORDER BY id DESC LIMIT 1`,
    [userId],
  )
  return row || null
}

router.post('/start', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const roomCode = String(req.body.roomCode || 'SR-DEFAULT')
    await ensureVideoState(userId, roomCode)

    const existing = await getActiveSession(userId)
    if (existing) {
      return res.json({ success: true, data: { sessionId: existing.id, resumed: true } })
    }

    const [result] = await pool.query(
      `INSERT INTO study_video_focus_sessions (user_id, room_code) VALUES (?, ?)`,
      [userId, roomCode],
    )

    res.json({
      success: true,
      data: { sessionId: result.insertId, resumed: false },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/events', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const sessionId = Number(req.body.sessionId)
    const events = Array.isArray(req.body.events) ? req.body.events : []

    if (!sessionId || !events.length) {
      return res.status(400).json({ success: false, message: '缺少 sessionId 或 events' })
    }

    const [[session]] = await pool.query(
      `SELECT id FROM study_video_focus_sessions
       WHERE id = ? AND user_id = ? AND ended_at IS NULL`,
      [sessionId, userId],
    )
    if (!session) {
      return res.status(404).json({ success: false, message: '分析会话不存在或已结束' })
    }

    for (const ev of events) {
      const score = Math.max(0, Math.min(100, Number(ev.score) || 0))
      const status = String(ev.status || 'unknown').slice(0, 24)
      await pool.query(
        `INSERT INTO study_video_focus_events (session_id, score, status, metrics_json)
         VALUES (?, ?, ?, ?)`,
        [sessionId, score, status, JSON.stringify(ev.metrics || {})],
      )
    }

    const summary = req.body.summary || {}
    await pool.query(
      `UPDATE study_video_focus_sessions SET
         sample_count = sample_count + ?,
         focus_score_avg = ?,
         effective_seconds = GREATEST(effective_seconds, ?),
         distracted_count = GREATEST(distracted_count, ?),
         away_seconds = GREATEST(away_seconds, ?),
         phone_suspect_count = GREATEST(phone_suspect_count, ?)
       WHERE id = ?`,
      [
        events.length,
        Math.round(Number(summary.focusScoreAvg) || 100),
        Math.round(Number(summary.effectiveSeconds) || 0),
        Math.round(Number(summary.distractedCount) || 0),
        Math.round(Number(summary.awaySeconds) || 0),
        Math.round(Number(summary.phoneSuspectCount) || 0),
        sessionId,
      ],
    )

    res.json({ success: true, message: '已记录' })
  } catch (err) {
    next(err)
  }
})

router.post('/end', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const sessionId = Number(req.body.sessionId)
    const summary = req.body.summary || {}

    const [[session]] = await pool.query(
      `SELECT * FROM study_video_focus_sessions
       WHERE id = ? AND user_id = ? AND ended_at IS NULL`,
      [sessionId, userId],
    )
    if (!session) {
      return res.status(404).json({ success: false, message: '分析会话不存在或已结束' })
    }

    const focusScoreAvg = Math.round(
      Number(summary.focusScoreAvg) || session.focus_score_avg || 100,
    )
    const effectiveSeconds = Math.round(
      Number(summary.effectiveSeconds) || session.effective_seconds || 0,
    )
    const distractedCount = Math.round(
      Number(summary.distractedCount) || session.distracted_count || 0,
    )
    const awaySeconds = Math.round(Number(summary.awaySeconds) || session.away_seconds || 0)
    const phoneSuspectCount = Math.round(
      Number(summary.phoneSuspectCount) || session.phone_suspect_count || 0,
    )
    const sampleCount = Math.round(
      Number(summary.sampleCount) || session.sample_count || 0,
    )

    const rewards = computeSessionRewards({ effectiveSeconds, avgScore: focusScoreAvg })
    const { taskCompleted } = await applyVideoFocusRewards(pool, userId, rewards)

    await pool.query(
      `UPDATE study_video_focus_sessions SET
         ended_at = NOW(),
         focus_score_avg = ?,
         effective_seconds = ?,
         distracted_count = ?,
         away_seconds = ?,
         phone_suspect_count = ?,
         sample_count = ?,
         exp_reward = ?,
         pet_exp_reward = ?,
         task_completed = ?
       WHERE id = ?`,
      [
        focusScoreAvg,
        effectiveSeconds,
        distractedCount,
        awaySeconds,
        phoneSuspectCount,
        sampleCount,
        rewards.expReward,
        rewards.petExpReward,
        taskCompleted ? 1 : 0,
        sessionId,
      ],
    )

    const [[userRow]] = await pool.query(
      'SELECT exp, focus_today_minutes, focus_stat FROM users WHERE id = ?',
      [userId],
    )
    const [[petRow]] = await pool.query(
      'SELECT exp, focus_power FROM pets WHERE user_id = ?',
      [userId],
    )

    res.json({
      success: true,
      message: '专注分析已结束',
      data: {
        sessionId,
        focusScoreAvg,
        effectiveSeconds,
        effectiveMinutes: rewards.minutes,
        distractedCount,
        awaySeconds,
        phoneSuspectCount,
        expReward: rewards.expReward,
        petExpReward: rewards.petExpReward,
        expMultiplier: rewards.expMultiplier,
        taskCompleted,
        user: userRow,
        pet: petRow,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/summary', async (req, res, next) => {
  try {
    const userId = resolveUserId(req)
    const [rows] = await pool.query(
      `SELECT id, focus_score_avg, effective_seconds, distracted_count,
              away_seconds, exp_reward, pet_exp_reward, task_completed, started_at, ended_at
       FROM study_video_focus_sessions
       WHERE user_id = ?
       ORDER BY id DESC LIMIT 5`,
      [userId],
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    next(err)
  }
})

export default router
