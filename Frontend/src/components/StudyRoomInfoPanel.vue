<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { avatarUrl } from '../utils/avatar'
import bannerFox from '../assets/home-fox-island.png'

const props = defineProps({
  mode: { type: String, default: 'voice' },
  initialTab: { type: String, default: 'info' },
})

const emit = defineEmits(['back', 'toast', 'exit', 'invite'])
const router = useRouter()

const loading = ref(true)
const info = ref(null)
const activeTab = ref(props.initialTab)

watch(
  () => props.initialTab,
  (tab) => {
    activeTab.value = tab
  },
)

async function loadInfo() {
  loading.value = true
  try {
    info.value = await api.getStudyRoomInfo(props.mode)
  } catch (err) {
    emit('toast', err.message || '加载失败')
    emit('back')
  } finally {
    loading.value = false
  }
}

onMounted(loadInfo)

async function copyRoomNumber() {
  if (!info.value?.displayNumber) return
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(info.value.displayNumber)
    }
    emit('toast', '房间号已复制')
  } catch {
    emit('toast', '复制失败')
  }
}

function inviteFriends() {
  emit('invite')
  router.push({ path: '/study-room/invite', query: { mode: props.mode } })
}

function exitRoom() {
  emit('exit')
}
</script>

<template>
  <div class="room-info-panel">
    <div v-if="loading" class="info-loading">加载中...</div>

    <template v-else-if="info">
      <div class="tab-switch">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'members' }"
          @click="activeTab = 'members'"
        >
          成员列表
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'info' }"
          @click="activeTab = 'info'"
        >
          房间资料
        </button>
      </div>

      <div v-if="activeTab === 'info'" class="info-scroll">
        <section class="room-banner">
          <div class="banner-stars" aria-hidden="true">✦</div>
          <img :src="bannerFox" alt="" class="banner-fox" aria-hidden="true">
          <div class="banner-text">
            <h3>{{ info.name }}</h3>
            <p>{{ info.slogan }}</p>
          </div>
        </section>

        <section class="info-card">
          <div class="info-row">
            <span class="info-label">在线人数</span>
            <span class="info-value">{{ info.onlineLabel }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">房主信息</span>
            <span class="info-value host-value">
              <img :src="avatarUrl(info.host.seed, info.host.avatarUrl)" alt="" class="host-avatar">
              <span>{{ info.host.name }}</span>
              <span class="host-tag">房主</span>
            </span>
          </div>
          <div class="info-row tags-row">
            <span class="info-label">学习主题</span>
            <span class="tag-list">
              <span v-for="tag in info.tags" :key="tag" class="theme-tag">{{ tag }}</span>
            </span>
          </div>
          <div class="info-row block-row">
            <span class="info-label">房间简介</span>
            <p class="info-block">{{ info.intro }}</p>
          </div>
          <div class="info-row">
            <span class="info-label">入房方式</span>
            <span class="info-value">{{ info.entryLabel }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">房间规则</span>
            <span class="info-value">{{ info.rulesSummary }}</span>
          </div>
        </section>

        <section class="member-card">
          <div class="member-card-head">
            <span class="member-card-title">成员列表 ({{ info.totalMembers }})</span>
            <span class="member-card-meta">专注时长</span>
            <span class="member-card-meta mic-meta">麦克风状态</span>
          </div>
          <ul class="member-preview-list">
            <li v-for="member in info.membersPreview" :key="member.id" class="member-preview-row">
              <img :src="avatarUrl(member.seed, member.avatarUrl)" :alt="member.name" class="member-preview-avatar">
              <div class="member-preview-name">
                {{ member.name }}
                <span v-if="member.isHost" class="host-tag small">房主</span>
              </div>
              <span class="member-preview-time">{{ member.focusLabel || '45:00' }}</span>
              <span class="member-preview-mic" :class="{ off: member.micOn === false }">
                <font-awesome-icon :icon="member.micOn === false ? 'microphone-slash' : 'microphone'" />
              </span>
            </li>
          </ul>
          <button
            v-if="info.hasMoreMembers"
            type="button"
            class="more-members-btn"
            @click="activeTab = 'members'"
          >
            查看更多成员 >
          </button>
        </section>
      </div>

      <div v-else class="info-scroll">
        <section class="member-card full-list">
          <div class="member-card-head">
            <span class="member-card-title">成员列表 ({{ info.totalMembers }})</span>
            <span class="member-card-meta">专注时长</span>
            <span class="member-card-meta mic-meta">麦克风状态</span>
          </div>
          <ul class="member-preview-list">
            <li v-for="member in info.members" :key="member.id" class="member-preview-row">
              <img :src="avatarUrl(member.seed, member.avatarUrl)" :alt="member.name" class="member-preview-avatar">
              <div class="member-preview-name">
                {{ member.name }}
                <span v-if="member.isHost" class="host-tag small">房主</span>
              </div>
              <span class="member-preview-time">{{ member.focusLabel || '45:00' }}</span>
              <span class="member-preview-mic" :class="{ off: member.micOn === false }">
                <font-awesome-icon :icon="member.micOn === false ? 'microphone-slash' : 'microphone'" />
              </span>
            </li>
          </ul>
        </section>
      </div>

      <footer class="info-actions">
        <button type="button" class="action-btn invite" @click="inviteFriends">
          邀请好友
        </button>
        <button type="button" class="action-btn copy" @click="copyRoomNumber">
          复制房间号
        </button>
        <button type="button" class="action-btn exit" @click="exitRoom">
          退出房间
        </button>
      </footer>
    </template>
  </div>
</template>

<style scoped>
.room-info-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  color: #fff;
}

.info-loading {
  padding: 48px 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.75);
  font-size: 14px;
}

.tab-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 4px;
  margin-bottom: 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.tab-btn {
  padding: 9px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.72);
}

.tab-btn.active {
  color: #fff;
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
  box-shadow: 0 4px 14px rgba(139, 92, 246, 0.35);
}

.info-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 8px;
}

.room-banner {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  padding: 16px 14px;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 45%, #9333ea 100%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  min-height: 96px;
}

.banner-stars {
  position: absolute;
  left: 12px;
  top: 12px;
  color: #fde68a;
  font-size: 14px;
  opacity: 0.9;
}

.banner-fox {
  position: absolute;
  right: 6px;
  bottom: -4px;
  width: 78px;
  height: auto;
  object-fit: contain;
  pointer-events: none;
}

.banner-text {
  position: relative;
  z-index: 1;
  max-width: 68%;
}

.banner-text h3 {
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 6px;
}

.banner-text p {
  font-size: 12px;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.88);
}

.info-card,
.member-card {
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.65);
  margin-bottom: 12px;
  overflow: hidden;
}

.info-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(124, 107, 207, 0.1);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  flex-shrink: 0;
  font-size: 12px;
  color: #9ca3af;
  min-width: 56px;
}

.info-value {
  text-align: right;
  font-size: 12px;
  font-weight: 600;
  color: #43308b;
  line-height: 1.45;
}

.host-value {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;
}

.host-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid #fff;
}

.host-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 999px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
}

.host-tag.small {
  margin-left: 4px;
  vertical-align: middle;
}

.tags-row {
  flex-direction: column;
  align-items: flex-start;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
  width: 100%;
}

.theme-tag {
  padding: 4px 8px;
  border-radius: 999px;
  background: #ede9fe;
  color: #6d28d9;
  font-size: 10px;
  font-weight: 600;
}

.block-row {
  flex-direction: column;
  align-items: flex-start;
}

.info-block {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.65;
  color: #43308b;
}

.member-card-head {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 8px;
  align-items: center;
  padding: 12px 14px 8px;
  border-bottom: 1px solid rgba(124, 107, 207, 0.1);
}

.member-card-title {
  font-size: 13px;
  font-weight: 800;
  color: #43308b;
}

.member-card-meta {
  font-size: 10px;
  color: #9ca3af;
}

.mic-meta {
  min-width: 52px;
  text-align: center;
}

.member-preview-list {
  list-style: none;
}

.member-preview-row {
  display: grid;
  grid-template-columns: 32px 1fr auto 28px;
  gap: 8px;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(124, 107, 207, 0.08);
}

.member-preview-row:last-child {
  border-bottom: none;
}

.member-preview-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(80, 60, 140, 0.12);
}

.member-preview-name {
  font-size: 12px;
  font-weight: 700;
  color: #43308b;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-preview-time {
  font-size: 11px;
  font-weight: 600;
  color: #7c6bcf;
  font-variant-numeric: tabular-nums;
}

.member-preview-mic {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #dcfce7;
  color: #16a34a;
  font-size: 10px;
}

.member-preview-mic.off {
  background: #f3f4f6;
  color: #9ca3af;
}

.more-members-btn {
  display: block;
  width: 100%;
  padding: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #7c6bcf;
  border-top: 1px solid rgba(124, 107, 207, 0.1);
}

.full-list {
  margin-top: 4px;
}

.info-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding-top: 10px;
  flex-shrink: 0;
}

.action-btn {
  padding: 12px 6px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
}

.action-btn.invite {
  background: linear-gradient(145deg, #8b5cf6, #7c3aed);
}

.action-btn.copy {
  background: linear-gradient(145deg, #3b82f6, #06b6d4);
}

.action-btn.exit {
  background: linear-gradient(145deg, #f87171, #ef4444);
}

.action-btn:disabled {
  opacity: 0.7;
}
</style>
