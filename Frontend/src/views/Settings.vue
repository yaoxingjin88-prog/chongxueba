<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { api } from '../api'
import { avatarUrl } from '../utils/avatar'

const router = useRouter()
const user = useUserStore()

const loading = ref(true)
const toast = ref('')
const settings = ref(null)

const focusOptions = [15, 25, 45, 60]
const petFreqOptions = [
  { value: 'daily', label: '每日提醒' },
  { value: 'weekly', label: '每周提醒' },
  { value: 'off', label: '关闭提醒' },
]
const reportOptions = [
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
]
const themeOptions = [
  { value: 'starry', label: '梦幻星空' },
  { value: 'light', label: '清新浅色' },
  { value: 'dark', label: '暗夜模式' },
]

function showToast(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 2000)
}

async function loadSettings() {
  loading.value = true
  try {
    settings.value = await api.getSettings()
  } catch (err) {
    showToast(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function patchSettings(payload) {
  try {
    settings.value = await api.updateSettings(payload)
  } catch (err) {
    showToast(err.message || '保存失败')
    await loadSettings()
  }
}

function cycleOption(current, options, field, valueKey = 'value') {
  const idx = options.findIndex((o) => o[valueKey] === current)
  const next = options[(idx + 1) % options.length]
  patchSettings({ [field]: next[valueKey] })
}

async function toggleNotify(key) {
  if (!settings.value) return
  const next = !settings.value.notifications[key]
  settings.value.notifications[key] = next
  await patchSettings({ [key]: next })
}

async function clearCache() {
  try {
    settings.value = await api.clearSettingsCache()
    showToast('缓存已清理')
  } catch (err) {
    showToast(err.message || '清理失败')
  }
}

async function checkUpdate() {
  try {
    const data = await api.checkSettingsUpdate()
    showToast(data.hasUpdate ? '发现新版本' : '当前已是最新版本')
  } catch (err) {
    showToast(err.message || '检查失败')
  }
}

async function deleteAccount() {
  if (!window.confirm('确定要注销账号吗？此操作不可撤销。')) return
  try {
    await api.deleteAccount()
    showToast('注销申请已提交')
  } catch (err) {
    showToast(err.message || '操作失败')
  }
}

function handleLogout() {
  user.logout()
  sessionStorage.removeItem('chong-xueba-guest')
  router.replace('/login')
}

onMounted(loadSettings)
</script>

<template>
  <div class="settings page">
    <div class="hero-bg">
      <div class="hero-gradient" />
      <div class="hero-nebula" />
      <div class="hero-clouds" />
      <div class="hero-stars" />
    </div>

    <header class="settings-header">
      <button type="button" class="back-btn" @click="router.back()">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <h1 class="header-title">设置中心</h1>
      <button type="button" class="profile-entry-btn" aria-label="个人资料" @click="router.push('/settings/profile')">
        <font-awesome-icon icon="user" />
      </button>
    </header>

    <div class="settings-body">
      <div class="page-content">
        <div v-if="loading" class="loading-tip">加载中...</div>

        <template v-else-if="settings">
          <section class="profile-card glass-card" @click="router.push('/settings/profile')">
          <div class="profile-avatar">
            <img
              :src="avatarUrl(settings.profile.avatarSeed, settings.profile.avatarUrl)"
              alt="avatar"
            />
          </div>
          <div class="profile-info">
            <div class="profile-name-row">
              <span class="profile-name">{{ settings.profile.name }}</span>
              <span class="level-badge">Lv.{{ settings.profile.level }}</span>
            </div>
            <p class="profile-meta">
              <span>{{ settings.profile.phone }}</span>
              <span class="meta-divider">|</span>
              <span>当前宠物：{{ settings.profile.petName }}</span>
            </p>
          </div>
          <font-awesome-icon icon="chevron-right" class="profile-arrow" />
        </section>

        <div class="settings-grid">
          <section class="setting-card glass-card">
            <h2 class="card-title">学习与宠物设置</h2>
            <button type="button" class="setting-row" @click="showToast('功能开发中')">
              <font-awesome-icon icon="bullseye" class="row-icon" />
              <span class="row-label">学习目标设置</span>
              <font-awesome-icon icon="chevron-right" class="row-arrow" />
            </button>
            <button
              type="button"
              class="setting-row"
              @click="cycleOption(settings.study.defaultFocusMinutes, focusOptions.map(v => ({ value: v, label: `${v}分钟` })), 'defaultFocusMinutes')"
            >
              <font-awesome-icon icon="clock" class="row-icon" />
              <span class="row-label">默认专注时长</span>
              <span class="row-value">{{ settings.study.defaultFocusLabel }}</span>
            </button>
            <button type="button" class="setting-row" @click="showToast('功能开发中')">
              <font-awesome-icon icon="book-open-reader" class="row-icon" />
              <span class="row-label">AI自习室偏好</span>
              <font-awesome-icon icon="chevron-right" class="row-arrow" />
            </button>
            <button
              type="button"
              class="setting-row"
              @click="cycleOption(settings.study.petInteractionFreq, petFreqOptions, 'petInteractionFreq')"
            >
              <font-awesome-icon icon="cat" class="row-icon" />
              <span class="row-label">宠物互动频率</span>
              <span class="row-value">{{ settings.study.petInteractionLabel }}</span>
            </button>
            <button
              type="button"
              class="setting-row no-border"
              @click="cycleOption(settings.study.growthReportCycle, reportOptions, 'growthReportCycle')"
            >
              <font-awesome-icon icon="chart-line" class="row-icon" />
              <span class="row-label">成长报告周期</span>
              <span class="row-value">{{ settings.study.growthReportLabel }}</span>
            </button>
          </section>

          <section class="setting-card glass-card">
            <h2 class="card-title">通知提醒</h2>
            <div class="setting-row">
              <font-awesome-icon icon="bell" class="row-icon" />
              <span class="row-label">专注开始提醒</span>
              <button
                type="button"
                class="toggle"
                :class="{ on: settings.notifications.focusStart }"
                @click="toggleNotify('focusStart')"
              >
                <span class="toggle-thumb" />
              </button>
            </div>
            <div class="setting-row">
              <font-awesome-icon icon="bell" class="row-icon" />
              <span class="row-label">任务完成提醒</span>
              <button
                type="button"
                class="toggle"
                :class="{ on: settings.notifications.taskComplete }"
                @click="toggleNotify('taskComplete')"
              >
                <span class="toggle-thumb" />
              </button>
            </div>
            <div class="setting-row">
              <font-awesome-icon icon="bell" class="row-icon" />
              <span class="row-label">宠物成长提醒</span>
              <button
                type="button"
                class="toggle"
                :class="{ on: settings.notifications.petGrowth }"
                @click="toggleNotify('petGrowth')"
              >
                <span class="toggle-thumb" />
              </button>
            </div>
            <div class="setting-row">
              <font-awesome-icon icon="bell" class="row-icon" />
              <span class="row-label">每日打卡提醒</span>
              <button
                type="button"
                class="toggle"
                :class="{ on: settings.notifications.dailyCheckin }"
                @click="toggleNotify('dailyCheckin')"
              >
                <span class="toggle-thumb" />
              </button>
            </div>
            <div class="setting-row no-border">
              <font-awesome-icon icon="bell" class="row-icon" />
              <span class="row-label">成就解锁提醒</span>
              <button
                type="button"
                class="toggle"
                :class="{ on: settings.notifications.achievement }"
                @click="toggleNotify('achievement')"
              >
                <span class="toggle-thumb" />
              </button>
            </div>
          </section>

          <section class="setting-card glass-card">
            <h2 class="card-title">隐私与安全</h2>
            <button type="button" class="setting-row" @click="showToast('功能开发中')">
              <font-awesome-icon icon="shield" class="row-icon" />
              <span class="row-label">账号安全</span>
              <font-awesome-icon icon="chevron-right" class="row-arrow" />
            </button>
            <button type="button" class="setting-row" @click="showToast('功能开发中')">
              <font-awesome-icon icon="lock" class="row-icon" />
              <span class="row-label">修改密码</span>
              <font-awesome-icon icon="chevron-right" class="row-arrow" />
            </button>
            <button type="button" class="setting-row" @click="showToast('功能开发中')">
              <font-awesome-icon icon="pen" class="row-icon" />
              <span class="row-label">绑定手机号</span>
              <font-awesome-icon icon="chevron-right" class="row-arrow" />
            </button>
            <button type="button" class="setting-row" @click="showToast('功能开发中')">
              <font-awesome-icon icon="book" class="row-icon" />
              <span class="row-label">用户协议</span>
              <font-awesome-icon icon="chevron-right" class="row-arrow" />
            </button>
            <button type="button" class="setting-row" @click="showToast('功能开发中')">
              <font-awesome-icon icon="shield" class="row-icon" />
              <span class="row-label">隐私政策</span>
              <font-awesome-icon icon="chevron-right" class="row-arrow" />
            </button>
            <button type="button" class="setting-row danger-row no-border" @click="deleteAccount">
              <font-awesome-icon icon="circle-xmark" class="row-icon danger-icon" />
              <span class="row-label danger-label">注销账号</span>
              <font-awesome-icon icon="chevron-right" class="row-arrow danger-arrow" />
            </button>
          </section>

          <section class="setting-card glass-card">
            <h2 class="card-title">通用设置</h2>
            <button type="button" class="setting-row" @click="clearCache">
              <font-awesome-icon icon="trash-can" class="row-icon" />
              <span class="row-label">清理缓存</span>
              <span class="row-value">{{ settings.general.cacheSizeLabel }}</span>
            </button>
            <button
              type="button"
              class="setting-row"
              @click="cycleOption(settings.general.themeAppearance, themeOptions, 'themeAppearance')"
            >
              <font-awesome-icon icon="moon" class="row-icon" />
              <span class="row-label">主题外观</span>
              <span class="row-value">{{ settings.general.themeLabel }}</span>
            </button>
            <button type="button" class="setting-row" @click="showToast('功能开发中')">
              <font-awesome-icon icon="pen" class="row-icon" />
              <span class="row-label">意见反馈</span>
              <font-awesome-icon icon="chevron-right" class="row-arrow" />
            </button>
            <button type="button" class="setting-row" @click="showToast('宠学霸 v2.3 — AI电子宠物自律养成平台')">
              <font-awesome-icon icon="question-circle" class="row-icon" />
              <span class="row-label">关于宠学霸</span>
              <font-awesome-icon icon="chevron-right" class="row-arrow" />
            </button>
            <button type="button" class="setting-row no-border" @click="checkUpdate">
              <font-awesome-icon icon="circle-check" class="row-icon" />
              <span class="row-label">检查更新</span>
              <span class="row-value">{{ settings.general.appVersion }}</span>
            </button>
          </section>
        </div>
        </template>
      </div>

      <footer v-if="!loading && settings" class="settings-footer">
        <button type="button" class="logout-btn" @click="handleLogout">
          退出登录
        </button>
      </footer>
    </div>

    <Transition name="fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.settings.page {
  --set-primary: #4a4580;
  --set-secondary: #8e8ebc;
  --set-muted: #a9a5c8;
  --set-icon: #8b5cf6;
  --set-purple: #8b5cf6;
  --set-purple-light: #a78bfa;
  --set-purple-dark: #6366f1;
  --set-danger: #ff4d4f;
  --set-glass: rgba(255, 255, 255, 0.78);
  --set-glass-border: rgba(255, 255, 255, 0.62);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background: #e0e7ff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.settings-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 5;
}

.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  pointer-events: none;
}

.hero-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    #5d5fef 0%,
    #6366f1 10%,
    #7c83f6 24%,
    #9498f8 38%,
    #b4bcfc 52%,
    #c7d2fe 68%,
    #d8e0fe 82%,
    #e0e7ff 100%
  );
}

.hero-nebula {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 85% 45% at 12% 18%, rgba(93, 95, 239, 0.45) 0%, transparent 58%),
    radial-gradient(ellipse 70% 40% at 88% 12%, rgba(129, 140, 248, 0.32) 0%, transparent 52%),
    radial-gradient(ellipse 90% 55% at 55% 35%, rgba(165, 180, 252, 0.28) 0%, transparent 62%),
    radial-gradient(ellipse 75% 38% at 25% 55%, rgba(199, 210, 254, 0.35) 0%, transparent 55%),
    radial-gradient(ellipse 100% 42% at 70% 48%, rgba(224, 231, 255, 0.4) 0%, transparent 60%);
  mix-blend-mode: soft-light;
}

.hero-clouds {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 110% 38% at 50% 105%, rgba(255, 255, 255, 0.55) 0%, transparent 68%),
    radial-gradient(ellipse 65% 28% at 18% 88%, rgba(255, 255, 255, 0.28) 0%, transparent 62%),
    radial-gradient(ellipse 60% 26% at 82% 92%, rgba(255, 255, 255, 0.22) 0%, transparent 58%),
    radial-gradient(ellipse 50% 20% at 45% 78%, rgba(255, 255, 255, 0.15) 0%, transparent 55%);
}

.hero-stars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 58%;
  background-image:
    radial-gradient(2px 2px at 8% 12%, rgba(255, 255, 255, 0.95) 0%, transparent 100%),
    radial-gradient(1px 1px at 18% 24%, rgba(255, 255, 255, 0.55) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 32% 8%, rgba(255, 255, 255, 0.85) 0%, transparent 100%),
    radial-gradient(1px 1px at 48% 18%, rgba(255, 255, 255, 0.45) 0%, transparent 100%),
    radial-gradient(2px 2px at 62% 10%, rgba(255, 255, 255, 0.9) 0%, transparent 100%),
    radial-gradient(1px 1px at 76% 22%, rgba(255, 255, 255, 0.6) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 90% 14%, rgba(255, 255, 255, 0.75) 0%, transparent 100%),
    radial-gradient(1px 1px at 24% 36%, rgba(255, 255, 255, 0.4) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 55% 32%, rgba(255, 255, 255, 0.5) 0%, transparent 100%),
    radial-gradient(1px 1px at 82% 38%, rgba(255, 255, 255, 0.35) 0%, transparent 100%),
    radial-gradient(1px 1px at 12% 42%, rgba(255, 255, 255, 0.3) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 68% 44%, rgba(255, 255, 255, 0.42) 0%, transparent 100%);
  mask-image: linear-gradient(180deg, #000 0%, #000 55%, transparent 100%);
  -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 55%, transparent 100%);
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  padding-top: calc(10px + env(safe-area-inset-top, 0px));
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}

.back-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  color: #fff;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.5px;
}

.profile-entry-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  color: #fff;
}

.page-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 4px 16px 8px;
}

.settings-footer {
  flex-shrink: 0;
  padding: 10px 16px calc(12px + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(180deg, rgba(224, 231, 255, 0) 0%, rgba(224, 231, 255, 0.88) 40%, #e0e7ff 100%);
}

.loading-tip {
  text-align: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.glass-card {
  background: var(--set-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--set-glass-border);
  box-shadow: 0 8px 32px rgba(93, 95, 239, 0.08);
}

/* ===== 用户卡片 ===== */
.profile-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 22px;
  margin-bottom: 16px;
  cursor: pointer;
}

.profile-avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 2.5px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 4px 12px rgba(123, 66, 246, 0.2);
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.profile-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--set-primary);
  letter-spacing: 0.2px;
}

.level-badge {
  font-size: 10px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  padding: 3px 9px;
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);
}

.profile-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  color: var(--set-secondary);
  line-height: 1.4;
}

.meta-divider {
  color: var(--set-muted);
  font-size: 11px;
}

.profile-arrow {
  font-size: 11px;
  color: var(--set-muted);
  flex-shrink: 0;
}

/* ===== 2x2 网格 ===== */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 8px;
}

.setting-card {
  border-radius: 20px;
  padding: 14px 12px 6px;
  min-width: 0;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--set-primary);
  margin-bottom: 10px;
  padding: 0 2px;
  letter-spacing: 0.3px;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 9px 2px;
  text-align: left;
  border-bottom: 1px solid rgba(142, 142, 188, 0.15);
  min-height: 36px;
}

.setting-row.no-border {
  border-bottom: none;
}

.row-icon {
  width: 16px;
  font-size: 13px;
  color: var(--set-icon);
  flex-shrink: 0;
  text-align: center;
}

.row-label {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--set-primary);
  line-height: 1.35;
}

.row-value {
  font-size: 12px;
  font-weight: 400;
  color: var(--set-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}

.row-arrow {
  font-size: 10px;
  color: var(--set-muted);
  flex-shrink: 0;
}

.danger-row {
  background: rgba(255, 77, 79, 0.08);
  border-radius: 12px;
  margin-top: 6px;
  padding: 11px 10px;
  border-bottom: none;
}

.danger-icon,
.danger-label {
  color: var(--set-danger) !important;
}

.danger-arrow {
  color: rgba(255, 77, 79, 0.45);
}

/* ===== Toggle ===== */
.toggle {
  width: 44px;
  height: 26px;
  border-radius: 999px;
  background: #d4d0e8;
  position: relative;
  flex-shrink: 0;
  transition: background 0.25s;
}

.toggle.on {
  background: var(--set-purple);
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(74, 69, 128, 0.2);
  transition: transform 0.25s;
}

.toggle.on .toggle-thumb {
  transform: translateX(18px);
}

/* ===== 退出登录 ===== */
.logout-btn {
  display: block;
  width: 100%;
  padding: 15px;
  border-radius: 999px;
  background: linear-gradient(90deg, #8b5cf6 0%, #9f7aea 50%, #a78bfa 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  box-shadow: 0 8px 28px rgba(139, 92, 246, 0.38);
}

.logout-btn:active {
  transform: scale(0.98);
}

/* ===== Toast ===== */
.toast {
  position: fixed;
  left: 50%;
  bottom: calc(40px + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  padding: 10px 22px;
  background: rgba(74, 69, 128, 0.92);
  color: #fff;
  font-size: 13px;
  border-radius: 999px;
  z-index: 200;
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

@media (max-width: 380px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }

  .row-label {
    font-size: 13px;
  }

  .setting-row {
    padding: 10px 2px;
    min-height: 38px;
  }
}
</style>
