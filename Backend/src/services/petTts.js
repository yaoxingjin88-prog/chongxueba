import {
  isBaiduTtsConfigured,
  listBaiduPetVoices,
  resolveBaiduVoice,
  synthesizeBaiduSpeech,
} from './baiduTts.js'
import { synthesizeEdgeSpeech } from './edgeTtsFallback.js'

const MAX_TEXT_LEN = 80
const audioCache = new Map()
let lastBaiduError = ''

function normalizeText(text) {
  return String(text || '')
    .trim()
    .replace(/\s+/g, '')
    .slice(0, MAX_TEXT_LEN)
}

function cacheKey(content, voiceId, provider) {
  return `${provider}:${voiceId}:${content}`
}

function rememberCache(key, buffer) {
  audioCache.set(key, buffer)
  if (audioCache.size > 48) {
    audioCache.delete(audioCache.keys().next().value)
  }
}

function isQuotaError(message) {
  return /limit reached|quota|额度|不足/i.test(String(message))
}

export async function synthesizePetSpeech(text, voiceId) {
  const content = normalizeText(text)
  if (!content) {
    throw new Error('台词不能为空')
  }

  const wantBaidu = isBaiduTtsConfigured()
    && (process.env.TTS_PROVIDER || 'baidu') === 'baidu'
  const resolvedVoice = wantBaidu
    ? resolveBaiduVoice(voiceId).id
    : (voiceId || 'duoduo')

  let provider = wantBaidu ? 'baidu' : 'edge-fallback'
  let fallbackReason = ''

  const key = cacheKey(content, resolvedVoice, provider)
  if (audioCache.has(key)) {
    const voiceMeta = provider === 'baidu' ? resolveBaiduVoice(resolvedVoice) : null
    return {
      buffer: audioCache.get(key),
      voice: resolvedVoice,
      voiceLabel: voiceMeta?.label || 'Edge Neural',
      provider,
      fallbackReason: '',
      cached: true,
    }
  }

  let result
  if (wantBaidu) {
    try {
      result = await synthesizeBaiduSpeech(content, resolvedVoice)
      lastBaiduError = ''
    } catch (err) {
      lastBaiduError = err.message || '百度 TTS 失败'
      fallbackReason = lastBaiduError
      console.warn('[petTts] 百度 TTS 失败，改用 Edge 备用:', lastBaiduError)
      result = await synthesizeEdgeSpeech(content, resolvedVoice)
      provider = 'edge-fallback'
    }
  } else {
    result = await synthesizeEdgeSpeech(content, resolvedVoice)
  }

  const finalKey = cacheKey(content, resolvedVoice, provider)
  rememberCache(finalKey, result.buffer)

  return {
    buffer: result.buffer,
    voice: result.voice,
    voiceLabel: result.voiceLabel,
    provider,
    fallbackReason,
    cached: false,
  }
}

export function getPetTtsConfig() {
  const baiduReady = isBaiduTtsConfigured()
  const current = baiduReady ? resolveBaiduVoice() : null
  const quotaIssue = isQuotaError(lastBaiduError)

  return {
    provider: baiduReady && !quotaIssue ? 'baidu' : 'edge-fallback',
    baiduConfigured: baiduReady,
    baiduAvailable: baiduReady && !quotaIssue && !lastBaiduError,
    baiduError: lastBaiduError || null,
    voice: current?.id || 'duoduo',
    voiceLabel: current?.label || null,
    spd: current?.spd,
    pit: current?.pit,
    vol: current?.vol,
    per: current?.per,
    voices: listBaiduPetVoices(),
    hint: !baiduReady
      ? '未配置百度密钥，当前使用 Edge 备用语音'
      : quotaIssue || lastBaiduError
        ? `百度语音额度不可用（${lastBaiduError}），已临时使用 Edge 备用音`
        : '已启用百度智能云卡通音色',
  }
}
