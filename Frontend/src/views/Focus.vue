<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Live2DCharacter from '../components/Live2DCharacter.vue'
import { useUserStore } from '../stores/user'

import { api } from '../api'
import { useAmbientSound } from '../composables/useAmbientSound'
import { getAmbientLabel, DEFAULT_AMBIENT_KEY } from '../config/ambientSounds'

const user = useUserStore()
const router = useRouter()
const { stopAudio, currentKey, isPlaying } = useAmbientSound()

const ambientLabel = computed(() => {
  const key = isPlaying.value
    ? (currentKey.value || user.ambientSound)
    : (user.ambientSound || DEFAULT_AMBIENT_KEY)
  return getAmbientLabel(key)
})

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

function closeAmbient() {
  stopAudio()
}

onMounted(() => {
  updateDisplay()
  updateProgress()
  startTimer()
})

onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="focus-page">
    <div class="focus-bg">
      <div class="sky-gradient" />
      <div class="stars" />
      <div class="city-glow" />
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

      <button class="icon-circle">
        <font-awesome-icon icon="share-nodes" />
      </button>
    </header>

    <div class="focus-body">
      <!-- 计时环 + 时间文字 -->
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

        <!-- Live2D 角色 + 石台 -->
        <div class="character-stage">
          <Live2DCharacter
            :top-padding="16"
            :bottom-padding="42"
            :scale-factor="1.18"
          />
          <div class="stone-platform">
            <div class="stone-top" />
            <div class="stone-mid" />
            <div class="stone-base" />
          </div>
        </div>
      </div>

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

        <div class="footer-bar">
          <div class="music-pill">
            <font-awesome-icon icon="music" class="music-icon" />
            <span>白噪音：{{ ambientLabel }}</span>
            <button class="music-close" type="button" aria-label="关闭白噪音" @click="closeAmbient">
              <font-awesome-icon icon="circle-xmark" />
            </button>
          </div>
          <button class="avatar-mini">
            <span>🦊</span>
          </button>
        </div>
      </div>
    </div>
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
  background: #0f0a24;
}

/* ===== 背景 ===== */
.focus-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.sky-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    #0c0820 0%,
    #1a1040 25%,
    #2d1f5e 50%,
    #1e1645 75%,
    #120a28 100%
  );
}

.stars {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.9) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 30% 8%, rgba(255,255,255,0.7) 0%, transparent 100%),
    radial-gradient(1px 1px at 55% 20%, rgba(255,255,255,0.8) 0%, transparent 100%),
    radial-gradient(1px 1px at 75% 12%, rgba(255,255,255,0.6) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 90% 25%, rgba(255,255,255,0.9) 0%, transparent 100%),
    radial-gradient(1px 1px at 20% 35%, rgba(255,255,255,0.5) 0%, transparent 100%),
    radial-gradient(1px 1px at 65% 5%, rgba(255,255,255,0.7) 0%, transparent 100%);
}

.city-glow {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 35%;
  background: radial-gradient(ellipse 80% 60% at 50% 100%, rgba(88, 60, 180, 0.35) 0%, transparent 70%);
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
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.ring-wrap {
  position: relative;
  width: 260px;
  height: 260px;
  flex-shrink: 0;
  margin-top: 4px;
}

.ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.08);
  stroke-width: 3;
}

.ring-progress {
  fill: none;
  stroke: url(#ringGrad);
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear;
  filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.5));
}

.ring-dot {
  fill: #fff;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.9));
  transform: rotate(90deg);
  transform-origin: center;
}

.timer-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: 30px;
  pointer-events: none;
}

.status-tag {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 6px;
  letter-spacing: 1px;
}

.timer-display {
  font-size: 44px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 3px;
  color: #fff;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  line-height: 1;
}

.focus-today {
  margin-top: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
}

/* ===== Live2D 角色区 ===== */
.character-stage {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 180px;
  max-height: 280px;
  margin-top: -72px;
  z-index: 5;
}

.character-stage :deep(.live2d-container) {
  position: absolute;
  inset: 0;
  z-index: 3;
}

.stone-platform {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stone-top {
  width: 130px;
  height: 18px;
  background: linear-gradient(180deg, #6b5b95 0%, #4a3f6b 100%);
  border-radius: 50% 50% 4px 4px;
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.15);
}

.stone-mid {
  width: 150px;
  height: 14px;
  margin-top: -2px;
  background: linear-gradient(180deg, #4a3f6b 0%, #3d3560 100%);
  border-radius: 0 0 8px 8px;
}

.stone-base {
  width: 170px;
  height: 10px;
  margin-top: -1px;
  background: linear-gradient(180deg, #3d3560 0%, #2a2448 100%);
  border-radius: 0 0 50% 50%;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

/* ===== 底部面板 ===== */
.bottom-panel {
  flex-shrink: 0;
  padding: 0 20px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.reward-card {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 18px;
  padding: 16px 0;
}

.reward-half {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.reward-value {
  font-size: 26px;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}

.reward-unit {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  margin-top: -2px;
}

.reward-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

.reward-divider {
  width: 1px;
  height: 44px;
  background: rgba(255, 255, 255, 0.15);
}

.pause-btn {
  width: 100%;
  padding: 16px;
  border-radius: 28px;
  background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #8b5cf6 100%);
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 1px;
  box-shadow: 0 6px 24px rgba(124, 58, 237, 0.45);
  transition: transform 0.15s;
}

.pause-btn:active {
  transform: scale(0.98);
}

.footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.music-pill {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
}

.music-icon {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.music-close {
  margin-left: auto;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.45);
  display: flex;
  padding: 0;
}

.avatar-mini {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
</style>
