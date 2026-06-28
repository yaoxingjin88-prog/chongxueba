export function computeSessionRewards({ effectiveSeconds, avgScore }) {
  const minutes = Math.max(0, Math.floor(effectiveSeconds / 60))
  let expMultiplier = 1
  if (avgScore >= 90) expMultiplier = 1.4
  else if (avgScore >= 80) expMultiplier = 1.2
  else if (avgScore < 60) expMultiplier = 0.8

  const expReward = minutes > 0 ? Math.round(minutes * 2.4 * expMultiplier) : 0
  const petExpReward = Math.round(expReward * 0.5)
  const taskEligible = minutes >= 15 && avgScore >= 75
  const focusPowerBonus = avgScore >= 80 ? 1 : 0

  return {
    minutes,
    expReward,
    petExpReward,
    taskEligible,
    focusPowerBonus,
    expMultiplier,
  }
}

export async function applyVideoFocusRewards(pool, userId, rewards) {
  const { minutes, expReward, petExpReward, taskEligible, focusPowerBonus } = rewards

  if (expReward > 0) {
    await pool.query(
      `UPDATE users SET
         exp = exp + ?,
         focus_today_minutes = focus_today_minutes + ?,
         focus_week_minutes = focus_week_minutes + ?,
         focus_stat = LEAST(100, focus_stat + ?)
       WHERE id = ?`,
      [expReward, minutes, minutes, focusPowerBonus ? 3 : 1, userId],
    )

    if (minutes > 0) {
      await pool.query(
        `INSERT INTO focus_records (user_id, record_date, minutes)
         VALUES (?, CURDATE(), ?)
         ON DUPLICATE KEY UPDATE minutes = minutes + VALUES(minutes)`,
        [userId, minutes],
      )
    }
  }

  if (petExpReward > 0) {
    await pool.query(
      `UPDATE pets SET
         exp = exp + ?,
         focus_power = LEAST(100, focus_power + ?)
       WHERE user_id = ?`,
      [petExpReward, focusPowerBonus, userId],
    )
  }

  if (taskEligible) {
    const [tasks] = await pool.query(
      `SELECT t.id FROM tasks t WHERE t.type = 'daily' AND t.icon = 'clock' LIMIT 1`,
    )
    if (tasks.length) {
      await pool.query(
        `INSERT INTO user_tasks (user_id, task_id, current_count, done, activity_date)
         VALUES (?, ?, 1, 1, CURDATE())
         ON DUPLICATE KEY UPDATE current_count = 1, done = 1`,
        [userId, tasks[0].id],
      )
    }
  }

  return { taskCompleted: taskEligible }
}
