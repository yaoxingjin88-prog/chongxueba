<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { useToast } from '../composables/useToast'
import { useStudyRoomJoin } from '../composables/useStudyRoomJoin'

const router = useRouter()
const toast = useToast()
const { joinPlazaRoom } = useStudyRoomJoin()

const loading = ref(true)
const submitting = ref(false)
const showRules = ref(false)
const showMoreThemes = ref(false)
const showPassword = ref(false)

const themes = ref([])
const moreThemes = ref([])
const modes = ref([])
const durations = ref([25, 45, 60])
const capacities = ref([4, 8, 12])
const atmospheres = ref([])
const rules = ref([])

const roomName = ref('')
const themeLabel = ref('晚间专注')
const studyMode = ref('quiet')
const isPrivate = ref(true)
const password = ref('')
const durationMinutes = ref(45)
const maxMembers = ref(8)
const micEnabled = ref(true)
const cameraEnabled = ref(true)
const atmosphereId = ref('starry-night')

const atmosphereStyles = {
  'starry-night': {
    background: 'linear-gradient(160deg, #1e1b4b 0%, #4c1d95 45%, #7c3aed 100%)',
  },
  'moon-desk': {
    background: 'linear-gradient(160deg, #1e3a5f 0%, #312e81 50%, #6366f1 100%)',
  },
  'cloud-dream': {
    background: 'linear-gradient(160deg, #fce7f3 0%, #e9d5ff 45%, #c4b5fd 100%)',
  },
}

const nameError = computed(() => {
  const n = roomName.value.trim()
  if (!n) return ''
  if (n.length < 2 || n.length > 20) return '名称需 2-20 字'
  return ''
})

const canSubmit = computed(() => {
  const n = roomName.value.trim()
  if (n.length < 2 || n.length > 20) return false
  if (isPrivate.value) {
    const p = password.value.trim()
    if (p.length < 4 || p.length > 8) return false
  }
  return !submitting.value
})

function resetForm() {
  roomName.value = ''
  themeLabel.value = '晚间专注'
  studyMode.value = 'quiet'
  isPrivate.value = true
  password.value = ''
  durationMinutes.value = 45
  maxMembers.value = 8
  micEnabled.value = true
  cameraEnabled.value = true
  atmosphereId.value = 'starry-night'
  showMoreThemes.value = false
  toast.show('表单已重置')
}

function selectTheme(label) {
  themeLabel.value = label
  showMoreThemes.value = false
}

function goInvite() {
  router.push('/study-room/invite')
}

async function loadPage() {
  loading.value = true
  try {
    const data = await api.getStudyRoomCreatePage()
    themes.value = data.themes || []
    moreThemes.value = data.moreThemes || []
    modes.value = data.modes || []
    durations.value = data.durations || [25, 45, 60]
    capacities.value = data.capacities || [4, 8, 12]
    atmospheres.value = data.atmospheres || []
    rules.value = data.rules || []
    if (!themeLabel.value && themes.value[1]) {
      themeLabel.value = themes.value[1].label
    }
  } catch {
    themes.value = [
      { label: '考研冲刺', category: 'kaoyan' },
      { label: '晚间专注', category: 'recommend' },
      { label: '英语学习', category: 'language' },
    ]
    moreThemes.value = [
      { label: '热门自习', category: 'hot' },
      { label: '四六级', category: 'cet' },
      { label: '编程学习', category: 'code' },
    ]
    modes.value = [
      { key: 'quiet', label: '安静自习' },
      { key: 'pomodoro', label: '番茄专注' },
      { key: 'ai', label: 'AI陪伴' },
    ]
    atmospheres.value = [
      { id: 'starry-night', label: '星空之夜' },
      { id: 'moon-desk', label: '月夜书桌' },
      { id: 'cloud-dream', label: '云端梦境' },
    ]
    rules.value = ['请保持友善交流，专注学习']
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (!canSubmit.value) {
    toast.show(nameError.value || '请完善表单信息')
    return
  }
  submitting.value = true
  try {
    const data = await api.createStudyRoom({
      name: roomName.value.trim(),
      themeLabel: themeLabel.value,
      studyMode: studyMode.value,
      isPrivate: isPrivate.value,
      password: isPrivate.value ? password.value.trim() : '',
      durationMinutes: durationMinutes.value,
      maxMembers: maxMembers.value,
      micEnabled: micEnabled.value,
      cameraEnabled: cameraEnabled.value,
      atmosphereId: atmosphereId.value,
    })
    toast.show(data.message || '创建成功')
    const room = data.room
    if (room?.id) {
      try {
        await joinPlazaRoom({
          id: room.id,
          name: room.name,
          isPrivate: isPrivate.value,
        }, isPrivate.value ? password.value.trim() : '')
        return
      } catch {
        router.push('/study-room/plaza')
        return
      }
    }
    router.push('/study-room/plaza')
  } catch (err) {
    toast.show(err.message || '创建失败')
  } finally {
    submitting.value = false
  }
}

onMounted(loadPage)
</script>

<template>
  <div class="create-page page">
    <div class="page-bg" aria-hidden="true" />

    <header class="top-bar">
      <button type="button" class="icon-btn" aria-label="返回" @click="router.back()">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <h1 class="page-title">
        <font-awesome-icon icon="star" class="title-star" />
        创建自习室
        <font-awesome-icon icon="star" class="title-star" />
      </h1>
      <button type="button" class="rules-btn" @click="showRules = true">
        <font-awesome-icon icon="question-circle" />
        规则
      </button>
    </header>

    <div v-if="loading" class="page-content no-tab create-body">
      <p class="loading-text">加载中…</p>
    </div>

    <div v-else class="page-content no-tab create-body">
      <div class="form-card">
        <!-- 自习室名称 -->
        <div class="form-row">
          <div class="row-icon">
            <font-awesome-icon icon="book" />
          </div>
          <div class="row-main">
            <label class="row-label">自习室名称</label>
            <input
              v-model="roomName"
              type="text"
              class="text-input"
              maxlength="20"
              placeholder="请输入自习室名称（2-20字）"
            >
            <p v-if="nameError" class="field-hint error">{{ nameError }}</p>
          </div>
        </div>

        <!-- 自习室主题 -->
        <div class="form-row">
          <div class="row-icon">
            <font-awesome-icon icon="bookmark" />
          </div>
          <div class="row-main">
            <label class="row-label">自习室主题</label>
            <div class="chip-row">
              <button
                v-for="item in themes"
                :key="item.label"
                type="button"
                class="chip"
                :class="{ active: themeLabel === item.label }"
                @click="selectTheme(item.label)"
              >
                {{ item.label }}
              </button>
              <div class="more-wrap">
                <button
                  type="button"
                  class="chip chip-more"
                  :class="{ active: moreThemes.some((t) => t.label === themeLabel) }"
                  @click="showMoreThemes = !showMoreThemes"
                >
                  更多
                  <font-awesome-icon icon="chevron-down" class="more-arrow" />
                </button>
                <div v-if="showMoreThemes" class="more-dropdown">
                  <button
                    v-for="item in moreThemes"
                    :key="item.label"
                    type="button"
                    class="dropdown-item"
                    @click="selectTheme(item.label)"
                  >
                    {{ item.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 自习模式 -->
        <div class="form-row">
          <div class="row-icon">
            <font-awesome-icon icon="mug-hot" />
          </div>
          <div class="row-main">
            <label class="row-label">自习模式</label>
            <div class="pill-row">
              <button
                v-for="mode in modes"
                :key="mode.key"
                type="button"
                class="pill"
                :class="{ active: studyMode === mode.key }"
                @click="studyMode = mode.key"
              >
                {{ mode.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- 公开/私密 -->
        <div class="form-row">
          <div class="row-icon">
            <font-awesome-icon icon="lock" />
          </div>
          <div class="row-main">
            <label class="row-label">公开/私密</label>
            <div class="segmented">
              <button
                type="button"
                class="segment"
                :class="{ active: !isPrivate }"
                @click="isPrivate = false"
              >
                公开（可被搜索加入）
              </button>
              <button
                type="button"
                class="segment"
                :class="{ active: isPrivate }"
                @click="isPrivate = true"
              >
                私密（需密码加入）
              </button>
            </div>
          </div>
        </div>

        <!-- 房间密码 -->
        <div v-if="isPrivate" class="form-row">
          <div class="row-icon">
            <font-awesome-icon icon="link" />
          </div>
          <div class="row-main">
            <label class="row-label">房间密码</label>
            <div class="password-wrap">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="text-input"
                maxlength="8"
                placeholder="请输入4-8位房间密码"
              >
              <button
                type="button"
                class="eye-btn"
                aria-label="切换密码可见"
                @click="showPassword = !showPassword"
              >
                <font-awesome-icon :icon="showPassword ? 'eye' : 'eye-slash'" />
              </button>
            </div>
          </div>
        </div>

        <!-- 学习时长 -->
        <div class="form-row">
          <div class="row-icon">
            <font-awesome-icon icon="clock" />
          </div>
          <div class="row-main">
            <label class="row-label">学习时长</label>
            <div class="pill-row">
              <button
                v-for="d in durations"
                :key="d"
                type="button"
                class="pill"
                :class="{ active: durationMinutes === d }"
                @click="durationMinutes = d"
              >
                {{ d }}分钟
              </button>
            </div>
          </div>
        </div>

        <!-- 人数上限 -->
        <div class="form-row">
          <div class="row-icon">
            <font-awesome-icon icon="users" />
          </div>
          <div class="row-main">
            <label class="row-label">人数上限</label>
            <div class="pill-row">
              <button
                v-for="c in capacities"
                :key="c"
                type="button"
                class="pill"
                :class="{ active: maxMembers === c }"
                @click="maxMembers = c"
              >
                {{ c }}人
              </button>
            </div>
          </div>
        </div>

        <!-- 开麦 -->
        <div class="form-row form-row--toggle">
          <div class="row-icon">
            <font-awesome-icon icon="microphone" />
          </div>
          <div class="row-main row-main--between">
            <label class="row-label">开麦功能</label>
            <button
              type="button"
              class="toggle"
              :class="{ on: micEnabled }"
              aria-label="开麦功能"
              @click="micEnabled = !micEnabled"
            >
              <span class="toggle-knob" />
            </button>
          </div>
        </div>

        <!-- 摄像头 -->
        <div class="form-row form-row--toggle">
          <div class="row-icon">
            <font-awesome-icon icon="video" />
          </div>
          <div class="row-main row-main--between">
            <label class="row-label">摄像头功能</label>
            <button
              type="button"
              class="toggle"
              :class="{ on: cameraEnabled }"
              aria-label="摄像头功能"
              @click="cameraEnabled = !cameraEnabled"
            >
              <span class="toggle-knob" />
            </button>
          </div>
        </div>

        <!-- 邀请好友 -->
        <button type="button" class="form-row form-row--link" @click="goInvite">
          <div class="row-icon">
            <font-awesome-icon icon="user-plus" />
          </div>
          <div class="row-main row-main--between">
            <div>
              <span class="row-label">邀请好友</span>
              <p class="row-sub">生成邀请链接或分享给好友</p>
            </div>
            <font-awesome-icon icon="chevron-right" class="link-arrow" />
          </div>
        </button>
      </div>

      <!-- 房间氛围预览 -->
      <section class="preview-card">
        <h2 class="atmosphere-title">
          <font-awesome-icon icon="wand-magic-sparkles" />
          房间氛围预览
        </h2>
        <div class="atmosphere-scroll">
          <button
            v-for="item in atmospheres"
            :key="item.id"
            type="button"
            class="atmosphere-card"
            :class="{ active: atmosphereId === item.id }"
            @click="atmosphereId = item.id"
          >
            <div
              class="atmosphere-thumb"
              :style="atmosphereStyles[item.id] || atmosphereStyles['starry-night']"
            />
            <span class="atmosphere-label">{{ item.label }}</span>
            <span v-if="atmosphereId === item.id" class="atmosphere-check">
              <font-awesome-icon icon="check" />
            </span>
          </button>
        </div>
      </section>
    </div>

    <footer class="bottom-bar">
      <button type="button" class="side-btn" aria-label="编辑" @click="resetForm">
        <span class="side-btn-text">编辑</span>
      </button>
      <button
        type="button"
        class="create-btn"
        :disabled="!canSubmit"
        @click="handleCreate"
      >
        <font-awesome-icon icon="star" />
        {{ submitting ? '创建中…' : '立即创建' }}
      </button>
      <button type="button" class="side-btn" aria-label="分享" @click="goInvite">
        <font-awesome-icon icon="share-nodes" />
      </button>
    </footer>

  <!-- 规则弹层 -->
    <div v-if="showRules" class="rules-overlay mobile-overlay" @click.self="showRules = false">
      <div class="rules-sheet">
        <h3>创建规则</h3>
        <ul>
          <li v-for="(rule, i) in rules" :key="i">{{ rule }}</li>
        </ul>
        <button type="button" class="rules-close" @click="showRules = false">知道了</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.create-page {
  position: relative;
  overflow: hidden;
}

.page-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: url('/创建自习室背景.png') center top / 100% auto no-repeat;
  background-color: #ebe4ff;
}

.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.88);
  color: #6d28d9;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(91, 33, 182, 0.12);
}

.page-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 6px rgba(76, 29, 149, 0.35);
}

.title-star {
  font-size: 10px;
  color: #fde68a;
  opacity: 0.95;
}

.rules-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 5px 9px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  font-size: 11px;
  cursor: pointer;
  backdrop-filter: blur(6px);
}

.create-body {
  position: relative;
  z-index: 1;
  padding: min(46vw, 210px) 12px 82px;
}

.loading-text {
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  padding: 24px 0;
  font-size: 13px;
}

.form-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 22px;
  padding: 2px 12px;
  box-shadow: 0 8px 28px rgba(91, 33, 182, 0.12);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.65);
}

.form-row {
  display: flex;
  gap: 8px;
  padding: 9px 0;
  border-bottom: 1px solid #f3f0fb;
  align-items: flex-start;
}

.form-row:last-child {
  border-bottom: none;
}

.form-row--toggle {
  align-items: center;
  padding: 8px 0;
}

.form-row--link {
  width: 100%;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  padding: 9px 0;
}

.row-icon {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  color: #7c3aed;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 13px;
}

.row-main {
  flex: 1;
  min-width: 0;
}

.row-main--between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.row-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #5b4a96;
  margin-bottom: 6px;
}

.form-row--toggle .row-label,
.form-row--link .row-label {
  margin-bottom: 0;
}

.row-sub {
  font-size: 11px;
  color: #a8a0c8;
  margin-top: 2px;
}

.text-input {
  width: 100%;
  border: none;
  background: #f7f4ff;
  border-radius: 10px;
  padding: 8px 11px;
  font-size: 13px;
  color: #374151;
  outline: none;
}

.text-input::placeholder {
  color: #c4b5fd;
  font-size: 12px;
}

.field-hint {
  font-size: 10px;
  margin-top: 3px;
}

.field-hint.error {
  color: #ef4444;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.chip {
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid #e9e5f5;
  background: #fff;
  font-size: 12px;
  color: #8b7fb8;
  cursor: pointer;
}

.chip.active {
  border-color: #a855f7;
  background: #faf5ff;
  color: #7c3aed;
  font-weight: 600;
}

.chip-more {
  display: flex;
  align-items: center;
  gap: 3px;
}

.more-arrow {
  font-size: 9px;
}

.more-wrap {
  position: relative;
}

.more-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 5;
  min-width: 108px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  padding: 4px;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 7px 10px;
  border: none;
  background: none;
  text-align: left;
  font-size: 12px;
  color: #4b5563;
  border-radius: 6px;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #f5f3ff;
}

.pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pill {
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid #e9e5f5;
  background: #fff;
  font-size: 12px;
  color: #8b7fb8;
  cursor: pointer;
}

.pill.active {
  border-color: #a855f7;
  background: #faf5ff;
  color: #7c3aed;
  font-weight: 600;
}

.segmented {
  display: flex;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e9e5f5;
}

.segment {
  flex: 1;
  padding: 7px 5px;
  border: none;
  background: #fff;
  font-size: 11px;
  color: #8b7fb8;
  cursor: pointer;
  line-height: 1.3;
}

.segment.active {
  background: linear-gradient(135deg, #b07cff, #8b5cf6);
  color: #fff;
  font-weight: 600;
}

.password-wrap {
  display: flex;
  align-items: center;
  background: #f7f4ff;
  border-radius: 10px;
  padding-right: 6px;
}

.password-wrap .text-input {
  background: transparent;
}

.eye-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  color: #b8b0d8;
  cursor: pointer;
  font-size: 13px;
}

.toggle {
  width: 42px;
  height: 24px;
  border-radius: 999px;
  border: none;
  background: #e5e7eb;
  padding: 2px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s;
}

.toggle.on {
  background: linear-gradient(135deg, #b07cff, #8b5cf6);
}

.toggle-knob {
  display: block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s;
}

.toggle.on .toggle-knob {
  transform: translateX(18px);
}

.link-arrow {
  color: #c4b5fd;
  font-size: 12px;
}

.preview-card {
  margin-top: 10px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 18px;
  padding: 12px;
  box-shadow: 0 6px 20px rgba(91, 33, 182, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.65);
}

.atmosphere-title {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 700;
  color: #5b4a96;
  margin-bottom: 10px;
}

.atmosphere-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  -webkit-overflow-scrolling: touch;
}

.atmosphere-card {
  position: relative;
  flex: 0 0 96px;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 0;
  background: #fff;
  cursor: pointer;
  overflow: hidden;
}

.atmosphere-card.active {
  border-color: #a855f7;
  box-shadow: 0 3px 12px rgba(124, 58, 237, 0.28);
}

.atmosphere-thumb {
  height: 58px;
}

.atmosphere-label {
  display: block;
  padding: 6px 4px;
  font-size: 11px;
  font-weight: 600;
  color: #5b4a96;
  text-align: center;
}

.atmosphere-check {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #7c3aed;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
}

.bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px calc(var(--safe-bottom) + 10px);
  background: linear-gradient(180deg, transparent 0%, rgba(235, 228, 255, 0.92) 35%, rgba(235, 228, 255, 0.98) 100%);
}

.side-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.85);
  color: #7c3aed;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(91, 33, 182, 0.1);
  font-size: 13px;
}

.side-btn-text {
  font-size: 10px;
  font-weight: 600;
}

.create-btn {
  flex: 1;
  border: none;
  border-radius: 999px;
  padding: 11px 16px;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #c084fc 0%, #a855f7 45%, #9333ea 100%);
  box-shadow: 0 4px 16px rgba(147, 51, 234, 0.38);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.create-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.rules-overlay {
  z-index: 100;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.rules-sheet {
  width: 100%;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 20px 20px calc(var(--safe-bottom) + 16px);
  max-height: 70vh;
}

.rules-sheet h3 {
  font-size: 17px;
  font-weight: 700;
  color: #4a3b8c;
  margin-bottom: 12px;
}

.rules-sheet ul {
  list-style: none;
  margin: 0 0 16px;
  padding: 0;
}

.rules-sheet li {
  font-size: 14px;
  color: #6b7280;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
  line-height: 1.45;
}

.rules-close {
  width: 100%;
  border: none;
  border-radius: 12px;
  padding: 12px;
  background: linear-gradient(135deg, #a855f7, #7c3aed);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
</style>
