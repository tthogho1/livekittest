import type { VercelRequest, VercelResponse } from '@vercel/node'
import { AccessToken } from 'livekit-server-sdk'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const room =
      (req.query.room as string | undefined)?.trim() || 'default-room'
    const identity =
      (req.query.identity as string | undefined)?.trim() ||
      `user-${Math.random().toString(36).slice(2, 8)}`
    const name = (req.query.name as string | undefined)?.trim() || identity

    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET
    const livekitUrl = process.env.LIVEKIT_URL

    if (!apiKey || !apiSecret || !livekitUrl) {
      res.status(500).json({ error: 'Missing LiveKit server credentials' })
      return
    }

    const at = new AccessToken(apiKey, apiSecret, { identity, name })
    at.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })
    const token = await at.toJwt()

    res.status(200).json({ token, url: livekitUrl, room, identity })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}
