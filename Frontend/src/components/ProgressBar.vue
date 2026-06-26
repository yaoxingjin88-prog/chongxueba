<script setup>
defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  color: { type: String, default: 'var(--primary-light)' },
  height: { type: String, default: '6px' },
  showLabel: { type: Boolean, default: false },
  label: { type: String, default: '' },
})
</script>

<template>
  <div class="progress-wrap">
    <div v-if="showLabel" class="progress-label">
      <span>{{ label }}</span>
      <span>{{ value }}%</span>
    </div>
    <div class="progress-track" :style="{ height }">
      <div
        class="progress-fill"
        :style="{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }"
      />
    </div>
  </div>
</template>

<style scoped>
.progress-wrap {
  width: 100%;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 6px;
  color: var(--text-muted);
}

.progress-track {
  width: 100%;
  background: rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
}
</style>
