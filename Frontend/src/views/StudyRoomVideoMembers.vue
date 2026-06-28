<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { avatarUrl } from '../utils/avatar'

const router = useRouter()

const members = ref([])
const onlineCount = ref(0)
const total = ref(0)
const page = ref(1)
const pageSize = 24
const hasMore = ref(true)
const loading = ref(false)
const loadingMore = ref(false)
const keyword = ref('')
const roomName = ref('星光自习室')
let searchTimer = null

const loadedLabel = computed(() => {
  if (!total.value) return '加载中…'
  return `已加载 ${members.value.length} / ${total.value} 人`
})

function focusColor(score) {
  if (score >= 85) return '#6ee7b7'
  if (score >= 70) return '#a5b4fc'
  if (score >= 55) return '#fde68a'
  return '#fca5a5'
}

async function fetchMembers(reset = false) {
  if (reset) {
    page.value = 1
    hasMore.value = true
    members.value = []
  }
  if (!hasMore.value && !reset) return

  const isFirst = page.value === 1
  if (isFirst) loading.value = true
  else loadingMore.value = true

  try {
    const data = await api.getVideoRoomMembers({
      page: page.value,
      pageSize,
      q: keyword.value.trim(),
    })
    roomName.value = data.roomName || '星光自习室'
    onlineCount.value = data.onlineCount || 0
    total.value = data.total || 0
    hasMore.value = Boolean(data.hasMore)

    if (reset) {
      members.value = data.members || []
    } else {
      members.value = [...members.value, ...(data.members || [])]
    }
  } catch (err) {
    if (isFirst) members.value = []
    window.alert(err.message || '加载失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function onSearchInput() {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => fetchMembers(true), 320)
}

function loadMore() {
  if (loading.value || loadingMore.value || !hasMore.value) return
  page.value += 1
  fetchMembers(false)
}

function onScroll(e) {
  const el = e.target
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
    loadMore()
  }
}

function goBack() {
  router.back()
}

onMounted(() => fetchMembers(true))

onBeforeUnmount(() => {
  window.clearTimeout(searchTimer)
})
</script>

<template>
  <div class="members-page page">
    <div class="sky-bg" aria-hidden="true">
      <span v-for="n in 12" :key="n" class="star" :class="`s${n}`" />
    </div>

    <header class="top-bar">
      <button type="button" class="back-btn" aria-label="返回" @click="goBack">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <div class="title-block">
        <h1>更多同学</h1>
        <p>{{ roomName }} · {{ onlineCount }} 人在线</p>
      </div>
    </header>

    <div class="search-wrap">
      <font-awesome-icon icon="search" class="search-icon" />
      <input
        v-model="keyword"
        type="search"
        class="search-input"
        placeholder="搜索昵称"
        @input="onSearchInput"
      >
    </div>

    <p class="meta-line">{{ loadedLabel }}</p>

    <div v-if="loading" class="loading-box">加载中…</div>

    <div v-else class="member-scroll" @scroll="onScroll">
      <div v-if="!members.length" class="empty-box">暂无匹配的同学</div>

      <div v-else class="member-grid">
        <article v-for="m in members" :key="m.id" class="member-card">
          <div class="avatar-wrap">
            <img :src="avatarUrl(m.seed, m.avatarUrl)" :alt="m.name" class="avatar">
            <span v-if="m.focusScore" class="focus-badge" :style="{ color: focusColor(m.focusScore) }">
              {{ m.focusScore }}
            </span>
          </div>
          <p class="member-name">{{ m.name }}</p>
          <div class="member-meta">
            <span class="focus-time">{{ m.focusLabel }}</span>
            <span class="status-icons">
              <font-awesome-icon
                :icon="m.micOn ? 'microphone' : 'microphone-slash'"
                :class="{ off: !m.micOn }"
              />
              <font-awesome-icon
                :icon="m.cameraOn ? 'video' : 'video-slash'"
                :class="{ off: !m.cameraOn }"
              />
            </span>
          </div>
        </article>
      </div>

      <p v-if="loadingMore" class="load-more-tip">加载更多…</p>
      <p v-else-if="!hasMore && members.length" class="load-more-tip end">已显示全部同学</p>
    </div>
  </div>
</template>

<style scoped>
.members-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(165deg, #0f172a 0%, #1e1b4b 40%, #312e81 100%);
  color: #e0e7ff;
  position: relative;
  overflow: hidden;
}

.sky-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.star {
  position: absolute;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.65);
  animation: twinkle 3s ease-in-out infinite;
}

.s1 { top: 8%; left: 12%; }
.s2 { top: 15%; right: 18%; animation-delay: 0.5s; width: 3px; height: 3px; }
.s3 { top: 28%; left: 35%; animation-delay: 1s; opacity: 0.5; }
.s4 { top: 42%; right: 8%; animation-delay: 0.3s; }
.s5 { bottom: 40%; left: 20%; animation-delay: 1.5s; }
.s6 { bottom: 25%; right: 25%; animation-delay: 0.8s; }
.s7 { top: 55%; left: 8%; animation-delay: 2s; opacity: 0.4; }
.s8 { top: 22%; right: 42%; animation-delay: 1.2s; }
.s9 { bottom: 55%; right: 12%; animation-delay: 0.6s; }
.s10 { top: 38%; left: 55%; animation-delay: 1.8s; }
.s11 { bottom: 15%; left: 45%; animation-delay: 2.2s; }
.s12 { top: 12%; left: 68%; animation-delay: 0.9s; opacity: 0.6; }

@keyframes twinkle {
  0%, 100% { opacity: 0.25; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.5); }
}

.top-bar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px 8px;
}

.back-btn {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #e0e7ff;
  display: grid;
  place-items: center;
}

.title-block h1 {
  font-size: 18px;
  font-weight: 800;
  margin: 0;
}

.title-block p {
  margin: 2px 0 0;
  font-size: 11px;
  color: #a5b4fc;
}

.search-wrap {
  position: relative;
  z-index: 2;
  margin: 0 16px 8px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #818cf8;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 34px;
  border-radius: 14px;
  border: 1px solid rgba(129, 140, 248, 0.25);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  color: #e0e7ff;
  font-size: 13px;
  outline: none;
}

.search-input::placeholder {
  color: #818cf8;
}

.meta-line {
  position: relative;
  z-index: 2;
  margin: 0 16px 10px;
  font-size: 10px;
  color: #818cf8;
}

.loading-box,
.empty-box {
  flex: 1;
  display: grid;
  place-items: center;
  color: #a5b4fc;
  font-size: 13px;
}

.member-scroll {
  position: relative;
  z-index: 2;
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 24px;
  -webkit-overflow-scrolling: touch;
}

.member-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.member-card {
  padding: 10px 8px 8px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  text-align: center;
}

.avatar-wrap {
  position: relative;
  width: 64px;
  height: 64px;
  margin: 0 auto 6px;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 14px;
  object-fit: cover;
  background: rgba(129, 140, 248, 0.2);
}

.focus-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 22px;
  padding: 2px 4px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.15);
  font-size: 9px;
  font-weight: 800;
  line-height: 1.2;
}

.member-name {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 700;
  color: #e0e7ff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  font-size: 9px;
  color: #a5b4fc;
}

.focus-time {
  font-variant-numeric: tabular-nums;
}

.status-icons {
  display: flex;
  gap: 4px;
  font-size: 8px;
}

.status-icons .off {
  color: #fca5a5;
  opacity: 0.85;
}

.load-more-tip {
  text-align: center;
  padding: 14px 0 4px;
  font-size: 11px;
  color: #818cf8;
}

.load-more-tip.end {
  opacity: 0.7;
}
</style>
