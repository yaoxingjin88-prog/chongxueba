<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { avatarUrl } from '../utils/avatar'
import { studyRoomLyingIp } from '../config/ossAssets.js'
import StudyRoomMenuSheet from '../components/StudyRoomMenuSheet.vue'
import { studyRoomBottomBg } from '../config/ossPublic.js'

const router = useRouter()

const room = ref(null)
const loading = ref(true)
const toast = ref('')
const rulesOpen = ref(false)
const menuOpen = ref(false)
const holding = ref(false)
let pollTimer = null
let countdownTimer = null

function showToast(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 2200)
}

function formatTime(sec) {
  const s = Math.max(0, sec)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

const focusLabel = computed(() => {
  if (!room.value) return '45:00'
  return formatTime(room.value.focusRemainingSec)
})

async function loadRoom() {
  try {
    const data = await api.getVoiceRoom()
    room.value = data
  } catch (err) {
    if (err.message?.includes('请先进入')) {
      router.replace('/study-room')
      return
    }
    showToast(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function startCountdown() {
  countdownTimer = window.setInterval(() => {
    if (!room.value || room.value.focusRemainingSec <= 0) return
    room.value.focusRemainingSec -= 1
    room.value.focusLabel = formatTime(room.value.focusRemainingSec)
    if (room.value.self) {
      room.value.self.focusLabel = room.value.focusLabel
    }
  }, 1000)
}

async function patchSettings(payload) {
  try {
    room.value = await api.patchVoiceSettings(payload)
  } catch (err) {
    showToast(err.message || '设置失败')
  }
}

function toggleMic() {
  if (!room.value) return
  patchSettings({ micEnabled: !room.value.self.micEnabled })
}

function toggleSpeaker() {
  if (!room.value) return
  patchSettings({ speakerEnabled: !room.value.self.speakerEnabled })
}

function toggleHeadphone() {
  if (!room.value) return
  patchSettings({ headphoneMode: !room.value.self.headphoneMode })
}

async function startSpeak() {
  if (!room.value?.self.micEnabled || holding.value) return
  holding.value = true
  try {
    room.value = await api.voiceSpeak(true)
  } catch (err) {
    showToast(err.message || '无法发言')
    holding.value = false
  }
}

async function stopSpeak() {
  if (!holding.value) return
  holding.value = false
  try {
    room.value = await api.voiceSpeak(false)
  } catch {
    /* ignore */
  }
}

async function endFocus() {
  try {
    await api.voiceEndFocus()
    showToast('专注已结束')
    router.back()
  } catch (err) {
    showToast(err.message || '操作失败')
  }
}

async function exitRoom() {
  if (!window.confirm('确定退出语音自习室吗？')) return
  try {
    await api.leaveStudyInteract()
    router.back()
  } catch (err) {
    showToast(err.message || '退出失败')
  }
}

function inviteFriends() {
  router.push({ path: '/study-room/invite', query: { mode: 'voice' } })
}

const studyRoomBottomBgUrl = `url("${studyRoomBottomBg}")`

onMounted(async () => {
  await loadRoom()
  startCountdown()
  pollTimer = window.setInterval(loadRoom, 8000)
})

onBeforeUnmount(() => {
  window.clearInterval(pollTimer)
  window.clearInterval(countdownTimer)
  if (holding.value) api.voiceSpeak(false).catch(() => {})
})
</script>

<template>
  <div class="voice-room page">
    <div class="room-bg" aria-hidden="true" />

    <header class="voice-header">
      <button type="button" class="back-btn" @click="router.back()">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <div class="header-center">
        <h1 class="room-title">{{ room?.roomName || '星光自习室' }}</h1>
        <div class="header-meta">
          <span class="online-pill">
            <span class="online-dot" />
            {{ room?.onlineCount || 128 }}人在线
          </span>
          <button type="button" class="rules-btn" @click="rulesOpen = !rulesOpen">规则</button>
        </div>
      </div>
      <button type="button" class="room-icon-btn" aria-label="功能菜单" @click="menuOpen = true">
        <font-awesome-icon icon="grip" />
      </button>
    </header>

    <div v-if="rulesOpen && room?.rules" class="rules-banner">{{ room.rules }}</div>

    <div v-if="loading" class="loading-tip">加载中...</div>

    <template v-else-if="room">
      <div class="timer-wrap">
        <section class="timer-card">
          <span class="timer-label">专注时长</span>
          <span class="timer-value">{{ focusLabel }}</span>
          <button type="button" class="end-focus-btn" @click="endFocus">结束专注</button>
        </section>
      </div>

      <section class="orbit-stage">
        <div class="orbit-track" aria-hidden="true">
          <svg class="orbit-svg" viewBox="0 0 320 240" preserveAspectRatio="none">
            <defs>
              <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="rgba(196, 181, 253, 0.55)" />
                <stop offset="50%" stop-color="rgba(139, 92, 246, 0.35)" />
                <stop offset="100%" stop-color="rgba(196, 181, 253, 0.55)" />
              </linearGradient>
            </defs>
            <ellipse cx="160" cy="120" rx="148" ry="92" fill="none" stroke="url(#orbitGrad)" stroke-width="1.2" opacity="0.65" />
            <ellipse cx="160" cy="120" rx="148" ry="92" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="0.6" stroke-dasharray="4 8" />
          </svg>
          <span class="orbit-sparkle s1" />
          <span class="orbit-sparkle s2" />
          <span class="orbit-sparkle s3" />
          <span class="orbit-sparkle s4" />
          <span class="orbit-sparkle s5" />
          <span class="orbit-sparkle s6" />
        </div>

        <div class="center-platform">
          <span class="center-glow" aria-hidden="true" />
          <img :src="studyRoomLyingIp" alt="自习猫" class="center-ip">
        </div>

        <p v-if="room.self.isSpeaking || holding" class="center-speak-hint">
          <span class="hint-wave" aria-hidden="true">▂▃▅▆▇</span>
          {{ room.speakingHint || '你正在说话...' }}
        </p>

        <div
          v-for="mate in room.orbit"
          :key="mate.id"
          class="orbit-mate"
          :style="{ left: `${mate.x}%`, top: `${mate.y}%` }"
        >
          <div class="mate-avatar">
            <img :src="avatarUrl(mate.seed, mate.avatarUrl)" :alt="mate.name">
            <span v-if="mate.status === 'speaking' && mate.micOn" class="mate-mic active">
              <font-awesome-icon icon="microphone" />
            </span>
            <span v-else-if="!mate.micOn || mate.status === 'muted'" class="mate-mic muted">
              <font-awesome-icon icon="microphone-slash" />
            </span>
          </div>
          <span class="mate-name">{{ mate.name }}</span>
        </div>
      </section>

      <section class="speak-zone">
        <p v-if="holding" class="speak-hint release-hint">松开发送</p>
        <div v-if="room.self.isSpeaking || holding" class="waveform" aria-hidden="true">
          <span v-for="i in 12" :key="i" class="wave-bar" :style="{ animationDelay: `${i * 0.08}s` }" />
        </div>

        <div class="speak-controls">
          <div class="mic-status-chip" :class="{ off: !room.self.micEnabled }">
            <font-awesome-icon :icon="room.self.micEnabled ? 'microphone' : 'microphone-slash'" />
            {{ room.self.micEnabled ? '麦克风已开启' : '麦克风已关闭' }}
          </div>

          <button
            type="button"
            class="hold-speak-btn"
            :class="{ active: holding || room.self.isSpeaking, disabled: !room.self.micEnabled }"
            :disabled="!room.self.micEnabled"
            @mousedown.prevent="startSpeak"
            @mouseup.prevent="stopSpeak"
            @mouseleave="stopSpeak"
            @touchstart.prevent="startSpeak"
            @touchend.prevent="stopSpeak"
            @touchcancel="stopSpeak"
          >
            <font-awesome-icon icon="microphone" />
            按住说话
          </button>
        </div>
      </section>

      <section class="partners-panel">
        <h2 class="partners-title">在线学习伙伴 ({{ room.onlineCount }})</h2>
        <ul class="partners-list">
          <li v-for="p in room.partners" :key="p.id" class="partner-row">
            <span class="partner-rank" aria-hidden="true">
              <font-awesome-icon v-if="p.rank === 1" icon="crown" class="rank-icon gold" />
              <font-awesome-icon v-else-if="p.rank === 2" icon="medal" class="rank-icon silver" />
              <span v-else class="rank-spacer" />
            </span>
            <img :src="avatarUrl(p.seed, p.avatarUrl)" :alt="p.name" class="partner-avatar">
            <div class="partner-info">
              <span class="partner-name">{{ p.name }}</span>
              <span class="partner-focus">正在专注 {{ p.focusLabel }}</span>
            </div>
            <span class="partner-status" :class="p.status">
              <template v-if="p.status === 'hand_raise'">
                <font-awesome-icon icon="hand" class="status-hand" /> 举手发言
              </template>
              <template v-else-if="p.status === 'speaking'">
                <span class="status-dot green" /> 发言中
              </template>
              <template v-else-if="p.status === 'muted'">
                <span class="status-dot muted" /> 已静音
              </template>
              <template v-else>
                <span class="status-dot green" /> 专注中
              </template>
            </span>
            <span class="partner-mic" :class="{ off: !p.micOn }">
              <font-awesome-icon :icon="p.micOn ? 'microphone' : 'microphone-slash'" />
            </span>
          </li>
        </ul>
      </section>

      <footer class="toolbar">
        <button type="button" class="tool-btn" :class="{ active: room.self.micEnabled }" @click="toggleMic">
          <font-awesome-icon :icon="room.self.micEnabled ? 'microphone' : 'microphone-slash'" />
          <span>麦克风</span>
        </button>
        <button type="button" class="tool-btn" :class="{ active: room.self.speakerEnabled }" @click="toggleSpeaker">
          <font-awesome-icon :icon="room.self.speakerEnabled ? 'volume-high' : 'volume-xmark'" />
          <span>扬声器</span>
        </button>
        <button type="button" class="tool-btn" :class="{ active: room.self.headphoneMode }" @click="toggleHeadphone">
          <font-awesome-icon icon="headphones" />
          <span>耳机模式</span>
        </button>
        <button type="button" class="tool-btn" @click="inviteFriends">
          <font-awesome-icon icon="user-plus" />
          <span>邀请好友</span>
        </button>
        <button type="button" class="tool-btn exit" @click="exitRoom">
          <font-awesome-icon icon="right-from-bracket" />
          <span>退出</span>
        </button>
      </footer>
    </template>

    <Transition name="fade">
      <div v-if="toast" class="voice-toast">{{ toast }}</div>
    </Transition>

    <StudyRoomMenuSheet v-model="menuOpen" mode="voice" @toast="showToast" @exit="exitRoom" />
  </div>
</template>

<style scoped>
.voice-room.page {
  background: #1e2a6e;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.room-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: v-bind(studyRoomBottomBgUrl) center bottom / cover no-repeat;
}

.voice-header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: calc(12px + env(safe-area-inset-top, 0px)) 14px 8px;
  flex-shrink: 0;
}

.back-btn, .room-icon-btn {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 16px;
  flex-shrink: 0;
}

.header-center {
  flex: 1;
  min-width: 0;
}

.room-title {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 6px;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.online-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(38, 210, 130, .2);
  border: 1px solid rgba(112, 255, 178, .25);
  color: #8cf0b4;
  font-size: 11px;
  font-weight: 600;
}

.online-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 6px #4ade80;
}

.rules-btn {
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .14);
  color: rgba(255, 255, 255, .88);
  font-size: 11px;
}

.rules-banner {
  position: relative;
  z-index: 9;
  margin: 0 14px 8px;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, .12);
  color: rgba(255, 255, 255, .9);
  font-size: 12px;
  line-height: 1.5;
}

.loading-tip {
  flex: 1;
  display: grid;
  place-items: center;
  color: rgba(255,255,255,.85);
  font-size: 14px;
}

.timer-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.timer-card {
  position: relative;
  z-index: 8;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 7px 12px 7px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .12);
  border: 1px solid rgba(255, 255, 255, .18);
  backdrop-filter: blur(14px);
  flex-shrink: 0;
}

.timer-label {
  font-size: 11px;
  color: rgba(255, 255, 255, .7);
  white-space: nowrap;
}

.timer-value {
  font-size: 26px;
  font-weight: 800;
  color: #fff;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.5px;
  line-height: 1;
  white-space: nowrap;
}

.end-focus-btn {
  padding: 6px 12px;
  border-radius: 999px;
  background: linear-gradient(90deg, #8b5cf6 0%, #7c3aed 45%, #6366f1 100%);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  box-shadow: 0 3px 12px rgba(99, 102, 241, 0.35);
  white-space: nowrap;
}

.orbit-stage {
  position: relative;
  z-index: 5;
  height: clamp(240px, 38vh, 320px);
  margin: 0 8px;
  flex-shrink: 0;
}

.orbit-track {
  position: absolute;
  inset: 6% 2% 10%;
  pointer-events: none;
}

.orbit-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.35));
}

.orbit-sparkle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.9), 0 0 14px rgba(196, 181, 253, 0.8);
  animation: sparkle 2.4s ease-in-out infinite;
}

.orbit-sparkle.s1 { left: 14%; top: 22%; animation-delay: 0s; }
.orbit-sparkle.s2 { left: 84%; top: 20%; animation-delay: 0.4s; }
.orbit-sparkle.s3 { left: 8%; top: 52%; animation-delay: 0.8s; }
.orbit-sparkle.s4 { right: 8%; top: 50%; animation-delay: 1.2s; }
.orbit-sparkle.s5 { left: 26%; top: 78%; animation-delay: 1.6s; }
.orbit-sparkle.s6 { right: 24%; top: 76%; animation-delay: 2s; }

@keyframes sparkle {
  0%, 100% { opacity: 0.35; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.15); }
}

.center-platform {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.center-ip {
  position: relative;
  z-index: 2;
  width: clamp(118px, 36vw, 158px);
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 10px 28px rgba(76, 48, 160, 0.45));
  pointer-events: none;
  user-select: none;
}

.center-glow {
  position: absolute;
  bottom: 8%;
  left: 50%;
  transform: translateX(-50%);
  width: 72%;
  height: 18px;
  background: radial-gradient(ellipse, rgba(167, 139, 250, 0.55) 0%, transparent 72%);
  filter: blur(2px);
  z-index: 1;
}

.center-speak-hint {
  position: absolute;
  left: 50%;
  bottom: 4%;
  transform: translateX(-50%);
  z-index: 4;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(10px);
  color: rgba(255, 255, 255, 0.92);
  font-size: 12px;
  white-space: nowrap;
}

.hint-wave {
  font-size: 10px;
  letter-spacing: 1px;
  color: #c4b5fd;
}

.orbit-mate {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  z-index: 5;
}

.mate-avatar {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  overflow: visible;
  border: 2.5px solid rgba(255,255,255,.9);
  box-shadow: 0 0 0 3px rgba(174,168,255,.35);
}

.mate-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.mate-mic {
  position: absolute;
  right: -4px;
  bottom: -2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 8px;
}

.mate-mic.active {
  background: #4ade80;
  color: #fff;
}

.mate-mic.muted {
  background: rgba(255,255,255,.85);
  color: #94a3b8;
}

.mate-name {
  font-size: 10px;
  color: rgba(255,255,255,.92);
  text-shadow: 0 1px 4px rgba(0,0,0,.4);
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.speak-zone {
  position: relative;
  z-index: 6;
  padding: 8px 14px 12px;
  flex-shrink: 0;
}

.speak-hint {
  text-align: center;
  color: rgba(255,255,255,.88);
  font-size: 13px;
  margin-bottom: 8px;
}

.release-hint {
  color: #fde68a;
}

.waveform {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 28px;
  margin-bottom: 10px;
}

.wave-bar {
  width: 4px;
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(180deg, #c4b5fd, #8b5cf6);
  animation: wave 0.8s ease-in-out infinite;
}

.speak-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mic-status-chip {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255,255,255,.14);
  color: #fff;
  font-size: 11px;
  max-width: 120px;
}

.mic-status-chip.off {
  color: rgba(255,255,255,.55);
}

.hold-speak-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border-radius: 999px;
  background: linear-gradient(90deg, #7c3aed, #6366f1);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 0 28px rgba(139, 92, 246, .45);
  transition: transform 0.1s, box-shadow 0.1s;
}

.hold-speak-btn.active {
  transform: scale(0.97);
  box-shadow: 0 0 36px rgba(167, 139, 250, .65);
}

.hold-speak-btn.disabled {
  opacity: 0.45;
}

.partners-panel {
  position: relative;
  z-index: 7;
  flex: 1;
  min-height: 0;
  margin: 0 0 -4px;
  padding: 12px 14px 6px;
  border-radius: 24px 24px 0 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(210, 195, 255, 0.38) 100%);
  backdrop-filter: blur(18px);
  border-top: 1px solid rgba(255,255,255,.28);
  display: flex;
  flex-direction: column;
}

.partners-title {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
  flex-shrink: 0;
  text-shadow: 0 1px 4px rgba(60, 40, 120, 0.2);
}

.partners-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  list-style: none;
}

.partner-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 2px;
  border-bottom: 1px solid rgba(255,255,255,.12);
}

.partner-rank {
  width: 20px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
}

.rank-icon {
  font-size: 15px;
}

.rank-icon.gold {
  color: #fbbf24;
  filter: drop-shadow(0 0 5px rgba(251, 191, 36, 0.55));
}

.rank-icon.silver {
  color: #e2e8f0;
  filter: drop-shadow(0 0 4px rgba(226, 232, 240, 0.45));
}

.rank-spacer {
  display: block;
  width: 14px;
}

.partner-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255,255,255,.9);
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(80, 60, 140, 0.18);
}

.partner-info {
  flex: 1;
  min-width: 0;
}

.partner-name {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  line-height: 1.25;
}

.partner-focus {
  font-size: 10px;
  color: rgba(255,255,255,.62);
  margin-top: 1px;
}

.partner-status {
  font-size: 10px;
  color: rgba(255,255,255,.88);
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  white-space: nowrap;
}

.partner-status.hand_raise {
  color: #fde68a;
}

.status-hand {
  font-size: 9px;
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.green {
  background: #4ade80;
}

.status-dot.muted {
  background: rgba(255,255,255,.45);
}

.partner-mic {
  width: 22px;
  text-align: center;
  color: #fff;
  font-size: 12px;
  flex-shrink: 0;
}

.partner-mic.off {
  color: rgba(255,255,255,.4);
}

.toolbar {
  position: relative;
  z-index: 10;
  flex-shrink: 0;
  display: flex;
  justify-content: space-around;
  padding: 6px 6px calc(6px + env(safe-area-inset-bottom, 0px));
  background: rgba(30, 35, 90, .75);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255,255,255,.08);
}

.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 2px 4px;
  color: rgba(255,255,255,.65);
  font-size: 9px;
  min-width: 44px;
}

.tool-btn svg {
  width: 28px;
  height: 28px;
  padding: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,.1);
  font-size: 12px;
}

.tool-btn.active svg {
  background: rgba(139, 92, 246, .35);
  box-shadow: 0 0 0 2px rgba(167, 139, 250, .55);
  color: #fff;
}

.tool-btn.exit svg {
  background: rgba(239, 68, 68, .25);
  color: #fca5a5;
}

.tool-btn.exit span {
  color: #fca5a5;
}

.voice-toast {
  position: fixed;
  left: 50%;
  bottom: calc(68px + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  padding: 10px 22px;
  background: rgba(30, 42, 120, .92);
  color: #fff;
  font-size: 13px;
  border-radius: 999px;
  z-index: 500;
  white-space: nowrap;
}

@keyframes wave {
  0%, 100% { height: 8px; }
  50% { height: 22px; }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
