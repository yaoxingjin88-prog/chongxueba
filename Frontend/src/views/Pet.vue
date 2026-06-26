<script setup>
import { ref, onMounted } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import ProgressBar from '../components/ProgressBar.vue'
import { useUserStore } from '../stores/user'
import { api } from '../api'

const user = useUserStore()
const tabs = ['成长', '技能', '装备', '进化']
const activeTab = ref(0)
const evolutionStages = ref([])
const attributes = ref([])
const feeding = ref(false)

async function loadPet() {
  const data = await api.getPet()
  user.petName = data.name
  user.petLevel = data.level
  user.exp = data.exp
  user.expMax = data.expMax
  evolutionStages.value = data.evolutionStages
  attributes.value = data.attributes
}

async function feedPet() {
  if (feeding.value) return
  feeding.value = true
  try {
    const data = await api.feedPet()
    user.fullness = data.fullness
    user.coins = data.coins
  } catch (err) {
    alert(err.message)
  } finally {
    feeding.value = false
  }
}

onMounted(loadPet)
</script>

<template>
  <div class="pet page">
    <div class="stars-bg" />
    <PageHeader title="宠物养成" />

    <div class="page-content no-tab">
      <div class="pet-header glass-card">
        <div class="pet-avatar">🦊</div>
        <div class="pet-info">
          <h2>{{ user.petName }}</h2>
          <span class="pet-level">Lv.{{ user.petLevel }}</span>
          <ProgressBar :value="user.exp" :max="user.expMax" color="var(--gold)" height="8px" />
        </div>
      </div>

      <div class="tab-row">
        <button
          v-for="(tab, i) in tabs"
          :key="tab"
          class="tab-btn"
          :class="{ active: activeTab === i }"
          @click="activeTab = i"
        >
          {{ tab }}
        </button>
      </div>

      <div class="evolution-section glass-card">
        <h3 class="section-title">进化路线</h3>
        <div class="evolution-path">
          <template v-for="(stage, i) in evolutionStages" :key="stage.label">
            <div class="evo-stage" :class="{ active: stage.active, locked: stage.locked }">
              <div class="evo-circle">
                <font-awesome-icon :icon="stage.active ? stage.icon : 'lock'" />
              </div>
              <span>{{ stage.label }}</span>
            </div>
            <div v-if="i < evolutionStages.length - 1" class="evo-line" :class="{ active: i < 2 }" />
          </template>
        </div>
      </div>

      <div class="pet-display">
        <div class="pet-scene-bg">
          <div class="pet-large">🦊</div>
        </div>
      </div>

      <div class="attributes-grid">
        <div v-for="attr in attributes" :key="attr.label" class="attr-card glass-card">
          <font-awesome-icon :icon="attr.icon" :style="{ color: attr.color }" />
          <span class="attr-value">{{ attr.value }}</span>
          <span class="attr-label">{{ attr.label }}</span>
        </div>
      </div>

      <button class="feed-btn gradient-btn block" :disabled="feeding" @click="feedPet">
        <font-awesome-icon icon="utensils" />
        喂养
      </button>
    </div>
  </div>
</template>

<style scoped>
.pet-header {
  margin: 0 16px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
}

.pet-avatar {
  width: 64px;
  height: 64px;
  background: var(--gradient-btn);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
}

.pet-info {
  flex: 1;
}

.pet-info h2 {
  font-size: 18px;
  font-weight: 700;
}

.pet-level {
  font-size: 12px;
  color: var(--gold);
  display: block;
  margin: 4px 0 8px;
}

.tab-row {
  display: flex;
  gap: 8px;
  padding: 0 16px;
  margin-bottom: 16px;
  overflow-x: auto;
}

.tab-btn {
  padding: 8px 18px;
  border-radius: var(--radius-full);
  font-size: 13px;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-muted);
  border: 1px solid transparent;
}

.tab-btn.active {
  background: rgba(159, 122, 234, 0.3);
  color: #fff;
  border-color: var(--primary-light);
}

.evolution-section {
  margin: 0 16px 16px;
  padding: 16px;
}

.evolution-path {
  display: flex;
  align-items: center;
  justify-content: center;
}

.evo-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-dim);
}

.evo-stage.active {
  color: var(--gold);
}

.evo-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.evo-stage.active .evo-circle {
  background: rgba(251, 191, 36, 0.2);
  border-color: var(--gold);
  color: var(--gold);
}

.evo-line {
  width: 30px;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 4px;
  margin-bottom: 20px;
}

.evo-line.active {
  background: var(--gold);
}

.pet-display {
  margin: 0 16px 16px;
}

.pet-scene-bg {
  height: 160px;
  background: linear-gradient(180deg, #2d1f5e 0%, #4a3a8c 100%);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.pet-scene-bg::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(180deg, #5b8a3c 0%, #3d6b28 100%);
  border-radius: 50% 50% 0 0;
}

.pet-large {
  font-size: 72px;
  z-index: 1;
  animation: bounce 2s ease-in-out infinite;
}

.attributes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 0 16px;
  margin-bottom: 20px;
}

.attr-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  gap: 4px;
}

.attr-card svg {
  font-size: 20px;
  margin-bottom: 4px;
}

.attr-value {
  font-size: 22px;
  font-weight: 700;
}

.attr-label {
  font-size: 11px;
  color: var(--text-muted);
}

.feed-btn {
  margin: 0 16px 20px;
  padding: 16px;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
</style>
