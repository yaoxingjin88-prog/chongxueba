<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { avatarUrl } from '../utils/avatar'
import { useAmbientSound } from '../composables/useAmbientSound'
import AiMascotBot from '../components/AiMascotBot.vue'
import StudyInteractSheet from '../components/StudyInteractSheet.vue'

const router = useRouter()

const sounds = ref([])
const classmates = ref([])
const onlineCount = ref(128)
const atmosphere = ref(95)
const selectedKey = ref('rain')
const interactData = ref(null)
const sheetOpen = ref(false)
const joining = ref(false)
const toast = ref('')

const { playSound, stopAudio, currentKey, isPlaying, isLoading } = useAmbientSound()

const RING_R = 92
const RING_C = 2 * Math.PI * RING_R
const progress = 28

function syncActiveState() {
  sounds.value = sounds.value.map((sound) => ({
    ...sound,
    active: sound.key === selectedKey.value,
    playing: sound.key === currentKey.value && isPlaying.value,
  }))
}

function showToast(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 2200)
}

async function loadInteract() {
  try {
    interactData.value = await api.getStudyInteract()
  } catch {
    interactData.value = {
      title: '互动功能',
      subtitle: '选择你想要的互动方式',
      currentMode: 'none',
      modes: [
        { key: 'voice', title: '语音连麦', subtitle: '开麦交流 一起学习更专注', onlineCount: 12 },
        { key: 'video', title: '视频自习', subtitle: '视频陪伴 见面学习更有动力', onlineCount: 8 },
      ],
      utilities: [
        { key: 'rules', title: '房间规则', subtitle: '了解规则', icon: 'clipboard-list' },
        { key: 'privacy', title: '权限说明', subtitle: '隐私与安全', icon: 'shield' },
        { key: 'spectate', title: '仅围观', subtitle: '不进麦不出镜', icon: 'eye' },
      ],
    }
  }
}

function openInteractSheet() {
  sheetOpen.value = true
  loadInteract()
}

async function onJoinMode(mode) {
  joining.value = true
  try {
    const data = await api.joinStudyInteract(mode)
    interactData.value = data
    sheetOpen.value = false
    if (mode === 'voice') {
      router.push('/study-room/voice')
      return
    }
    if (mode === 'video') {
      router.push('/study-room/video')
      return
    }
    showToast(data.message || '已进入')
  } catch (err) {
    showToast(err.message || '进入失败')
  } finally {
    joining.value = false
  }
}

async function onUtility(key) {
  if (key === 'spectate') {
    await onJoinMode('spectate')
  }
}

async function onSoundSelect(key) {
  if (isLoading.value) return

  if (currentKey.value === key && isPlaying.value) {
    stopAudio()
    syncActiveState()
    return
  }

  selectedKey.value = key
  await playSound(key)
  syncActiveState()

  try {
    await api.saveAmbientSound(key)
  } catch {
    // 本地播放不受影响
  }
}

onMounted(async () => {
  try {
    const data = await api.getStudyRoom()
    sounds.value = data.sounds
    selectedKey.value = data.ambientSound || 'rain'
    classmates.value = data.classmates
    onlineCount.value = data.onlineCount
    atmosphere.value = data.atmosphere
  } catch {
    sounds.value = [
      { key: 'rain', icon: 'cloud-rain', label: '雨声', url: '/sounds/rain.wav', active: true },
      { key: 'cafe', icon: 'mug-hot', label: '咖啡厅', url: '/sounds/cafe.wav', active: false },
      { key: 'forest', icon: 'tree', label: '森林', url: '/sounds/forest.wav', active: false },
      { key: 'fire', icon: 'fire', label: '篝火', url: '/sounds/fire.wav', active: false },
    ]
  }
  syncActiveState()
  loadInteract()
})
</script>

<template>
  <div class="study-room page">
    <div class="room-bg" aria-hidden="true">
      <div class="sky-gradient" />
      <div class="stars-layer" />
      <div class="nebula nebula-a" />
      <div class="nebula nebula-b" />
      <div class="cloud cloud-a" />
      <div class="cloud cloud-b" />
      <div class="planet planet-a" />
      <div class="ufo" />
      <div class="glow-star glow-star-a" />
    </div>

    <header class="room-header">
      <div class="header-left">
        <h1 class="room-title">星光自习室</h1>
        <div class="online-badge">
          <font-awesome-icon icon="seedling" class="badge-icon" />
          {{ onlineCount }}人在线
        </div>
        <div class="atmosphere">
          <font-awesome-icon icon="eye" />
          学习氛围值：<em>{{ atmosphere }}%</em>
        </div>
      </div>
      <div class="header-icons">
        <button class="icon-btn" type="button" aria-label="搜索" @click="router.push('/study-room/search')">
          <font-awesome-icon icon="search" />
        </button>
        <button class="icon-btn" type="button" aria-label="更多功能" @click="router.push('/study-room/plaza')">
          <font-awesome-icon icon="grip" />
        </button>
      </div>
    </header>

    <main class="page-body">
      <section class="focus-stage" aria-label="专注计时">
        <div class="focus-cluster">
          <div class="timer-ring-wrap">
            <div class="timer-glow" />
            <svg viewBox="0 0 200 200" class="timer-ring" aria-hidden="true">
              <circle cx="100" cy="100" :r="RING_R" class="ring-track" />
              <circle
                cx="100"
                cy="100"
                :r="RING_R"
                class="ring-progress"
                :stroke-dasharray="RING_C"
                :stroke-dashoffset="RING_C - (RING_C * progress) / 100"
              />
            </svg>

            <div class="timer-inner">
              <div class="timer-status-row">
                <font-awesome-icon icon="arrow-right" class="status-arrow" />
                <span>专注中</span>
              </div>
              <span class="timer-value">45:00</span>
            </div>
          </div>

          <div
            v-for="(mate, index) in classmates"
            :key="mate.id"
            class="classmate"
            :style="{ left: `${mate.x}%`, top: `${mate.y}%` }"
          >
            <div class="classmate-float" :style="{ animationDelay: `${index * 0.4}s` }">
              <div class="classmate-avatar">
                <img :src="avatarUrl(mate.seed, mate.avatarUrl)" :alt="mate.name">
              </div>
              <span class="classmate-name">{{ mate.name }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="bottom-section">
        <div class="ai-card">
          <div class="ai-text">
            <span class="ai-label">AI行为检测</span>
            <p class="ai-status">专注中</p>
            <p class="ai-hint">状态良好，继续保持哦！</p>
          </div>
          <div class="ai-mascot">
            <AiMascotBot />
          </div>
        </div>

        <div class="scene-row" aria-label="环境音">
          <button
            v-for="sound in sounds"
            :key="sound.key"
            class="scene-pill"
            :class="{ active: sound.active, playing: sound.playing }"
            type="button"
            :aria-label="`${sound.label}${sound.playing ? '，播放中' : ''}`"
            :disabled="isLoading"
            @click="onSoundSelect(sound.key)"
          >
            <font-awesome-icon :icon="sound.icon" />
            {{ sound.label }}
            <span v-if="sound.playing" class="sound-wave" aria-hidden="true" />
          </button>
        </div>

        <button type="button" class="interact-bar" @click="openInteractSheet">
          <span class="interact-icon-btn" aria-hidden="true">
            <font-awesome-icon icon="microphone" />
          </span>
          <span class="interact-label">连麦互动</span>
          <span class="interact-icon-btn" aria-hidden="true">
            <font-awesome-icon icon="video" />
          </span>
        </button>
      </section>
    </main>

    <StudyInteractSheet
      v-model="sheetOpen"
      :data="interactData"
      :joining="joining"
      @join="onJoinMode"
      @utility="onUtility"
    />

    <Transition name="fade">
      <div v-if="toast" class="room-toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.study-room {
  isolation: isolate;
  background: #25317f;
}

.room-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.sky-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #4f5ee0 0%, #4559d5 28%, #3949b7 58%, #2f378f 82%, #272d73 100%);
}

.stars-layer {
  position: absolute;
  inset: 0;
  opacity: .9;
  background-image:
    radial-gradient(1.5px 1.5px at 8% 12%, rgba(255,255,255,.95) 0%, transparent 100%),
    radial-gradient(1px 1px at 23% 7%, rgba(214,225,255,.9) 0%, transparent 100%),
    radial-gradient(1px 1px at 45% 18%, rgba(255,255,255,.7) 0%, transparent 100%),
    radial-gradient(1px 1px at 68% 6%, rgba(255,255,255,.9) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 88% 14%, rgba(255,255,255,.75) 0%, transparent 100%),
    radial-gradient(1px 1px at 15% 38%, rgba(255,255,255,.55) 0%, transparent 100%),
    radial-gradient(1px 1px at 55% 32%, rgba(255,255,255,.6) 0%, transparent 100%),
    radial-gradient(1px 1px at 78% 44%, rgba(255,255,255,.8) 0%, transparent 100%),
    radial-gradient(1px 1px at 31% 67%, rgba(220,228,255,.7) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 91% 73%, rgba(255,255,255,.65) 0%, transparent 100%);
}

.nebula {
  position: absolute;
  border-radius: 50%;
  filter: blur(52px);
  opacity: .28;
}

.nebula-a {
  width: 260px;
  height: 260px;
  top: 12%;
  left: -28%;
  background: #70a7ff;
}

.nebula-b {
  width: 220px;
  height: 220px;
  top: 34%;
  right: -30%;
  background: #b56cff;
}

.cloud {
  position: absolute;
  border-radius: 50px;
  background: rgba(255, 255, 255, .11);
  filter: blur(5px);
}

.cloud-a {
  width: 42px;
  height: 14px;
  top: 29%;
  left: 7%;
}

.cloud-b {
  width: 52px;
  height: 18px;
  top: 54%;
  right: 4%;
}

.planet-a {
  position: absolute;
  width: 40px;
  height: 40px;
  top: 21%;
  right: 9%;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 28%, #e4c9ff, #9b66ed 50%, #7045d5 78%);
  box-shadow: 0 0 24px rgba(177, 134, 255, .55);
}

.planet-a::after {
  content: '';
  position: absolute;
  top: 50%;
  left: -8px;
  right: -8px;
  height: 8px;
  margin-top: -4px;
  border: 2px solid rgba(224, 203, 255, .6);
  border-radius: 50%;
  transform: rotate(-18deg);
}

.ufo {
  position: absolute;
  top: 25%;
  left: 5%;
  width: 30px;
  height: 9px;
  border-radius: 50% 50% 4px 4px;
  background: rgba(192, 188, 255, .56);
  box-shadow: 0 0 12px rgba(167, 139, 250, .4);
}

.ufo::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 50%;
  width: 14px;
  height: 8px;
  border-radius: 50% 50% 0 0;
  background: rgba(255, 255, 255, .35);
  transform: translateX(-50%);
}

.glow-star {
  position: absolute;
  width: 9px;
  height: 9px;
  background: #fff7cb;
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  filter: drop-shadow(0 0 6px rgba(255, 245, 184, .9));
  animation: twinkle 2.5s ease-in-out infinite;
}

.glow-star-a {
  top: 17%;
  right: 27%;
}

.room-header {
  position: relative;
  z-index: 10;
  display: flex;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: space-between;
  padding: calc(18px + env(safe-area-inset-top, 0px)) 20px 4px;
}

.room-title {
  color: #fff;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: .5px;
}

.online-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 7px;
  padding: 3px 9px;
  border: 1px solid rgba(112, 255, 178, .24);
  border-radius: 999px;
  background: rgba(38, 210, 130, .18);
  color: #8cf0b4;
  font-size: 11px;
  font-weight: 600;
}

.badge-icon {
  font-size: 10px;
}

.atmosphere {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 7px;
  color: rgba(255, 255, 255, .72);
  font-size: 12px;
}

.atmosphere em {
  color: #a9ef54;
  font-style: normal;
  font-weight: 800;
}

.atmosphere svg {
  font-size: 11px;
  opacity: .8;
}

.header-icons {
  display: flex;
  gap: 8px;
  padding-top: 2px;
}

.icon-btn {
  display: flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 50%;
  background: rgba(255, 255, 255, .11);
  color: rgba(255, 255, 255, .88);
  font-size: 13px;
  transition: background .2s ease, transform .2s ease;
}

.icon-btn:active {
  background: rgba(255,255,255,.2);
  transform: scale(.94);
}

.page-body {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding-bottom: calc(var(--tab-height) + var(--safe-bottom) + 8px);
}

.focus-stage {
  position: relative;
  z-index: 5;
  display: flex;
  min-height: 0;
  flex: 1;
  align-items: flex-end;
  justify-content: center;
}

.focus-cluster {
  position: relative;
  width: 100%;
  max-width: 350px;
  height: clamp(380px, 54vh, 500px);
  flex-shrink: 0;
}

.classmate {
  position: absolute;
  z-index: 4;
  transform: translate(-50%, -50%);
}

.classmate-float {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  animation: floatAvatar 4.5s ease-in-out infinite;
}

.classmate-avatar {
  width: clamp(62px, 17vw, 74px);
  height: clamp(62px, 17vw, 74px);
  overflow: hidden;
  border: 2.5px solid rgba(255, 255, 255, .9);
  border-radius: 50%;
  background: #fff;
  box-shadow:
    0 0 0 4px rgba(174, 168, 255, .38),
    0 0 22px rgba(174, 168, 255, .28),
    0 8px 22px rgba(26, 27, 92, .38);
}

.classmate-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.classmate-name {
  max-width: 72px;
  overflow: hidden;
  color: rgba(255, 255, 255, .94);
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  text-shadow: 0 1px 5px rgba(0, 0, 0, .5);
  white-space: nowrap;
}

.timer-ring-wrap {
  position: absolute;
  z-index: 3;
  top: 31%;
  left: 50%;
  width: 206px;
  height: 206px;
  transform: translate(-50%, -50%);
}

.timer-glow {
  position: absolute;
  inset: 19%;
  border-radius: 50%;
  background: rgba(115, 144, 255, .12);
  box-shadow: 0 0 58px 30px rgba(128, 151, 255, .13);
}

.timer-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
  filter: drop-shadow(0 0 7px rgba(255, 255, 255, .4));
}

.ring-track {
  fill: none;
  stroke: rgba(255, 255, 255, .16);
  stroke-width: 3;
}

.ring-progress {
  fill: none;
  stroke: rgba(255, 255, 255, .96);
  stroke-linecap: round;
  stroke-width: 3;
}

.timer-inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.timer-status-row {
  display: flex;
  align-items: center;
  gap: 5px;
  color: rgba(255, 255, 255, .84);
  font-size: 12px;
  font-weight: 500;
}

.status-arrow {
  font-size: 10px;
  opacity: .75;
}

.timer-value {
  color: #fff;
  font-size: 42px;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  letter-spacing: 1px;
  line-height: 1;
  text-shadow: 0 2px 18px rgba(0, 0, 0, .25);
}

.bottom-section {
  position: relative;
  z-index: 6;
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 12px;
  padding: 0 20px;
}

.ai-card {
  display: flex;
  min-height: 104px;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 13px 14px 13px 17px;
  border: 1px solid rgba(219, 232, 255, .18);
  border-radius: 18px;
  background: linear-gradient(105deg, rgba(118, 171, 255, .34), rgba(153, 188, 255, .23));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.1), 0 10px 30px rgba(20,31,100,.14);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.ai-label {
  color: rgba(255, 255, 255, .67);
  font-size: 11px;
}

.ai-status {
  margin-top: 5px;
  color: #95f071;
  font-size: 25px;
  font-weight: 800;
  line-height: 1;
  text-shadow: 0 0 14px rgba(133, 244, 106, .2);
}

.ai-hint {
  margin-top: 6px;
  color: rgba(255, 255, 255, .78);
  font-size: 12px;
}

.ai-mascot {
  width: 84px;
  height: 84px;
  flex-shrink: 0;
  overflow: hidden;
  border: 1.5px solid rgba(255, 255, 255, .32);
  border-radius: 22px;
  background: linear-gradient(145deg, rgba(186, 214, 255, .45), rgba(130, 168, 255, .28));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, .35),
    inset 0 -8px 18px rgba(72, 108, 196, .12),
    0 8px 22px rgba(26, 38, 110, .22);
}

.scene-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  padding-bottom: 4px;
}

.scene-pill {
  display: flex;
  min-width: 0;
  min-height: 38px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 8px 5px;
  border: 1px solid rgba(255, 255, 255, .14);
  border-radius: 999px;
  background: rgba(255, 255, 255, .11);
  color: rgba(255, 255, 255, .84);
  font-size: 11px;
  white-space: nowrap;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: background .2s ease, border-color .2s ease, transform .2s ease;
}

.scene-pill svg {
  flex-shrink: 0;
  font-size: 13px;
  opacity: .9;
}

.scene-pill.active {
  border-color: rgba(208, 231, 255, .4);
  background: rgba(133, 184, 255, .3);
  box-shadow: 0 2px 14px rgba(0, 0, 0, .14);
  color: #fff;
}

.scene-pill.playing {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, .35), 0 2px 16px rgba(133, 184, 255, .35);
}

.sound-wave {
  display: inline-block;
  width: 4px;
  height: 4px;
  margin-left: 2px;
  border-radius: 50%;
  background: #a9ef54;
  box-shadow: 0 0 6px #a9ef54;
  animation: soundPulse 1.2s ease-in-out infinite;
}

@keyframes soundPulse {
  0%, 100% { opacity: .4; transform: scale(.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

.scene-pill:active {
  transform: scale(.96);
}

.interact-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 10px 14px;
  margin-top: 2px;
  border-radius: 999px;
  border: 1.5px solid rgba(255, 245, 200, 0.45);
  background: linear-gradient(90deg, rgba(55, 48, 163, 0.72) 0%, rgba(79, 70, 229, 0.65) 50%, rgba(99, 102, 241, 0.68) 100%);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.12) inset,
    0 0 22px rgba(167, 139, 250, 0.35),
    0 8px 28px rgba(20, 31, 100, 0.28);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  color: #fff;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.interact-bar:active {
  transform: scale(0.98);
}

.interact-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.22);
  font-size: 15px;
  flex-shrink: 0;
}

.interact-label {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.2);
}

.room-toast {
  position: fixed;
  left: 50%;
  bottom: calc(var(--tab-height) + var(--safe-bottom) + 24px);
  transform: translateX(-50%);
  padding: 10px 22px;
  background: rgba(30, 42, 120, 0.92);
  color: #fff;
  font-size: 13px;
  border-radius: 999px;
  z-index: 500;
  white-space: nowrap;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-height: 760px) {
  .room-header {
    padding-top: calc(12px + env(safe-area-inset-top, 0px));
  }

  .focus-cluster {
    height: 380px;
  }

  .classmate-avatar {
    width: 58px;
    height: 58px;
  }

  .timer-ring-wrap {
    width: 190px;
    height: 190px;
  }

  .bottom-section {
    gap: 8px;
  }

  .ai-card {
    min-height: 92px;
    padding-top: 9px;
    padding-bottom: 9px;
  }

  .ai-mascot {
    width: 72px;
    height: 72px;
  }
}

@keyframes floatAvatar {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes twinkle {
  0%, 100% { opacity: .6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.15); }
}
</style>
