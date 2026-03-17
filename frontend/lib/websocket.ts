import { getToken } from './api'

type MessageHandler = (data: unknown) => void

class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string = ''
  private handlers: Map<string, Set<MessageHandler>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private shouldReconnect = true

  connect(yardId: string) {
    const token = getToken()
    if (!token) return

    const proto = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:8000'
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `${proto}//${host}`
    this.url = `${wsUrl}/ws/yard/${yardId}?token=${token}`
    this.shouldReconnect = true
    this._connect()
  }

  private _connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return

    this.ws = new WebSocket(this.url)

    this.ws.onopen = () => {
      console.log('[WS] Connected')
      this.reconnectAttempts = 0
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        const type = data.type as string
        const typeHandlers = this.handlers.get(type)
        if (typeHandlers) {
          typeHandlers.forEach((handler) => handler(data))
        }
        // Also notify 'all' handlers
        const allHandlers = this.handlers.get('*')
        if (allHandlers) {
          allHandlers.forEach((handler) => handler(data))
        }
      } catch (e) {
        console.error('[WS] Parse error:', e)
      }
    }

    this.ws.onclose = () => {
      console.log('[WS] Disconnected')
      if (this.shouldReconnect) {
        this._scheduleReconnect()
      }
    }

    this.ws.onerror = (error) => {
      console.error('[WS] Error:', error)
    }
  }

  private _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WS] Max reconnect attempts reached')
      return
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    this.reconnectAttempts++
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

    this.reconnectTimer = setTimeout(() => {
      this._connect()
    }, delay)
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)
    return () => {
      this.handlers.get(type)?.delete(handler)
    }
  }

  disconnect() {
    this.shouldReconnect = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    this.ws?.close()
    this.ws = null
    this.handlers.clear()
  }
}

export const wsClient = new WebSocketClient()
