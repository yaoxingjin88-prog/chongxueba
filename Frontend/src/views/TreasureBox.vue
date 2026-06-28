<script setup>
import { ref, computed, onMounted } from 'vue'
import DreamPageBg from '../components/DreamPageBg.vue'
import TreasureChestVisual from '../components/TreasureChestVisual.vue'
import ChestTierIcon from '../components/ChestTierIcon.vue'
import RewardBurst from '../components/RewardBurst.vue'
import { api } from '../api'
import { useUserStore } from '../stores/user'
import { useToast } from '../composables/useToast'

const user = useUserStore()
const toast = useToast()
const currentActivity = ref(0)
const chests = ref([])
const remainingOpens = ref(0)
const maxOpens = ref(3)
const statusMessage = ref('')
const preview = ref([])
const claiming = ref(false)
const rewardPopup = ref(null)
const chestOpen = ref(false)
const showBurst = ref(false)
const opening = ref(false)
const showRules = ref(false)
const selectedTier = ref(1)

const canOpen = computed(() => chests.value.some((c) => c.canClaim))
const nextTier = computed(() => chests.value.find((c) => c.canClaim) || chests.value.find((c) => c.reached && !c.claimed))
const activePreview = computed(() => {
  const c = chests.value.find((x) => x.tier === selectedTier.value)
  return c?.preview || preview.value
})
const selectedChest = computed(() => chests.value.find((x) => x.tier === selectedTier.value))

async function loadChests() {
  const data = await api.getActivityChests()
  currentActivity.value = data.currentActivity
  chests.value = data.chests
  remainingOpens.value = data.remainingOpens
  maxOpens.value = data.maxOpensPerDay
  statusMessage.value = data.statusMessage
  preview.value = data.preview || []
  const def = data.chests.find((c) => c.canClaim) || data.chests.find((c) => c.reached && !c.claimed) || data.chests[0]
  if (def) selectedTier.value = def.tier
}

function selectTier(tier) {
  selectedTier.value = tier
}

async function openChest() {
  const target = chests.value.find((c) => c.canClaim)
  if (!target || claiming.value) return
  claiming.value = true
  opening.value = true
  chestOpen.value = true
  try {
    await new Promise((r) => setTimeout(r, 700))
    showBurst.value = true
    rewardPopup.value = await api.claimActivityChest(target.tier)
    await user.refresh()
    await loadChests()
    toast.reward(`开启${rewardPopup.value.label}宝箱成功！`)
    setTimeout(() => { showBurst.value = false }, 1200)
  } catch (e) {
    chestOpen.value = false
    toast.info(e.message)
  } finally {
    claiming.value = false
    opening.value = false
    setTimeout(() => { chestOpen.value = false }, 400)
  }
}

onMounted(loadChests)
</script>

<template>
  <div class="dream-page treasure-page">
    <DreamPageBg />
    <RewardBurst :active="showBurst" />

    <header class="dream-header">
      <button class="dream-hdr-btn" type="button" aria-label="返回" @click="$router.back()">
        <font-awesome-icon icon="chevron-left" />
      </button>
      <h1>奖励宝箱</h1>
      <button class="dream-hdr-btn pill" type="button" aria-label="宝箱说明" @click="showRules = true">宝箱说明</button>
    </header>

    <main class="dream-body has-footer-btn">
      <section class="chest-scene">
        <div class="chest-glow-ring" :class="{ active: canOpen || opening }" />
        <TreasureChestVisual :tier="selectedTier" :open="chestOpen" :glowing="canOpen || opening" />
      </section>

      <section class="dream-card prog-card">
        <div class="prog-head">
          <div>
            <span class="prog-label">宝箱进度</span>
            <p v-if="nextTier" class="prog-sub">下一档：{{ nextTier.label }}宝箱</p>
          </div>
          <strong>{{ currentActivity }}<small>/100</small></strong>
        </div>
        <div class="task-progress-bar task-progress-bar--lg">
          <div class="task-progress-bar__fill" :style="{ width: `${currentActivity}%` }" />
        </div>
        <p class="prog-tip">{{ statusMessage }}</p>
      </section>

      <section class="dream-card tier-card">
        <h3 class="dream-section-title">宝箱等级</h3>
        <div class="tier-tabs">
          <button
            v-for="c in chests"
            :key="c.tier"
            type="button"
            class="tier-tab"
            :class="{ active: selectedTier === c.tier, reached: c.reached, claimable: c.canClaim, done: c.claimed }"
            @click="selectTier(c.tier)"
          >
            <ChestTierIcon :tier="c.tier" :size="52" mini :floating="false" />
            <span class="tier-tab-name">{{ c.label }}</span>
          </button>
        </div>
      </section>

      <section class="dream-card">
        <h3 class="dream-section-title">宝箱奖励预览</h3>
        <div class="preview-scroll">
          <div v-for="(item, i) in activePreview" :key="i" class="preview-box">
            <div class="p-icon" :class="item.icon"><font-awesome-icon :icon="item.icon" /></div>
            <span class="p-name">{{ item.label }}</span>
            <strong>×{{ item.amount }}</strong>
          </div>
        </div>
      </section>
    </main>

    <div class="dream-footer">
      <button class="dream-btn" :disabled="!canOpen || claiming" @click="openChest">
        {{ canOpen ? (claiming ? '开启中...' : '开启宝箱') : '暂不可开启' }}
      </button>
      <p class="limit">今日可开启次数: {{ remainingOpens }}/{{ maxOpens }}</p>
    </div>

    <div v-if="showRules" class="overlay" @click.self="showRules = false">
      <div class="rules-popup">
        <h3>宝箱说明</h3>
        <ul>
          <li>完成每日任务可获得活跃度，最高 100 点</li>
          <li>活跃度达到 20/40/60/80 可解锁对应档位宝箱</li>
          <li>每日最多开启 3 次宝箱</li>
          <li>档位：新手 → 进阶 → 精英 → 大师</li>
        </ul>
        <button class="pop-btn" @click="showRules = false">知道了</button>
      </div>
    </div>

    <div v-if="rewardPopup" class="overlay" @click.self="rewardPopup = null">
      <div class="popup">
        <div class="pop-burst" />
        <div class="pop-emoji">🎉</div>
        <h3>宝箱开启成功</h3>
        <p>{{ rewardPopup.label }}宝箱</p>
        <div class="pop-rewards">
          <div class="pop-item exp"><font-awesome-icon icon="bolt" /> +{{ rewardPopup.rewards.exp }} EXP</div>
          <div class="pop-item coins"><font-awesome-icon icon="coins" /> +{{ rewardPopup.rewards.coins }} 学豆</div>
          <div v-if="rewardPopup.rewards.gems" class="pop-item gems"><font-awesome-icon icon="gem" /> +{{ rewardPopup.rewards.gems }} 宝石</div>
        </div>
        <button class="pop-btn" @click="rewardPopup = null">太棒了</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chest-scene {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0 4px;
  min-height: 220px;
}

.chest-glow-ring {
  position: absolute;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.25), rgba(123, 97, 255, 0.12) 55%, transparent 72%);
  opacity: 0;
  transition: opacity 0.35s;
  pointer-events: none;
}

.chest-glow-ring.active {
  opacity: 1;
  animation: chest-ring-pulse 2.4s ease-in-out infinite;
}

@keyframes chest-ring-pulse {
  0%, 100% { transform: scale(1); opacity: 0.75; }
  50% { transform: scale(1.06); opacity: 1; }
}
.prog-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.prog-label { font-size: 15px; font-weight: 800; color: rgba(255,255,255,.95); display: block; }
.prog-sub { margin-top: 4px; font-size: 11px; color: var(--task-text-dim); }
.prog-head strong { color: #c4b5fd; font-size: 28px; font-weight: 800; line-height: 1; }
.prog-head strong small { font-size: 16px; font-weight: 700; color: var(--task-text-dim); }
.prog-tip { margin-top: 12px; text-align: center; font-size: 12px; color: var(--task-text-muted); font-weight: 600; padding: 8px; border-radius: 10px; background: rgba(255,255,255,.08); }

.tier-card { padding-bottom: 14px; }
.tier-tabs { display: flex; gap: 8px; justify-content: space-between; }
.tier-tab {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 10px 4px; border: 2px solid transparent; border-radius: 16px;
  background: rgba(255,255,255,.08); cursor: pointer; transition: all 0.2s;
}
.tier-tab:active { transform: scale(0.97); }
.tier-tab.active { border-color: var(--task-primary-light); background: rgba(255,255,255,.18); box-shadow: 0 4px 16px rgba(123,97,255,.25); }
.tier-tab.reached:not(.active) { border-color: rgba(123,97,255,.35); }
.tier-tab-name { font-size: 10px; font-weight: 700; color: var(--task-text-dim); }
.tier-tab.active .tier-tab-name { color: #fff; }

.preview-scroll { display: flex; gap: 12px; overflow-x: auto; padding: 4px 2px 8px; scrollbar-width: none; justify-content: flex-start; }
.preview-scroll::-webkit-scrollbar { display: none; }
.preview-box { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 64px; padding: 10px 8px; border-radius: 16px; background: rgba(255,255,255,.1); }
.p-icon { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 20px; background: rgba(255,255,255,.92); box-shadow: 0 4px 12px rgba(0,0,0,.12); }
.p-icon.coins { color: #d97706; }
.p-icon.bolt { color: #ea580c; }
.p-icon.gem { color: #7c3aed; }
.p-icon.star { color: #ca8a04; }
.p-icon.paw { color: #db2777; }
.p-name { font-size: 10px; color: var(--task-text-dim); font-weight: 600; text-align: center; }
.preview-box strong { font-size: 13px; color: rgba(255,255,255,.92); font-weight: 800; }
.limit { margin-top: 10px; text-align: center; font-size: 11px; color: rgba(255,255,255,.4); }
.overlay { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: rgba(46,42,94,.55); backdrop-filter: blur(6px); padding: 24px; }
.rules-popup { width: 100%; max-width: 320px; padding: 24px 22px 20px; border-radius: 24px; background: #fff; box-shadow: 0 20px 40px rgba(46,42,94,.2); }
.rules-popup h3 { font-size: 18px; font-weight: 800; color: #333366; margin-bottom: 14px; text-align: center; }
.rules-popup ul { margin: 0 0 18px; padding-left: 18px; font-size: 13px; line-height: 1.7; color: #635a78; }
.rules-popup .pop-btn { width: 100%; padding: 14px; border: none; border-radius: 999px; background: linear-gradient(90deg, var(--task-primary-light), var(--task-primary)); color: #fff; font-weight: 700; font-size: 15px; cursor: pointer; }
.popup { position: relative; width: 100%; max-width: 310px; padding: 36px 26px 28px; border-radius: 30px; background: linear-gradient(168deg, #fefcff, #f8f0ff); text-align: center; box-shadow: 0 24px 48px rgba(46,42,94,.25); overflow: hidden; animation: pop-in 0.35s ease; }
.pop-burst { position: absolute; top: -40px; left: 50%; transform: translateX(-50%); width: 180px; height: 180px; border-radius: 50%; background: radial-gradient(circle, rgba(251,191,36,.25), transparent 70%); }
.pop-emoji { position: relative; font-size: 56px; margin-bottom: 8px; }
.popup h3 { position: relative; font-size: 22px; font-weight: 800; color: var(--task-primary); }
.popup p { position: relative; font-size: 13px; color: #7a7194; margin: 6px 0 18px; }
.pop-rewards { position: relative; display: flex; flex-direction: column; gap: 8px; margin-bottom: 22px; }
.pop-item { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; border-radius: 14px; font-weight: 800; font-size: 15px; }
.pop-item.exp { background: rgba(234,88,12,.1); color: #ea580c; }
.pop-item.coins { background: rgba(217,119,6,.1); color: #d97706; }
.pop-item.gems { background: rgba(124,58,237,.1); color: #7c3aed; }
.pop-btn { position: relative; width: 100%; padding: 16px; border-radius: 999px; border: none; background: linear-gradient(135deg, var(--task-primary-light), var(--task-primary)); color: #fff; font-weight: 800; font-size: 16px; cursor: pointer; box-shadow: 0 10px 24px rgba(123,97,255,.35); }
@keyframes pop-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
</style>
