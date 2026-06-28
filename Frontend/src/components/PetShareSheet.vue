<script setup>
import { ref, computed, watch } from 'vue'
import { api } from '../api'
import { avatarUrl } from '../utils/avatar'
import { PET_STAGE_IMAGES } from '../utils/petStages.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'toast'])

const loading = ref(false)
const acting = ref(false)
const shareData = ref(null)

const canNativeShare = computed(
  () => typeof navigator !== 'undefined' && typeof navigator.share === 'function',
)

const previewImage = computed(() => {
  const key = shareData.value?.preview?.stageKey || 'growth'
  return PET_STAGE_IMAGES[key] || PET_STAGE_IMAGES.growth
})

const expPercent = computed(() => {
  const p = shareData.value?.preview
  if (!p) return 0
  return Math.min(100, Math.round((p.exp / Math.max(p.expMax, 1)) * 100))
})

watch(
  () => props.modelValue,
  (open) => {
    if (open) loadShare()
  },
)

function close() {
  emit('update:modelValue', false)
}

async function loadShare() {
  loading.value = true
  try {
    shareData.value = await api.getPetShare()
  } catch (err) {
    emit('toast', err.message || '加载分享失败')
    close()
  } finally {
    loading.value = false
  }
}

async function copyText(text, message) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    }
    emit('toast', message)
  } catch {
    emit('toast', '复制失败')
  }
}

async function onShare(key) {
  if (acting.value) return
  acting.value = true
  const actionMap = {
    wechat: 'share-wechat',
    qq: 'share-qq',
    link: 'share-link',
    copy: 'share-copy',
  }
  try {
    const data = await api.petShareAction(actionMap[key] || 'share-copy')
    await copyText(data.copyText || data.shareText || data.shareLink, data.message || '已复制')
  } catch (err) {
    const fallback = shareData.value
    const text = key === 'link' ? fallback?.shareLink : fallback?.shareText
    if (text) {
      await copyText(text, key === 'link' ? '宠物链接已复制' : '分享文案已复制')
    } else {
      emit('toast', err.message || '分享失败')
    }
  } finally {
    acting.value = false
  }
}

async function onSystemShare() {
  if (acting.value || !shareData.value) return
  acting.value = true
  try {
    if (canNativeShare.value) {
      await navigator.share({
        title: shareData.value.title,
        text: shareData.value.shareText,
        url: shareData.value.shareLink,
      })
      emit('toast', '分享成功')
      close()
      return
    }
    await copyText(shareData.value.shareText, '分享文案已复制')
  } catch (err) {
    if (err?.name !== 'AbortError') {
      emit('toast', '分享失败')
    }
  } finally {
    acting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div v-if="modelValue" class="share-overlay mobile-overlay" @click.self="close">
        <div class="share-sheet" @click.stop>
          <div class="sheet-stars" aria-hidden="true">
            <span v-for="n in 8" :key="n" class="star" />
          </div>

          <header class="share-header">
            <div>
              <h2>{{ shareData?.title || '分享我的宠物' }}</h2>
              <p>{{ shareData?.subtitle || '晒晒小橙的成长' }}</p>
            </div>
            <button type="button" class="close-btn" aria-label="关闭" @click="close">
              <font-awesome-icon icon="xmark" />
            </button>
          </header>

          <div v-if="loading" class="share-loading">加载中…</div>

          <template v-else-if="shareData">
            <div class="share-card">
              <div class="card-top">
                <img
                  :src="avatarUrl(shareData.preview.avatarSeed, shareData.preview.avatarUrl)"
                  alt=""
                  class="card-avatar"
                >
                <div class="card-info">
                  <strong>{{ shareData.preview.petName }}</strong>
                  <span>Lv.{{ shareData.preview.level }} · {{ shareData.preview.stageLabel }}</span>
                </div>
                <div class="card-stars">
                  <font-awesome-icon icon="star" />
                  {{ shareData.preview.growthStars }}
                </div>
              </div>

              <div class="card-hero">
                <img :src="previewImage" alt="" class="hero-img">
              </div>

              <div class="card-exp">
                <div class="exp-track">
                  <span class="exp-fill" :style="{ width: `${expPercent}%` }" />
                </div>
                <small>{{ shareData.preview.exp }}/{{ shareData.preview.expMax }}</small>
              </div>

              <div class="card-stats">
                <div>
                  <strong>{{ shareData.preview.stats.studyPower }}</strong>
                  <span>学习力</span>
                </div>
                <div>
                  <strong>{{ shareData.preview.stats.focusPower }}</strong>
                  <span>专注力</span>
                </div>
                <div>
                  <strong>{{ shareData.preview.stats.vitality }}</strong>
                  <span>活力</span>
                </div>
                <div>
                  <strong>{{ shareData.preview.stats.intimacy }}</strong>
                  <span>亲密度</span>
                </div>
              </div>

              <p class="card-footer">宠学霸 · 和我一起养专属学伴</p>
            </div>

            <p class="share-tip">选择分享方式，邀请好友一起养宠</p>

            <div class="share-grid">
              <button
                v-for="item in shareData.shareMethods"
                :key="item.key"
                type="button"
                class="share-item"
                :disabled="acting"
                @click="onShare(item.key)"
              >
                <span class="share-icon" :class="item.key">
                  <font-awesome-icon
                    :icon="item.key === 'wechat' ? 'comment' : item.key === 'qq' ? 'user' : item.key === 'link' ? 'link' : 'copy'"
                  />
                </span>
                <span>{{ item.label }}</span>
              </button>
            </div>

            <button
              v-if="canNativeShare"
              type="button"
              class="system-share-btn"
              :disabled="acting"
              @click="onSystemShare"
            >
              <font-awesome-icon icon="share-nodes" />
              系统分享
            </button>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.share-overlay {
  z-index: 500;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(8, 12, 36, 0.55);
  backdrop-filter: blur(4px);
}

.share-sheet {
  position: relative;
  width: 100%;
  max-height: 92dvh;
  overflow-y: auto;
  border-radius: 22px 22px 0 0;
  padding: 18px 16px calc(20px + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(165deg, #1e1b4b 0%, #312e81 50%, #43308b 100%);
  border-top: 1px solid rgba(129, 140, 248, 0.35);
  box-shadow: 0 -12px 40px rgba(30, 27, 75, 0.45);
}

.sheet-stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.star {
  position: absolute;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
}

.star:nth-child(1) { top: 12%; left: 15%; }
.star:nth-child(2) { top: 8%; right: 22%; width: 3px; height: 3px; }
.star:nth-child(3) { top: 22%; left: 45%; opacity: 0.5; }
.star:nth-child(4) { top: 35%; right: 12%; }
.star:nth-child(5) { bottom: 40%; left: 8%; }
.star:nth-child(6) { bottom: 25%; right: 30%; opacity: 0.4; }
.star:nth-child(7) { top: 18%; left: 72%; }
.star:nth-child(8) { bottom: 55%; right: 8%; }

.share-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.share-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #f3e8ff;
}

.share-header p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #c4b5fd;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: #e0e7ff;
  display: grid;
  place-items: center;
}

.share-loading {
  text-align: center;
  padding: 32px 0;
  color: #c4b5fd;
  font-size: 13px;
}

.share-card {
  position: relative;
  z-index: 1;
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(12px);
  margin-bottom: 14px;
}

.card-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-info strong {
  display: block;
  font-size: 14px;
  color: #fff;
}

.card-info span {
  font-size: 10px;
  color: #fde68a;
  font-weight: 600;
}

.card-stars {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(251, 191, 36, 0.2);
  color: #fde68a;
  font-size: 11px;
  font-weight: 800;
}

.card-hero {
  display: flex;
  justify-content: center;
  margin: 10px 0 8px;
}

.hero-img {
  width: min(68%, 180px);
  object-fit: contain;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.25));
}

.card-exp {
  margin-bottom: 10px;
}

.exp-track {
  height: 5px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.25);
  overflow: hidden;
  margin-bottom: 4px;
}

.exp-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
}

.card-exp small {
  font-size: 9px;
  color: #ddd6fe;
}

.card-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 10px;
}

.card-stats div {
  text-align: center;
  padding: 6px 4px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.15);
}

.card-stats strong {
  display: block;
  font-size: 13px;
  color: #fff;
}

.card-stats span {
  font-size: 8px;
  color: #c4b5fd;
}

.card-footer {
  margin: 0;
  text-align: center;
  font-size: 10px;
  color: #a5b4fc;
}

.share-tip {
  position: relative;
  z-index: 1;
  text-align: center;
  font-size: 11px;
  color: #c4b5fd;
  margin-bottom: 12px;
}

.share-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.share-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 600;
  color: #e0e7ff;
}

.share-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 18px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.share-icon.wechat { color: #4ade80; }
.share-icon.qq { color: #60a5fa; }
.share-icon.link { color: #a5b4fc; }
.share-icon.copy { color: #e879f9; }

.system-share-btn {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 13px;
  border-radius: 14px;
  background: linear-gradient(90deg, #6366f1, #a855f7);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.system-share-btn:disabled {
  opacity: 0.6;
}

.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity 0.25s ease;
}

.sheet-fade-enter-active .share-sheet,
.sheet-fade-leave-active .share-sheet {
  transition: transform 0.28s ease;
}

.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}

.sheet-fade-enter-from .share-sheet,
.sheet-fade-leave-to .share-sheet {
  transform: translateY(100%);
}
</style>
