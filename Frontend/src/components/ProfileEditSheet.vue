<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { avatarUrl, AVATAR_PRESETS, compressImageFile } from '../utils/avatar'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  type: {
    type: String,
    default: 'text',
    validator: (v) => ['text', 'date', 'gender', 'focus', 'avatar'].includes(v),
  },
  value: { type: [String, Number], default: '' },
  customAvatarUrl: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  maxLength: { type: Number, default: 0 },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const draft = ref('')
const localPreview = ref('')
const pickingLocal = ref(false)
const localError = ref('')
const inputRef = ref(null)
const fileInputRef = ref(null)

const genderOptions = [
  { label: '女', value: 'female' },
  { label: '男', value: 'male' },
  { label: '保密', value: 'other' },
]

const focusOptions = [15, 25, 45, 60]

const usingLocalAvatar = computed(() => Boolean(localPreview.value))

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    draft.value = props.value ?? ''
    localPreview.value = props.customAvatarUrl || ''
    localError.value = ''
    pickingLocal.value = false
    if (props.type === 'text') {
      nextTick(() => inputRef.value?.focus())
    }
  },
)

function close() {
  emit('update:modelValue', false)
}

function confirm() {
  const val = String(draft.value ?? '').trim()
  if (props.type === 'text' && !val) return
  emit('confirm', props.type === 'focus' ? Number(draft.value) : draft.value)
  close()
}

function selectOption(val) {
  draft.value = val
  if (props.type === 'gender' || props.type === 'focus' || props.type === 'avatar') {
    if (props.type === 'avatar') {
      localPreview.value = ''
      emit('confirm', { kind: 'preset', seed: val })
    } else {
      emit('confirm', val)
    }
    close()
  }
}

function openLocalPicker() {
  localError.value = ''
  fileInputRef.value?.click()
}

async function onLocalFileChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  pickingLocal.value = true
  localError.value = ''
  try {
    const dataUrl = await compressImageFile(file)
    localPreview.value = dataUrl
    emit('confirm', { kind: 'local', url: dataUrl })
    close()
  } catch (err) {
    localError.value = err.message || '图片处理失败'
  } finally {
    pickingLocal.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div v-if="modelValue" class="sheet-root mobile-overlay" @click.self="close">
        <div class="sheet-panel">
          <div class="sheet-handle" />
          <div class="sheet-header">
            <button type="button" class="sheet-cancel" @click="close">取消</button>
            <h3 class="sheet-title">{{ title }}</h3>
            <button
              v-if="type === 'text' || type === 'date'"
              type="button"
              class="sheet-confirm"
              @click="confirm"
            >
              确定
            </button>
            <span v-else class="sheet-spacer" />
          </div>

          <div class="sheet-body">
            <input
              v-if="type === 'text'"
              ref="inputRef"
              v-model="draft"
              class="sheet-input"
              type="text"
              :placeholder="placeholder"
              :maxlength="maxLength || undefined"
            >

            <input
              v-else-if="type === 'date'"
              v-model="draft"
              class="sheet-input sheet-input-date"
              type="date"
            >

            <div v-else-if="type === 'gender'" class="option-grid">
              <button
                v-for="opt in genderOptions"
                :key="opt.value"
                type="button"
                class="option-pill"
                :class="{ active: draft === opt.value }"
                @click="selectOption(opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>

            <div v-else-if="type === 'focus'" class="option-grid focus-grid">
              <button
                v-for="min in focusOptions"
                :key="min"
                type="button"
                class="option-pill"
                :class="{ active: Number(draft) === min }"
                @click="selectOption(min)"
              >
                {{ min }} 分钟
              </button>
            </div>

            <div v-else-if="type === 'avatar'" class="avatar-picker">
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                class="hidden-file-input"
                @change="onLocalFileChange"
              >

              <button
                type="button"
                class="local-pick-btn"
                :disabled="pickingLocal"
                @click="openLocalPicker"
              >
                <span class="local-pick-icon">
                  <font-awesome-icon icon="camera" />
                </span>
                <span class="local-pick-text">
                  <strong>{{ pickingLocal ? '处理中…' : '从相册选择' }}</strong>
                  <small>支持 JPG / PNG，最大 5MB</small>
                </span>
                <font-awesome-icon icon="chevron-right" class="local-pick-arrow" />
              </button>

              <p v-if="localError" class="local-error">{{ localError }}</p>

              <div v-if="usingLocalAvatar" class="local-preview">
                <img :src="localPreview" alt="当前自定义头像">
                <span>当前使用相册头像</span>
              </div>

              <p class="avatar-section-label">预设头像</p>

              <div class="avatar-grid">
                <button
                  v-for="item in AVATAR_PRESETS"
                  :key="item.seed"
                  type="button"
                  class="avatar-option"
                  :class="{ active: !usingLocalAvatar && draft === item.seed }"
                  @click="selectOption(item.seed)"
                >
                  <img :src="avatarUrl(item.seed)" :alt="item.label">
                  <span>{{ item.label }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-root {
  z-index: 300;
  background: rgba(45, 40, 80, 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
}

.sheet-panel {
  width: 100%;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 24px 24px 0 0;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -8px 40px rgba(93, 95, 239, 0.18);
}

.sheet-handle {
  width: 40px;
  height: 4px;
  border-radius: 999px;
  background: rgba(142, 142, 188, 0.35);
  margin: 10px auto 6px;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 16px 12px;
}

.sheet-title {
  font-size: 16px;
  font-weight: 700;
  color: #4a4580;
}

.sheet-cancel,
.sheet-confirm {
  font-size: 14px;
  padding: 6px 4px;
  min-width: 44px;
}

.sheet-cancel {
  color: #8e8ebc;
}

.sheet-confirm {
  color: #8b5cf6;
  font-weight: 600;
}

.sheet-spacer {
  width: 44px;
}

.sheet-body {
  padding: 0 16px 8px;
}

.sheet-input {
  width: 100%;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1.5px solid rgba(139, 92, 246, 0.2);
  background: rgba(224, 231, 255, 0.45);
  font: inherit;
  font-size: 15px;
  color: #4a4580;
  outline: none;
}

.sheet-input:focus {
  border-color: rgba(139, 92, 246, 0.55);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
}

.sheet-input-date {
  appearance: none;
  -webkit-appearance: none;
}

.option-grid {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 8px 0 12px;
}

.focus-grid {
  flex-wrap: wrap;
}

.option-pill {
  flex: 1;
  min-width: 88px;
  padding: 14px 12px;
  border-radius: 16px;
  border: 1.5px solid rgba(139, 92, 246, 0.18);
  background: rgba(224, 231, 255, 0.35);
  font-size: 15px;
  font-weight: 600;
  color: #4a4580;
  transition: all 0.15s ease;
}

.option-pill.active {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.25), rgba(139, 92, 246, 0.18));
  color: #7c3aed;
  box-shadow: 0 4px 14px rgba(139, 92, 246, 0.2);
}

.hidden-file-input {
  display: none;
}

.avatar-picker {
  padding-bottom: 4px;
}

.local-pick-btn {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 12px;
  border-radius: 18px;
  border: 1.5px solid rgba(139, 92, 246, 0.22);
  background: linear-gradient(135deg, rgba(224, 231, 255, 0.65), rgba(237, 233, 254, 0.85));
  text-align: left;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.local-pick-btn:active:not(:disabled) {
  transform: scale(0.99);
}

.local-pick-btn:disabled {
  opacity: 0.72;
}

.local-pick-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: linear-gradient(135deg, #a78bfa, #8b5cf6);
  color: #fff;
  font-size: 16px;
  flex-shrink: 0;
}

.local-pick-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.local-pick-text strong {
  font-size: 15px;
  color: #4a4580;
}

.local-pick-text small {
  font-size: 12px;
  color: #8e8ebc;
}

.local-pick-arrow {
  font-size: 11px;
  color: #c4c0dc;
  flex-shrink: 0;
}

.local-error {
  margin: -4px 0 10px;
  font-size: 12px;
  color: #ef4444;
}

.local-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin-bottom: 12px;
  border-radius: 16px;
  background: rgba(224, 231, 255, 0.45);
}

.local-preview img {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.18);
}

.local-preview span {
  font-size: 13px;
  color: #7c3aed;
  font-weight: 600;
}

.avatar-section-label {
  margin-bottom: 10px;
  padding-left: 2px;
  font-size: 13px;
  font-weight: 700;
  color: #8e8ebc;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  padding: 0 0 12px;
}

.avatar-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px 8px;
  border-radius: 18px;
  border: 2px solid transparent;
  background: rgba(224, 231, 255, 0.35);
  transition: all 0.15s ease;
}

.avatar-option.active {
  border-color: #8b5cf6;
  background: rgba(167, 139, 250, 0.15);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.22);
}

.avatar-option img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.9);
}

.avatar-option span {
  font-size: 12px;
  color: #4a4580;
  font-weight: 600;
}

.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity 0.22s ease;
}

.sheet-fade-enter-active .sheet-panel,
.sheet-fade-leave-active .sheet-panel {
  transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}

.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}

.sheet-fade-enter-from .sheet-panel,
.sheet-fade-leave-to .sheet-panel {
  transform: translateY(100%);
}
</style>
