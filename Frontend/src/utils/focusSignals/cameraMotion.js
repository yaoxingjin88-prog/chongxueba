/**
 * 摄像头非识别分析 — 帧方差 / 黑屏 / 遮挡
 * 不做任何人脸或情绪识别
 */
export class CameraMotionAnalyzer {
  constructor() {
    this.video = null
    this.canvas = null
    this.ctx = null
    this.lastFrameData = null
    this.varianceSamples = []
    this.blackScreenSec = 0
    this.occludedSec = 0
    this.lastSampleAt = 0
    this.sampleInterval = 800
    this.lastTickAt = Date.now()
  }

  reset() {
    this.lastFrameData = null
    this.varianceSamples = []
    this.blackScreenSec = 0
    this.occludedSec = 0
    this.lastSampleAt = 0
    this.lastTickAt = Date.now()
  }

  attach(videoEl) {
    this.video = videoEl
    if (!this.canvas) {
      this.canvas = document.createElement('canvas')
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })
    }
  }

  detach() {
    this.video = null
  }

  _sampleFrame(now) {
    if (!this.video || this.video.readyState < 2 || !this.ctx) {
      return null
    }
    if (now - this.lastSampleAt < this.sampleInterval) return null
    this.lastSampleAt = now

    const w = 48
    const h = 36
    this.canvas.width = w
    this.canvas.height = h
    this.ctx.drawImage(this.video, 0, 0, w, h)
    const img = this.ctx.getImageData(0, 0, w, h)
    const data = img.data

    let sum = 0
    let sumSq = 0
    const pixels = w * h
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      sum += lum
      sumSq += lum * lum
    }
    const mean = sum / pixels
    const variance = sumSq / pixels - mean * mean

    let frameDiff = 0
    if (this.lastFrameData && this.lastFrameData.length === data.length) {
      let diffSum = 0
      for (let i = 0; i < data.length; i += 16) {
        diffSum += Math.abs(data[i] - this.lastFrameData[i])
      }
      frameDiff = diffSum / (data.length / 16)
    }
    this.lastFrameData = data

    return {
      meanLuminance: mean,
      variance,
      frameDiff,
      isBlack: mean < 18,
      isOccluded: variance < 12 && mean < 45,
      isStatic: frameDiff < 3,
    }
  }

  tick(now = Date.now()) {
    const deltaSec = Math.min(5, (now - this.lastTickAt) / 1000)
    this.lastTickAt = now

    const sample = this._sampleFrame(now)
    if (sample) {
      this.varianceSamples.push(sample.variance)
      if (this.varianceSamples.length > 20) this.varianceSamples.shift()

      if (sample.isBlack) this.blackScreenSec += this.sampleInterval / 1000
      else this.blackScreenSec = Math.max(0, this.blackScreenSec - deltaSec * 0.3)

      if (sample.isOccluded) this.occludedSec += this.sampleInterval / 1000
      else this.occludedSec = Math.max(0, this.occludedSec - deltaSec * 0.3)
    }

    return this.getMetrics()
  }

  /** 0-100：异常越高分越低（黑屏/遮挡/剧烈晃动） */
  getAnomalyScore() {
    let anomaly = 0
    if (this.blackScreenSec > 5) anomaly += 40
    else if (this.blackScreenSec > 2) anomaly += 20

    if (this.occludedSec > 8) anomaly += 35
    else if (this.occludedSec > 3) anomaly += 15

    const recent = this.varianceSamples.slice(-8)
    if (recent.length >= 4) {
      const avgVar = recent.reduce((s, v) => s + v, 0) / recent.length
      if (avgVar > 800) anomaly += 20
    }

    return Math.max(0, Math.min(100, anomaly))
  }

  /** 摄像头健康度（非识别） */
  getCameraHealthScore() {
    return Math.max(0, Math.min(100, 100 - this.getAnomalyScore()))
  }

  getMetrics() {
    const anomaly = this.getAnomalyScore()
    return {
      blackScreenSec: Math.round(this.blackScreenSec * 10) / 10,
      occludedSec: Math.round(this.occludedSec * 10) / 10,
      avgVariance: this.varianceSamples.length
        ? Math.round(this.varianceSamples.reduce((s, v) => s + v, 0) / this.varianceSamples.length)
        : 0,
      anomalyScore: Math.round(anomaly),
      cameraHealthScore: Math.round(this.getCameraHealthScore()),
    }
  }
}
