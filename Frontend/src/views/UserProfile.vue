<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { api } from '../api'
import { avatarUrl } from '../utils/avatar'
import ProfileEditSheet from '../components/ProfileEditSheet.vue'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const saving = ref(false)
const toast = ref('')
const form = ref(null)

const sheetOpen = ref(false)
const sheetConfig = ref({
  title: '',
  type: 'text',
  key: '',
  value: '',
  placeholder: '',
  maxLength: 0,
})

const GENDER_LABELS = { female: '女', male: '男', other: '保密' }

function showToast(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 2000)
}

async function loadProfile() {
  loading.value = true
  try {
    form.value = await api.getProfile()
  } catch (err) {
    showToast(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const signatureCount = computed(() => form.value?.signature?.length || 0)

async function saveProfile() {
  if (!form.value || saving.value) return
  saving.value = true
  try {
    const data = await api.updateProfile({
      nickname: form.value.nickname,
      avatarSeed: form.value.avatarSeed,
      avatarUrl: form.value.avatarUrl || '',
      birthday: form.value.birthday,
      gender: form.value.gender,
      region: form.value.region,
      studyGoal: form.value.studyGoal,
      interests: form.value.interests,
      focusPreference: form.value.focusPreference,
      signature: form.value.signature,
    })
    form.value = data
    userStore.name = data.nickname
    userStore.avatarSeed = data.avatarSeed
    userStore.avatarUrl = data.avatarUrl || ''
    showToast('资料已保存')
  } catch (err) {
    showToast(err.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function copyUserId() {
  if (!form.value?.userIdMasked) return
  navigator.clipboard?.writeText(form.value.userIdMasked)
    .then(() => showToast('ID 已复制'))
    .catch(() => showToast(form.value.userIdMasked))
}

function openSheet({ title, type, key, value, placeholder = '', maxLength = 0 }) {
  sheetConfig.value = { title, type, key, value, placeholder, maxLength }
  sheetOpen.value = true
}

function openTextField(label, key) {
  openSheet({
    title: `修改${label}`,
    type: 'text',
    key,
    value: form.value[key],
    placeholder: `请输入${label}`,
    maxLength: key === 'nickname' ? 20 : key === 'interests' ? 200 : 100,
  })
}

function openBirthday() {
  openSheet({
    title: '修改生日',
    type: 'date',
    key: 'birthday',
    value: form.value.birthday,
  })
}

function openGender() {
  openSheet({
    title: '选择性别',
    type: 'gender',
    key: 'gender',
    value: form.value.gender,
  })
}

function openFocus() {
  openSheet({
    title: '专注时长偏好',
    type: 'focus',
    key: 'focusPreference',
    value: form.value.focusPreference,
  })
}

function openAvatarPicker() {
  openSheet({
    title: '选择头像',
    type: 'avatar',
    key: 'avatarSeed',
    value: form.value.avatarSeed,
  })
}

function onSheetConfirm(val) {
  const { key, type } = sheetConfig.value
  if (type === 'gender') {
    form.value.gender = val
    form.value.genderLabel = GENDER_LABELS[val]
  } else if (type === 'focus') {
    form.value.focusPreference = val
    form.value.focusPreferenceLabel = `${val} 分钟`
  } else if (type === 'avatar') {
    if (val && typeof val === 'object' && val.kind === 'local') {
      form.value.avatarUrl = val.url
      showToast('相册头像已更新，记得保存')
    } else if (val && typeof val === 'object' && val.kind === 'preset') {
      form.value.avatarSeed = val.seed
      form.value.avatarUrl = ''
      showToast('头像已更新，记得保存')
    } else {
      form.value.avatarSeed = val
      form.value.avatarUrl = ''
      showToast('头像已更新，记得保存')
    }
  } else {
    form.value[key] = String(val).trim()
  }
}

onMounted(loadProfile)
</script>

<template>
  <div class="user-profile page">
    <div class="hero-bg">
      <div class="hero-gradient" />
      <div class="hero-clouds" />
      <div class="hero-stars" />
      <div class="hero-planet" />
    </div>

    <header class="profile-header">
      <button type="button" class="back-btn" @click="router.back()">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <h1 class="header-title">个人资料</h1>
      <div class="header-spacer" />
    </header>

    <div v-if="loading" class="loading-tip">加载中...</div>

    <div v-else-if="form" class="profile-body">
      <section class="hero-card glass-card">
        <div class="hero-avatar-wrap">
          <img :src="avatarUrl(form.avatarSeed, form.avatarUrl)" alt="avatar" class="hero-avatar">
          <button type="button" class="camera-btn" aria-label="更换头像" @click="openAvatarPicker">
            <font-awesome-icon icon="camera" />
          </button>
        </div>
        <div class="hero-info">
          <div class="name-row">
            <span class="hero-name">{{ form.nickname }}</span>
            <button type="button" class="icon-btn" @click="openTextField('昵称', 'nickname')">
              <font-awesome-icon icon="pen" />
            </button>
          </div>
          <span class="level-badge">Lv.{{ form.level }}</span>
          <div class="id-row">
            <span>ID: {{ form.userIdMasked }}</span>
            <button type="button" class="icon-btn" @click="copyUserId">
              <font-awesome-icon icon="copy" />
            </button>
          </div>
          <p class="pet-line">当前宠物：{{ form.petName }}</p>
        </div>
        <font-awesome-icon icon="chevron-right" class="hero-arrow" />
      </section>

      <section class="info-block">
        <h2 class="block-title"><span class="dot" />基础信息</h2>
        <div class="info-card glass-card">
          <button type="button" class="info-row" @click="openTextField('昵称', 'nickname')">
            <font-awesome-icon icon="user" class="row-icon" />
            <span class="row-label">昵称</span>
            <span class="row-value">{{ form.nickname }}</span>
            <font-awesome-icon icon="chevron-right" class="row-arrow" />
          </button>
          <button type="button" class="info-row" @click="openBirthday">
            <font-awesome-icon icon="calendar-check" class="row-icon" />
            <span class="row-label">生日</span>
            <span class="row-value">{{ form.birthday }}</span>
            <font-awesome-icon icon="chevron-right" class="row-arrow" />
          </button>
          <button type="button" class="info-row" @click="openGender">
            <font-awesome-icon icon="user" class="row-icon" />
            <span class="row-label">性别</span>
            <span class="row-value">{{ form.genderLabel }}</span>
            <font-awesome-icon icon="chevron-right" class="row-arrow" />
          </button>
          <button type="button" class="info-row no-border" @click="openTextField('所在地区', 'region')">
            <font-awesome-icon icon="location-dot" class="row-icon" />
            <span class="row-label">所在地区</span>
            <span class="row-value">{{ form.region }}</span>
            <font-awesome-icon icon="chevron-right" class="row-arrow" />
          </button>
        </div>
      </section>

      <section class="info-block">
        <h2 class="block-title"><span class="dot" />学习信息</h2>
        <div class="info-card glass-card">
          <button type="button" class="info-row" @click="openTextField('学习目标', 'studyGoal')">
            <font-awesome-icon icon="book-open-reader" class="row-icon" />
            <span class="row-label">学习目标</span>
            <span class="row-value">{{ form.studyGoal }}</span>
            <font-awesome-icon icon="chevron-right" class="row-arrow" />
          </button>
          <button type="button" class="info-row" @click="openTextField('感兴趣领域', 'interests')">
            <font-awesome-icon icon="brain" class="row-icon" />
            <span class="row-label">感兴趣领域</span>
            <span class="row-value">{{ form.interests }}</span>
            <font-awesome-icon icon="chevron-right" class="row-arrow" />
          </button>
          <button type="button" class="info-row no-border" @click="openFocus">
            <font-awesome-icon icon="clock" class="row-icon" />
            <span class="row-label">专注时长偏好</span>
            <span class="row-value">{{ form.focusPreferenceLabel }}</span>
            <font-awesome-icon icon="chevron-right" class="row-arrow" />
          </button>
        </div>
      </section>

      <section class="info-block">
        <h2 class="block-title"><span class="dot" />个性签名</h2>
        <div class="signature-card glass-card">
          <textarea
            v-model="form.signature"
            class="signature-input"
            maxlength="60"
            rows="3"
            placeholder="写一句属于自己的学习宣言吧"
          />
          <div class="signature-meta">
            <font-awesome-icon icon="pen" class="sig-icon" />
            <span>{{ signatureCount }}/60</span>
          </div>
        </div>
      </section>
    </div>

    <footer v-if="form" class="save-footer">
      <button type="button" class="save-btn" :disabled="saving" @click="saveProfile">
        {{ saving ? '保存中…' : '保存修改' }}
      </button>
    </footer>

    <ProfileEditSheet
      v-model="sheetOpen"
      :title="sheetConfig.title"
      :type="sheetConfig.type"
      :value="sheetConfig.value"
      :custom-avatar-url="form?.avatarUrl || ''"
      :placeholder="sheetConfig.placeholder"
      :max-length="sheetConfig.maxLength"
      @confirm="onSheetConfirm"
    />

    <Transition name="fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.user-profile.page {
  --up-primary: #4a4580;
  --up-secondary: #8e8ebc;
  --up-purple: #8b5cf6;
  --up-glass: rgba(255, 255, 255, 0.82);
  --up-glass-border: rgba(255, 255, 255, 0.62);
  background: #e0e7ff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #5d5fef 0%, #9498f8 35%, #c7d2fe 62%, #e0e7ff 100%);
}

.hero-clouds {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 100% 35% at 50% 100%, rgba(255,255,255,0.5) 0%, transparent 68%),
    radial-gradient(ellipse 55% 25% at 10% 85%, rgba(255,255,255,0.28) 0%, transparent 60%),
    radial-gradient(ellipse 50% 22% at 90% 88%, rgba(255,255,255,0.22) 0%, transparent 58%);
}

.hero-stars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background-image:
    radial-gradient(2px 2px at 15% 18%, rgba(255,255,255,0.95) 0%, transparent 100%),
    radial-gradient(1px 1px at 42% 12%, rgba(255,255,255,0.7) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 68% 20%, rgba(255,255,255,0.8) 0%, transparent 100%),
    radial-gradient(1px 1px at 85% 28%, rgba(255,255,255,0.55) 0%, transparent 100%);
}

.hero-planet {
  position: absolute;
  top: 8%;
  right: 8%;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(145deg, #c4b5fd, #8b5cf6);
  box-shadow: inset -6px -4px 12px rgba(0,0,0,0.12);
}

.hero-planet::after {
  content: '';
  position: absolute;
  top: 50%;
  left: -8px;
  width: 64px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.45);
  border-radius: 50%;
  transform: translateY(-50%) rotate(-18deg);
}

.profile-header {
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
}

.header-spacer {
  width: 36px;
}

.loading-tip {
  flex: 1;
  display: grid;
  place-items: center;
  color: rgba(255,255,255,0.9);
  font-size: 14px;
}

.profile-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 16px 100px;
  position: relative;
  z-index: 5;
}

.glass-card {
  background: var(--up-glass);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid var(--up-glass-border);
  box-shadow: 0 8px 28px rgba(93, 95, 239, 0.1);
}

.hero-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 22px;
  margin-bottom: 18px;
}

.hero-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.hero-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255,255,255,0.85);
  box-shadow: 0 4px 14px rgba(123, 66, 246, 0.2);
}

.camera-btn {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a78bfa, #8b5cf6);
  color: #fff;
  font-size: 11px;
  display: grid;
  place-items: center;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
}

.hero-info {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.hero-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--up-primary);
}

.icon-btn {
  color: var(--up-secondary);
  font-size: 12px;
  padding: 4px;
}

.level-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #a78bfa, #8b5cf6);
  padding: 3px 9px;
  border-radius: 999px;
  margin-bottom: 6px;
}

.id-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--up-secondary);
  margin-bottom: 4px;
}

.pet-line {
  font-size: 12px;
  color: var(--up-secondary);
}

.hero-arrow {
  font-size: 11px;
  color: var(--up-secondary);
  flex-shrink: 0;
}

.info-block {
  margin-bottom: 16px;
}

.block-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--up-primary);
  margin-bottom: 10px;
  padding-left: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a78bfa, #8b5cf6);
}

.info-card {
  border-radius: 20px;
  padding: 4px 0;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid rgba(142, 142, 188, 0.12);
}

.info-row.no-border {
  border-bottom: none;
}

.row-icon {
  width: 18px;
  font-size: 14px;
  color: var(--up-purple);
  flex-shrink: 0;
}

.row-label {
  font-size: 14px;
  color: var(--up-primary);
  flex-shrink: 0;
}

.row-value {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: var(--up-secondary);
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-arrow {
  font-size: 10px;
  color: #c4c0dc;
  flex-shrink: 0;
}

.signature-card {
  border-radius: 20px;
  padding: 16px;
  position: relative;
}

.signature-input {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  font: inherit;
  font-size: 14px;
  line-height: 1.6;
  color: var(--up-primary);
}

.signature-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--up-secondary);
}

.sig-icon {
  font-size: 11px;
}

.save-footer {
  flex-shrink: 0;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(180deg, rgba(224, 231, 255, 0) 0%, rgba(224, 231, 255, 0.95) 35%, #e0e7ff 100%);
  position: relative;
  z-index: 10;
}

.save-btn {
  width: 100%;
  padding: 15px;
  border-radius: 999px;
  background: linear-gradient(90deg, #8b5cf6 0%, #7c3aed 50%, #6366f1 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 8px 28px rgba(139, 92, 246, 0.38);
}

.save-btn:disabled {
  opacity: 0.7;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: calc(100px + env(safe-area-inset-bottom, 0px));
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
</style>
