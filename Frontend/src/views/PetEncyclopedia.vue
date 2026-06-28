<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '../api'
import { PET_STAGE_IMAGES } from '../utils/petStages.js'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const page = ref(null)
const activeCategory = ref('all')
const keyword = ref('')
const expandedId = ref('')
const openFaqId = ref('')

const filteredArticles = computed(() => {
  const list = page.value?.articles || []
  const q = keyword.value.trim().toLowerCase()
  return list.filter((item) => {
    const matchCat = activeCategory.value === 'all' || item.category === activeCategory.value
    const matchQ = !q
      || item.title.toLowerCase().includes(q)
      || item.summary.toLowerCase().includes(q)
      || item.content.toLowerCase().includes(q)
    return matchCat && matchQ
  })
})

async function loadPage() {
  loading.value = true
  try {
    page.value = await api.getPetEncyclopedia()
  } catch (err) {
    window.alert(err.message || '加载失败')
    router.back()
  } finally {
    loading.value = false
  }
}

function toggleArticle(id) {
  expandedId.value = expandedId.value === id ? '' : id
}

function toggleFaq(id) {
  openFaqId.value = openFaqId.value === id ? '' : id
}

function statusLabel(status) {
  if (status === 'current') return '当前阶段'
  if (status === 'locked') return '未解锁'
  if (status === 'unlocked') return '已达成'
  return ''
}

function stageImage(key) {
  return PET_STAGE_IMAGES[key] || PET_STAGE_IMAGES.growth
}

onMounted(async () => {
  const tab = String(route.query.tab || '')
  if (tab && tab !== 'all') activeCategory.value = tab
  await loadPage()
})
</script>

<template>
  <div class="wiki-page page">
    <img src="/宠物养成页面背景.png" alt="" class="page-bg">

    <header class="top-bar">
      <button type="button" class="icon-btn" aria-label="返回" @click="router.back()">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <div class="title-block">
        <h1>{{ page?.title || '养成百科' }}</h1>
        <p>{{ page?.subtitle || '宠物养成指南' }}</p>
      </div>
    </header>

    <div v-if="loading" class="loading-tip">加载中…</div>

    <div v-else-if="page" class="page-scroll">
      <section v-if="page.personalize" class="glass tip-card">
        <div class="tip-head">
          <span class="tip-badge">专属提示</span>
          <span class="tip-level">Lv.{{ page.personalize.level }} · {{ page.personalize.stageLabel }}</span>
        </div>
        <p class="tip-text">{{ page.personalize.tip }}</p>
        <div class="tip-stats">
          <span>学习 {{ page.personalize.stats.studyPower }}</span>
          <span>专注 {{ page.personalize.stats.focusPower }}</span>
          <span>活力 {{ page.personalize.stats.vitality }}</span>
          <span>亲密 {{ page.personalize.stats.intimacy }}</span>
        </div>
      </section>

      <section class="glass timeline-card">
        <h2>进化路线</h2>
        <div class="timeline">
          <div
            v-for="(stage, i) in page.evolutionTimeline"
            :key="stage.key"
            class="timeline-item"
            :class="{ active: stage.active, locked: stage.locked }"
          >
            <div class="timeline-thumb">
              <img :src="stageImage(stage.key)" alt="">
              <span v-if="stage.locked" class="tl-lock"><font-awesome-icon icon="lock" /></span>
            </div>
            <strong>{{ stage.label }}</strong>
            <small>Lv.{{ stage.unlockLevel }}</small>
            <span v-if="i < page.evolutionTimeline.length - 1" class="tl-arrow" aria-hidden="true" />
          </div>
        </div>
      </section>

      <div class="search-wrap">
        <font-awesome-icon icon="search" class="search-icon" />
        <input v-model="keyword" type="search" class="search-input" placeholder="搜索百科内容">
      </div>

      <div class="category-row">
        <button
          v-for="cat in page.categories"
          :key="cat.key"
          type="button"
          class="cat-chip"
          :class="{ active: activeCategory === cat.key }"
          @click="activeCategory = cat.key"
        >
          {{ cat.label }}
        </button>
      </div>

      <section class="article-list">
        <article
          v-for="item in filteredArticles"
          :key="item.id"
          class="glass article-card"
          :class="{ expanded: expandedId === item.id, locked: item.status === 'locked' }"
        >
          <button type="button" class="article-head" @click="toggleArticle(item.id)">
            <span class="article-icon">{{ item.icon }}</span>
            <div class="article-meta">
              <strong>{{ item.title }}</strong>
              <p>{{ item.summary }}</p>
            </div>
            <span v-if="statusLabel(item.status)" class="status-tag" :class="item.status">
              {{ statusLabel(item.status) }}
            </span>
            <font-awesome-icon
              :icon="expandedId === item.id ? 'chevron-down' : 'chevron-right'"
              class="chev"
            />
          </button>
          <div v-if="expandedId === item.id" class="article-body">
            <p>{{ item.content }}</p>
            <p v-if="item.unlockLevel" class="unlock-hint">建议等级：Lv.{{ item.unlockLevel }}+</p>
          </div>
        </article>

        <p v-if="!filteredArticles.length" class="empty-tip">没有找到相关内容</p>
      </section>

      <section class="glass faq-card">
        <h2>常见问题</h2>
        <div v-for="faq in page.faqs" :key="faq.id" class="faq-item">
          <button type="button" class="faq-q" @click="toggleFaq(faq.id)">
            <span>{{ faq.question }}</span>
            <font-awesome-icon :icon="openFaqId === faq.id ? 'chevron-down' : 'chevron-right'" />
          </button>
          <p v-if="openFaqId === faq.id" class="faq-a">{{ faq.answer }}</p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.wiki-page {
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
  gap: 10px;
  padding: 12px 14px 8px;
}

.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #f3e8ff;
  display: grid;
  place-items: center;
}

.title-block h1 {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
}

.title-block p {
  margin: 2px 0 0;
  font-size: 10px;
  color: #c4b5fd;
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
  color: #c4b5fd;
}

.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
}

.tip-card {
  padding: 12px 14px;
  margin-bottom: 12px;
}

.tip-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.tip-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(251, 191, 36, 0.25);
  color: #fde68a;
}

.tip-level {
  font-size: 10px;
  color: #c4b5fd;
}

.tip-text {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.5;
  color: #ede9fe;
}

.tip-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 9px;
  color: #a5b4fc;
}

.timeline-card {
  padding: 12px;
  margin-bottom: 12px;
}

.timeline-card h2,
.faq-card h2 {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 800;
}

.timeline {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.timeline-item {
  position: relative;
  text-align: center;
  font-size: 9px;
  color: rgba(255, 255, 255, 0.55);
}

.timeline-item.active {
  color: #fde68a;
}

.timeline-item.active .timeline-thumb {
  border-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 12px rgba(253, 224, 71, 0.4);
}

.timeline-thumb {
  position: relative;
  width: 44px;
  height: 44px;
  margin: 0 auto 4px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.15);
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.15);
}

.timeline-thumb img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.timeline-item.locked .timeline-thumb img {
  filter: grayscale(0.7) opacity(0.55);
}

.tl-lock {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(30, 20, 60, 0.85);
  color: #e0e7ff;
  font-size: 7px;
  display: grid;
  place-items: center;
}

.timeline-item strong {
  display: block;
  font-size: 9px;
}

.timeline-item small {
  font-size: 8px;
  opacity: 0.8;
}

.search-wrap {
  position: relative;
  margin-bottom: 10px;
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
  color: #f3e8ff;
  font-size: 13px;
  outline: none;
}

.search-input::placeholder {
  color: #818cf8;
}

.category-row {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  margin-bottom: 12px;
  padding-bottom: 2px;
}

.cat-chip {
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: #c4b5fd;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid transparent;
}

.cat-chip.active {
  color: #fff;
  background: rgba(129, 140, 248, 0.35);
  border-color: rgba(165, 180, 252, 0.4);
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.article-card {
  overflow: hidden;
}

.article-card.locked {
  opacity: 0.75;
}

.article-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  text-align: left;
  color: inherit;
}

.article-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.article-meta {
  flex: 1;
  min-width: 0;
}

.article-meta strong {
  display: block;
  font-size: 13px;
  margin-bottom: 2px;
}

.article-meta p {
  margin: 0;
  font-size: 10px;
  color: #c4b5fd;
  line-height: 1.4;
}

.status-tag {
  flex-shrink: 0;
  font-size: 8px;
  padding: 2px 6px;
  border-radius: 999px;
  font-weight: 700;
}

.status-tag.current {
  background: rgba(251, 191, 36, 0.25);
  color: #fde68a;
}

.status-tag.locked {
  background: rgba(0, 0, 0, 0.25);
  color: #a5b4fc;
}

.status-tag.unlocked {
  background: rgba(52, 211, 153, 0.2);
  color: #6ee7b7;
}

.chev {
  flex-shrink: 0;
  font-size: 11px;
  color: #a5b4fc;
}

.article-body {
  padding: 0 12px 12px 44px;
}

.article-body p {
  margin: 0;
  font-size: 11px;
  line-height: 1.55;
  color: #ddd6fe;
}

.unlock-hint {
  margin-top: 8px !important;
  font-size: 10px !important;
  color: #fde68a !important;
}

.empty-tip {
  text-align: center;
  padding: 24px;
  font-size: 12px;
  color: #a5b4fc;
}

.faq-card {
  padding: 12px 14px;
  margin-bottom: 8px;
}

.faq-item + .faq-item {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.faq-q {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 0;
  font-size: 12px;
  font-weight: 600;
  color: #ede9fe;
  text-align: left;
}

.faq-a {
  margin: 0 0 10px;
  padding-bottom: 4px;
  font-size: 11px;
  line-height: 1.5;
  color: #c4b5fd;
}
</style>
