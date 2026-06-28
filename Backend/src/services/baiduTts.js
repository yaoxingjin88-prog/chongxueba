/** 百度卡通宠物音色（per 参数见官方音色列表） */
export const BAIDU_PET_VOICES = {
  xiaolu: {
    id: 'xiaolu',
    name: '小鹿',
    label: '度小鹿·甜美女声',
    per: 5118,
    spd: 4,
    pit: 6,
    vol: 9,
    desc: '清甜柔和，适合温柔陪伴型宠物',
  },
  xiaoshi: {
    id: 'xiaoshi',
    name: '小狮',
    label: '度小童·活泼童声',
    per: 110,
    spd: 4,
    pit: 5,
    vol: 9,
    desc: '元气男童，适合活泼勇敢型宠物',
  },
  duoduo: {
    id: 'duoduo',
    name: '朵朵',
    label: '度米朵·可爱童声',
    per: 103,
    spd: 3,
    pit: 7,
    vol: 9,
    desc: '软萌慢速，默认推荐给小狐狸',
  },
}

export function resolveBaiduVoice(voiceId) {
  const key = String(voiceId || process.env.TTS_BAIDU_VOICE || 'duoduo').trim()
  return BAIDU_PET_VOICES[key] || BAIDU_PET_VOICES.duoduo
}

export function listBaiduPetVoices() {
  return Object.values(BAIDU_PET_VOICES).map(({ id, name, label, desc, spd, pit }) => ({
    id, name, label, desc, spd, pit,
  }))
}

export function isBaiduTtsConfigured() {
  return Boolean(process.env.BAIDU_API_KEY && process.env.BAIDU_SECRET_KEY)
}

let tokenCache = { token: '', expiresAt: 0 }

async function fetchAccessToken() {
  const apiKey = process.env.BAIDU_API_KEY
  const secret = process.env.BAIDU_SECRET_KEY
  if (!apiKey || !secret) {
    throw new Error('请在 Backend/.env 配置 BAIDU_API_KEY 与 BAIDU_SECRET_KEY')
  }

  const url = new URL('https://aip.baidubce.com/oauth/2.0/token')
  url.searchParams.set('grant_type', 'client_credentials')
  url.searchParams.set('client_id', apiKey)
  url.searchParams.set('client_secret', secret)

  const res = await fetch(url, { method: 'POST' })
  const data = await res.json()
  if (!res.ok || data.error || !data.access_token) {
    throw new Error(data.error_description || data.error || '百度 access_token 获取失败')
  }

  const ttlMs = Math.max(3600, Number(data.expires_in || 2592000) - 3600) * 1000
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + ttlMs,
  }
  return tokenCache.token
}

async function getAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token
  }
  return fetchAccessToken()
}

function applyEnvOverrides(voice) {
  return {
    ...voice,
    spd: process.env.TTS_BAIDU_SPD != null ? Number(process.env.TTS_BAIDU_SPD) : voice.spd,
    pit: process.env.TTS_BAIDU_PIT != null ? Number(process.env.TTS_BAIDU_PIT) : voice.pit,
    vol: process.env.TTS_BAIDU_VOL != null ? Number(process.env.TTS_BAIDU_VOL) : voice.vol,
  }
}

/**
 * 百度短文本在线合成 → MP3 Buffer
 * @see https://cloud.baidu.com/doc/SPEECH/s/mlbxh7xie
 */
export async function synthesizeBaiduSpeech(text, voiceId) {
  const content = String(text || '').trim()
  if (!content) throw new Error('台词不能为空')

  const voice = applyEnvOverrides(resolveBaiduVoice(voiceId))
  const token = await getAccessToken()

  const params = new URLSearchParams()
  params.set('tex', content)
  params.set('tok', token)
  params.set('cuid', process.env.TTS_BAIDU_CUID || 'chong-xueba-pet')
  params.set('ctp', '1')
  params.set('lan', 'zh')
  params.set('per', String(voice.per))
  params.set('spd', String(voice.spd))
  params.set('pit', String(voice.pit))
  params.set('vol', String(voice.vol))
  params.set('aue', '3')

  const res = await fetch(`https://tsn.baidu.com/text2audio?${params.toString()}`)
  const buffer = Buffer.from(await res.arrayBuffer())

  if (!buffer.length) {
    throw new Error('百度 TTS 返回空音频')
  }

  if (buffer[0] === 0x7b) {
    let message = '百度 TTS 合成失败'
    try {
      const err = JSON.parse(buffer.toString('utf8'))
      message = err.err_msg || err.error_description || message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  return {
    buffer,
    voice: voice.id,
    voiceLabel: voice.label,
    per: voice.per,
    spd: voice.spd,
    pit: voice.pit,
  }
}
