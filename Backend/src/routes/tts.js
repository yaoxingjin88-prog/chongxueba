import { Router } from 'express'
import { synthesizePetSpeech, getPetTtsConfig } from '../services/petTts.js'

const router = Router()

router.get('/pet/config', (_req, res) => {
  res.json({ success: true, data: getPetTtsConfig() })
})

router.post('/pet', async (req, res, next) => {
  try {
    const text = String(req.body.text || '').trim()
    const voice = String(req.body.voice || '').trim() || undefined
    if (!text) {
      return res.status(400).json({ success: false, message: '缺少 text' })
    }

    const { buffer, voice: voiceId, voiceLabel, provider, fallbackReason, cached } = await synthesizePetSpeech(text, voice)

    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'private, max-age=3600')
    res.setHeader('X-TTS-Provider', provider)
    res.setHeader('X-TTS-Voice', voiceId || '')
    res.setHeader('X-TTS-Voice-Label', encodeURIComponent(voiceLabel || ''))
    res.setHeader('X-TTS-Cached', cached ? '1' : '0')
    if (fallbackReason) {
      res.setHeader('X-TTS-Fallback-Reason', encodeURIComponent(fallbackReason))
    }
    res.send(buffer)
  } catch (err) {
    next(err)
  }
})

export default router
