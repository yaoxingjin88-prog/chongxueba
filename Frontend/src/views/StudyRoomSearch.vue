<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { FontAwesomeIcon } from '../plugins/fontawesome'
import { api } from '../api'
import { useStudyRoomJoin } from '../composables/useStudyRoomJoin'

const router = useRouter()
const {
  joining,
  passwordRoom,
  requestJoin,
  submitPassword,
  cancelPassword,
} = useStudyRoomJoin()
const passwordInput = ref('')

const tabs = [
  { key: 'room', label: '自习室' },
  { key: 'buddy', label: '学习搭子' },
  { key: 'code', label: '房间' },
]

const coverThemes = {
  'english-fox': ['#ffd8b1', '#ffb8c6'],
  'math-cat': ['#c8d8ff', '#a8b4ff'],
  'night-deer': ['#d4c4ff', '#b8a8ff'],
  'code-bear': ['#b8e8ff', '#98c8ff'],
  'japanese-rabbit': ['#ffd4ec', '#ffc4dc'],
}

const keyword = ref('')
const activeTab = ref('room')
const loading = ref(true)
const searching = ref(false)
const recentSearches = ref([])
const hotRooms = ref([])
const buddies = ref([])
const searchRooms = ref([])
const searchBuddies = ref([])
const isSearchMode = ref(false)

let searchTimer = null

function avatarUrl(seed) {
  return `https://api.dicebear.com/7.x/adventurer/png?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`
}

function coverStyle(seed) {
  const colors = coverThemes[seed] || ['#d8c8ff', '#b8a8ff']
  return {
    background: `linear-gradient(145deg, ${colors[0]}, ${colors[1]})`,
  }
}

const displayRooms = computed(() => (isSearchMode.value ? searchRooms.value : hotRooms.value))
const displayBuddies = computed(() => (isSearchMode.value ? searchBuddies.value : buddies.value))
const showRooms = computed(() => activeTab.value !== 'buddy')
const showBuddies = computed(() => activeTab.value !== 'code')

async function loadPage() {
  loading.value = true
  try {
    const data = await api.getStudyRoomSearchPage()
    recentSearches.value = data.recentSearches || []
    hotRooms.value = data.hotRooms || []
    buddies.value = data.buddies || []
  } catch {
    recentSearches.value = [
      { keyword: '英语四六级', searchType: 'room' },
      { keyword: '考研数学', searchType: 'room' },
      { keyword: '晚间自律房', searchType: 'room' },
    ]
    hotRooms.value = []
    buddies.value = []
  } finally {
    loading.value = false
  }
}

async function runSearch() {
  const q = keyword.value.trim()
  if (!q) {
    isSearchMode.value = false
    searchRooms.value = []
    searchBuddies.value = []
    return
  }

  searching.value = true
  isSearchMode.value = true
  try {
    const data = await api.searchStudyRoom(q, activeTab.value)
    searchRooms.value = data.rooms || []
    searchBuddies.value = data.buddies || []
    const historyData = await api.saveStudySearchHistory(q, activeTab.value)
    recentSearches.value = historyData.recentSearches || []
  } catch {
    searchRooms.value = []
    searchBuddies.value = []
  } finally {
    searching.value = false
  }
}

function onInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(runSearch, 320)
}

function onTabChange(key) {
  activeTab.value = key
  if (keyword.value.trim()) runSearch()
}

function onRecentClick(item) {
  keyword.value = item.keyword
  activeTab.value = item.searchType || 'room'
  runSearch()
}

async function clearHistory() {
  try {
    const data = await api.clearStudySearchHistory()
    recentSearches.value = data.recentSearches || []
  } catch {
    recentSearches.value = []
  }
}

async function joinRoom(room) {
  await requestJoin(room)
}

async function confirmPasswordJoin() {
  const pwd = passwordInput.value.trim()
  if (!pwd) return
  await submitPassword(pwd)
  passwordInput.value = ''
}

function closePasswordModal() {
  passwordInput.value = ''
  cancelPassword()
}

async function greetBuddy(buddy) {
  try {
    const data = await api.greetStudyBuddy(buddy.id)
    alert(data.message || `已向「${buddy.name}」打招呼`)
  } catch (err) {
    alert(err.message)
  }
}

async function inviteBuddy(buddy) {
  try {
    const data = await api.inviteStudyBuddy(buddy.id)
    alert(data.message || `已邀请「${buddy.name}」`)
  } catch (err) {
    alert(err.message)
  }
}

function statusLabel(status) {
  return status === 'focusing' ? '正在专注' : '可邀请'
}

watch(keyword, (val) => {
  if (!val.trim()) {
    isSearchMode.value = false
    searchRooms.value = []
    searchBuddies.value = []
  }
})

onMounted(loadPage)
</script>

<template>
  <div class="search-page page">
    <div class="search-bg" aria-hidden="true">
      <div class="bg-gradient" />
      <div class="bg-stars" />
      <div class="bg-glow bg-glow-a" />
      <div class="bg-glow bg-glow-b" />
    </div>

    <div class="search-hero">
      <header class="search-header">
        <button class="back-btn" type="button" aria-label="返回" @click="router.back()">
          <font-awesome-icon icon="chevron-left" />
        </button>
        <h1 class="search-title">搜索自习室</h1>
        <div class="header-spacer" />
      </header>

      <div class="hero-controls">
        <div class="search-bar">
          <font-awesome-icon icon="search" class="search-icon" />
          <input
            v-model="keyword"
            type="search"
            class="search-input"
            placeholder="搜索自习室 / 学习搭子 / 房间号"
            enterkeyhint="search"
            @input="onInput"
            @keyup.enter="runSearch"
          />
        </div>

        <div class="filter-tabs" role="tablist" aria-label="搜索类型">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="filter-tab"
            :class="{ active: activeTab === tab.key }"
            type="button"
            role="tab"
            :aria-selected="activeTab === tab.key"
            @click="onTabChange(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>

    <main class="page-content no-tab">
      <section v-if="recentSearches.length && !isSearchMode" class="recent-section">
        <div class="section-head">
          <h2 class="section-title">最近搜索</h2>
          <button class="clear-btn" type="button" @click="clearHistory">
            <font-awesome-icon icon="trash-can" />
            清空
          </button>
        </div>
        <div class="recent-tags">
          <button
            v-for="item in recentSearches"
            :key="item.keyword"
            class="recent-tag"
            type="button"
            @click="onRecentClick(item)"
          >
            {{ item.keyword }}
          </button>
        </div>
      </section>

      <section v-if="showRooms && displayRooms.length" class="block-section">
        <div class="section-head">
          <h2 class="section-title">{{ isSearchMode ? '搜索结果' : '热门推荐' }}</h2>
        </div>

        <div v-if="loading" class="loading-tip">加载中...</div>
        <div v-else class="room-list">
          <article v-for="room in displayRooms" :key="room.id" class="room-card">
            <div class="room-cover" :style="coverStyle(room.coverSeed)">
              <img :src="avatarUrl(room.coverSeed)" :alt="room.name" />
            </div>
            <div class="room-body">
              <h3 class="room-name">{{ room.name }}</h3>
              <p class="room-subtitle">{{ room.subtitle }}</p>
              <div class="room-stats">
                <span class="stat-item">
                  <font-awesome-icon icon="users" />
                  {{ room.onlineCount }}人在线
                </span>
                <span class="stat-item stat-focus">专注率 {{ room.focusRate }}%</span>
              </div>
              <div class="room-tags">
                <span v-for="tag in room.tags" :key="tag" class="room-tag">{{ tag }}</span>
              </div>
            </div>
            <button class="join-btn" type="button" :disabled="joining" @click="joinRoom(room)">加入</button>
          </article>
        </div>
      </section>

      <section v-if="showBuddies && displayBuddies.length" class="block-section buddy-section">
        <div class="section-head">
          <h2 class="section-title">{{ isSearchMode ? '搭子结果' : '推荐搭子' }}</h2>
          <button v-if="!isSearchMode" class="more-btn" type="button">查看更多 &gt;</button>
        </div>

        <div class="buddy-panel">
          <article
            v-for="(buddy, index) in displayBuddies"
            :key="buddy.id"
            class="buddy-row"
            :class="{ 'has-divider': index < displayBuddies.length - 1 }"
          >
            <div class="buddy-avatar">
              <img :src="avatarUrl(buddy.seed)" :alt="buddy.name" />
            </div>
            <div class="buddy-info">
              <div class="buddy-name-row">
                <span class="buddy-name">{{ buddy.name }}</span>
                <span class="level-badge">Lv.{{ buddy.level }}</span>
              </div>
              <p class="buddy-goal">学习目标：{{ buddy.studyGoal }}</p>
            </div>
            <div class="buddy-status" :class="buddy.status">
              <span class="status-dot" />
              <span class="status-text">{{ statusLabel(buddy.status) }}</span>
            </div>
            <button
              class="buddy-action"
              :class="{ outline: buddy.status === 'available' }"
              type="button"
              @click="buddy.status === 'available' ? inviteBuddy(buddy) : greetBuddy(buddy)"
            >
              {{ buddy.status === 'available' ? '邀请' : '打招呼' }}
            </button>
          </article>
        </div>
      </section>

      <p v-if="isSearchMode && !searching && !displayRooms.length && !displayBuddies.length" class="empty-tip">
        没有找到相关内容，换个关键词试试
      </p>
    </main>

    <div v-if="passwordRoom" class="pwd-overlay mobile-overlay" @click.self="closePasswordModal">
      <div class="pwd-sheet">
        <h3>输入房间密码</h3>
        <p class="pwd-hint">「{{ passwordRoom.name }}」为私密房间</p>
        <input
          v-model="passwordInput"
          type="password"
          class="pwd-input"
          maxlength="8"
          placeholder="4-8 位密码"
          @keyup.enter="confirmPasswordJoin"
        >
        <div class="pwd-actions">
          <button type="button" class="pwd-cancel" @click="closePasswordModal">取消</button>
          <button type="button" class="pwd-confirm" :disabled="joining" @click="confirmPasswordJoin">
            加入
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-page {
  --text-primary: #4a3b8c;
  --text-secondary: #7768a8;
  --text-tertiary: #9585b8;
  --text-action: #5c48b5;
  --text-tag: #5a4898;

  color: var(--text-primary);
  background: #e8e4f6;
}

.search-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    #5346c9 0%,
    #5f52d4 8%,
    #6d5fdd 16%,
    #7d70e8 24%,
    #9488ef 32%,
    #afa6f4 40%,
    #c8c2f7 48%,
    #dad6f9 56%,
    #e8e5f8 64%,
    #f0eefb 76%,
    #f6f5fd 88%,
    #f8f7ff 100%
  );
}

.bg-stars {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 260px;
  opacity: .75;
  background-image:
    radial-gradient(1.5px 1.5px at 12% 18%, rgba(255,255,255,.95) 0%, transparent 100%),
    radial-gradient(1px 1px at 28% 10%, rgba(255,255,255,.85) 0%, transparent 100%),
    radial-gradient(1px 1px at 52% 22%, rgba(255,255,255,.7) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 78% 14%, rgba(255,255,255,.9) 0%, transparent 100%),
    radial-gradient(1px 1px at 90% 28%, rgba(255,255,255,.65) 0%, transparent 100%),
    radial-gradient(1px 1px at 18% 42%, rgba(255,255,255,.55) 0%, transparent 100%),
    radial-gradient(1px 1px at 65% 38%, rgba(255,255,255,.6) 0%, transparent 100%);
}

.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
}

.bg-glow-a {
  top: -60px;
  right: -20px;
  width: 220px;
  height: 220px;
  background: rgba(167, 139, 250, .35);
  opacity: .6;
}

.bg-glow-b {
  top: 80px;
  left: -50px;
  width: 180px;
  height: 180px;
  background: rgba(129, 140, 248, .28);
  opacity: .5;
}

.search-hero {
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}

.search-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(10px + env(safe-area-inset-top, 0px)) 16px 6px;
}

.back-btn {
  display: flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, .18);
  border-radius: 50%;
  background: rgba(255, 255, 255, .16);
  color: rgba(255, 255, 255, .95);
  font-size: 14px;
}

.search-title {
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  text-shadow: 0 1px 8px rgba(30, 20, 80, .18);
}

.header-spacer {
  width: 36px;
}

.hero-controls {
  padding: 0 16px 18px;
}

.page-content {
  position: relative;
  z-index: 5;
  padding: 4px 16px calc(env(safe-area-inset-bottom, 0px) + 20px);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  border: 1px solid rgba(255, 255, 255, .65);
  border-radius: 999px;
  background: rgba(255, 255, 255, .96);
  box-shadow: 0 10px 28px rgba(45, 30, 110, .16);
}

.search-icon {
  flex-shrink: 0;
  color: var(--text-tertiary);
  font-size: 15px;
}

.search-input {
  width: 100%;
  padding: 14px 0;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.search-input::placeholder {
  color: #a898c8;
}

.filter-tabs {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.filter-tab {
  flex: 1;
  padding: 10px 8px;
  border: 1.5px solid transparent;
  border-radius: 999px;
  background: rgba(255, 255, 255, .18);
  color: rgba(255, 255, 255, .88);
  font-size: 13px;
  font-weight: 600;
  transition: all .2s ease;
}

.filter-tab.active {
  border-color: rgba(255, 255, 255, .55);
  background: linear-gradient(135deg, #9f7aea, #7c5fd4);
  box-shadow: 0 6px 20px rgba(45, 25, 110, .28);
  color: #fff;
}

.recent-section,
.block-section {
  margin-top: 18px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 800;
}

.clear-btn,
.more-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 6px;
  border-radius: 8px;
  color: var(--text-action);
  font-size: 13px;
  font-weight: 600;
}

.clear-btn svg {
  font-size: 12px;
  opacity: .92;
}

.recent-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.recent-tag {
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .82);
  color: var(--text-tag);
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 4px 14px rgba(80, 60, 140, .08);
}

.room-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.room-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, .72);
  border-radius: 20px;
  background: rgba(248, 247, 255, .94);
  box-shadow: 0 10px 30px rgba(70, 50, 130, .1);
}

.room-cover {
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 16px;
  box-shadow: 0 4px 14px rgba(70, 50, 130, .12);
}

.room-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.room-body {
  min-width: 0;
  flex: 1;
}

.room-name {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 800;
}

.room-subtitle {
  margin-top: 3px;
  color: var(--text-secondary);
  font-size: 11px;
  line-height: 1.35;
}

.room-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  font-size: 11px;
}

.stat-item svg {
  font-size: 10px;
}

.stat-focus {
  color: #38a169;
  font-weight: 700;
}

.room-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 7px;
}

.room-tag {
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(159, 122, 234, .14);
  color: #6b52c4;
  font-size: 10px;
  font-weight: 600;
}

.join-btn {
  flex-shrink: 0;
  padding: 8px 14px;
  border-radius: 999px;
  background: linear-gradient(135deg, #a78bfa, #7c5fd4);
  box-shadow: 0 6px 18px rgba(100, 70, 180, .32);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.buddy-section {
  margin-top: 24px;
}

.buddy-panel {
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, .72);
  border-radius: 20px;
  background: rgba(248, 247, 255, .94);
  box-shadow: 0 10px 30px rgba(70, 50, 130, .1);
}

.buddy-row {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) 64px auto;
  column-gap: 8px;
  align-items: center;
  padding: 14px 12px;
}

.buddy-row.has-divider {
  border-bottom: 1px solid rgba(120, 96, 180, .1);
}

.buddy-avatar {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, .95);
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(70, 50, 130, .14);
}

.buddy-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.buddy-info {
  min-width: 0;
  flex: 1;
}

.buddy-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.buddy-name {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 800;
}

.level-badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, #a594f5, #8778e8);
  box-shadow: 0 2px 6px rgba(110, 90, 200, .22);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.2;
}

.buddy-goal {
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 11px;
  line-height: 1.35;
}

.buddy-status {
  display: flex;
  width: 64px;
  flex-shrink: 0;
  align-items: center;
  gap: 5px;
  justify-content: flex-start;
}

.buddy-status.focusing {
  color: #28b446;
}

.buddy-status.focusing .status-dot {
  box-shadow: 0 0 6px rgba(40, 180, 70, .35);
}

.buddy-status.available {
  color: var(--text-secondary);
}

.status-dot {
  width: 7px;
  height: 7px;
  flex-shrink: 0;
  border-radius: 50%;
  background: currentColor;
}

.status-text {
  flex: 1;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.buddy-action {
  justify-self: end;
  min-width: 58px;
  padding: 8px 12px;
  border: 1.5px solid transparent;
  border-radius: 999px;
  background: linear-gradient(135deg, #b794f4, #8b6fd4);
  box-shadow: 0 4px 14px rgba(100, 70, 180, .22);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
}

.buddy-action.outline {
  border-color: rgba(107, 82, 196, .42);
  background: rgba(248, 247, 255, .95);
  box-shadow: none;
  color: var(--text-action);
}

.loading-tip,
.empty-tip {
  padding: 24px 0;
  color: var(--text-secondary);
  font-size: 13px;
  text-align: center;
}

.pwd-overlay {
  z-index: 100;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.pwd-sheet {
  width: 100%;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 20px 20px calc(var(--safe-bottom) + 16px);
}

.pwd-sheet h3 {
  font-size: 17px;
  font-weight: 700;
  color: #4a3b8c;
  margin-bottom: 6px;
}

.pwd-hint {
  font-size: 13px;
  color: #8b7fb8;
  margin-bottom: 14px;
}

.pwd-input {
  width: 100%;
  border: none;
  background: #f5f3ff;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 15px;
  margin-bottom: 14px;
  outline: none;
}

.pwd-actions {
  display: flex;
  gap: 10px;
}

.pwd-cancel,
.pwd-confirm {
  flex: 1;
  border: none;
  border-radius: 12px;
  padding: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.pwd-cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.pwd-confirm {
  background: linear-gradient(135deg, #a855f7, #7c3aed);
  color: #fff;
}

.pwd-confirm:disabled {
  opacity: 0.55;
}
</style>
