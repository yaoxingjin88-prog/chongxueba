/**
 * 音频环境 — 仅检测能量强弱变化，不识别内容
 */
export class AudioEnvAnalyzer {
  constructor() {
    this.stream = null
    this.context = null
    this.analyser = null
    this.source = null
    this.energySamples = []
    this.lastEnergy = 0
    this.spikeCount = 0
    this.enabled = false
  }

  async attachFromStream(mediaStream) {
    this.detach()
    if (!mediaStream?.getAudioTracks?.().length) {
      this.enabled = false
      return false
    }
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)()
      this.analyser = this.context.createAnalyser()
      this.analyser.fftSize = 256
      this.source = this.context.createMediaStreamSource(mediaStream)
      this.source.connect(this.analyser)
      this.stream = mediaStream
      this.enabled = true
      return true
    } catch {
      this.enabled = false
      return false
    }
  }

  detach() {
    this.source?.disconnect()
    this.context?.close?.()
    this.stream = null
    this.context = null
    this.analyser = null
    this.source = null
    this.enabled = false
    this.energySamples = []
  }

  reset() {
    this.energySamples = []
    this.lastEnergy = 0
    this.spikeCount = 0
  }

  _readEnergy() {
    if (!this.analyser) return 0
    const data = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteFrequencyData(data)
    const avg = data.reduce((s, v) => s + v, 0) / data.length
    return avg
  }

  tick() {
    if (!this.enabled) {
      return { enabled: false, energyScore: 80, energyLevel: 0, spikeCount: 0 }
    }

    const energy = this._readEnergy()
    const delta = Math.abs(energy - this.lastEnergy)
    if (delta > 35 && this.lastEnergy > 10) this.spikeCount += 1
    this.lastEnergy = energy
    this.energySamples.push(energy)
    if (this.energySamples.length > 30) this.energySamples.shift()

    const spikePenalty = Math.min(35, this.spikeCount * 4)
    const score = Math.max(40, Math.min(100, 88 - spikePenalty))

    return {
      enabled: true,
      energyLevel: Math.round(energy),
      energyScore: Math.round(score),
      spikeCount: this.spikeCount,
    }
  }
}
