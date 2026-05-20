import { useState, useCallback } from 'react'
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react'
import '@livekit/components-styles'
import './App.css'

type Connection = {
  token: string
  url: string
  room: string
  identity: string
}

function App() {
  const [room, setRoom] = useState('demo-room')
  const [name, setName] = useState('')
  const [connection, setConnection] = useState<Connection | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleJoin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setLoading(true)
      try {
        const params = new URLSearchParams({ room: room.trim() || 'demo-room' })
        if (name.trim()) {
          params.set('name', name.trim())
          params.set('identity', name.trim())
        }
        const res = await fetch(`/api/token?${params.toString()}`)
        if (!res.ok) throw new Error(`Token request failed: ${res.status}`)
        const data = (await res.json()) as Connection & { error?: string }
        if (data.error) throw new Error(data.error)
        setConnection(data)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    },
    [room, name],
  )

  const handleDisconnect = useCallback(() => {
    setConnection(null)
  }, [])

  if (connection) {
    return (
      <div style={{ height: '100vh' }} data-lk-theme="default">
        <LiveKitRoom
          serverUrl={connection.url}
          token={connection.token}
          connect={true}
          video={true}
          audio={true}
          onDisconnected={handleDisconnect}
          style={{ height: '100vh' }}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    )
  }

  return (
    <section id="center">
      <div className="join-card">
        <h1>LiveKit Video Chat</h1>
        <p>参加するルーム名と表示名を入力してください。</p>
        <form onSubmit={handleJoin} className="join-form">
          <label>
            ルーム名
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="demo-room"
              required
            />
          </label>
          <label>
            表示名
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="あなたの名前"
            />
          </label>
          <button type="submit" className="counter" disabled={loading}>
            {loading ? '接続中…' : 'ルームに参加'}
          </button>
          {error && <p style={{ color: 'crimson' }}>{error}</p>}
        </form>
      </div>
    </section>
  )
}

export default App
