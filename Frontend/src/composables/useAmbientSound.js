import { ref, onUnmounted } from 'vue'
import { AMBIENT_SOUNDS, DEFAULT_AMBIENT_KEY, getAmbientByKey } from '../config/ambientSounds'

const FADE_MS = 600
const FADE_STEP = 40

let sharedAudio = null
let fadeTimer = null
const currentKey = ref(null)
const isPlaying = ref(false)
const isLoading = ref(false)

function clearFade() {
  if (fadeTimer) {
    clearInterval(fadeTimer)
    fadeTimer = null
  }
}

function fadeVolume(audio, from, to, onDone) {
  clearFade()
  const steps = Math.max(1, Math.round(FADE_MS / FADE_STEP))
  let step = 0
  const delta = (to - from) / steps

  fadeTimer = setInterval(() => {
    step += 1
    audio.volume = Math.max(0, Math.min(1, from + delta * step))
    if (step >= steps) {
      clearFade()
      audio.volume = to
      onDone?.()
    }
  }, FADE_STEP)
}

function stopAudio() {
  if (!sharedAudio) return
  const audio = sharedAudio
  fadeVolume(audio, audio.volume, 0, () => {
    audio.pause()
    audio.currentTime = 0
    isPlaying.value = false
  })
}

async function playSound(key) {
  const sound = getAmbientByKey(key)
  if (!sound?.url) return

  if (currentKey.value === key && isPlaying.value) return

  isLoading.value = true

  try {
    if (!sharedAudio) {
      sharedAudio = new Audio()
      sharedAudio.loop = true
      sharedAudio.preload = 'auto'
    }

    const audio = sharedAudio
    const targetVolume = sound.volume

    const startNew = () => {
      audio.src = sound.url
      audio.volume = 0
      currentKey.value = key
      return audio.play().then(() => {
        isPlaying.value = true
        fadeVolume(audio, 0, targetVolume)
      })
    }

    if (isPlaying.value && audio.src) {
      await new Promise((resolve) => {
        fadeVolume(audio, audio.volume, 0, () => {
          audio.pause()
          resolve()
        })
      })
    }

    await startNew()
  } catch (err) {
    console.warn('环境音播放失败:', err)
    isPlaying.value = false
  } finally {
    isLoading.value = false
  }
}

function stopCurrent() {
  stopAudio()
  currentKey.value = null
}

export function useAmbientSound() {
  onUnmounted(() => {
    // 离开页面时不停止，自习室/专注页可共享背景音
  })

  return {
    sounds: AMBIENT_SOUNDS,
    currentKey,
    isPlaying,
    isLoading,
    playSound,
    stopAudio,
    stopCurrent,
    defaultKey: DEFAULT_AMBIENT_KEY,
  }
}

export function getAmbientCurrentKey() {
  return currentKey.value
}

export function getAmbientIsPlaying() {
  return isPlaying.value
}
