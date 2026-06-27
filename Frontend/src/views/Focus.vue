<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

import { api } from '../api'
import { useAmbientSound } from '../composables/useAmbientSound'
import { AMBIENT_SOUNDS, getAmbientLabel, DEFAULT_AMBIENT_KEY } from '../config/ambientSounds'

const user = useUserStore()
const router = useRouter()
const { playSound, stopAudio, currentKey, isPlaying, isLoading } = useAmbientSound()

const selectedKey = ref(DEFAULT_AMBIENT_KEY)
const soundPickerOpen = ref(false)
const shareSheetOpen = ref(false)
const shareLoading = ref(false)
const shareActing = ref(false)
const shareData = ref(null)
const toast = ref('')

const ambientLabel = computed(() => {
  const key = isPlaying.value
    ? (currentKey.value || selectedKey.value)
    : selectedKey.value
  return getAmbientLabel(key)
})

const activeSoundKey = computed(() => {
  if (isPlaying.value && currentKey.value) return currentKey.value
  return selectedKey.value
})

const canNativeShare = computed(
  () => typeof navigator !== 'undefined' && typeof navigator.share === 'function',
)

const presets = [25, 45, 90]
const selectedPreset = ref(25)
const secondsLeft = ref(25 * 60)
const isPaused = ref(false)
const displayTime = ref('25:00')
const progress = ref(0)
const expReward = ref(60)
const growthReward = ref(15)
const sessionCompleted = ref(false)

const RING_R = 108
const RING_C = 2 * Math.PI * RING_R

let timer = null

const statusText = computed(() => (isPaused.value ? '已暂停' : '专注中'))

const strokeDashoffset = computed(
  () => RING_C - (RING_C * progress.value) / 100,
)

const progressDot = computed(() => {
  const angle = ((progress.value / 100) * 360 - 90) * (Math.PI / 180)
  return {
    cx: 120 + RING_R * Math.cos(angle),
    cy: 120 + RING_R * Math.sin(angle),
  }
})

function updateDisplay() {
  const m = Math.floor(secondsLeft.value / 60)
  const s = secondsLeft.value % 60
  displayTime.value = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function updateProgress() {
  const total = selectedPreset.value * 60
  progress.value = ((total - secondsLeft.value) / total) * 100
}

function selectPreset(min) {
  selectedPreset.value = min
  secondsLeft.value = min * 60
  sessionCompleted.value = false
  updateDisplay()
  updateProgress()
  isPaused.value = false
  startTimer()
}

function startTimer() {
  clearInterval(timer)
  timer = setInterval(async () => {
    if (!isPaused.value && secondsLeft.value > 0) {
      secondsLeft.value--
      updateDisplay()
      updateProgress()
      if (secondsLeft.value === 0 && !sessionCompleted.value) {
        sessionCompleted.value = true
        await submitFocus()
      }
    }
  }, 1000)
}

async function submitFocus() {
  try {
    const data = await api.completeFocus(selectedPreset.value)
    expReward.value = data.expReward
    growthReward.value = data.growthReward
    await user.refresh()
  } catch {
    // 后端不可用时静默失败
  }
}

function togglePause() {
  isPaused.value = !isPaused.value
}

function toggleSoundPicker(e) {
  e?.stopPropagation?.()
  soundPickerOpen.value = !soundPickerOpen.value
}

function closeSoundPicker() {
  soundPickerOpen.value = false
}

async function onSoundSelect(key) {
  if (isLoading.value) return

  if (currentKey.value === key && isPlaying.value) {
    stopAudio()
    closeSoundPicker()
    return
  }

  selectedKey.value = key
  await playSound(key)
  closeSoundPicker()

  try {
    await api.saveAmbientSound(key)
    user.ambientSound = key
  } catch {
    // 本地播放不受影响
  }
}

function closeAmbient(e) {
  e?.stopPropagation?.()
  stopAudio()
  closeSoundPicker()
}

async function toggleMute(e) {
  e?.stopPropagation?.()
  closeSoundPicker()
  if (isLoading.value) return

  if (isPlaying.value) {
    stopAudio()
    return
  }

  await playSound(selectedKey.value)
}

function showToast(msg) {
  toast.value = msg
  window.clearTimeout(showToast._t)
  showToast._t = window.setTimeout(() => {
    toast.value = ''
  }, 2200)
}

function buildSharePayload() {
  return {
    preset: selectedPreset.value,
    displayTime: displayTime.value,
    status: statusText.value,
    progress: Math.round(progress.value),
  }
}

function buildLocalShareFallback() {
  const link = `${window.location.origin}${window.location.pathname}`
  const shareText = [
    `我在宠学霸${statusText.value}！`,
    `⏱ ${displayTime.value} / ${selectedPreset.value}分钟 · 进度 ${Math.round(progress.value)}%`,
    `📚 今日专注 ${user.focusToday}`,
    `🔥 连续打卡 ${user.streakDays} 天`,
    '一起来自习吧 👇',
    link,
  ].join('\n')

  return {
    title: '分享专注时刻',
    subtitle: '邀请好友一起加入宠学霸自习',
    shareText,
    shareLink: link,
    preview: {
      status: statusText.value,
      timer: displayTime.value,
      preset: selectedPreset.value,
      progress: Math.round(progress.value),
      focusToday: user.focusToday,
      streakDays: user.streakDays,
      userName: user.name,
    },
    shareMethods: [
      { key: 'wechat', label: '微信' },
      { key: 'qq', label: 'QQ' },
      { key: 'link', label: '复制链接' },
      { key: 'copy', label: '复制文案' },
    ],
  }
}

async function loadSharePreview() {
  shareLoading.value = true
  try {
    shareData.value = await api.getFocusShare(buildSharePayload())
  } catch {
    shareData.value = buildLocalShareFallback()
  } finally {
    shareLoading.value = false
  }
}

async function openShareSheet() {
  closeSoundPicker()
  shareSheetOpen.value = true
  await loadSharePreview()
}

function closeShareSheet() {
  shareSheetOpen.value = false
}

async function copyText(text, message) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    }
    showToast(message)
  } catch {
    showToast('复制失败')
  }
}

async function tryNativeShare(data) {
  if (!navigator.share) return false
  try {
    await navigator.share({
      title: '宠学霸专注',
      text: data.shareText,
      url: data.shareLink,
    })
    showToast('分享成功')
    closeShareSheet()
    return true
  } catch (err) {
    if (err?.name !== 'AbortError') {
      showToast('分享失败')
    }
    return false
  }
}

async function onShare(key) {
  if (shareActing.value) return
  shareActing.value = true

  const actionMap = {
    wechat: 'share-wechat',
    qq: 'share-qq',
    link: 'share-link',
    copy: 'share-copy',
  }

  try {
    const data = await api.focusShareAction({
      action: actionMap[key] || 'share-copy',
      ...buildSharePayload(),
    })
    await copyText(data.copyText || data.shareText || data.shareLink, data.message || '已复制')
    if (key !== 'link' && key !== 'copy') {
      closeShareSheet()
    }
  } catch {
    const fallback = shareData.value || buildLocalShareFallback()
    const text = key === 'link'
      ? fallback.shareLink
      : fallback.shareText
    const message = key === 'link' ? '专注链接已复制' : '分享文案已复制'
    await copyText(text, message)
  } finally {
    shareActing.value = false
  }
}

async function onSystemShare() {
  const data = shareData.value || buildLocalShareFallback()
  const shared = await tryNativeShare(data)
  if (!shared) {
    await onShare('copy')
  }
}

function onDocClick() {
  closeSoundPicker()
  closeShareSheet()
}

onMounted(async () => {
  updateDisplay()
  updateProgress()
  startTimer()

  selectedKey.value = user.ambientSound || DEFAULT_AMBIENT_KEY
  if (!isPlaying.value) {
    await playSound(selectedKey.value)
  }

  document.addEventListener('click', onDocClick)
})

onUnmounted(() => {
  clearInterval(timer)
  document.removeEventListener('click', onDocClick)
})
</script>

<template>
  <div class="focus-page">
    <div class="focus-bg" aria-hidden="true">
      <img src="/开始专注.png" alt="" class="focus-bg-img">
    </div>

    <!-- 顶栏 -->
    <header class="focus-header">
      <button class="icon-circle" @click="router.back()">
        <font-awesome-icon icon="chevron-left" />
      </button>

      <div class="preset-group">
        <button
          v-for="p in presets"
          :key="p"
          class="preset-chip"
          :class="{ active: selectedPreset === p }"
          @click="selectPreset(p)"
        >
          {{ p }}分钟
        </button>
      </div>

      <button class="icon-circle" type="button" aria-label="分享专注" @click.stop="openShareSheet">
        <font-awesome-icon icon="share-nodes" />
      </button>
    </header>

    <div class="focus-body">
      <div class="timer-zone">
        <div class="ring-wrap">
          <svg viewBox="0 0 240 240" class="ring-svg">
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffffff" />
                <stop offset="55%" stop-color="#fde68a" />
                <stop offset="100%" stop-color="#fb923c" />
              </linearGradient>
              <filter id="ringGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle cx="120" cy="120" :r="RING_R" class="ring-track" />
            <circle
              cx="120"
              cy="120"
              :r="RING_R"
              class="ring-progress"
              :stroke-dasharray="RING_C"
              :stroke-dashoffset="strokeDashoffset"
            />
            <circle
              :cx="progressDot.cx"
              :cy="progressDot.cy"
              r="5"
              class="ring-dot"
              filter="url(#ringGlow)"
            />
          </svg>

          <div class="timer-text">
            <span class="status-tag">{{ statusText }}</span>
            <span class="timer-display">{{ displayTime }}</span>
            <span class="focus-today">今日专注 {{ user.focusToday }}</span>
          </div>
        </div>
      </div>

      <div class="character-stage" aria-hidden="true" />

      <!-- 底部操作区 -->
      <div class="bottom-panel">
        <div class="reward-card">
          <div class="reward-half">
            <span class="reward-value">+{{ expReward }}</span>
            <span class="reward-unit">EXP</span>
            <span class="reward-label">经验值</span>
          </div>
          <div class="reward-divider" />
          <div class="reward-half">
            <span class="reward-value">+{{ growthReward }}</span>
            <span class="reward-label">成长值</span>
          </div>
        </div>

        <button class="pause-btn" @click="togglePause">
          {{ isPaused ? '继续专注' : '暂停专注' }}
        </button>

        <div class="footer-wrap" @click.stop>
          <Transition name="sound-slide">
            <div v-if="soundPickerOpen" class="sound-picker">
              <button
                v-for="sound in AMBIENT_SOUNDS"
                :key="sound.key"
                class="sound-option"
                :class="{ active: sound.key === activeSoundKey && isPlaying }"
                type="button"
                :disabled="isLoading"
                @click="onSoundSelect(sound.key)"
              >
                <font-awesome-icon :icon="sound.icon" class="sound-option-icon" />
                <span class="sound-option-label">{{ sound.label }}</span>
                <span
                  v-if="sound.key === activeSoundKey && isPlaying"
                  class="sound-playing-dot"
                  aria-hidden="true"
                />
              </button>
              <button
                class="sound-stop"
                type="button"
                :disabled="!isPlaying"
                @click="closeAmbient"
              >
                <font-awesome-icon icon="circle-xmark" />
                关闭白噪音
              </button>
            </div>
          </Transition>

          <div class="footer-bar">
            <div class="music-pill">
              <button
                class="music-pill-main"
                type="button"
                :aria-expanded="soundPickerOpen"
                aria-label="切换白噪音"
                @click="toggleSoundPicker"
              >
                <font-awesome-icon icon="music" class="music-icon" />
                <span class="music-label">白噪音：{{ ambientLabel }}</span>
              </button>
              <button
                class="music-close"
                type="button"
                aria-label="关闭白噪音"
                @click="closeAmbient"
              >
                <font-awesome-icon icon="circle-xmark" />
              </button>
            </div>

            <button
              class="mute-btn"
              :class="{ muted: !isPlaying }"
              type="button"
              :aria-label="isPlaying ? '关闭声音' : '开启声音'"
              :disabled="isLoading"
              @click="toggleMute"
            >
              <font-awesome-icon :icon="isPlaying ? 'volume-xmark' : 'volume-high'" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="share-fade">
        <div v-if="shareSheetOpen" class="share-overlay" @click.self="closeShareSheet">
          <div class="share-sheet" @click.stop>
            <header class="share-header">
              <div>
                <h2 class="share-title">{{ shareData?.title || '分享专注时刻' }}</h2>
                <p class="share-subtitle">{{ shareData?.subtitle || '邀请好友一起加入宠学霸自习' }}</p>
              </div>
              <button type="button" class="share-close" aria-label="关闭" @click="closeShareSheet">
                <font-awesome-icon icon="xmark" />
              </button>
            </header>

            <div v-if="shareLoading" class="share-loading">加载中...</div>
            <template v-else-if="shareData">
              <div class="share-preview">
                <span class="share-preview-status">{{ shareData.preview.status }}</span>
                <strong class="share-preview-timer">{{ shareData.preview.timer }}</strong>
                <p class="share-preview-meta">
                  {{ shareData.preview.preset }}分钟 · 进度 {{ shareData.preview.progress }}%
                </p>
                <div class="share-preview-stats">
                  <span>今日专注 {{ shareData.preview.focusToday }}</span>
                  <span>连续 {{ shareData.preview.streakDays }} 天</span>
                </div>
              </div>

              <div class="share-grid">
                <button
                  v-for="item in shareData.shareMethods"
                  :key="item.key"
                  type="button"
                  class="share-item"
                  :disabled="shareActing"
                  @click="onShare(item.key)"
                >
                  <span class="share-icon" :class="item.key">
                    <font-awesome-icon
                      :icon="item.key === 'wechat' ? 'comment' : item.key === 'qq' ? 'user' : item.key === 'link' ? 'link' : 'copy'"
                    />
                  </span>
                  <span class="share-label">{{ item.label }}</span>
                </button>
              </div>

              <button
                v-if="canNativeShare"
                type="button"
                class="share-system-btn"
                :disabled="shareActing"
                @click="onSystemShare"
              >
                <font-awesome-icon icon="share-nodes" />
                系统分享
              </button>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Transition name="toast-fade">
      <div v-if="toast" class="focus-toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.focus-page {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  background: #1a1040;
}

/* ===== 背景 ===== */
.focus-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.focus-bg-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 38%;
}

/* ===== 顶栏 ===== */
.focus-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  padding-top: calc(8px + env(safe-area-inset-top, 0px));
  position: relative;
  z-index: 20;
  flex-shrink: 0;
}

.icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: #fff;
  flex-shrink: 0;
}

.preset-group {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  backdrop-filter: blur(8px);
}

.preset-chip {
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
  white-space: nowrap;
  transition: all 0.2s;
}

.preset-chip.active {
  background: #fff;
  color: #1e1b4b;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* ===== 主体 ===== */
.focus-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 10;
}

.timer-zone {
  position: relative;
  flex-shrink: 0;
  height: clamp(230px, 38vh, 340px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.character-stage {
  flex: 1;
  min-height: clamp(160px, 22vh, 260px);
  pointer-events: none;
}

.ring-wrap {
  position: relative;
  width: min(74vw, 296px);
  aspect-ratio: 1;
  flex-shrink: 0;
  display: grid;
  place-items: center;
}

.ring-svg {
  grid-area: 1 / 1;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-track {
  fill: none;
  stroke: transparent;
  stroke-width: 3;
}

.ring-progress {
  fill: none;
  stroke: url(#ringGrad);
  stroke-width: 3.5;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear;
  filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.55));
}

.ring-dot {
  fill: #fff;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.9));
  transform: rotate(90deg);
  transform-origin: center;
}

.timer-text {
  grid-area: 1 / 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  pointer-events: none;
  z-index: 1;
}

.status-tag {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 1px;
  line-height: 1.2;
}

.timer-display {
  font-size: 42px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
  color: #fff;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  line-height: 1;
}

.focus-today {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.2;
}

/* ===== 底部面板（紧凑，贴近图一） ===== */
.bottom-panel {
  flex-shrink: 0;
  margin-top: auto;
  padding: 0 16px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  z-index: 12;
}

.reward-card {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 16px;
  padding: 10px 0;
}

.reward-half {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.reward-value {
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}

.reward-unit {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  margin-top: -1px;
}

.reward-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.48);
  margin-top: 2px;
}

.reward-divider {
  width: 1px;
  height: 34px;
  background: rgba(255, 255, 255, 0.15);
}

.pause-btn {
  width: 100%;
  padding: 13px 16px;
  border-radius: 999px;
  background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #8b5cf6 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 18px rgba(124, 58, 237, 0.38);
  transition: transform 0.15s;
}

.pause-btn:active {
  transform: scale(0.98);
}

.footer-wrap {
  position: relative;
}

.footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  position: relative;
}

.music-pill {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 4px 4px 12px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.music-pill-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.82);
  text-align: left;
}

.music-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-icon {
  color: rgba(255, 255, 255, 0.55);
  font-size: 12px;
  flex-shrink: 0;
}

.music-close {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
  flex-shrink: 0;
}

.mute-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.92);
  flex-shrink: 0;
  transition: opacity 0.15s, color 0.15s;
}

.mute-btn.muted {
  color: rgba(255, 255, 255, 0.55);
}

.mute-btn:disabled {
  opacity: 0.5;
}

.sound-picker {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(100% + 8px);
  padding: 10px;
  background: rgba(20, 12, 48, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  z-index: 20;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
}

.sound-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.78);
  transition: background 0.15s, border-color 0.15s;
}

.sound-option.active {
  background: rgba(124, 58, 237, 0.28);
  border-color: rgba(167, 139, 250, 0.45);
  color: #fff;
}

.sound-option:disabled {
  opacity: 0.6;
}

.sound-option-icon {
  font-size: 13px;
  opacity: 0.85;
}

.sound-option-label {
  flex: 1;
  text-align: left;
}

.sound-playing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #a78bfa;
  box-shadow: 0 0 6px rgba(167, 139, 250, 0.8);
  animation: soundPulse 1.2s ease-in-out infinite;
}

.sound-stop {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.sound-stop:disabled {
  opacity: 0.35;
}

@keyframes soundPulse {
  0%, 100% { opacity: 0.4; transform: scale(0.85); }
  50% { opacity: 1; transform: scale(1.15); }
}

.sound-slide-enter-active,
.sound-slide-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.sound-slide-enter-from,
.sound-slide-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* ===== 分享面板 ===== */
.share-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(8, 4, 24, 0.55);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
}

.share-sheet {
  width: min(100%, 420px);
  background: linear-gradient(180deg, #2a1858 0%, #1a1040 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 18px 16px 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
}

.share-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.share-title {
  font-size: 17px;
  font-weight: 700;
  color: #fff;
}

.share-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.58);
}

.share-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.share-loading {
  padding: 28px 0;
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
}

.share-preview {
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  margin-bottom: 14px;
}

.share-preview-status {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
}

.share-preview-timer {
  display: block;
  margin-top: 6px;
  font-size: 34px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 2px;
  font-variant-numeric: tabular-nums;
}

.share-preview-meta {
  margin-top: 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.share-preview-stats {
  margin-top: 10px;
  display: flex;
  justify-content: center;
  gap: 16px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.62);
}

.share-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.share-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 4px;
}

.share-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.share-icon.wechat { color: #22c55e; }
.share-icon.qq { color: #3b82f6; }
.share-icon.link { color: #6366f1; }
.share-icon.copy { color: #a78bfa; }

.share-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.72);
}

.share-system-btn {
  width: 100%;
  margin-top: 12px;
  padding: 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.share-system-btn:disabled {
  opacity: 0.6;
}

.share-fade-enter-active,
.share-fade-leave-active {
  transition: opacity 0.2s ease;
}

.share-fade-enter-active .share-sheet,
.share-fade-leave-active .share-sheet {
  transition: transform 0.24s ease;
}

.share-fade-enter-from,
.share-fade-leave-to {
  opacity: 0;
}

.share-fade-enter-from .share-sheet,
.share-fade-leave-to .share-sheet {
  transform: translateY(24px);
}

.focus-toast {
  position: fixed;
  left: 50%;
  bottom: calc(96px + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  z-index: 130;
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(20, 12, 48, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 13px;
  pointer-events: none;
  white-space: nowrap;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>
