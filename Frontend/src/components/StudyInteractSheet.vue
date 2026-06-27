<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  data: { type: Object, default: null },
  joining: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'join', 'utility'])

const rulesOpen = ref(false)
const privacyOpen = ref(false)

watch(() => props.modelValue, (open) => {
  if (!open) {
    rulesOpen.value = false
    privacyOpen.value = false
  }
})

function close() {
  emit('update:modelValue', false)
}

function joinMode(key) {
  if (props.joining) return
  emit('join', key)
}

function onUtility(key) {
  if (key === 'rules') {
    rulesOpen.value = !rulesOpen.value
    privacyOpen.value = false
    return
  }
  if (key === 'privacy') {
    privacyOpen.value = !privacyOpen.value
    rulesOpen.value = false
    return
  }
  emit('utility', key)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="interact-fade">
      <div v-if="modelValue" class="sheet-root mobile-overlay" @click.self="close">
        <div class="sheet-panel">
          <header class="sheet-header">
            <div>
              <h2 class="sheet-title">{{ data?.title || '互动功能' }}</h2>
              <p class="sheet-subtitle">{{ data?.subtitle || '选择你想要的互动方式' }}</p>
            </div>
            <button type="button" class="close-btn" aria-label="关闭" @click="close">
              <font-awesome-icon icon="xmark" />
            </button>
          </header>

          <div v-if="data" class="mode-grid">
            <article
              v-for="mode in data.modes"
              :key="mode.key"
              class="mode-card"
              :class="`mode-${mode.key}`"
            >
              <div class="mode-visual">
                <span v-if="mode.key === 'voice'" class="mode-emoji">🎙️</span>
                <span v-else class="mode-emoji">📹</span>
                <span class="mode-sparkle sparkle-a">✦</span>
                <span class="mode-sparkle sparkle-b">✦</span>
              </div>
              <h3 class="mode-title">{{ mode.title }}</h3>
              <p class="mode-desc">{{ mode.subtitle }}</p>
              <p v-if="mode.onlineCount" class="mode-online">{{ mode.onlineCount }} 人正在{{ mode.key === 'voice' ? '连麦' : '视频' }}</p>
              <button
                type="button"
                class="enter-btn"
                :disabled="joining"
                @click="joinMode(mode.key)"
              >
                {{ joining ? '进入中…' : '立即进入' }}
              </button>
            </article>
          </div>

          <div v-if="data?.utilities?.length" class="utility-row">
            <button
              v-for="item in data.utilities"
              :key="item.key"
              type="button"
              class="utility-item"
              @click="onUtility(item.key)"
            >
              <span class="utility-icon" :class="`icon-${item.key}`">
                <font-awesome-icon :icon="item.icon" />
              </span>
              <span class="utility-title">{{ item.title }}</span>
              <span class="utility-sub">{{ item.subtitle }}</span>
            </button>
          </div>

          <div v-if="rulesOpen && data?.rules" class="info-panel">
            <h4>房间规则</h4>
            <p>{{ data.rules }}</p>
          </div>
          <div v-if="privacyOpen && data?.privacy" class="info-panel">
            <h4>权限说明</h4>
            <p>{{ data.privacy }}</p>
          </div>

          <p v-if="data?.currentMode && data.currentMode !== 'none'" class="current-mode">
            当前状态：{{ data.currentModeLabel }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-root {
  z-index: 400;
  background: rgba(15, 20, 60, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
}

.sheet-panel {
  width: 100%;
  max-height: 78vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: #fff;
  border-radius: 28px 28px 0 0;
  padding: 22px 18px calc(20px + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -12px 40px rgba(30, 40, 120, 0.18);
}

.sheet-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.sheet-title {
  font-size: 20px;
  font-weight: 800;
  color: #1e2a5a;
  margin-bottom: 4px;
}

.sheet-subtitle {
  font-size: 13px;
  color: #8b93b0;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #f3f4f8;
  color: #6b7280;
  font-size: 14px;
  flex-shrink: 0;
}

.mode-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 18px;
}

.mode-card {
  position: relative;
  border-radius: 22px;
  padding: 16px 14px 14px;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.mode-voice {
  background: linear-gradient(165deg, #7c3aed 0%, #9333ea 45%, #c084fc 100%);
}

.mode-video {
  background: linear-gradient(165deg, #2563eb 0%, #3b82f6 45%, #60a5fa 100%);
}

.mode-visual {
  position: relative;
  height: 72px;
  margin-bottom: 8px;
}

.mode-emoji {
  font-size: 48px;
  line-height: 1;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
}

.mode-sparkle {
  position: absolute;
  font-size: 14px;
  color: #fde68a;
  opacity: 0.9;
}

.sparkle-a { top: 4px; right: 18px; }
.sparkle-b { top: 28px; right: 6px; font-size: 10px; }

.mode-title {
  font-size: 17px;
  font-weight: 800;
  margin-bottom: 6px;
}

.mode-desc {
  font-size: 11px;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.88);
  flex: 1;
}

.mode-online {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 10px;
}

.enter-btn {
  width: 100%;
  padding: 10px;
  border-radius: 999px;
  background: #fff;
  font-size: 13px;
  font-weight: 700;
  margin-top: auto;
}

.mode-voice .enter-btn { color: #7c3aed; }
.mode-video .enter-btn { color: #2563eb; }

.enter-btn:disabled {
  opacity: 0.7;
}

.utility-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 8px;
}

.utility-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 6px;
  border-radius: 16px;
  background: #f7f8fc;
}

.utility-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 16px;
}

.icon-rules { background: #ede9fe; color: #7c3aed; }
.icon-privacy { background: #dbeafe; color: #2563eb; }
.icon-spectate { background: #f3e8ff; color: #9333ea; }

.utility-title {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
}

.utility-sub {
  font-size: 10px;
  color: #9ca3af;
  text-align: center;
}

.info-panel {
  margin-top: 12px;
  padding: 14px;
  border-radius: 14px;
  background: #f7f8fc;
  font-size: 12px;
  line-height: 1.6;
  color: #4b5563;
}

.info-panel h4 {
  font-size: 13px;
  font-weight: 700;
  color: #1e2a5a;
  margin-bottom: 6px;
}

.current-mode {
  margin-top: 12px;
  text-align: center;
  font-size: 12px;
  color: #6366f1;
  font-weight: 600;
}

.interact-fade-enter-active,
.interact-fade-leave-active {
  transition: opacity 0.22s ease;
}

.interact-fade-enter-active .sheet-panel,
.interact-fade-leave-active .sheet-panel {
  transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}

.interact-fade-enter-from,
.interact-fade-leave-to {
  opacity: 0;
}

.interact-fade-enter-from .sheet-panel,
.interact-fade-leave-to .sheet-panel {
  transform: translateY(100%);
}
</style>
