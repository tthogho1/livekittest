import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { AccessToken } from 'livekit-server-sdk'

// Dev-only middleware that issues a LiveKit access token.
// Keeps the API secret on the server side (never shipped to the browser).
function livekitTokenPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'livekit-token-endpoint',
    configureServer(server) {
      server.middlewares.use('/api/token', async (req, res) => {
        try {
          const url = new URL(req.url ?? '', 'http://localhost')
          const room = url.searchParams.get('room') ?? 'default-room'
          const identity =
            url.searchParams.get('identity') ?? `user-${Math.random().toString(36).slice(2, 8)}`
          const name = url.searchParams.get('name') ?? identity

          const apiKey = env.LIVEKIT_API_KEY
          const apiSecret = env.LIVEKIT_API_SECRET
          if (!apiKey || !apiSecret) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Missing LiveKit credentials' }))
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

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ token, url: env.LIVEKIT_URL, room, identity }))
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: (err as Error).message }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), livekitTokenPlugin(env)],
  }
})
