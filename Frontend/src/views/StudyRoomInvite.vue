<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api'
import { avatarUrl } from '../utils/avatar'

const route = useRoute()
const router = useRouter()

const mode = computed(() => (route.query.mode === 'video' ? 'video' : 'voice'))
const loading = ref(true)
const acting = ref(false)
const page = ref(null)
const showRecords = ref(false)
const records = ref([])
const toast = ref('')

const progressPercent = computed(() => {
  if (!page.value?.rewardProgress) return 0
  const count = page.value.rewardProgress.invitedCount || 0
  if (count >= 5) return 100
  if (count >= 3) return 66
  if (count >= 1) return 33
  return 0
})

function showToast(msg) {
  toast.value = msg
  window.clearTimeout(showToast._t)
  showToast._t = window.setTimeout(() => {
    toast.value = ''
  }, 2200)
}

async function loadPage() {
  loading.value = true
  try {
    page.value = await api.getStudyRoomInvite(mode.value)
  } catch (err) {
    showToast(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function loadRecords() {
  try {
    const data = await api.getStudyRoomInviteRecords()
    records.value = data.records || []
  } catch {
    records.value = []
  }
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

async function runAction(action, extra = {}) {
  if (acting.value) return
  acting.value = true
  try {
    const data = await api.studyRoomInviteAction({ action, mode: mode.value, ...extra })
    if (action === 'copy-code') {
      await copyText(data.inviteCode, data.message || '邀请码已复制')
    } else if (action.startsWith('share-')) {
      await copyText(data.inviteLink || page.value?.room?.inviteLink, data.message || '已复制分享内容')
    } else if (action === 'share-room') {
      await copyText(data.shareText, data.message || '房间信息已复制')
    } else if (action === 'invite-now') {
      await copyText(data.inviteLink, data.message || '邀请链接已复制')
    } else {
      showToast(data.message || '操作成功')
      await loadPage()
    }
  } catch (err) {
    showToast(err.message || '操作失败')
  } finally {
    acting.value = false
  }
}

function onShare(key) {
  const map = {
    wechat: 'share-wechat',
    qq: 'share-qq',
    link: 'share-link',
    qrcode: 'share-qrcode',
  }
  runAction(map[key] || 'share-link')
}

async function openRecords() {
  showRecords.value = true
  await loadRecords()
}

function channelLabel(channel) {
  const map = {
    buddy: '好友邀请',
    wechat: '微信',
    qq: 'QQ',
    link: '链接',
    qrcode: '二维码',
    now: '立即邀请',
  }
  return map[channel] || '邀请'
}

onMounted(loadPage)
</script>

<template>
  <div class="invite-page page">
    <div class="invite-bg" aria-hidden="true">
      <img src="/邀请好友.png" alt="" class="invite-bg-img">
    </div>

    <header class="invite-header">
      <button type="button" class="nav-btn" aria-label="返回" @click="router.back()">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <h1>{{ showRecords ? '邀请记录' : '邀请好友' }}</h1>
      <button
        v-if="!showRecords"
        type="button"
        class="nav-link"
        @click="openRecords"
      >
        邀请记录
      </button>
      <button
        v-else
        type="button"
        class="nav-link"
        @click="showRecords = false"
      >
        返回
      </button>
    </header>

    <main class="invite-scroll">
      <div v-if="loading" class="loading-box">加载中...</div>

      <template v-else-if="page && !showRecords">
      <section class="hero-section">
        <h2 class="hero-title">{{ page.heroTitle }}</h2>
        <p class="hero-badge">{{ page.heroSubtitle }}</p>
      </section>

      <section class="card code-card">
        <div class="code-row">
          <span class="code-label">我的邀请码</span>
          <strong class="code-value">{{ page.inviteCode }}</strong>
          <button type="button" class="copy-pill" :disabled="acting" @click="runAction('copy-code')">
            复制
          </button>
        </div>
        <div class="room-row">
          <span>房间名称：{{ page.room.name }}</span>
          <span class="room-no">房间号：{{ page.room.displayNumber }}</span>
          <button type="button" class="share-room-link" :disabled="acting" @click="runAction('share-room')">
            分享房间 >
          </button>
        </div>
      </section>

      <section class="card">
        <h3 class="card-title">分享方式</h3>
        <div class="share-grid">
          <button
            v-for="item in page.shareMethods"
            :key="item.key"
            type="button"
            class="share-item"
            :disabled="acting"
            @click="onShare(item.key)"
          >
            <span class="share-icon" :class="item.key">
              <font-awesome-icon
                :icon="item.key === 'wechat' ? 'comment' : item.key === 'qq' ? 'user' : item.key === 'link' ? 'link' : 'qrcode'"
              />
            </span>
            <span class="share-label">{{ item.label }}</span>
          </button>
        </div>
      </section>

      <section class="card">
        <div class="card-head">
          <h3 class="card-title">邀请奖励进度</h3>
          <button type="button" class="rules-link">
            <font-awesome-icon icon="circle-question" />
            规则说明
          </button>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${progressPercent}%` }" />
          <div class="milestones">
            <div
              v-for="item in page.rewardProgress.milestones"
              :key="item.target"
              class="milestone"
              :class="{ reached: item.reached }"
            >
              <span class="milestone-icon">
                <font-awesome-icon :icon="item.icon === 'star' ? 'star' : item.icon === 'gift' ? 'gift' : 'box-open'" />
              </span>
              <span class="milestone-target">{{ item.label }}</span>
              <span class="milestone-reward">+{{ item.reward }} 星光</span>
            </div>
          </div>
        </div>
        <p class="rules-tip">{{ page.rewardProgress.rulesSummary }}</p>
      </section>

      <section class="card">
        <h3 class="card-title">推荐邀请好友</h3>
        <ul class="friend-list">
          <li v-for="friend in page.recommendedFriends" :key="friend.id" class="friend-row">
            <img :src="avatarUrl(friend.seed)" :alt="friend.name" class="friend-avatar">
            <div class="friend-info">
              <strong>{{ friend.name }}</strong>
              <span>{{ friend.message }}</span>
            </div>
            <button
              type="button"
              class="invite-pill"
              :disabled="acting"
              @click="runAction('invite-friend', { buddyId: friend.id })"
            >
              邀请
            </button>
          </li>
        </ul>
      </section>
      </template>

      <section v-else-if="!loading && showRecords" class="records-panel">
        <div v-if="!records.length" class="empty-records">暂无邀请记录</div>
        <ul v-else class="record-list">
          <li v-for="item in records" :key="item.id" class="record-row">
            <div>
              <strong>{{ item.name }}</strong>
              <span>{{ channelLabel(item.channel) }} · {{ item.createdAt }}</span>
            </div>
            <span class="record-reward">+{{ item.rewardStars }} 星光</span>
          </li>
        </ul>
      </section>
    </main>

    <footer v-if="page && !showRecords && !loading" class="invite-footer">
      <button type="button" class="invite-now-btn" :disabled="acting" @click="runAction('invite-now')">
        <span class="spark">✦</span>
        立即邀请
        <span class="spark">✦</span>
      </button>
    </footer>

    <Transition name="toast-fade">
      <p v-if="toast" class="toast">{{ toast }}</p>
    </Transition>
  </div>
</template>

<style scoped>
.invite-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #7c6bcf;
  position: relative;
  overflow: hidden;
}

.invite-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  position: relative;
  z-index: 1;
  padding-bottom: calc(108px + env(safe-area-inset-bottom, 0px));
}

.invite-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.invite-bg-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
}

.invite-header {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 40px 1fr auto;
  align-items: center;
  padding: 14px 16px 8px;
  color: #fff;
}

.invite-header h1 {
  text-align: center;
  font-size: 17px;
  font-weight: 800;
}

.nav-btn {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  font-size: 14px;
}

.nav-link {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
  white-space: nowrap;
}

.loading-box,
.empty-records {
  text-align: center;
  padding: 48px 0;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
}

.hero-section {
  position: relative;
  z-index: 1;
  text-align: left;
  padding: 8px 20px 16px;
  min-height: 168px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  max-width: 62%;
}

.hero-title {
  font-size: 24px;
  font-weight: 900;
  color: #fff;
  line-height: 1.35;
  text-shadow: 0 2px 12px rgba(76, 48, 160, 0.28);
}

.hero-badge {
  display: inline-block;
  align-self: flex-start;
  margin-top: 10px;
  padding: 7px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.28);
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.card {
  position: relative;
  z-index: 1;
  margin: 12px 16px 0;
  padding: 16px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 8px 28px rgba(88, 70, 160, 0.14);
}

.code-card {
  padding-top: 16px;
}

.code-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
}

.code-label {
  font-size: 13px;
  color: #7c6bcf;
  font-weight: 600;
}

.code-value {
  text-align: center;
  font-size: 22px;
  font-weight: 900;
  color: #43308b;
  letter-spacing: 1px;
}

.copy-pill {
  padding: 7px 14px;
  border-radius: 999px;
  background: linear-gradient(90deg, #8b5cf6, #7c3aed);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.room-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(124, 107, 207, 0.12);
  font-size: 12px;
  color: #6b7280;
}

.room-no {
  flex: 1;
}

.share-room-link {
  margin-left: auto;
  font-size: 12px;
  font-weight: 700;
  color: #7c3aed;
}

.card-title {
  font-size: 15px;
  font-weight: 800;
  color: #43308b;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.rules-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #9ca3af;
}

.share-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 14px;
}

.share-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.share-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 20px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 4px 14px rgba(88, 70, 160, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.85);
}

.share-icon.wechat { color: #22c55e; }
.share-icon.qq { color: #3b82f6; }
.share-icon.link { color: #6366f1; }
.share-icon.qrcode { color: #8b5cf6; }

.share-label {
  font-size: 11px;
  color: #6b7280;
  font-weight: 600;
}

.progress-track {
  position: relative;
  margin-top: 18px;
  padding-top: 8px;
}

.progress-track::before {
  content: '';
  position: absolute;
  left: 8%;
  right: 8%;
  top: 28px;
  height: 3px;
  background: repeating-linear-gradient(
    90deg,
    #d8b4fe 0,
    #d8b4fe 6px,
    transparent 6px,
    transparent 12px
  );
  border-radius: 999px;
}

.progress-fill {
  position: absolute;
  left: 8%;
  top: 28px;
  height: 3px;
  background: linear-gradient(90deg, #a855f7, #ec4899);
  border-radius: 999px;
  transition: width 0.35s ease;
}

.milestones {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.milestone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
}

.milestone-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(237, 233, 254, 0.95);
  color: #a78bfa;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(88, 70, 160, 0.08);
}

.milestone.reached .milestone-icon {
  background: linear-gradient(145deg, #fde68a, #fbbf24);
  color: #fff;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.35);
}

.milestone:nth-child(2) .milestone-icon {
  color: #8b5cf6;
}

.milestone:nth-child(3) .milestone-icon {
  color: #7c3aed;
}

.milestone-target {
  font-size: 11px;
  font-weight: 700;
  color: #43308b;
}

.milestone-reward {
  font-size: 10px;
  color: #8b5cf6;
  font-weight: 600;
}

.rules-tip {
  margin-top: 12px;
  font-size: 11px;
  line-height: 1.55;
  color: #9ca3af;
}

.friend-list {
  list-style: none;
  margin-top: 12px;
}

.friend-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(124, 107, 207, 0.1);
}

.friend-row:last-child {
  border-bottom: none;
}

.friend-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(88, 70, 160, 0.12);
}

.friend-info {
  flex: 1;
  min-width: 0;
}

.friend-info strong {
  display: block;
  font-size: 13px;
  font-weight: 800;
  color: #43308b;
}

.friend-info span {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invite-pill {
  padding: 7px 14px;
  border-radius: 999px;
  background: linear-gradient(90deg, #8b5cf6, #7c3aed);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.records-panel {
  position: relative;
  z-index: 1;
  margin: 12px 16px 24px;
  padding: 8px 0;
}

.record-list {
  list-style: none;
}

.record-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  margin-bottom: 10px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.88);
}

.record-row strong {
  display: block;
  font-size: 14px;
  color: #43308b;
}

.record-row span {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #9ca3af;
}

.record-reward {
  font-size: 13px !important;
  font-weight: 700;
  color: #8b5cf6 !important;
  margin-top: 0 !important;
  white-space: nowrap;
}

.invite-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(180deg, transparent, rgba(124, 108, 207, 0.72) 36%);
  pointer-events: none;
}

.invite-now-btn {
  pointer-events: auto;
  width: 100%;
  padding: 16px;
  border-radius: 999px;
  background: linear-gradient(90deg, #a855f7 0%, #ec4899 100%);
  color: #fff;
  font-size: 17px;
  font-weight: 800;
  box-shadow: 0 10px 28px rgba(168, 85, 247, 0.38);
}

.invite-now-btn .spark {
  color: #fde68a;
  font-size: 12px;
  margin: 0 8px;
}

.toast {
  position: absolute;
  left: 50%;
  bottom: calc(96px + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  z-index: 30;
  padding: 10px 18px;
  border-radius: 999px;
  background: rgba(30, 20, 60, 0.88);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
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
