<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { avatarUrl } from '../utils/avatar'
import { enrichEvolutionStages, getActiveStageImage } from '../utils/petStages.js'
import { api } from '../api'
import PetShareSheet from '../components/PetShareSheet.vue'
import { petRaisePageBg } from '../config/ossPublic.js'

const router = useRouter()
const user = useUserStore()

const loading = ref(true)
const acting = ref('')
const toast = ref('')
const pet = ref(null)
const shareOpen = ref(false)

const expPercent = computed(() => {
  if (!pet.value?.profile) return 0
  const { exp, expMax } = pet.value.profile
  return Math.min(100, Math.round((exp / expMax) * 100))
})

const intimacyPercent = computed(() => {
  if (!pet.value?.intimacy) return 0
  const { current, max } = pet.value.intimacy
  return Math.min(100, Math.round((current / max) * 100))
})

const evolutionStages = computed(() =>
  enrichEvolutionStages(pet.value?.evolutionStages || []),
)

const heroStageImage = computed(() =>
  getActiveStageImage(pet.value?.evolutionStages || []),
)

function genderSymbol(g) {
  if (g === 'male') return '♂'
  if (g === 'female') return '♀'
  return ''
}

function showToast(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 2200)
}

async function loadPet() {
  loading.value = true
  try {
    pet.value = await api.getPet()
    if (pet.value?.profile) {
      user.petName = pet.value.profile.petName
      user.petLevel = pet.value.profile.level
      user.coins = pet.value.coins
      user.gems = pet.value.gems
      user.fullness = pet.value.fullness
      user.mood = pet.value.mood
    }
  } catch (err) {
    showToast(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function doAction(type) {
  if (acting.value) return
  acting.value = type
  try {
    const data = type === 'feed' ? await api.feedPet() : await api.petAction(type)
    pet.value = data
    if (data?.coins != null) user.coins = data.coins
    if (data?.fullness != null) user.fullness = data.fullness
    if (data?.mood != null) user.mood = data.mood
    showToast(type === 'feed' ? '喂养成功～' : '互动完成')
  } catch (err) {
    showToast(err.message || '操作失败')
  } finally {
    acting.value = ''
  }
}

async function claimIntimacy() {
  if (acting.value) return
  acting.value = 'reward'
  try {
    pet.value = await api.claimPetIntimacyReward()
    showToast('亲密奖励已领取')
  } catch (err) {
    showToast(err.message || '暂不可领取')
  } finally {
    acting.value = ''
  }
}

function goTask(task) {
  if (task.done) return
  if (task.key === 'focus25' || task.key === 'pomodoro3') {
    router.push('/focus')
    return
  }
  if (task.key === 'feed1') {
    doAction('feed')
    return
  }
  if (task.key === 'accompany10') {
    doAction('accompany')
  }
}

function sharePet() {
  shareOpen.value = true
}

onMounted(loadPet)
onActivated(loadPet)
</script>

<template>
  <div class="pet-page page">
    <img :src="petRaisePageBg" alt="" class="page-bg">

    <header class="top-bar">
      <button type="button" class="icon-btn" aria-label="返回" @click="router.back()">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <h1>宠物养成</h1>
      <div class="top-actions">
        <button type="button" class="text-btn" @click="router.push('/pet/encyclopedia')">
          <font-awesome-icon icon="book" /> 养成百科
        </button>
        <button type="button" class="icon-btn" aria-label="分享" @click="sharePet">
          <font-awesome-icon icon="share-nodes" />
        </button>
      </div>
    </header>

    <div v-if="loading" class="loading-tip">加载中…</div>

    <div v-else-if="pet" class="page-scroll">
      <!-- 顶部档案卡 -->
      <section class="glass profile-card">
        <div class="profile-left">
          <img :src="avatarUrl(pet.profile.avatarSeed, pet.profile.avatarUrl)" alt="" class="pet-avatar">
          <div class="profile-info">
            <div class="name-row">
              <h2>{{ pet.profile.name }}</h2>
              <span class="gender">{{ genderSymbol(pet.profile.gender) }}</span>
              <button type="button" class="edit-btn" aria-label="编辑">
                <font-awesome-icon icon="pen" />
              </button>
            </div>
            <p class="level-row">Lv.{{ pet.profile.level }}</p>
            <div class="exp-bar">
              <div class="exp-fill" :style="{ width: `${expPercent}%` }" />
            </div>
            <p class="exp-text">{{ pet.profile.exp }}/{{ pet.profile.expMax }}</p>
          </div>
        </div>
        <div class="profile-stats">
          <div class="stat-col">
            <span class="stat-num">{{ pet.stats.studyPower }}</span>
            <span class="stat-label">学习力</span>
          </div>
          <div class="stat-col">
            <span class="stat-num">{{ pet.stats.focusPower }}</span>
            <span class="stat-label">专注力</span>
          </div>
          <div class="stat-col">
            <span class="stat-num">{{ pet.stats.vitality }}</span>
            <span class="stat-label">活力</span>
          </div>
          <div class="stat-col">
            <span class="stat-num">{{ pet.stats.intimacy }}</span>
            <span class="stat-label">亲密度</span>
          </div>
        </div>
        <div class="growth-badge">
          <font-awesome-icon icon="star" />
          {{ pet.profile.growthStars }}
        </div>
      </section>

      <!-- 宠物展示区 -->
      <section class="pet-stage">
        <div class="float-card intimacy-card glass">
          <p class="card-title">亲密度 Lv.{{ pet.intimacy.level }}</p>
          <div class="mini-bar">
            <div class="mini-fill pink" :style="{ width: `${intimacyPercent}%` }" />
          </div>
          <p class="card-sub">{{ pet.intimacy.current }}/{{ pet.intimacy.max }}</p>
          <button
            type="button"
            class="reward-btn"
            :disabled="!pet.intimacy.rewardAvailable || acting === 'reward'"
            @click="claimIntimacy"
          >
            <font-awesome-icon icon="gift" /> 亲密奖励
          </button>
        </div>

        <div class="fox-wrap">
          <img :src="heroStageImage" alt="小橙" class="fox-hero">
          <span
            v-for="(item, i) in pet.equippedOutfit || []"
            :key="`${item.name}-${i}`"
            class="fox-gear"
            :class="[`gear-cat-${item.category}`, `gear-idx-${i}`]"
          >
            {{ item.image }}
          </span>
        </div>

        <div class="float-actions">
          <button type="button" class="round-btn glass" @click="router.push('/pet/dress-up')">
            <font-awesome-icon icon="crown" />
            <span>装扮</span>
          </button>
          <button type="button" class="round-btn glass" @click="router.push('/pet/profile')">
            <font-awesome-icon icon="book" />
            <span>宠物档案</span>
          </button>
        </div>
      </section>

      <!-- 四个体态 · 进化路线 -->
      <section class="glass section-card evolution-card">
        <div class="evo-track">
          <template v-for="(stage, i) in evolutionStages" :key="stage.key">
            <div
              class="evo-node"
              :class="{ active: stage.active, locked: stage.locked, unlocked: !stage.locked && !stage.active }"
            >
              <div class="evo-thumb-wrap">
                <img :src="stage.image" :alt="stage.label" class="evo-thumb">
                <span v-if="stage.locked" class="evo-lock">
                  <font-awesome-icon icon="lock" />
                </span>
              </div>
              <span class="evo-label">{{ stage.label }}</span>
              <span v-if="stage.active" class="evo-indicator" aria-hidden="true" />
            </div>
            <span
              v-if="i < evolutionStages.length - 1"
              class="evo-arrow"
              :class="{ active: !stage.locked }"
              aria-hidden="true"
            >
              <i class="evo-dash" />
              <i class="evo-dash" />
              <i class="evo-head" />
            </span>
          </template>
        </div>
      </section>

      <!-- 属性详情 -->
      <section class="glass section-card">
        <div class="section-head">
          <h3>属性详情</h3>
          <button type="button" class="link-btn" @click="router.push('/pet/encyclopedia?tab=attr')">查看属性说明 ›</button>
        </div>
        <ul class="attr-list">
          <li v-for="attr in pet.attributes" :key="attr.key">
            <div class="attr-row">
              <font-awesome-icon :icon="attr.icon" :style="{ color: attr.color }" />
              <span class="attr-name">{{ attr.label }}</span>
              <span class="attr-val">{{ attr.value }}/{{ attr.max }}</span>
            </div>
            <div class="attr-bar">
              <div class="attr-fill" :style="{ width: `${(attr.value / attr.max) * 100}%`, background: attr.color }" />
            </div>
          </li>
        </ul>
      </section>

      <!-- 互动按钮 -->
      <section class="action-row">
        <button
          v-for="act in pet.actions"
          :key="act.key"
          type="button"
          class="action-btn glass"
          :class="{ loading: acting === act.key }"
          @click="doAction(act.key)"
        >
          <span class="action-icon">
            <font-awesome-icon
              :icon="act.key === 'feed' ? 'utensils' : act.key === 'accompany' ? 'heart' : act.key === 'train' ? 'bolt' : act.key === 'bath' ? 'wand-magic-sparkles' : 'moon'"
            />
          </span>
          <span>{{ act.label }}</span>
        </button>
      </section>

      <!-- 任务 & 奖励 -->
      <section class="bottom-grid">
        <div class="glass section-card tasks-card">
          <h3>今日养成任务</h3>
          <ul class="task-list">
            <li v-for="task in pet.dailyTasks" :key="task.key">
              <div class="task-info">
                <span class="task-title">{{ task.title }}</span>
                <span class="task-progress" :class="{ done: task.done }">{{ task.progressLabel }}</span>
              </div>
              <button
                v-if="!task.done"
                type="button"
                class="task-go"
                @click="goTask(task)"
              >
                去完成
              </button>
              <font-awesome-icon v-else icon="circle-check" class="task-done-icon" />
            </li>
          </ul>
          <div class="task-bonus">
            <span>{{ pet.taskBonus.label }}</span>
            <span class="bonus-items">
              +{{ pet.taskBonus.stars }} <font-awesome-icon icon="star" />
              +{{ pet.taskBonus.coins }} <font-awesome-icon icon="coins" />
            </span>
            <span class="chest">🎁</span>
          </div>
        </div>

        <div class="glass section-card rewards-card">
          <div class="section-head">
            <h3>成长奖励</h3>
            <span class="reward-tag">{{ pet.growthRewards.claimLabel }}</span>
          </div>
          <div class="reward-items">
            <div
              v-for="item in pet.growthRewards.items"
              :key="item.key"
              class="reward-item"
              :class="{ locked: item.locked }"
            >
              <span class="reward-icon">{{ item.icon }}</span>
              <span class="reward-name">{{ item.name }}</span>
              <span v-if="item.amount > 1" class="reward-amt">×{{ item.amount }}</span>
              <font-awesome-icon v-if="item.locked" icon="lock" class="lock-icon" />
            </div>
          </div>
          <div class="reward-progress">
            <div class="mini-bar">
              <div
                class="mini-fill purple"
                :style="{ width: `${(pet.growthRewards.progress / pet.growthRewards.progressMax) * 100}%` }"
              />
            </div>
            <span>{{ pet.growthRewards.progressLabel }}</span>
          </div>
          <button type="button" class="preview-btn">查看奖励预览</button>
        </div>
      </section>
    </div>

    <Transition name="fade">
      <div v-if="toast" class="pet-toast">{{ toast }}</div>
    </Transition>

    <PetShareSheet v-model="shareOpen" @toast="showToast" />
  </div>
</template>

<style scoped>
.pet-page {
  position: relative;
  height: 100%;
  color: #f3e8ff;
  overflow: hidden;
}

.page-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  z-index: 0;
  pointer-events: none;
}

.top-bar {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px 8px;
}

.top-bar h1 {
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: 800;
  margin: 0;
  text-shadow: 0 2px 8px rgba(30, 20, 80, 0.4);
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-btn, .text-btn {
  color: #f3e8ff;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
}

.icon-btn {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  font-size: 14px;
}

.text-btn {
  padding: 6px 8px;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-scroll {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 14px 24px;
  -webkit-overflow-scrolling: touch;
}

.loading-tip {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 40px;
  color: #ddd6fe;
}

.glass {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(40, 30, 100, 0.2);
}

.profile-card {
  position: relative;
  padding: 14px;
  margin-bottom: 12px;
}

.profile-left {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.pet-avatar {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.35);
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.name-row h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.gender {
  color: #93c5fd;
  font-size: 14px;
}

.edit-btn {
  color: #c4b5fd;
  font-size: 11px;
  padding: 2px;
}

.level-row {
  margin: 2px 0 6px;
  font-size: 11px;
  color: #fde68a;
  font-weight: 700;
}

.exp-bar {
  height: 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.exp-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
}

.exp-text {
  margin: 4px 0 0;
  font-size: 9px;
  color: #ddd6fe;
  opacity: 0.85;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.stat-col {
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 15px;
  font-weight: 800;
}

.stat-label {
  font-size: 9px;
  color: #ddd6fe;
  opacity: 0.8;
}

.growth-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(251, 191, 36, 0.25);
  color: #fde68a;
  font-size: 11px;
  font-weight: 800;
}

.pet-stage {
  position: relative;
  min-height: 200px;
  margin-bottom: 12px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.fox-wrap {
  position: relative;
  width: min(72%, 260px);
  animation: float 3s ease-in-out infinite;
}

.fox-hero {
  width: 100%;
  height: auto;
  display: block;
  filter: drop-shadow(0 12px 24px rgba(40, 30, 100, 0.35));
}

.fox-gear {
  position: absolute;
  font-size: 26px;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));
  pointer-events: none;
  z-index: 2;
}

.gear-cat-1.gear-idx-0 { top: -6%; left: 50%; transform: translateX(-50%); font-size: 30px; }
.gear-cat-1.gear-idx-1 { top: 6%; right: 6%; font-size: 22px; }
.gear-cat-3.gear-idx-0 { bottom: 30%; left: -4%; font-size: 24px; }
.gear-cat-3.gear-idx-1 { bottom: 24%; right: -2%; font-size: 22px; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.float-card {
  position: absolute;
  left: 0;
  top: 8px;
  width: 118px;
  padding: 10px;
  z-index: 2;
}

.card-title {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
}

.card-sub {
  margin: 4px 0 8px;
  font-size: 9px;
  color: #ddd6fe;
}

.mini-bar {
  height: 5px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.mini-fill {
  height: 100%;
  border-radius: 999px;
}

.mini-fill.pink { background: linear-gradient(90deg, #f472b6, #ec4899); }
.mini-fill.purple { background: linear-gradient(90deg, #a78bfa, #818cf8); }

.reward-btn {
  width: 100%;
  padding: 5px 0;
  border-radius: 10px;
  background: rgba(236, 72, 153, 0.35);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.reward-btn:disabled {
  opacity: 0.45;
}

.float-actions {
  position: absolute;
  right: 0;
  top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 2;
}

.round-btn {
  width: 52px;
  padding: 8px 4px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #f3e8ff;
  font-size: 8px;
  font-weight: 700;
}

.round-btn svg {
  font-size: 14px;
  color: #fde68a;
}

.section-card {
  padding: 14px;
  margin-bottom: 12px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.section-head h3, .tasks-card h3, .rewards-card h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 800;
}

.link-btn {
  font-size: 10px;
  color: #c4b5fd;
}

.evolution-card {
  padding: 12px 10px 14px;
}

.evo-track {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 0;
}

.evo-arrow {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  width: 22px;
  height: 54px;
  margin-top: 0;
  opacity: 0.38;
}

.evo-arrow.active {
  opacity: 0.88;
}

.evo-dash {
  display: block;
  width: 4px;
  height: 2px;
  border-radius: 1px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.35);
}

.evo-head {
  display: block;
  width: 0;
  height: 0;
  margin-left: 1px;
  border-top: 3.5px solid transparent;
  border-bottom: 3.5px solid transparent;
  border-left: 5px solid rgba(255, 255, 255, 0.92);
  filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.35));
}

.evo-node {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding-bottom: 10px;
}

.evo-thumb-wrap {
  position: relative;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.12);
}

.evo-thumb {
  width: 44px;
  height: 44px;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.evo-node.unlocked .evo-thumb-wrap {
  border-color: rgba(255, 255, 255, 0.22);
}

.evo-node.active .evo-thumb-wrap {
  border-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.18), 0 0 18px rgba(253, 224, 71, 0.45);
  background: rgba(255, 255, 255, 0.16);
}

.evo-node.locked .evo-thumb {
  filter: grayscale(0.75) saturate(0.4) opacity(0.55);
}

.evo-lock {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(30, 20, 60, 0.82);
  border: 1.5px solid rgba(255, 255, 255, 0.5);
  color: #e0e7ff;
  font-size: 8px;
  display: grid;
  place-items: center;
}

.evo-label {
  font-size: 9px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.55);
  white-space: nowrap;
}

.evo-node.active .evo-label {
  color: #fde68a;
}

.evo-node.unlocked .evo-label {
  color: rgba(255, 255, 255, 0.82);
}

.evo-indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 7px solid rgba(255, 255, 255, 0.95);
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2));
}

.attr-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.attr-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  margin-bottom: 4px;
}

.attr-name {
  flex: 1;
  font-weight: 600;
}

.attr-val {
  font-size: 10px;
  color: #ddd6fe;
}

.attr-bar {
  height: 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.attr-fill {
  height: 100%;
  border-radius: 999px;
}

.action-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.action-btn {
  padding: 10px 4px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #f3e8ff;
  font-size: 10px;
  font-weight: 700;
}

.action-btn.loading {
  opacity: 0.6;
}

.action-icon {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12);
  display: grid;
  place-items: center;
  font-size: 14px;
  color: #fde68a;
}

.bottom-grid {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 10px;
}

.task-list {
  list-style: none;
  margin: 0 0 10px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-size: 10px;
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-title {
  display: block;
  font-weight: 600;
  margin-bottom: 2px;
}

.task-progress {
  color: #c4b5fd;
  font-size: 9px;
}

.task-progress.done {
  color: #6ee7b7;
}

.task-go {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(129, 140, 248, 0.35);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  white-space: nowrap;
}

.task-done-icon {
  color: #4ade80;
  font-size: 16px;
}

.task-bonus {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 9px;
  color: #ddd6fe;
}

.bonus-items {
  color: #fde68a;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}

.chest {
  margin-left: auto;
  font-size: 16px;
}

.reward-tag {
  font-size: 9px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(129, 140, 248, 0.3);
  color: #e0e7ff;
}

.reward-items {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.reward-item {
  flex: 1;
  position: relative;
  padding: 8px 4px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.15);
  text-align: center;
  font-size: 9px;
}

.reward-item.locked {
  opacity: 0.5;
}

.reward-icon {
  display: block;
  font-size: 20px;
  margin-bottom: 4px;
}

.lock-icon {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 9px;
  color: #c4b5fd;
}

.reward-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 9px;
}

.reward-progress .mini-bar {
  flex: 1;
}

.preview-btn {
  width: 100%;
  padding: 8px;
  border-radius: 12px;
  background: linear-gradient(90deg, rgba(129, 140, 248, 0.5), rgba(167, 139, 250, 0.5));
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.pet-toast {
  position: absolute;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 100;
  padding: 10px 18px;
  border-radius: 999px;
  background: rgba(30, 27, 75, 0.92);
  color: #e0e7ff;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@media (max-width: 360px) {
  .bottom-grid {
    grid-template-columns: 1fr;
  }
  .action-row {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
