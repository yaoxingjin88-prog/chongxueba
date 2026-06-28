/**
 * 页面注意力 — visibility / focus / 停留时长
 * 不要求键鼠操作；长时间静止仍可为高专注
 */
export class PageAttentionAnalyzer {
  constructor() {
    this.sessionStartedAt = Date.now()
    this.lastTickAt = Date.now()
    this.visibleSec = 0
    this.hiddenSec = 0
    this.focusedSec = 0
    this.blurredSec = 0
    this.currentHiddenSince = null
    this.currentBlurSince = null
    this.isVisible = typeof document !== 'undefined'
      ? document.visibilityState === 'visible'
      : true
    this.isFocused = typeof document !== 'undefined' ? document.hasFocus() : true

    this._onVisibility = () => this._syncVisibility()
    this._onFocus = () => { this.isFocused = true; this.currentBlurSince = null }
    this._onBlur = () => {
      this.isFocused = false
      if (!this.currentBlurSince) this.currentBlurSince = Date.now()
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this._onVisibility)
      window.addEventListener('focus', this._onFocus)
      window.addEventListener('blur', this._onBlur)
    }
  }

  reset() {
    this.sessionStartedAt = Date.now()
    this.lastTickAt = Date.now()
    this.visibleSec = 0
    this.hiddenSec = 0
    this.focusedSec = 0
    this.blurredSec = 0
    this.currentHiddenSince = null
    this.currentBlurSince = null
    this._syncVisibility()
    this.isFocused = document.hasFocus()
  }

  destroy() {
    document.removeEventListener('visibilitychange', this._onVisibility)
    window.removeEventListener('focus', this._onFocus)
    window.removeEventListener('blur', this._onBlur)
  }

  _syncVisibility() {
    this.isVisible = document.visibilityState === 'visible'
    if (!this.isVisible && !this.currentHiddenSince) {
      this.currentHiddenSince = Date.now()
    }
    if (this.isVisible) this.currentHiddenSince = null
  }

  tick(now = Date.now()) {
    const deltaSec = Math.min(5, (now - this.lastTickAt) / 1000)
    this.lastTickAt = now
    this._syncVisibility()
    this.isFocused = document.hasFocus()

    if (this.isVisible) this.visibleSec += deltaSec
    else this.hiddenSec += deltaSec

    if (this.isFocused && this.isVisible) this.focusedSec += deltaSec
    else this.blurredSec += deltaSec

    return this.getMetrics()
  }

  getDwellSec() {
    return (Date.now() - this.sessionStartedAt) / 1000
  }

  getCurrentHiddenSec() {
    if (!this.currentHiddenSince) return 0
    return (Date.now() - this.currentHiddenSince) / 1000
  }

  /** 0-100：页面可见 + 窗口聚焦；静止不扣分 */
  getActivityScore() {
    if (this.isVisible && this.isFocused) {
      const dwellBonus = Math.min(15, this.visibleSec / 120)
      return Math.min(100, 82 + dwellBonus)
    }
    if (this.isVisible && !this.isFocused) return 62
    const hiddenNow = this.getCurrentHiddenSec()
    if (hiddenNow > 30) return 15
    if (hiddenNow > 8) return 35
    return 50
  }

  getMetrics() {
    return {
      isVisible: this.isVisible,
      isFocused: this.isFocused,
      dwellSec: Math.round(this.getDwellSec()),
      visibleSec: Math.round(this.visibleSec),
      hiddenSec: Math.round(this.hiddenSec),
      focusedSec: Math.round(this.focusedSec),
      blurredSec: Math.round(this.blurredSec),
      currentHiddenSec: Math.round(this.getCurrentHiddenSec()),
      pageActivityScore: Math.round(this.getActivityScore()),
    }
  }
}
