<script setup>
import ChestTierIcon from './ChestTierIcon.vue'

defineProps({
  tier: { type: Number, default: 1 },
  open: { type: Boolean, default: false },
  glowing: { type: Boolean, default: false },
})
</script>

<template>
  <ChestTierIcon :tier="tier" :size="220" :floating="true" :glowing="glowing" :open="open" />
</template>
