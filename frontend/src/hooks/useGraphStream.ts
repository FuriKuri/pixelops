import { useCallback, useRef, useState } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useGraphStore } from '../store/graphStore'
import type { NodeEvent } from '../types/api'

const API_BASE = 'http://localhost:8000'
const MAX_BACKOFF = 30000

export function useGraphStream(graphId: string | null) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ctrlRef = useRef<AbortController | null>(null)
  const backoffRef = useRef(1000)
  const { addNodeEvent, setCharacterState, startRun } = useGraphStore()

  const stop = useCallback(() => {
    ctrlRef.current?.abort()
    ctrlRef.current = null
    setIsConnected(false)
  }, [])

  const connect = useCallback(
    (id: string, attempt = 0) => {
      const ctrl = new AbortController()
      ctrlRef.current = ctrl

      fetchEventSource(`${API_BASE}/api/graphs/${id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        onopen: async (res) => {
          if (res.ok) {
            setIsConnected(true)
            setError(null)
            backoffRef.current = 1000
          } else {
            throw new Error(`HTTP ${res.status}`)
          }
        },
        onmessage: (msg) => {
          if (!msg.data) return
          try {
            const event: NodeEvent = JSON.parse(msg.data)
            addNodeEvent(event)
            setCharacterState(event.node_id, event.status)
          } catch {
            // ignore parse errors
          }
        },
        onerror: (err) => {
          setIsConnected(false)
          if (ctrl.signal.aborted) return
          const delay = Math.min(backoffRef.current * Math.pow(2, attempt), MAX_BACKOFF)
          setError(`Connection error, retrying in ${delay / 1000}s...`)
          setTimeout(() => {
            if (!ctrl.signal.aborted) connect(id, attempt + 1)
          }, delay)
          throw err // prevent auto-retry by fetchEventSource itself
        },
        onclose: () => {
          setIsConnected(false)
        },
      })
    },
    [addNodeEvent, setCharacterState]
  )

  const start = useCallback(() => {
    if (!graphId) return
    stop()
    startRun()
    setError(null)
    connect(graphId)
  }, [graphId, stop, startRun, connect])

  return { isConnected, error, start, stop }
}
