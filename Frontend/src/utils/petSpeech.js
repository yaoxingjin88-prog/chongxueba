const API_BASE = '/api/tts/pet'
const VOICE_STORAGE_KEY = 'chong-xueba-pet-voice'

let currentAudio = null
let currentObjectUrl = null
let cachedVoiceId = null

function getAuthHeaders() {
  const token = localStorage.getItem('chong-xueba-token')
    || sessionStorage.getItem('chong-xueba-token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function formatPetSpeech(text) {
  return String(text || '')
    .trim()
    .replace(/\s+/g, '')
}

function synth() {
  return typeof window !== 'undefined' ? window.speechSynthesis : null
}

function decodeHeader(value) {
  if (!value) return ''
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function getStoredPetVoice() {
  return localStorage.getItem(VOICE_STORAGE_KEY) || cachedVoiceId || 'duoduo'
}

export function setStoredPetVoice(voiceId) {
  if (!voiceId) return
  localStorage.setItem(VOICE_STORAGE_KEY, voiceId)
  cachedVoiceId = voiceId
}

async function speakPetLocal(text) {
  const s = synth()
  if (!s) return false

  s.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'zh-CN'
  utter.rate = 0.93
  utter.pitch = 1.06
  utter.volume = 0.95
  s.speak(utter)
  return true
}

async function speakPetViaApi(text, voiceId) {
  const voice = voiceId || getStoredPetVoice()
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ text, voice }),
  })

  const contentType = res.headers.get('Content-Type') || ''
  if (!res.ok) {
    let message = '语音合成失败'
    try {
      const err = await res.json()
      message = err.message || message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  if (!contentType.includes('audio')) {
    throw new Error('语音接口未返回音频')
  }

  const blob = await res.blob()
  if (!blob.size) {
    throw new Error('语音数据为空')
  }

  const provider = res.headers.get('X-TTS-Provider') || ''
  const fallbackReason = decodeHeader(res.headers.get('X-TTS-Fallback-Reason'))

  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl)
    currentObjectUrl = null
  }

  currentObjectUrl = URL.createObjectURL(blob)
  currentAudio = new Audio(currentObjectUrl)
  currentAudio.volume = 1
  await currentAudio.play()

  return {
    ok: true,
    provider,
    fallbackReason,
    usedBrowserFallback: false,
  }
}

/**
 * 宠物台词朗读：优先后端百度/Edge TTS，仅接口完全失败时才用浏览器语音
 */
export async function speakPet(text, options = {}) {
  const content = formatPetSpeech(text)
  if (!content) return { ok: false }

  try {
    const result = await speakPetViaApi(content, options.voice)
    if (result.fallbackReason && options.onFallback) {
      options.onFallback(result.fallbackReason, result.provider)
    }
    return result
  } catch (err) {
    if (options.onFallback) {
      options.onFallback(err.message || '接口失败', 'browser')
    }
    await speakPetLocal(content)
    return { ok: true, usedBrowserFallback: true, provider: 'browser' }
  }
}

export function stopPetSpeech() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl)
    currentObjectUrl = null
  }
  synth()?.cancel()
}

export function isPetSpeechSupported() {
  return true
}

export async function getPetVoiceLabel() {
  try {
    const res = await fetch('/api/tts/pet/config')
    const json = await res.json()
    const voices = json.data?.voices || []
    const current = json.data?.voice || getStoredPetVoice()
    cachedVoiceId = current
    const match = voices.find((v) => v.id === current)
    return match?.label || json.data?.voiceLabel || '百度卡通音色'
  } catch {
    return '百度卡通音色'
  }
}

export async function loadPetVoiceOptions() {
  try {
    const res = await fetch('/api/tts/pet/config')
    const json = await res.json()
    if (json.data?.voice) {
      cachedVoiceId = json.data.voice
    }
    return json.data || { voices: [] }
  } catch {
    return { voices: [], provider: 'unknown' }
  }
}
