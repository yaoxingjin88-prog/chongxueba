import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'

/** 百度不可用时的 Edge 音色映射（尽量贴近卡通角色） */
const EDGE_VOICE_MAP = {
  duoduo: { voice: 'zh-CN-XiaoyiNeural', rate: '+2%', pitch: '+6Hz' },
  xiaolu: { voice: 'zh-CN-XiaohanNeural', rate: '-2%', pitch: '+2Hz' },
  xiaoshi: { voice: 'zh-CN-YunzeNeural', rate: '+4%', pitch: '-2Hz' },
}

const clientCache = new Map()

async function getTtsClient(voiceName) {
  if (!clientCache.has(voiceName)) {
    const client = new MsEdgeTTS()
    clientCache.set(voiceName, {
      client,
      ready: client.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3),
    })
  }
  const entry = clientCache.get(voiceName)
  await entry.ready
  return entry.client
}

function streamToBuffer(audioStream) {
  return new Promise((resolve, reject) => {
    const chunks = []
    audioStream.on('data', (chunk) => chunks.push(chunk))
    audioStream.on('close', () => resolve(Buffer.concat(chunks)))
    audioStream.on('error', reject)
  })
}

function resolveEdgeProfile(voiceId) {
  const key = String(voiceId || 'duoduo')
  return EDGE_VOICE_MAP[key] || EDGE_VOICE_MAP.duoduo
}

/** 百度不可用时的备用 Neural 合成 */
export async function synthesizeEdgeSpeech(text, voiceId = 'duoduo') {
  const profile = resolveEdgeProfile(voiceId)
  const tts = await getTtsClient(profile.voice)
  const { audioStream } = tts.toStream(text, {
    rate: profile.rate,
    pitch: profile.pitch,
    volume: '+0%',
  })
  const buffer = await streamToBuffer(audioStream)
  if (!buffer.length) {
    throw new Error('Edge TTS 合成失败')
  }
  return {
    buffer,
    voice: voiceId,
    voiceLabel: `Edge · ${profile.voice}`,
  }
}
