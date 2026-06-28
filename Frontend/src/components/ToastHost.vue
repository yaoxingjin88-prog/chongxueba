<script setup>
import { useToast } from '../composables/useToast'

const { toasts } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="toast-host" aria-live="polite">
      <TransitionGroup name="toast">
        <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type">
          <font-awesome-icon v-if="t.type === 'success'" icon="circle-check" />
          <font-awesome-icon v-else-if="t.type === 'reward'" icon="coins" />
          <font-awesome-icon v-else icon="bell" />
          <span>{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-host {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 12px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  width: min(360px, calc(100% - 32px));
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8px 28px rgba(46, 42, 94, 0.18);
  font-size: 14px;
  font-weight: 600;
  color: #333366;
  backdrop-filter: blur(8px);
}

.toast.success { color: #059669; }
.toast.success svg { color: #4cd964; }
.toast.reward { color: #b45309; }
.toast.reward svg { color: #fbbf24; }

.toast-enter-active,
.toast-leave-active { transition: all 0.28s ease; }
.toast-enter-from { opacity: 0; transform: translateY(-12px) scale(0.96); }
.toast-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
