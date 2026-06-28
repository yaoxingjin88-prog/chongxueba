<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import StudyRoomInfoPanel from './StudyRoomInfoPanel.vue'
import { studyRoomMenuBg } from '../config/ossAssets.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'voice' },
})

const emit = defineEmits(['update:modelValue', 'toast', 'exit'])
const router = useRouter()

const loading = ref(false)
const acting = ref(false)
const menuData = ref(null)
const panelView = ref('menu')
const infoInitialTab = ref('info')
const reportText = ref('')

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) {
      panelView.value = 'menu'
      reportText.value = ''
      return
    }
    await loadMenu()
  },
)

async function loadMenu() {
  loading.value = true
  try {
    menuData.value = await api.getStudyRoomMenu(props.mode)
  } catch (err) {
    emit('toast', err.message || '菜单加载失败')
    close()
  } finally {
    loading.value = false
  }
}

function close() {
  emit('update:modelValue', false)
}

function panelTitle() {
  if (panelView.value === 'members' || panelView.value === 'info') return '房间资料'
  if (panelView.value === 'rules') return '房间规则'
  if (panelView.value === 'report') return '举报反馈'
  return menuData.value?.title || '功能菜单'
}

function iconClass(key) {
  if (key === 'report') return 'slot-icon danger'
  return 'slot-icon'
}

async function onItemClick(item) {
  if (!menuData.value || acting.value) return

  if (item.key === 'members' || item.key === 'info') {
    infoInitialTab.value = item.key === 'members' ? 'members' : 'info'
    panelView.value = item.key
    return
  }

  if (item.key === 'rules') {
    panelView.value = 'rules'
    return
  }

  if (item.key === 'report') {
    panelView.value = 'report'
    reportText.value = ''
    return
  }

  acting.value = true
  try {
    if (item.key === 'invite') {
      close()
      router.push({ path: '/study-room/invite', query: { mode: props.mode } })
      return
    }

    if (item.key === 'notify') {
      const data = await api.studyRoomMenuAction({ action: 'toggle-notify', mode: props.mode })
      menuData.value.notifyEnabled = data.notifyEnabled
      emit('toast', data.message || '设置已更新')
    }
  } catch (err) {
    emit('toast', err.message || '操作失败')
  } finally {
    acting.value = false
  }
}

async function submitReport() {
  if (acting.value) return
  acting.value = true
  try {
    const data = await api.studyRoomMenuAction({
      action: 'report',
      mode: props.mode,
      message: reportText.value,
    })
    emit('toast', data.message || '反馈已提交')
    close()
  } catch (err) {
    emit('toast', err.message || '提交失败')
  } finally {
    acting.value = false
  }
}

function backToMenu() {
  panelView.value = 'menu'
  reportText.value = ''
}

function onInfoExit() {
  emit('exit')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="menu-fade">
      <div v-if="modelValue" class="sheet-root mobile-overlay" @click.self="close">
        <div
          class="sheet-panel"
          :class="{
            'is-menu': panelView === 'menu' && !loading,
            'is-room-info': (panelView === 'info' || panelView === 'members') && !loading,
          }"
        >
          <header
            v-if="loading || panelView !== 'menu'"
            class="sheet-header"
            :class="{ 'menu-header': panelView === 'menu' && !loading }"
          >
            <button
              v-if="panelView !== 'menu'"
              type="button"
              class="back-btn"
              aria-label="返回"
              @click="backToMenu"
            >
              <font-awesome-icon icon="chevron-left" />
            </button>
            <span v-else class="header-spacer" />

            <h2 class="sheet-title">
              <span class="title-star">✦</span>
              {{ panelTitle() }}
              <span class="title-star">✦</span>
            </h2>

            <button type="button" class="close-btn" aria-label="关闭" @click="close">
              <font-awesome-icon icon="xmark" />
            </button>
          </header>

          <div v-if="loading" class="loading-box">加载中...</div>

          <template v-else-if="menuData">
            <div v-if="panelView === 'menu'" class="menu-stage">
              <img :src="studyRoomMenuBg" alt="" class="menu-bg" aria-hidden="true">

              <header class="sheet-header menu-header">
                <span class="header-spacer" />
                <h2 class="sheet-title">
                  <span class="title-star">✦</span>
                  {{ panelTitle() }}
                  <span class="title-star">✦</span>
                </h2>
                <button type="button" class="close-btn" aria-label="关闭" @click="close">
                  <font-awesome-icon icon="xmark" />
                </button>
              </header>

              <div class="menu-grid">
                <button
                  v-for="item in menuData.items"
                  :key="item.key"
                  type="button"
                  class="menu-slot"
                  :disabled="acting"
                  @click="onItemClick(item)"
                >
                  <span :class="iconClass(item.key)">
                    <font-awesome-icon :icon="item.icon" />
                  </span>
                  <span class="slot-text">
                    <strong class="slot-name">
                      {{ item.title }}
                      <span v-if="item.key === 'notify' && menuData.notifyEnabled" class="notify-tag">已开启</span>
                    </strong>
                    <span class="slot-sub">{{ item.subtitle }}</span>
                  </span>
                </button>
              </div>

              <p class="menu-footer-text">{{ menuData.footerText }}</p>
            </div>

            <StudyRoomInfoPanel
              v-else-if="panelView === 'info' || panelView === 'members'"
              :mode="mode"
              :initial-tab="infoInitialTab"
              @back="backToMenu"
              @toast="emit('toast', $event)"
              @exit="onInfoExit"
              @invite="close"
            />

            <div v-else-if="panelView === 'rules'" class="sub-panel rules-panel">
              <p>{{ menuData.room.rules }}</p>
            </div>

            <div v-else-if="panelView === 'report'" class="sub-panel report-panel">
              <p class="report-tip">请描述你遇到的问题，我们会尽快处理。</p>
              <textarea
                v-model="reportText"
                class="report-input"
                rows="5"
                maxlength="500"
                placeholder="请输入反馈内容..."
              />
              <button type="button" class="submit-btn" :disabled="acting" @click="submitReport">
                {{ acting ? '提交中…' : '提交反馈' }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-root {
  z-index: 420;
  background: rgba(15, 20, 60, 0.52);
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
  background: linear-gradient(180deg, #f5f0ff 0%, #ebe3ff 38%, #f7f4ff 100%);
  border-radius: 28px 28px 0 0;
  padding: 16px 16px calc(14px + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -12px 36px rgba(88, 70, 160, 0.18);
}

.sheet-panel.is-menu {
  padding: 0 0 calc(env(safe-area-inset-bottom, 0px));
  background: transparent;
  overflow: hidden;
  box-shadow: none;
  max-height: none;
  border-radius: 28px 28px 0 0;
}

.sheet-panel.is-room-info {
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px 14px calc(12px + env(safe-area-inset-bottom, 0px));
  background:
    radial-gradient(circle at 20% 15%, rgba(253, 230, 138, 0.12), transparent 28%),
    radial-gradient(circle at 80% 25%, rgba(167, 139, 250, 0.18), transparent 32%),
    linear-gradient(180deg, #312e81 0%, #4c1d95 38%, #581c87 100%);
  box-shadow: 0 -12px 36px rgba(30, 20, 80, 0.35);
}

.is-room-info .sheet-header {
  margin-bottom: 10px;
}

.is-room-info .sheet-title {
  color: #fff;
}

.is-room-info .back-btn,
.is-room-info .close-btn {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.sheet-header {
  display: grid;
  grid-template-columns: 32px 1fr 32px;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.sheet-header.menu-header {
  position: absolute;
  top: 5.5%;
  left: 0;
  right: 0;
  z-index: 4;
  margin: 0;
  padding: 0 16px;
  pointer-events: none;
}

.menu-header .close-btn {
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.header-spacer {
  width: 32px;
}

.sheet-title {
  text-align: center;
  font-size: 18px;
  font-weight: 800;
  color: #5b4bb7;
  letter-spacing: 0.5px;
}

.menu-header .sheet-title {
  color: #fff;
  text-shadow: 0 1px 8px rgba(60, 30, 120, 0.25);
}

.title-star {
  color: #fde68a;
  font-size: 11px;
  margin: 0 5px;
  opacity: 0.95;
}

.back-btn,
.close-btn {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.72);
  color: #7c6bcf;
  font-size: 14px;
}

.close-btn {
  justify-self: end;
}

.loading-box {
  text-align: center;
  padding: 48px 0;
  color: #8b7ec8;
  font-size: 14px;
}

.menu-stage {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 28px 28px 0 0;
  background: linear-gradient(180deg, #b39cff 0%, #c4b5fd 42%, #ddd6fe 100%);
  isolation: isolate;
}

.menu-bg {
  display: block;
  width: 100%;
  height: auto;
  pointer-events: none;
  user-select: none;
  vertical-align: top;
}

.menu-grid {
  position: absolute;
  left: 8%;
  right: 8%;
  top: 15%;
  bottom: 24%;
  z-index: 3;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: repeat(3, 1fr);
  gap: 10px 10px;
}

.menu-slot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px 10px 8px;
  border-radius: 18px;
  background: transparent;
  text-align: left;
  min-height: 0;
}

.menu-slot:disabled {
  opacity: 0.75;
}

.menu-slot:active {
  transform: scale(0.98);
}

.slot-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  font-size: 24px;
  color: #7c3aed;
  background: transparent;
  box-shadow: none;
  filter: drop-shadow(0 3px 5px rgba(124, 58, 237, 0.28));
}

.slot-icon.danger {
  color: #ef4444;
  background: transparent;
  filter: drop-shadow(0 3px 5px rgba(239, 68, 68, 0.28));
}

.slot-text {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  padding-top: 1px;
}

.slot-name {
  display: block;
  font-size: 13px;
  font-weight: 800;
  color: #43308b;
  line-height: 1.3;
}

.notify-tag {
  margin-left: 4px;
  font-size: 10px;
  font-weight: 700;
  color: #8b5cf6;
}

.slot-sub {
  display: block;
  font-size: 10px;
  color: rgba(67, 48, 139, 0.58);
  line-height: 1.4;
}

.menu-footer-text {
  position: absolute;
  left: 8%;
  bottom: 8%;
  z-index: 3;
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 1px 6px rgba(80, 50, 140, 0.28);
  pointer-events: none;
}

.sub-panel {
  padding: 4px 2px 8px;
}

.sub-meta {
  font-size: 12px;
  color: #8b7ec8;
  margin-bottom: 10px;
}

.member-list {
  list-style: none;
  max-height: 52vh;
  overflow-y: auto;
}

.member-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 4px;
  border-bottom: 1px solid rgba(124, 107, 207, 0.12);
}

.member-rank {
  width: 18px;
  text-align: center;
  font-size: 12px;
}

.member-rank.gold { color: #fbbf24; }
.member-rank.silver { color: #cbd5e1; }
.member-rank.spacer { opacity: 0; }

.member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #43308b;
}

.member-focus {
  font-size: 10px;
  color: #9ca3af;
}

.member-status {
  font-size: 10px;
  color: #7c6bcf;
  white-space: nowrap;
}

.info-panel h3 {
  font-size: 17px;
  font-weight: 800;
  color: #43308b;
  margin-bottom: 12px;
}

.info-line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(124, 107, 207, 0.12);
  font-size: 13px;
  color: #43308b;
}

.info-line span {
  color: #9ca3af;
}

.info-desc {
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.65;
  color: #6b7280;
}

.rules-panel p {
  font-size: 13px;
  line-height: 1.7;
  color: #4b5563;
}

.report-tip {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 10px;
}

.report-input {
  width: 100%;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(124, 107, 207, 0.18);
  background: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  line-height: 1.5;
  color: #374151;
  resize: none;
}

.submit-btn {
  width: 100%;
  margin-top: 12px;
  padding: 12px;
  border-radius: 999px;
  background: linear-gradient(90deg, #8b5cf6, #6366f1);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}

.submit-btn:disabled {
  opacity: 0.7;
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.22s ease;
}

.menu-fade-enter-active .sheet-panel,
.menu-fade-leave-active .sheet-panel {
  transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
}

.menu-fade-enter-from .sheet-panel,
.menu-fade-leave-to .sheet-panel {
  transform: translateY(100%);
}
</style>
