import { ref } from 'vue'
import { VideoRhythmAnalyzer } from '../utils/focusSignals/videoRhythm.js'
import { PageAttentionAnalyzer } from '../utils/focusSignals/pageAttention.js'
import { AudioEnvAnalyzer } from '../utils/focusSignals/audioEnv.js'
import { CameraMotionAnalyzer } from '../utils/focusSignals/cameraMotion.js'
import {
  BehaviorFocusTracker,
  FOCUS_LEVEL,
  STATUS_HINTS,
  FUSION_CONFIG,
  shouldAlert,
} from '../utils/focusMetrics.js'

/**
 * AI 视频自习室 · 高级专注感知系统 2.0
 * 不检测键鼠 · 不做人脸识别 · 多信号行为融合
 */
export function useFocusAnalyzer(options = {}) {
  const score = ref(88)
  const status = ref(FOCUS_LEVEL.NORMAL_FOCUS)
  const loading = ref(false)
  const ready = ref(false)
  const error = ref('')
  const hint = ref('')
  const sessionId = ref(null)
  const alertLevelRef = ref(options.alertLevel || 'standard')

  const videoRhythm = new VideoRhythmAnalyzer()
  const pageAttention = new PageAttentionAnalyzer()
  const audioEnv = new AudioEnvAnalyzer()
  const cameraMotion = new CameraMotionAnalyzer()
  let tracker = new BehaviorFocusTracker()

  let videoEl = null
  let tickTimer = null
  let lastReportAt = 0
  let lastLightToastAt = 0

  const { onReport, onAlert, onDeepDistraction } = options

  function setAlertLevel(level) {
    alertLevelRef.value = level
  }

  function collectSignals() {
    const now = Date.now()
    const rhythm = videoEl ? videoRhythm.tick(now) : null
    const page = pageAttention.tick(now)
    const audio = audioEnv.tick()
    const camera = videoEl ? cameraMotion.tick(now) : {
      anomalyScore: 0,
      cameraHealthScore: 80,
      blackScreenSec: 0,
      occludedSec: 0,
    }

    const noVideo = !videoEl
    const playbackScore = noVideo ? page.pageActivityScore : rhythm.playbackScore
    const rhythmStabilityScore = noVideo
      ? Math.min(100, 70 + Math.min(20, page.focusedSec / 60))
      : rhythm.rhythmStabilityScore

    return {
      isPlaying: noVideo ? (page.isVisible && page.isFocused) : rhythm.isPlaying,
      continuousPlaySec: noVideo ? page.focusedSec : rhythm.continuousPlaySec,
      playbackScore,
      rhythmStabilityScore,
      pauseCount: noVideo ? 0 : rhythm.pauseCount,
      seekCount: noVideo ? 0 : rhythm.seekCount,
      isVisible: page.isVisible,
      isFocused: page.isFocused,
      currentHiddenSec: page.currentHiddenSec,
      pageActivityScore: page.pageActivityScore,
      visibleSec: page.visibleSec,
      anomalyScore: camera.anomalyScore,
      blackScreenSec: camera.blackScreenSec,
      occludedSec: camera.occludedSec,
      audioScore: audio.energyScore,
      audioEnabled: audio.enabled,
    }
  }

  function tick() {
    const signals = collectSignals()
    const result = tracker.tick(signals)
    score.value = tracker.getSmoothedScore()
    status.value = result.level

    const now = Date.now()

    const lightAlert = tracker.consumeLightAlert()
    if (
      lightAlert
      && shouldAlert(lightAlert, alertLevelRef.value)
      && now - lastLightToastAt > FUSION_CONFIG.lightToastCooldownSec * 1000
    ) {
      lastLightToastAt = now
      onAlert?.(lightAlert, 'toast')
    }

    const deepReport = tracker.consumeDeepReport()
    if (deepReport) {
      onDeepDistraction?.(deepReport, tracker.getSummary())
    }

    if (onReport && sessionId.value && now - lastReportAt >= FUSION_CONFIG.reportIntervalSec * 1000) {
      lastReportAt = now
      const events = tracker.getPendingEvents()
      if (events.length) onReport(sessionId.value, events)
    }
  }

  async function start(video, sid, mediaStream = null) {
    sessionId.value = sid
    loading.value = true
    error.value = ''

    try {
      videoEl = video || null
      videoRhythm.reset()
      pageAttention.reset()
      cameraMotion.reset()
      audioEnv.reset()

      if (videoEl) {
        videoRhythm.attach(videoEl)
        cameraMotion.attach(videoEl)
      }

      if (mediaStream) {
        await audioEnv.attachFromStream(mediaStream)
      }

      lastReportAt = Date.now()
      ready.value = true
      tick()

      if (tickTimer) clearInterval(tickTimer)
      tickTimer = setInterval(tick, FUSION_CONFIG.tickIntervalMs)
    } catch (err) {
      error.value = err.message || '专注感知启动失败'
      ready.value = false
      throw err
    } finally {
      loading.value = false
    }
  }

  function stop() {
    if (tickTimer) {
      clearInterval(tickTimer)
      tickTimer = null
    }
    videoRhythm.detach()
    cameraMotion.detach()
    audioEnv.detach()
    videoEl = null
  }

  function getSummary() {
    return tracker.getSummary()
  }

  function resetTracker() {
    tracker = new BehaviorFocusTracker()
    videoRhythm.reset()
    pageAttention.reset()
    cameraMotion.reset()
    audioEnv.reset()
    score.value = 88
    status.value = FOCUS_LEVEL.NORMAL_FOCUS
  }

  function destroy() {
    stop()
    pageAttention.destroy()
  }

  return {
    score,
    status,
    loading,
    ready,
    error,
    hint,
    sessionId,
    start,
    stop,
    destroy,
    getSummary,
    resetTracker,
    setAlertLevel,
    STATUS_HINTS,
  }
}

/** 2.0 别名 */
export const useBehaviorFocusAnalyzer = useFocusAnalyzer
