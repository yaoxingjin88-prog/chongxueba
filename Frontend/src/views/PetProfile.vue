<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { avatarUrl } from '../utils/avatar'
import { enrichEvolutionStages, getActiveStageImage } from '../utils/petStages.js'
import { petRaisePageBg } from '../config/ossPublic.js'

const router = useRouter()

const loading = ref(true)
const pet = ref(null)

const expPercent = computed(() => {
  if (!pet.value?.profile) return 0
  const { exp, expMax } = pet.value.profile
  return Math.min(100, Math.round((exp / expMax) * 100))
})

const heroImage = computed(() =>
  getActiveStageImage(pet.value?.evolutionStages || []),
)

const evolutionStages = computed(() =>
  enrichEvolutionStages(pet.value?.evolutionStages || []),
)

const infoCards = computed(() => {
  const a = pet.value?.archive
  if (!a) return []
  return [
    { label: '领养日期', value: a.adoptDate, icon: 'calendar-check' },
    { label: '陪伴天数', value: `${a.companionDays}天`, icon: 'heart' },
    { label: '累计专注', value: `${a.focusTotalHours}h`, icon: 'brain' },
    { label: '互动次数', value: `${a.totalInteractions}次`, icon: 'hand' },
  ]
})

function genderSymbol(g) {
  if (g === 'male') return '♂'
  if (g === 'female') return '♀'
  return ''
}

async function loadProfile() {
  loading.value = true
  try {
    pet.value = await api.getPetProfile()
  } catch (err) {
    window.alert(err.message || '加载失败')
    router.back()
  } finally {
    loading.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <div class="profile-page page">
    <img :src="petRaisePageBg" alt="" class="page-bg">

    <header class="top-bar">
      <button type="button" class="icon-btn" aria-label="返回" @click="router.back()">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <h1>宠物档案</h1>
      <div class="header-spacer" />
    </header>

    <div v-if="loading" class="loading-tip">加载中…</div>

    <div v-else-if="pet" class="page-scroll">
      <!-- 档案头图 -->
      <section class="glass hero-card">
        <div class="hero-visual">
          <img :src="heroImage" :alt="pet.profile.petName" class="hero-pet">
        </div>
        <div class="hero-info">
          <div class="name-row">
            <h2>{{ pet.profile.petName }}</h2>
            <span class="gender">{{ genderSymbol(pet.profile.gender) }}</span>
          </div>
          <p class="species">{{ pet.archive.species }} · {{ pet.archive.stageLabel }}</p>
          <div class="tag-row">
            <span
              v-for="tag in pet.archive.personalityTags"
              :key="tag.label"
              class="personality-tag"
              :style="{ background: `${tag.color}22`, color: tag.color, borderColor: `${tag.color}44` }"
            >
              {{ tag.label }}
            </span>
          </div>
          <div class="level-block">
            <div class="level-head">
              <span>Lv.{{ pet.profile.level }}</span>
              <span class="exp-num">{{ pet.profile.exp }}/{{ pet.profile.expMax }}</span>
            </div>
            <div class="exp-bar">
              <div class="exp-fill" :style="{ width: `${expPercent}%` }" />
            </div>
          </div>
        </div>
      </section>

      <!-- 基础数据 -->
      <section class="info-grid">
        <div v-for="card in infoCards" :key="card.label" class="info-card glass">
          <font-awesome-icon :icon="card.icon" class="info-icon" />
          <span class="info-value">{{ card.value }}</span>
          <span class="info-label">{{ card.label }}</span>
        </div>
      </section>

      <!-- 简介 -->
      <section class="glass section-card">
        <h3 class="section-title">宠物简介</h3>
        <p class="bio-text">{{ pet.archive.bio }}</p>
        <p class="species-desc">{{ pet.archive.speciesDesc }}</p>
        <div class="owner-row">
          <img :src="avatarUrl(pet.profile.avatarSeed, pet.profile.avatarUrl)" alt="" class="owner-avatar">
          <div>
            <span class="owner-label">主人</span>
            <span class="owner-name">{{ pet.profile.ownerName || '同学' }}</span>
          </div>
          <div class="star-badge">
            <font-awesome-icon icon="star" />
            {{ pet.profile.growthStars }}
          </div>
        </div>
      </section>

      <!-- 能力总览 -->
      <section class="glass section-card">
        <div class="section-head">
          <h3 class="section-title">能力总览</h3>
          <button type="button" class="link-btn" @click="router.push('/pet/encyclopedia?tab=attr')">
            属性说明 ›
          </button>
        </div>
        <ul class="attr-list">
          <li v-for="attr in pet.attributes" :key="attr.key">
            <div class="attr-row">
              <font-awesome-icon :icon="attr.icon" :style="{ color: attr.color }" />
              <span class="attr-name">{{ attr.label }}</span>
              <span class="attr-val">{{ attr.value }}/{{ attr.max }}</span>
            </div>
            <div class="attr-bar">
              <div
                class="attr-fill"
                :style="{ width: `${(attr.value / attr.max) * 100}%`, background: attr.color }"
              />
            </div>
          </li>
        </ul>
      </section>

      <!-- 进化历程 -->
      <section class="glass section-card">
        <h3 class="section-title">进化历程</h3>
        <div class="evo-row">
          <div
            v-for="stage in evolutionStages"
            :key="stage.key"
            class="evo-item"
            :class="{ active: stage.active, locked: stage.locked }"
          >
            <div class="evo-thumb-wrap">
              <img :src="stage.image" :alt="stage.label" class="evo-thumb">
              <span v-if="stage.locked" class="evo-lock"><font-awesome-icon icon="lock" /></span>
            </div>
            <span class="evo-label">{{ stage.label }}</span>
          </div>
        </div>
        <ul class="milestone-list">
          <li
            v-for="item in pet.archive.milestones"
            :key="item.key"
            class="milestone-item"
            :class="{ done: item.done }"
          >
            <div class="milestone-icon">
              <font-awesome-icon :icon="item.icon" />
            </div>
            <div class="milestone-body">
              <span class="milestone-title">{{ item.title }}</span>
              <span class="milestone-desc">{{ item.desc }}</span>
            </div>
            <font-awesome-icon v-if="item.done" icon="circle-check" class="milestone-check" />
            <font-awesome-icon v-else icon="lock" class="milestone-lock" />
          </li>
        </ul>
      </section>

      <!-- 互动统计 -->
      <section v-if="pet.archive.interactions.length" class="glass section-card">
        <h3 class="section-title">互动统计</h3>
        <div class="interaction-grid">
          <div
            v-for="item in pet.archive.interactions"
            :key="item.key"
            class="interaction-chip"
          >
            <span class="chip-count">{{ item.count }}</span>
            <span class="chip-label">{{ item.label }}</span>
          </div>
        </div>
      </section>

      <!-- 成长足迹 -->
      <section v-if="pet.archive.memories.length" class="glass section-card">
        <h3 class="section-title">成长足迹</h3>
        <ul class="memory-list">
          <li v-for="(mem, i) in pet.archive.memories" :key="i" class="memory-item">
            <div class="memory-dot" :style="{ background: mem.color }">
              <font-awesome-icon :icon="mem.icon" />
            </div>
            <div class="memory-body">
              <span class="memory-date">{{ mem.date }}</span>
              <span class="memory-title">{{ mem.title }}</span>
              <span class="memory-desc">{{ mem.desc }}</span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
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

.header-spacer {
  width: 34px;
}

.icon-btn {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  font-size: 14px;
  color: #f3e8ff;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
}

.loading-tip {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 40px;
  opacity: 0.8;
}

.page-scroll {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 14px calc(24px + env(safe-area-inset-bottom, 0px));
}

.glass {
  background: rgba(30, 20, 60, 0.45);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
}

.hero-card {
  display: flex;
  gap: 14px;
  padding: 16px;
  margin-bottom: 12px;
}

.hero-visual {
  flex-shrink: 0;
  width: 108px;
  height: 108px;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
}

.hero-pet {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.hero-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.name-row h2 {
  font-size: 20px;
  font-weight: 800;
  margin: 0;
}

.gender {
  font-size: 16px;
  opacity: 0.85;
}

.species {
  font-size: 12px;
  color: rgba(243, 232, 255, 0.75);
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.personality-tag {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid;
}

.level-block {
  margin-top: auto;
}

.level-head {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
}

.exp-num {
  opacity: 0.7;
}

.exp-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  overflow: hidden;
}

.exp-fill {
  height: 100%;
  background: linear-gradient(90deg, #c084fc, #e879f9);
  border-radius: inherit;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.info-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 6px;
  text-align: center;
}

.info-icon {
  font-size: 14px;
  color: #c084fc;
}

.info-value {
  font-size: 13px;
  font-weight: 800;
  line-height: 1.2;
}

.info-label {
  font-size: 10px;
  color: rgba(243, 232, 255, 0.65);
}

.section-card {
  padding: 16px;
  margin-bottom: 12px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 800;
  margin: 0 0 12px;
}

.section-head .section-title {
  margin-bottom: 0;
}

.link-btn {
  font-size: 12px;
  color: #c084fc;
}

.bio-text {
  font-size: 13px;
  line-height: 1.65;
  color: rgba(243, 232, 255, 0.92);
  margin-bottom: 8px;
}

.species-desc {
  font-size: 11px;
  line-height: 1.5;
  color: rgba(243, 232, 255, 0.55);
  margin-bottom: 14px;
}

.owner-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.owner-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.25);
}

.owner-label {
  display: block;
  font-size: 10px;
  color: rgba(243, 232, 255, 0.55);
}

.owner-name {
  font-size: 13px;
  font-weight: 700;
}

.star-badge {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba(251, 191, 36, 0.15);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
  color: #fbbf24;
}

.attr-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attr-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 6px;
}

.attr-name {
  flex: 1;
}

.attr-val {
  font-size: 12px;
  opacity: 0.75;
}

.attr-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  overflow: hidden;
}

.attr-fill {
  height: 100%;
  border-radius: inherit;
}

.evo-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
}

.evo-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  opacity: 0.45;
}

.evo-item.active {
  opacity: 1;
}

.evo-item:not(.locked):not(.active) {
  opacity: 0.75;
}

.evo-thumb-wrap {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.15);
}

.evo-item.active .evo-thumb-wrap {
  border-color: #fbbf24;
  box-shadow: 0 0 12px rgba(251, 191, 36, 0.35);
}

.evo-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.evo-lock {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.45);
  font-size: 12px;
}

.evo-label {
  font-size: 10px;
  text-align: center;
}

.milestone-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.milestone-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  opacity: 0.55;
}

.milestone-item.done {
  opacity: 1;
}

.milestone-icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: rgba(192, 132, 252, 0.2);
  color: #c084fc;
  font-size: 14px;
  flex-shrink: 0;
}

.milestone-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.milestone-title {
  font-size: 13px;
  font-weight: 700;
}

.milestone-desc {
  font-size: 11px;
  color: rgba(243, 232, 255, 0.6);
}

.milestone-check {
  color: #4ade80;
  font-size: 16px;
  flex-shrink: 0;
}

.milestone-lock {
  color: rgba(243, 232, 255, 0.35);
  font-size: 12px;
  flex-shrink: 0;
}

.interaction-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.interaction-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.chip-count {
  font-size: 18px;
  font-weight: 800;
  color: #fbbf24;
}

.chip-label {
  font-size: 11px;
  color: rgba(243, 232, 255, 0.7);
}

.memory-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.memory-item {
  display: flex;
  gap: 12px;
}

.memory-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 11px;
  color: #fff;
  flex-shrink: 0;
}

.memory-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.memory-date {
  font-size: 10px;
  color: rgba(243, 232, 255, 0.5);
}

.memory-title {
  font-size: 13px;
  font-weight: 700;
}

.memory-desc {
  font-size: 11px;
  color: rgba(243, 232, 255, 0.65);
  line-height: 1.45;
}
</style>
