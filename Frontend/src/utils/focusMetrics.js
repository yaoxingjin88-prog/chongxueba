/**
 * AI 视频自习室 · 高级专注感知系统 2.0
 * 多信号融合 · 不检测键鼠 · 不做人脸/情绪识别
 */

export const FOCUS_LEVEL = {
  DEEP_FOCUS: 'deep_focus',
  NORMAL_FOCUS: 'normal_focus',
  LIGHT_DISTRACTION: 'light_distraction',
  DEEP_DISTRACTION: 'deep_distraction',
}

/** 兼容旧 API 的状态映射 */
export const FOCUS_STATUS = {
  FOCUSING: 'normal_focus',
  DEEP_FOCUS: 'deep_focus',
  DISTRACTED: 'light_distraction',
  DEEP_DISTRACTION: 'deep_distraction',
  AWAY: 'deep_distraction',
  PHONE_SUSPECT: 'light_distraction',
  UNKNOWN: 'normal_focus',
  GLANCE: 'light_distraction',
}

export const STATUS_LABELS = {
  deep_focus: '深度专注',
  normal_focus: '专注中',
  light_distraction: '轻微分心',
  deep_distraction: '明显分心',
  // 旧值兼容
  focusing: '专注中',
  distracted: '轻微分心',
  away: '离开页面',
  phone_suspect: '环境干扰',
  unknown: '感知中',
}

export const STATUS_HINTS = {
  deep_focus: '状态很棒，继续保持～',
  normal_focus: '学习节奏稳定，加油！',
  light_distraction: '回来继续吧，就差一点了',
  deep_distraction: '已记录到报告，调整一下状态哦',
  focusing: '学习节奏稳定，加油！',
  distracted: '回来继续吧，就差一点了',
  away: '页面已离开较久，回来继续自习吧',
  phone_suspect: '环境有些嘈杂，尽量保持安静',
  unknown: '正在感知学习行为…',
}

export const SCORE_WEIGHTS = {
  videoPlayback: 0.40,
  pageActivity: 0.20,
  rhythmStability: 0.25,
  anomalyInverse: 0.15,
}

export const FUSION_CONFIG = {
  /** 深度专注：高分 + 连续播放 */
  deepFocusScore: 85,
  deepFocusPlaySec: 180,
  /** 正常专注 */
  normalFocusScore: 65,
  /** 轻微分心 */
  lightDistractionScore: 40,
  /** 明显分心：低分或长时间离开 */
  deepHiddenSec: 45,
  deepBlackScreenSec: 20,
  /** 状态切换防抖（秒） */
  levelConfirmSec: 5,
  recoverConfirmSec: 4,
  /** 提醒 */
  lightToastCooldownSec: 50,
  reportIntervalSec: 30,
  tickIntervalMs: 1000,
}

const LEVEL_RANK = {
  deep_focus: 4,
  normal_focus: 3,
  light_distraction: 2,
  deep_distraction: 1,
}

const BAD_LEVELS = [FOCUS_LEVEL.LIGHT_DISTRACTION, FOCUS_LEVEL.DEEP_DISTRACTION]

/**
 * 多信号融合 → 0-100 专注分
 * @param {object} signals
 */
export function fuseFocusScore(signals) {
  const {
    playbackScore = 70,
    pageActivityScore = 70,
    rhythmStabilityScore = 70,
    anomalyScore = 0,
    audioScore = 80,
    audioEnabled = false,
  } = signals

  const anomalyInverse = 100 - Math.max(0, Math.min(100, anomalyScore))

  let score = (
    playbackScore * SCORE_WEIGHTS.videoPlayback
    + pageActivityScore * SCORE_WEIGHTS.pageActivity
    + rhythmStabilityScore * SCORE_WEIGHTS.rhythmStability
    + anomalyInverse * SCORE_WEIGHTS.anomalyInverse
  )

  if (audioEnabled) {
    score = score * 0.92 + audioScore * 0.08
  }

  return Math.round(Math.max(0, Math.min(100, score)))
}

/**
 * 融合判定专注等级
 * 关键：长时间无操作 + 视频连续播放 + 页面可见 → 仍为高专注
 */
export function classifyFocusLevel(score, ctx = {}) {
  const {
    continuousPlaySec = 0,
    isVisible = true,
    isPlaying = false,
    currentHiddenSec = 0,
    blackScreenSec = 0,
    pageActivityScore = 70,
  } = ctx

  if (currentHiddenSec >= FUSION_CONFIG.deepHiddenSec || blackScreenSec >= FUSION_CONFIG.deepBlackScreenSec) {
    return FOCUS_LEVEL.DEEP_DISTRACTION
  }

  if (!isVisible && currentHiddenSec > 12) {
    return FOCUS_LEVEL.DEEP_DISTRACTION
  }

  if (score < FUSION_CONFIG.lightDistractionScore) {
    return FOCUS_LEVEL.DEEP_DISTRACTION
  }

  if (
    score >= FUSION_CONFIG.deepFocusScore
    && continuousPlaySec >= FUSION_CONFIG.deepFocusPlaySec
    && isVisible
    && (isPlaying || pageActivityScore >= 75)
  ) {
    return FOCUS_LEVEL.DEEP_FOCUS
  }

  if (score >= FUSION_CONFIG.normalFocusScore) {
    return FOCUS_LEVEL.NORMAL_FOCUS
  }

  return FOCUS_LEVEL.LIGHT_DISTRACTION
}

export class BehaviorFocusTracker {
  constructor() {
    this.reset()
  }

  reset() {
    this.samples = []
    this.stableLevel = FOCUS_LEVEL.NORMAL_FOCUS
    this.rawLevel = FOCUS_LEVEL.NORMAL_FOCUS
    this.rawSince = Date.now()
    this.lastTickAt = Date.now()
    this.effectiveSeconds = 0
    this.lightDistractionCount = 0
    this.deepDistractionCount = 0
    this.tabHiddenSeconds = 0
    this.anomalyEvents = 0
    this.pendingLightAlert = false
    this.pendingDeepReport = false
    this.lastMetrics = {}
  }

  _elapsedSecSince(ts) {
    return (Date.now() - ts) / 1000
  }

  _applyStableTransition(nextLevel) {
    if (this.stableLevel === nextLevel) return

    if (nextLevel === FOCUS_LEVEL.LIGHT_DISTRACTION) {
      this.lightDistractionCount += 1
      this.pendingLightAlert = true
    }
    if (nextLevel === FOCUS_LEVEL.DEEP_DISTRACTION) {
      this.deepDistractionCount += 1
      this.pendingDeepReport = true
    }

    this.stableLevel = nextLevel
  }

  tick(signals) {
    const now = Date.now()
    const deltaSec = Math.min(5, (now - this.lastTickAt) / 1000)
    this.lastTickAt = now
    this.pendingLightAlert = false
    this.pendingDeepReport = false

    const score = fuseFocusScore(signals)
    const rawLevel = classifyFocusLevel(score, signals)
    this.lastMetrics = { ...signals, score, level: rawLevel }

    if (rawLevel !== this.rawLevel) {
      this.rawLevel = rawLevel
      this.rawSince = now
    }

    const rawDur = this._elapsedSecSince(this.rawSince)
    const needSec = BAD_LEVELS.includes(rawLevel)
      ? FUSION_CONFIG.levelConfirmSec
      : FUSION_CONFIG.recoverConfirmSec

    if (rawDur >= needSec) {
      this._applyStableTransition(rawLevel)
    }

    const trackLevel = this.stableLevel

    if (trackLevel === FOCUS_LEVEL.DEEP_FOCUS) {
      this.effectiveSeconds += deltaSec * (score / 100)
    } else if (trackLevel === FOCUS_LEVEL.NORMAL_FOCUS) {
      this.effectiveSeconds += deltaSec * (score / 100) * 0.92
    } else if (trackLevel === FOCUS_LEVEL.LIGHT_DISTRACTION) {
      this.effectiveSeconds += deltaSec * 0.45
    } else {
      this.effectiveSeconds += deltaSec * 0.15
    }

    if (!signals.isVisible) {
      this.tabHiddenSeconds += deltaSec
    }

    if (signals.anomalyScore > 50) {
      this.anomalyEvents += 1
    }

    this.samples.push({
      score,
      level: trackLevel,
      rawLevel,
      ...signals,
    })
    if (this.samples.length > 300) this.samples.shift()

    return { score, level: trackLevel, rawLevel }
  }

  consumeLightAlert() {
    const alert = this.pendingLightAlert
    this.pendingLightAlert = false
    return alert ? FOCUS_LEVEL.LIGHT_DISTRACTION : null
  }

  consumeDeepReport() {
    const report = this.pendingDeepReport
    this.pendingDeepReport = false
    return report ? FOCUS_LEVEL.DEEP_DISTRACTION : null
  }

  getSmoothedScore() {
    if (!this.samples.length) return 88
    const recent = this.samples.slice(-12)
    const avg = recent.reduce((s, x) => s + x.score, 0) / recent.length
    if (this.stableLevel === FOCUS_LEVEL.DEEP_FOCUS) {
      return Math.round(Math.max(avg, 85))
    }
    if (this.stableLevel === FOCUS_LEVEL.NORMAL_FOCUS) {
      return Math.round(Math.max(avg, 65))
    }
    return Math.round(Math.max(0, Math.min(100, avg)))
  }

  getCurrentLevel() {
    return this.stableLevel
  }

  /** 后端兼容 summary */
  getSummary() {
    return {
      focusScoreAvg: this.getSmoothedScore(),
      effectiveSeconds: Math.round(this.effectiveSeconds),
      distractedCount: this.lightDistractionCount,
      awaySeconds: Math.round(this.tabHiddenSeconds),
      phoneSuspectCount: this.anomalyEvents,
      deepDistractionCount: this.deepDistractionCount,
      lightDistractionCount: this.lightDistractionCount,
      sampleCount: this.samples.length,
      focusLevel: this.stableLevel,
    }
  }

  getPendingEvents() {
    const recent = this.samples.slice(-6)
    if (!recent.length) return []
    const avg = recent.reduce((s, x) => s + x.score, 0) / recent.length
    const last = recent[recent.length - 1]
    return [{
      score: Math.round(avg),
      status: this.getCurrentLevel(),
      metrics: {
        version: '2.0',
        focusLevel: last.level,
        playbackScore: last.playbackScore,
        pageActivityScore: last.pageActivityScore,
        rhythmStabilityScore: last.rhythmStabilityScore,
        anomalyScore: last.anomalyScore,
        continuousPlaySec: last.continuousPlaySec,
        isVisible: last.isVisible,
        isPlaying: last.isPlaying,
      },
    }]
  }
}

export function shouldAlert(level, alertLevel = 'standard') {
  if (!level || alertLevel === 'report') return false
  if (level === FOCUS_LEVEL.DEEP_DISTRACTION) return false
  if (level === FOCUS_LEVEL.LIGHT_DISTRACTION) return true
  return false
}

export function getDetectionHint() {
  return '2.0 行为感知：视频节奏 + 页面注意力 + 节奏稳定性，长时间静止仍算专注'
}

/** @deprecated 旧版人脸分析入口，保留空实现避免引用报错 */
export function analyzeLandmarks() {
  return { status: FOCUS_STATUS.UNKNOWN, score: 80, facePresent: false, yaw: 0, pitch: 0 }
}

/** @deprecated */
export const DETECTION_CONFIG = FUSION_CONFIG

/** @deprecated 别名 */
export class FocusScoreTracker extends BehaviorFocusTracker {}
