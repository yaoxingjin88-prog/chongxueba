<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { useToast } from '../composables/useToast'

const router = useRouter()
const toast = useToast()

const tabs = ['头饰', '服饰', '道具', '全部']
const activeTab = ref(1)

const outfitItems = ref([])
const filteredItems = ref([])
const saving = ref(false)

async function loadItems() {
  try {
    outfitItems.value = await api.getDressUpItems()
    filterByTab(activeTab.value)
  } catch {
    outfitItems.value = []
    filteredItems.value = []
  }
}

function filterByTab(tab) {
  activeTab.value = tab
  if (tab === 0 || tab === 1) {
    filteredItems.value = outfitItems.value.filter((i) => i.category === 1)
  } else if (tab === 2) {
    filteredItems.value = outfitItems.value.filter((i) => i.category === 3)
  } else {
    filteredItems.value = [...outfitItems.value]
  }
}

function toggleEquip(item) {
  item.equipped = !item.equipped
}

async function saveOutfit() {
  if (saving.value) return
  saving.value = true
  try {
    const equipped = outfitItems.value.filter((i) => i.equipped)
    await api.saveOutfit(equipped.map((i) => ({ id: i.id, category: i.category })))
    toast.show('搭配已保存')
  } catch (err) {
    toast.show(err.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadItems)
</script>

<template>
  <div class="dressup-page page">
    <div class="mall-sky-bg" />

    <div class="page-content no-tab">
      <div class="nav-bar">
        <button class="nav-back" @click="router.back()">
          <font-awesome-icon icon="chevron-left" />
        </button>
        <span class="nav-title">宠物装扮</span>
        <button class="nav-help">
          <font-awesome-icon icon="question-circle" />
        </button>
      </div>

      <div class="stage-area">
        <div class="stage-bg" />
        <div class="stage-stars">
          <span v-for="i in 8" :key="i" class="s-star" :style="{ '--i': i }" />
        </div>
        <div class="stage-character">
          <span class="char-emoji">🦊</span>
          <span
            v-for="item in outfitItems.filter((i) => i.equipped)"
            :key="item.id"
            class="char-gear"
          >
            {{ item.image }}
          </span>
        </div>
      </div>

      <div class="tab-bar">
        <button
          v-for="(tab, i) in tabs"
          :key="tab"
          class="tab-btn"
          :class="{ active: activeTab === i }"
          @click="filterByTab(i)"
        >
          {{ tab }}
        </button>
        <div class="tab-indicator" :style="{ left: `calc(${activeTab * 25}% + 10%)` }" />
      </div>

      <div class="gear-grid">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="gear-card glass-card"
          :class="{ equipped: item.equipped }"
          @click="toggleEquip(item)"
        >
          <div class="gear-icon">{{ item.image }}</div>
          <span class="gear-name">{{ item.name }}</span>
          <span v-if="item.equipped" class="gear-badge">已装备</span>
        </div>
        <div v-if="!filteredItems.length" class="empty-hint">暂无已购装扮，去商城看看吧</div>
      </div>
    </div>

    <div class="bottom-bar">
      <button class="btn-secondary" :disabled="saving" @click="saveOutfit">保存搭配</button>
      <button class="btn-primary" @click="router.push('/mall')">去商城</button>
    </div>
  </div>
</template>

<style scoped>
.dressup-page {
  background: var(--gradient-bg);
  padding-bottom: 0;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  padding-top: calc(8px + env(safe-area-inset-top, 0px));
  position: relative;
  z-index: 10;
}

.nav-back, .nav-help {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 14px;
}

.nav-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}

.stage-area {
  position: relative;
  height: 260px;
  overflow: hidden;
  margin-top: -52px;
  padding-top: 52px;
}

.stage-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(170deg, #2d1b69 0%, #4c1d95 35%, #7c5cfc 70%, #a78bfa 100%);
}

.stage-stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.s-star {
  position: absolute;
  width: 3px;
  height: 3px;
  background: #fff;
  border-radius: 50%;
  opacity: 0;
  animation: twinkle 2.5s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.3s);
  top: calc(15% + var(--i) * 10%);
  left: calc(8% + var(--i) * 11%);
}

@keyframes twinkle {
  0%, 100% { opacity: 0; transform: scale(0.5); }
  50% { opacity: 0.9; transform: scale(1.2); }
}

.stage-character {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.char-emoji {
  font-size: 80px;
  z-index: 2;
}

.char-gear {
  position: absolute;
  font-size: 32px;
  z-index: 3;
}

.stage-bubble {
  position: absolute;
  top: 60px;
  right: 16px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

.tab-bar {
  display: flex;
  position: relative;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  margin: 12px 14px 0;
  overflow: hidden;
}

.tab-btn {
  flex: 1;
  padding: 12px 0;
  font-size: 14px;
  color: var(--text-dim);
  text-align: center;
  position: relative;
  z-index: 2;
}

.tab-btn.active {
  color: #c084fc;
  font-weight: 700;
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  width: 20px;
  height: 2px;
  background: #c084fc;
  border-radius: 3px;
  transition: left 0.3s;
}

.gear-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 14px;
}

.gear-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px 10px;
  cursor: pointer;
  border: 2px solid transparent;
}

.gear-card.equipped {
  border-color: #7c5cfc;
}

.gear-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.gear-name {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  text-align: center;
}

.gear-badge {
  font-size: 10px;
  padding: 2px 8px;
  background: #7c5cfc;
  color: #fff;
  border-radius: 6px;
}

.empty-hint {
  grid-column: 1 / -1;
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
  font-size: 14px;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  background: var(--gradient-card);
  border-top: 1px solid var(--glass-border);
  z-index: 20;
}

.btn-primary, .btn-secondary {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: #fff;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-muted);
  border: 1px solid var(--glass-border);
}
</style>
