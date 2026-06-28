<template>
  <div class="dream-page-bg" aria-hidden="true">
    <div class="dream-page-bg__gradient" />
    <div class="dream-page-bg__stars" />
    <div class="dream-page-bg__clouds" />
    <div class="dream-page-bg__glow dream-page-bg__glow--1" />
    <div class="dream-page-bg__glow dream-page-bg__glow--2" />
    <div class="dream-page-bg__glow dream-page-bg__glow--warm" />
  </div>
</template>

<style scoped>
.dream-page-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* 深紫蓝夜空 → 柔和薰衣草，衬托橙色狐狸 mascot */
.dream-page-bg__gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    #1a1835 0%,
    #252247 12%,
    #2f2a58 28%,
    #3d3569 45%,
    #5a4f8a 62%,
    #7b6fad 78%,
    #a89fd4 92%,
    #c4bce8 100%
  );
}

.dream-page-bg__stars {
  position: absolute;
  inset: 0;
  opacity: 1;
  background-image:
    radial-gradient(1.5px 1.5px at 8% 12%, rgba(255,255,255,.95) 0%, transparent 100%),
    radial-gradient(1px 1px at 22% 28%, rgba(255,255,255,.75) 0%, transparent 100%),
    radial-gradient(2px 2px at 45% 8%, rgba(255,255,255,.9) 0%, transparent 100%),
    radial-gradient(1px 1px at 68% 18%, rgba(255,255,255,.7) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 85% 32%, rgba(255,255,255,.85) 0%, transparent 100%),
    radial-gradient(1px 1px at 15% 45%, rgba(255,255,255,.55) 0%, transparent 100%),
    radial-gradient(1px 1px at 55% 38%, rgba(255,255,255,.6) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 78% 52%, rgba(255,255,255,.75) 0%, transparent 100%),
    radial-gradient(1px 1px at 32% 22%, rgba(253,224,71,.45) 0%, transparent 100%),
    radial-gradient(1px 1px at 92% 14%, rgba(255,255,255,.8) 0%, transparent 100%),
    radial-gradient(1px 1px at 38% 62%, rgba(255,255,255,.5) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 72% 68%, rgba(255,255,255,.55) 0%, transparent 100%),
    radial-gradient(1px 1px at 5% 78%, rgba(255,255,255,.45) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 48% 88%, rgba(255,255,255,.6) 0%, transparent 100%),
    radial-gradient(1px 1px at 88% 72%, rgba(255,255,255,.5) 0%, transparent 100%),
    radial-gradient(2px 2px at 12% 58%, rgba(196,181,253,.35) 0%, transparent 100%);
}

.dream-page-bg__clouds {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 38%;
  opacity: 0.85;
  background:
    radial-gradient(ellipse 120% 80% at 15% 100%, rgba(255, 255, 255, 0.38) 0%, transparent 58%),
    radial-gradient(ellipse 90% 70% at 55% 105%, rgba(255, 255, 255, 0.32) 0%, transparent 55%),
    radial-gradient(ellipse 100% 75% at 88% 100%, rgba(255, 255, 255, 0.28) 0%, transparent 52%),
    radial-gradient(ellipse 70% 50% at 35% 92%, rgba(196, 181, 253, 0.35) 0%, transparent 60%),
    radial-gradient(ellipse 80% 55% at 72% 94%, rgba(196, 181, 253, 0.28) 0%, transparent 58%);
  filter: blur(2px);
  pointer-events: none;
}

.dream-page-bg__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(48px);
}

.dream-page-bg__glow--1 {
  width: 220px;
  height: 220px;
  top: 6%;
  right: -50px;
  background: rgba(123, 97, 255, 0.38);
  opacity: 0.55;
}

.dream-page-bg__glow--2 {
  width: 180px;
  height: 180px;
  top: 38%;
  left: -40px;
  background: rgba(164, 148, 232, 0.32);
  opacity: 0.45;
}

/* 右上暖色光晕，与狐狸橙色调和 */
.dream-page-bg__glow--warm {
  width: 160px;
  height: 160px;
  top: 10%;
  right: 8%;
  background: rgba(251, 146, 60, 0.14);
  filter: blur(56px);
  opacity: 0.7;
}
</style>
