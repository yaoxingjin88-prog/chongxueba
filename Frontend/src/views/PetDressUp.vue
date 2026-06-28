<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { useToast } from '../composables/useToast'
import { getActiveStageImage } from '../utils/petStages.js'
import homeFoxIsland from '../assets/home-fox-island.png'
import { resolveDressUpVisual } from '../utils/petDressUpVisuals.js'

const router = useRouter()
const toast = useToast()

const tabs = [
  { label: '头饰', slots: ['head', 'face'] },
  { label: '服饰', slots: ['back', 'body', 'neck'] },
  { label: '道具', slots: ['prop', 'effect'] },
  { label: '全部', slots: null },
]
const activeTab = ref(3)

const outfitItems = ref([])
const saving = ref(false)
const heroImage = ref(homeFoxIsland)
const hasUnsavedChanges = ref(false)

function resolveVisual(item) {
  return resolveDressUpVisual(item)
}

const resolvedItems = computed(() =>
  outfitItems.value.map((item) => ({
    ...item,
    ...resolveVisual(item),
  })),
)

const filteredItems = computed(() => {
  const slots = tabs[activeTab.value]?.slots
  if (!slots) return resolvedItems.value
  return resolvedItems.value.filter((item) => slots.includes(item.slot))
})

const equippedItems = computed(() =>
  resolvedItems.value.filter((item) => item.equipped),
)

async function loadItems() {
  try {
    const [items, pet] = await Promise.all([
      api.getDressUpItems(),
      api.getPet().catch(() => null),
    ])
    const uniqueItems = new Map()
    items.forEach((item) => {
      const key = Number(item.id)
      const previous = uniqueItems.get(key)
      uniqueItems.set(key, {
        ...previous,
        ...item,
        equipped: Boolean(previous?.equipped || item.equipped),
      })
    })
    outfitItems.value = [...uniqueItems.values()]
    hasUnsavedChanges.value = false
    if (pet?.evolutionStages) {
      heroImage.value = getActiveStageImage(pet.evolutionStages)
    }
  } catch {
    outfitItems.value = []
  }
}

function filterByTab(tab) {
  activeTab.value = tab
}

function toggleEquip(item) {
  const target = outfitItems.value.find((ownedItem) => Number(ownedItem.id) === Number(item.id))
  if (!target) return

  const slot = resolveVisual(target).slot
  if (!target.equipped) {
    outfitItems.value.forEach((i) => {
      if (resolveVisual(i).slot === slot && Number(i.id) !== Number(target.id)) {
        i.equipped = false
      }
    })
  }
  target.equipped = !target.equipped
  hasUnsavedChanges.value = true
}

async function saveOutfit() {
  if (saving.value) return
  saving.value = true
  try {
    const equipped = outfitItems.value.filter((i) => i.equipped)
    await api.saveOutfit(equipped.map((i) => ({ id: i.id, category: i.category })))
    hasUnsavedChanges.value = false
    toast.show('装扮已保存，返回看看小橙的新造型吧～')
  } catch (err) {
    toast.show(err.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function showHelp() {
  toast.show('不同部位可以同时穿戴；同一部位的新装扮会自动替换旧装扮')
}

onMounted(loadItems)
</script>

<template>
  <div class="dressup-page page">
    <img src="/宠物养成页面背景.png" alt="" class="page-bg">

    <header class="top-bar">
      <button type="button" class="icon-btn" aria-label="返回" @click="router.back()">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <h1>宠物装扮</h1>
      <button type="button" class="icon-btn" aria-label="说明" @click="showHelp">
        <font-awesome-icon icon="question-circle" />
      </button>
    </header>

    <div class="page-scroll">
      <!-- 预览舞台 -->
      <section class="stage-section">
        <div class="stage-glow" aria-hidden="true" />
        <span class="preview-badge">
          <span class="preview-dot" />
          实时试穿
        </span>
        <div class="fox-stage">
          <img :src="heroImage" alt="小橙" class="fox-img">
          <template
            v-for="item in equippedItems"
            :key="item.id"
          >
            <img
              v-if="item.asset"
              :src="item.asset"
              :alt="item.name"
              class="pet-accessory"
              :class="[`accessory-${item.slot}`, `accessory-id-${item.id}`]"
            >
            <span
              v-else
              class="pet-accessory-fallback"
              :class="`accessory-${item.slot}`"
            >
              {{ item.image }}
            </span>
          </template>
        </div>
        <p v-if="equippedItems.length" class="stage-tip">
          已搭配 {{ equippedItems.length }} 件
          <span v-if="hasUnsavedChanges"> · 保存后生效</span>
          <span v-else> · 已同步</span>
        </p>
        <p v-else class="stage-tip">轻点下方装扮，在小橙身上实时预览</p>
      </section>

      <!-- 分类 Tab -->
      <div class="tab-bar glass">
        <button
          v-for="(tab, i) in tabs"
          :key="tab.label"
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === i }"
          @click="filterByTab(i)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 装扮列表 -->
      <div class="gear-grid">
        <button
          v-for="item in filteredItems"
          :key="item.id"
          type="button"
          class="gear-card glass"
          :class="{ equipped: item.equipped }"
          :aria-pressed="item.equipped"
          @click="toggleEquip(item)"
        >
          <span v-if="item.equipped" class="equipped-check">
            <font-awesome-icon icon="check" />
          </span>
          <div class="gear-icon">
            <img v-if="item.asset" :src="item.asset" :alt="item.name">
            <span v-else>{{ item.image }}</span>
          </div>
          <span class="gear-name">{{ item.name }}</span>
          <span class="slot-label">{{ item.slotLabel }}</span>
        </button>
        <div v-if="!filteredItems.length" class="empty-block glass">
          <span class="empty-icon">👑</span>
          <p>暂无已购装扮</p>
          <button type="button" class="mall-link" @click="router.push('/mall')">
            去商城逛逛
          </button>
        </div>
      </div>
    </div>

    <div class="bottom-bar">
      <button
        type="button"
        class="btn-secondary"
        :disabled="saving || !hasUnsavedChanges"
        @click="saveOutfit"
      >
        {{ saving ? '保存中…' : hasUnsavedChanges ? '保存搭配' : '搭配已保存' }}
      </button>
      <button type="button" class="btn-primary" @click="router.push('/mall/categories')">
        去商城
      </button>
    </div>
  </div>
</template>

<style scoped>
.dressup-page {
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

.page-scroll {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 14px calc(88px + env(safe-area-inset-bottom, 0px));
}

.glass {
  background: rgba(30, 20, 60, 0.45);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
}

.stage-section {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 22px 0 12px;
  margin-bottom: 12px;
}

.stage-glow {
  position: absolute;
  top: 38%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 240px;
  height: 240px;
  background:
    radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, rgba(192, 132, 252, 0.24) 38%, transparent 70%);
  pointer-events: none;
}

.preview-badge {
  position: absolute;
  top: 4px;
  right: 2px;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 9px;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(28, 18, 70, 0.38);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  backdrop-filter: blur(8px);
  font-size: 10px;
  font-weight: 700;
}

.preview-dot {
  width: 6px;
  height: 6px;
  background: #86efac;
  border-radius: 50%;
  box-shadow: 0 0 7px rgba(134, 239, 172, 0.8);
}

.fox-stage {
  position: relative;
  isolation: isolate;
  width: min(78vw, 260px);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.fox-img {
  position: relative;
  z-index: 2;
  width: 100%;
  height: auto;
  display: block;
  filter: drop-shadow(0 12px 28px rgba(40, 30, 100, 0.4));
}

.pet-accessory,
.pet-accessory-fallback {
  position: absolute;
  pointer-events: none;
  transform-origin: center;
  animation: accessory-pop 0.28s cubic-bezier(0.2, 0.9, 0.25, 1.2);
}

.pet-accessory {
  display: block;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(30, 16, 70, 0.28));
}

.accessory-back {
  z-index: 1;
}

.accessory-head,
.accessory-face,
.accessory-neck,
.accessory-body,
.accessory-prop,
.accessory-effect {
  z-index: 4;
}

.accessory-id-1 {
  top: 21%;
  left: 1%;
  width: 98%;
}

.accessory-id-2 {
  top: -3%;
  left: 21%;
  width: 58%;
  transform: rotate(-2deg);
}

.accessory-id-3 {
  top: 18%;
  left: 27%;
  width: 46%;
}

.accessory-id-4 {
  top: 1%;
  left: 21%;
  width: 58%;
}

.pet-accessory-fallback.accessory-body,
.pet-accessory-fallback.accessory-neck {
  top: 39%;
  left: 50%;
  z-index: 4;
  font-size: 34px;
  transform: translateX(-50%);
}

.pet-accessory-fallback.accessory-prop,
.pet-accessory-fallback.accessory-effect {
  right: 2%;
  bottom: 28%;
  z-index: 4;
  font-size: 34px;
}

@keyframes accessory-pop {
  from { opacity: 0; scale: 0.76; }
  to { opacity: 1; scale: 1; }
}

.stage-tip {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(243, 232, 255, 0.7);
  text-align: center;
}

.tab-bar {
  display: flex;
  margin-bottom: 12px;
  overflow: hidden;
  padding: 4px;
}

.tab-btn {
  flex: 1;
  padding: 10px 0;
  font-size: 13px;
  color: rgba(243, 232, 255, 0.65);
  border-radius: 12px;
  transition: all 0.2s;
}

.tab-btn.active {
  background: rgba(192, 132, 252, 0.35);
  color: #fff;
  font-weight: 700;
}

.gear-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.gear-card {
  position: relative;
  color: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px 10px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s, transform 0.15s;
}

.gear-card:active {
  transform: scale(0.97);
}

.gear-card.equipped {
  border-color: #fbbf24;
  background: rgba(92, 56, 142, 0.66);
  box-shadow: 0 0 18px rgba(251, 191, 36, 0.2);
}

.gear-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  overflow: hidden;
}

.gear-icon img {
  width: 78px;
  height: 78px;
  max-width: none;
  object-fit: contain;
}

.gear-name {
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  line-height: 1.3;
}

.slot-label {
  font-size: 9px;
  color: rgba(243, 232, 255, 0.58);
}

.equipped-check {
  position: absolute;
  top: 7px;
  right: 7px;
  z-index: 2;
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  color: #4c2b05;
  background: linear-gradient(135deg, #fde68a, #f59e0b);
  border: 2px solid rgba(255, 255, 255, 0.74);
  border-radius: 50%;
  font-size: 9px;
  font-weight: 700;
  box-shadow: 0 3px 8px rgba(76, 43, 5, 0.24);
}

.empty-block {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px 16px;
  text-align: center;
}

.empty-icon {
  font-size: 36px;
  opacity: 0.6;
}

.empty-block p {
  font-size: 13px;
  color: rgba(243, 232, 255, 0.65);
}

.mall-link {
  margin-top: 4px;
  padding: 8px 20px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
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
  background: rgba(20, 12, 45, 0.92);
  backdrop-filter: blur(16px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 20;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  height: 44px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: #fff;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #f3e8ff;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.btn-secondary:disabled {
  opacity: 0.58;
}

@media (max-height: 720px) {
  .stage-section {
    padding-top: 12px;
  }

  .fox-stage {
    width: min(66vw, 218px);
  }

  .gear-grid {
    gap: 8px;
  }
}
</style>
