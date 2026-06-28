/**
 * 视频节奏分析 — 仅结构数据，不分析画面内容
 * play/pause · currentTime 变化 · seek · 连续播放时长
 */
export class VideoRhythmAnalyzer {
  constructor() {
    this.video = null
    this._onPlay = () => this._handlePlay()
    this._onPause = () => this._handlePause()
    this._onSeeking = () => { this.seekCount += 1; this.lastSeekAt = Date.now() }
    this._onTimeUpdate = () => this._handleTimeUpdate()
    this.reset()
  }

  reset() {
    this.isPlaying = false
    this.continuousPlaySec = 0
    this.totalPlaySec = 0
    this.pauseCount = 0
    this.seekCount = 0
    this.lastSeekAt = 0
    this.lastTime = 0
    this.lastTickAt = Date.now()
    this.playStartedAt = 0
    this.timeDeltaSamples = []
    this.steadyProgressSec = 0
  }

  attach(videoEl) {
    this.detach()
    if (!videoEl) return
    this.video = videoEl
    this.isPlaying = !videoEl.paused && !videoEl.ended
    this.lastTime = videoEl.currentTime || 0
    if (this.isPlaying) this.playStartedAt = Date.now()

    videoEl.addEventListener('play', this._onPlay)
    videoEl.addEventListener('pause', this._onPause)
    videoEl.addEventListener('seeking', this._onSeeking)
    videoEl.addEventListener('timeupdate', this._onTimeUpdate)
  }

  detach() {
    if (!this.video) return
    this.video.removeEventListener('play', this._onPlay)
    this.video.removeEventListener('pause', this._onPause)
    this.video.removeEventListener('seeking', this._onSeeking)
    this.video.removeEventListener('timeupdate', this._onTimeUpdate)
    this.video = null
  }

  _handlePlay() {
    this.isPlaying = true
    this.playStartedAt = Date.now()
  }

  _handlePause() {
    this.isPlaying = false
    this.pauseCount += 1
    this.continuousPlaySec = 0
    this.playStartedAt = 0
  }

  _handleTimeUpdate() {
    if (!this.video) return
    const t = this.video.currentTime
    const delta = Math.abs(t - this.lastTime)
    if (delta > 0 && delta < 5) {
      this.timeDeltaSamples.push(delta)
      if (this.timeDeltaSamples.length > 20) this.timeDeltaSamples.shift()
    }
    this.lastTime = t
  }

  /** 周期性采样（不依赖用户操作） */
  tick(now = Date.now()) {
    const deltaSec = Math.min(5, (now - this.lastTickAt) / 1000)
    this.lastTickAt = now

    const playing = this.video
      ? !this.video.paused && !this.video.ended && this.video.readyState >= 2
      : false

    this.isPlaying = playing

    if (playing) {
      this.continuousPlaySec += deltaSec
      this.totalPlaySec += deltaSec
      if (!this.playStartedAt) this.playStartedAt = now

      const expectedDelta = deltaSec
      const recent = this.timeDeltaSamples.slice(-5)
      const avgDelta = recent.length
        ? recent.reduce((s, x) => s + x, 0) / recent.length
        : expectedDelta
      const drift = Math.abs(avgDelta - expectedDelta)
      if (drift < 0.8) this.steadyProgressSec += deltaSec
      else this.steadyProgressSec = Math.max(0, this.steadyProgressSec - deltaSec * 0.5)
    } else {
      this.continuousPlaySec = 0
      this.playStartedAt = 0
    }

    return this.getMetrics()
  }

  /** 0-100：连续播放越长越高；暂停不立即归零整体分 */
  getPlaybackScore() {
    if (!this.video) return 72
    if (this.isPlaying) {
      const streakBonus = Math.min(30, this.continuousPlaySec / 12)
      const base = 68 + streakBonus
      return Math.min(100, base)
    }
    if (this.totalPlaySec > 120) return 55
    if (this.totalPlaySec > 30) return 45
    return 30
  }

  /** 0-100：节奏是否稳定（少 seek、time 匀速前进） */
  getRhythmStabilityScore() {
    const seekPenalty = Math.min(40, this.seekCount * 8)
    const steadyBonus = Math.min(25, this.steadyProgressSec / 8)
    let score = 75 - seekPenalty + steadyBonus
    if (this.isPlaying && this.continuousPlaySec > 60) score += 10
    return Math.max(0, Math.min(100, score))
  }

  getMetrics() {
    return {
      isPlaying: this.isPlaying,
      continuousPlaySec: Math.round(this.continuousPlaySec),
      totalPlaySec: Math.round(this.totalPlaySec),
      pauseCount: this.pauseCount,
      seekCount: this.seekCount,
      steadyProgressSec: Math.round(this.steadyProgressSec),
      playbackScore: Math.round(this.getPlaybackScore()),
      rhythmStabilityScore: Math.round(this.getRhythmStabilityScore()),
    }
  }
}
