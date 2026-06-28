<script setup>
defineProps({
  mood: {
    type: String,
    default: 'happy',
    validator: (v) => ['happy', 'warn', 'sleep', 'focus'].includes(v),
  },
})
</script>

<template>
  <svg
    class="ai-bot"
    :class="[`mood-${mood}`]"
    viewBox="0 0 120 120"
    role="img"
    aria-label="AI 助手"
  >
    <defs>
      <linearGradient id="aiBotBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#c5dcff" />
        <stop offset="50%" stop-color="#9ec0ff" />
        <stop offset="100%" stop-color="#78a8f7" />
      </linearGradient>
      <linearGradient id="aiBotBody" x1="35%" y1="0%" x2="65%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#edf2ff" />
      </linearGradient>
      <radialGradient id="aiBotEyeGlow" cx="45%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#b8fbff" />
        <stop offset="45%" stop-color="#4fd4ff" />
        <stop offset="100%" stop-color="#1994ff" />
      </radialGradient>
      <radialGradient id="aiBotEyeWarn" cx="45%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#fde68a" />
        <stop offset="100%" stop-color="#f59e0b" />
      </radialGradient>
      <filter id="aiBotEyeFilter" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="1.8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <rect width="120" height="120" rx="24" fill="url(#aiBotBg)" />

    <ellipse cx="60" cy="108" rx="22" ry="4.5" fill="rgba(38, 66, 130, .16)" />

    <g class="ai-bot-float">
      <ellipse cx="33" cy="79" rx="7.5" ry="9.5" fill="url(#aiBotBody)" />
      <ellipse cx="87" cy="79" rx="7.5" ry="9.5" fill="url(#aiBotBody)" />

      <rect x="43" y="67" width="34" height="26" rx="13" fill="url(#aiBotBody)" />

      <circle cx="60" cy="47" r="27" fill="url(#aiBotBody)" />
      <ellipse cx="52" cy="36" rx="10" ry="6" fill="#fff" opacity=".55" />

      <path
        d="M36 28 C34 14 40 8 47 16 C42 12 38 18 36 28 Z"
        fill="url(#aiBotBody)"
      />
      <path
        d="M84 28 C86 14 80 8 73 16 C78 12 82 18 84 28 Z"
        fill="url(#aiBotBody)"
      />
      <path d="M40 24 C41 18 44 16 46 20 C44 17 41 20 40 24 Z" fill="#ffc8dc" opacity=".75" />
      <path d="M80 24 C79 18 76 16 74 20 C76 17 79 20 80 24 Z" fill="#ffc8dc" opacity=".75" />

      <rect x="41" y="35" width="38" height="23" rx="11.5" fill="#1a284d" />
      <rect x="43" y="37" width="34" height="19" rx="9.5" fill="#243760" />

      <g class="ai-bot-eyes" filter="url(#aiBotEyeFilter)">
        <ellipse cx="50.5" cy="46.5" rx="6" ry="7.5" fill="url(#aiBotEyeGlow)" class="eye-left" />
        <ellipse cx="69.5" cy="46.5" rx="6" ry="7.5" fill="url(#aiBotEyeGlow)" class="eye-right" />
      </g>
      <ellipse cx="51.5" cy="44.5" rx="2.2" ry="2.8" fill="#e8feff" opacity=".95" class="eye-shine" />
      <ellipse cx="70.5" cy="44.5" rx="2.2" ry="2.8" fill="#e8feff" opacity=".95" class="eye-shine" />

      <circle cx="57" cy="57" r="2" fill="#ff9ec8" opacity=".5" />
      <circle cx="63" cy="57" r="2" fill="#ff9ec8" opacity=".5" />
    </g>
  </svg>
</template>

<style scoped>
.ai-bot {
  display: block;
  width: 100%;
  height: 100%;
}

.ai-bot-float {
  transform-origin: 60px 70px;
  animation: aiBotBob 3.2s ease-in-out infinite;
}

.ai-bot-eyes {
  animation: aiBotBlink 5s ease-in-out infinite;
  transform-origin: 60px 46px;
}

.mood-warn .ai-bot-float {
  animation: aiBotShake 0.5s ease-in-out infinite;
}

.mood-warn .eye-left,
.mood-warn .eye-right {
  fill: url(#aiBotEyeWarn);
}

.mood-sleep .ai-bot-eyes {
  animation: none;
  transform: scaleY(0.15);
}

.mood-sleep .eye-shine {
  opacity: 0;
}

.mood-focus .ai-bot-float {
  animation: aiBotBob 2s ease-in-out infinite;
}

@keyframes aiBotBob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2.5px); }
}

@keyframes aiBotBlink {
  0%, 42%, 46%, 100% { transform: scaleY(1); }
  44% { transform: scaleY(.12); }
}

@keyframes aiBotShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-1.5px); }
  75% { transform: translateX(1.5px); }
}
</style>
