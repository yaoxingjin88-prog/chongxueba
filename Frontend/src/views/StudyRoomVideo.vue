<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { avatarUrl } from '../utils/avatar'
import StudyRoomMenuSheet from '../components/StudyRoomMenuSheet.vue'

const router = useRouter()

const room = ref(null)
const loading = ref(true)
const toast = ref('')
const rulesOpen = ref(false)
const menuOpen = ref(false)
const videoEl = ref(null)
const mediaStream = ref(null)
const cameraReady = ref(false)
const cameraError = ref('')
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

const cameraMirror = computed(() => (room.value?.self.cameraFacing || 'front') === 'front')

function buildVideoConstraints(facing = 'front') {
  return {
    video: {
      facingMode: facing === 'back' ? { ideal: 'environment' } : { ideal: 'user' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  }
}

function stopCamera() {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach((track) => track.stop())
    mediaStream.value = null
  }
  if (videoEl.value) {
    videoEl.value.srcObject = null
  }
  cameraReady.value = false
}

async function attachStream(stream) {
  mediaStream.value = stream
  await nextTick()
  const el = videoEl.value
  if (!el) return
  el.srcObject = stream
  try {
    await el.play()
    cameraReady.value = true
    cameraError.value = ''
  } catch {
    cameraError.value = '摄像头预览失败'
  }
}

async function startCamera() {
  if (!room.value?.self.cameraEnabled) {
    stopCamera()
    return
  }

  stopCamera()
  cameraError.value = ''

  if (!navigator.mediaDevices?.getUserMedia) {
    cameraError.value = '当前浏览器不支持摄像头'
    showToast(cameraError.value)
    return
  }

  const facing = room.value.self.cameraFacing || 'front'

  try {
    const stream = await navigator.mediaDevices.getUserMedia(buildVideoConstraints(facing))
    await attachStream(stream)
  } catch (err) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      await attachStream(stream)
    } catch (fallbackErr) {
      const denied = fallbackErr?.name === 'NotAllowedError' || err?.name === 'NotAllowedError'
      cameraError.value = denied ? '请允许使用摄像头权限' : '无法打开摄像头'
      showToast(cameraError.value)
      cameraReady.value = false
    }
  }
}

async function loadRoom() {
  try {
    const data = await api.getVideoRoom()
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
  }, 1000)
}

async function patchSettings(payload) {
  try {
    room.value = await api.patchVideoSettings(payload)
  } catch (err) {
    showToast(err.message || '设置失败')
  }
}

function toggleMic() {
  if (!room.value) return
  patchSettings({ micEnabled: !room.value.self.micEnabled })
}

async function toggleCamera() {
  if (!room.value) return
  const next = !room.value.self.cameraEnabled
  try {
    room.value = await api.patchVideoSettings({ cameraEnabled: next })
    if (next) {
      await startCamera()
    } else {
      stopCamera()
      cameraError.value = ''
    }
  } catch (err) {
    showToast(err.message || '设置失败')
  }
}

async function switchCamera() {
  if (!room.value?.self.cameraEnabled) {
    showToast('请先开启摄像头')
    return
  }
  try {
    room.value = await api.switchVideoCamera()
    await startCamera()
    showToast('镜头已切换')
  } catch (err) {
    showToast(err.message || '切换失败')
  }
}

function toggleBeauty() {
  if (!room.value) return
  patchSettings({ beautyFilter: !room.value.self.beautyFilter })
}

function toggleBlur() {
  if (!room.value) return
  patchSettings({ backgroundBlur: !room.value.self.backgroundBlur })
}

function togglePrivacy() {
  if (!room.value) return
  patchSettings({ privacyMode: !room.value.self.privacyMode })
}

function toggleBrightness() {
  if (!room.value) return
  patchSettings({ screenBrightness: !room.value.self.screenBrightness })
}

async function endFocus() {
  try {
    await api.videoEndFocus()
    showToast('专注已结束')
    router.back()
  } catch (err) {
    showToast(err.message || '操作失败')
  }
}

async function exitRoom() {
  if (!window.confirm('确定退出视频自习室吗？')) return
  try {
    await api.leaveStudyInteract()
    router.back()
  } catch (err) {
    showToast(err.message || '退出失败')
  }
}

function showMoreClassmates() {
  showToast(`还有 ${room.value?.moreCount || 0} 位同学在线`)
}

onMounted(async () => {
  await loadRoom()
  if (room.value?.self.cameraEnabled) {
    await startCamera()
  }
  startCountdown()
  pollTimer = window.setInterval(loadRoom, 10000)
})

onBeforeUnmount(() => {
  stopCamera()
  window.clearInterval(pollTimer)
  window.clearInterval(countdownTimer)
})
</script>

<template>
  <div class="video-room page">
    <div class="room-bg" aria-hidden="true" />

    <header class="top-hero">
      <div class="top-nav">
        <button type="button" class="icon-btn" @click="router.back()">
          <font-awesome-icon icon="chevron-left" />
        </button>
        <button type="button" class="icon-btn" aria-label="功能菜单" @click="menuOpen = true">
          <font-awesome-icon icon="grip" />
        </button>
      </div>

      <h1 class="room-title">{{ room?.roomName || '星光自习室' }}</h1>
      <div class="header-meta">
        <span class="online-pill">
          <span class="online-dot" />
          {{ room?.onlineCount || 128 }}人在线
        </span>
        <button type="button" class="rules-btn" @click="rulesOpen = !rulesOpen">
          <font-awesome-icon icon="clipboard-list" class="rules-icon" />
          规则
        </button>
      </div>

      <div class="timer-wrap">
        <section v-if="!loading && room" class="timer-card">
          <span class="timer-label">专注时长</span>
          <span class="timer-value">{{ focusLabel }}</span>
          <button type="button" class="end-focus-btn" @click="endFocus">结束专注</button>
        </section>
        <section v-else-if="loading" class="timer-card timer-skeleton" aria-hidden="true">
          <span class="timer-label">专注时长</span>
          <span class="timer-value">45:00</span>
        </section>
      </div>
    </header>

    <div v-if="rulesOpen && room?.rules" class="rules-banner">{{ room.rules }}</div>

    <div v-if="loading" class="loading-tip">加载中...</div>

    <template v-else-if="room">
      <main class="video-body">
      <section
        class="main-video"
        :class="{
          blurred: room.self.backgroundBlur,
          bright: room.self.screenBrightness,
          'privacy-on': room.self.privacyMode,
        }"
      >
        <video
          v-show="room.self.cameraEnabled && cameraReady"
          ref="videoEl"
          class="video-preview"
          :class="{ beauty: room.self.beautyFilter, mirror: cameraMirror }"
          autoplay
          playsinline
          muted
        />
        <div v-if="room.self.cameraEnabled && !cameraReady" class="camera-off">
          <font-awesome-icon icon="video" />
          <span>{{ cameraError || '正在打开摄像头…' }}</span>
        </div>
        <div v-else-if="!room.self.cameraEnabled" class="camera-off">
          <font-awesome-icon icon="video-slash" />
          <span>摄像头已关闭</span>
        </div>

        <span class="video-badge">
          <span class="badge-dot" /> 你的视频
        </span>

        <button
          v-if="room.self.beautyFilter"
          type="button"
          class="beauty-badge"
          @click="toggleBeauty"
        >
          <font-awesome-icon icon="wand-magic-sparkles" />
          美颜开启
        </button>
      </section>

      <section class="grid-row">
        <div v-for="tile in room.gridTiles" :key="tile.id" class="grid-tile">
          <img :src="avatarUrl(tile.seed)" :alt="tile.name" class="tile-img">
          <div class="tile-footer">
            <span class="tile-name">{{ tile.name }}</span>
            <span class="tile-status">
              <font-awesome-icon
                v-if="!tile.micOn"
                icon="microphone-slash"
                class="muted"
              />
              <span v-else class="status-dot" />
            </span>
          </div>
        </div>
        <button type="button" class="grid-tile more-tile" @click="showMoreClassmates">
          <span class="more-dots">•••</span>
          <span class="more-label">更多同学</span>
        </button>
      </section>
      </main>

      <div class="video-bottom-dock">
        <section class="feature-panel">
          <button
            type="button"
            class="feature-btn"
            :class="{ active: room.self.beautyFilter }"
            @click="toggleBeauty"
          >
            <span class="feature-icon"><font-awesome-icon icon="wand-magic-sparkles" /></span>
            美颜
          </button>
          <button
            type="button"
            class="feature-btn"
            :class="{ active: room.self.backgroundBlur }"
            @click="toggleBlur"
          >
            <span class="feature-icon"><font-awesome-icon icon="eye" /></span>
            背景虚化
          </button>
          <button
            type="button"
            class="feature-btn"
            :class="{ active: room.self.privacyMode }"
            @click="togglePrivacy"
          >
            <span class="feature-icon"><font-awesome-icon icon="lock" /></span>
            隐私保护
          </button>
          <button
            type="button"
            class="feature-btn"
            :class="{ active: room.self.screenBrightness }"
            @click="toggleBrightness"
          >
            <span class="feature-icon"><font-awesome-icon icon="sun" /></span>
            屏幕亮度
          </button>
        </section>

        <footer class="toolbar">
          <button type="button" class="tool-btn" :class="{ active: room.self.micEnabled }" @click="toggleMic">
            <font-awesome-icon :icon="room.self.micEnabled ? 'microphone' : 'microphone-slash'" />
            <span>麦克风</span>
          </button>
          <button type="button" class="tool-btn" :class="{ active: room.self.cameraEnabled }" @click="toggleCamera">
            <font-awesome-icon :icon="room.self.cameraEnabled ? 'video' : 'video-slash'" />
            <span>摄像头</span>
          </button>
          <button type="button" class="tool-btn" @click="switchCamera">
            <font-awesome-icon icon="arrows-rotate" />
            <span>切换镜头</span>
          </button>
          <button type="button" class="tool-btn exit" @click="exitRoom">
            <font-awesome-icon icon="right-from-bracket" />
            <span>退出</span>
          </button>
        </footer>
      </div>
    </template>

    <Transition name="fade">
      <div v-if="toast" class="video-toast">{{ toast }}</div>
    </Transition>

    <StudyRoomMenuSheet v-model="menuOpen" mode="video" @toast="showToast" @exit="exitRoom" />
  </div>
</template>

<style scoped>
.video-room.page {
  background: #1e2a6e;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.room-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: url('/自习室底部背景.png') center bottom / cover no-repeat;
}

.top-hero {
  position: relative;
  z-index: 10;
  flex-shrink: 0;
  padding: calc(8px + env(safe-area-inset-top, 0px)) 16px 12px;
}

.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 17px;
  flex-shrink: 0;
}

.room-title {
  text-align: center;
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.12);
}

.header-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 14px;
}

.online-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: rgba(255, 255, 255, 0.92);
  font-size: 11px;
  font-weight: 600;
}

.online-dot, .badge-dot, .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 6px rgba(74, 222, 128, 0.6);
}

.rules-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: rgba(255, 255, 255, 0.92);
  font-size: 11px;
  font-weight: 600;
}

.rules-icon {
  font-size: 10px;
  opacity: 0.9;
}

.rules-banner {
  position: relative;
  z-index: 9;
  margin: -4px 16px 8px;
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  line-height: 1.5;
}

.loading-tip {
  flex: 1;
  display: grid;
  place-items: center;
  color: rgba(255,255,255,.85);
}

.video-body {
  position: relative;
  z-index: 5;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 16px 10px;
}

.video-bottom-dock {
  position: relative;
  z-index: 8;
  flex-shrink: 0;
  border-radius: 18px 18px 0 0;
  overflow: hidden;
  box-shadow: 0 -4px 16px rgba(30, 30, 80, 0.1);
}

.timer-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 4px;
}

.timer-card {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 7px 12px 7px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 4px 16px rgba(20, 30, 100, 0.14);
}

.timer-skeleton {
  opacity: 0.55;
}

.timer-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: 0.2px;
  white-space: nowrap;
}

.timer-value {
  font-size: 26px;
  font-weight: 800;
  color: #fff;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: 0.5px;
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

.end-focus-btn:active {
  transform: scale(0.97);
}

.main-video {
  position: relative;
  flex-shrink: 0;
  width: 100%;
  aspect-ratio: 4 / 3;
  height: auto;
  min-height: calc((min(var(--app-max-width, 430px), 100vw) - 32px) * 3 / 4);
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 8px;
  background: #1e2a5a;
  border: 1px solid rgba(255, 255, 255, .18);
  box-shadow: 0 12px 32px rgba(0, 0, 0, .2);
}

.main-video.bright {
  filter: brightness(1.12);
}

.main-video.privacy-on::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid rgba(139, 92, 246, .35);
  border-radius: 22px;
  pointer-events: none;
}

.video-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  background: #1e2a5a;
}

.video-preview.mirror {
  transform: scaleX(-1);
}

.main-video.blurred .video-preview {
  filter: blur(8px) brightness(1.05);
}

.main-video.blurred .video-preview.beauty {
  filter: blur(8px) brightness(1.05) saturate(1.08);
}

.video-preview.beauty {
  filter: saturate(1.08) brightness(1.06);
}

.camera-off {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(255, 255, 255, .55);
  font-size: 14px;
}

.camera-off svg {
  font-size: 32px;
}

.video-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, .45);
  color: #fff;
  font-size: 11px;
}

.beauty-badge {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .92);
  color: #7c3aed;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, .15);
}

.grid-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;
  margin-bottom: 2px;
  flex-shrink: 0;
}

.grid-tile {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, .14);
  border: 1px solid rgba(255, 255, 255, .18);
  backdrop-filter: blur(8px);
}

.tile-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tile-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px;
  background: linear-gradient(transparent, rgba(0,0,0,.55));
}

.tile-name {
  font-size: 9px;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tile-status .muted {
  font-size: 9px;
  color: #fca5a5;
}

.more-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: linear-gradient(145deg, rgba(139, 92, 246, .45), rgba(99, 102, 241, .35));
  border: 1px solid rgba(255, 255, 255, .2);
  color: #fff;
}

.more-dots {
  font-size: 18px;
  letter-spacing: 2px;
  line-height: 1;
}

.more-label {
  font-size: 10px;
}

.feature-panel {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  padding: 6px 10px 4px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(210, 195, 255, 0.32) 100%);
  backdrop-filter: blur(16px);
  border-top: 1px solid rgba(255, 255, 255, .24);
}

.feature-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 8px;
  color: rgba(255, 255, 255, .88);
}

.feature-btn.active {
  color: #fde68a;
}

.feature-icon {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, .16);
  font-size: 11px;
}

.feature-btn.active .feature-icon {
  background: rgba(253, 230, 138, .22);
  box-shadow: 0 0 8px rgba(253, 230, 138, .24);
}

.toolbar {
  position: relative;
  z-index: 10;
  flex-shrink: 0;
  display: flex;
  justify-content: space-around;
  padding: 4px 4px calc(4px + env(safe-area-inset-bottom, 0px));
  background: rgba(30, 35, 90, .82);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255, 255, 255, .08);
}

.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 0 2px;
  color: rgba(255, 255, 255, .65);
  font-size: 8px;
  min-width: 38px;
}

.tool-btn svg {
  width: 24px;
  height: 24px;
  padding: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, .1);
  font-size: 11px;
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

.video-toast {
  position: fixed;
  left: 50%;
  bottom: calc(88px + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  max-width: var(--app-max-width);
  padding: 10px 22px;
  background: rgba(30, 42, 120, .92);
  color: #fff;
  font-size: 13px;
  border-radius: 999px;
  z-index: 500;
  white-space: nowrap;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
