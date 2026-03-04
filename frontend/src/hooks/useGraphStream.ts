import { useCallback, useRef, useState } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useGraphStore } from '../store/graphStore'
import type { NodeStartEvent, NodeEndEvent, InterruptEvent } from '../types/api'

const API_BASE = 'http://localhost:8000'
const MAX_BACKOFF = 30000

export function useGraphStream(graphId: string | null) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ctrlRef = useRef<AbortController | null>(null)
  const { addNodeEvent, setCharacterState, startRun, stopRun, setInterrupted } = useGraphStore()

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
          } else {
            throw new Error(`HTTP ${res.status}`)
          }
        },
        onmessage: (msg) => {
          if (!msg.data) return
          try {
            const payload = JSON.parse(msg.data)
            switch (msg.event) {
              case 'node_start': {
                const e = payload as NodeStartEvent
                setCharacterState(e.node_id, 'running')
                addNodeEvent({ node_id: e.node_id, status: 'running', timestamp: e.timestamp })
                break
              }
              case 'node_end': {
                const e = payload as NodeEndEvent
                setCharacterState(e.node_id, 'completed')
                addNodeEvent({
                  node_id: e.node_id,
                  status: 'completed',
                  timestamp: e.timestamp,
                  data: e.data.output,
                })
                break
              }
              case 'interrupt': {
                const e = payload as InterruptEvent
                setInterrupted(true)
                addNodeEvent({ node_id: '__interrupt__', status: 'pending', timestamp: e.timestamp })
                break
              }
              case 'done': {
                stopRun()
                setIsConnected(false)
                ctrlRef.current?.abort()
                break
              }
              // node_progress: ignore for now (streaming tokens not visualized yet)
            }
          } catch {
            // ignore parse errors
          }
        },
        onerror: (err) => {
          setIsConnected(false)
          if (ctrl.signal.aborted) return
          const delay = Math.min(1000 * Math.pow(2, attempt), MAX_BACKOFF)
          setError(`Connection error, retrying in ${delay / 1000}s...`)
          setTimeout(() => {
            if (!ctrl.signal.aborted) connect(id, attempt + 1)
          }, delay)
          throw err
        },
        onclose: () => {
          setIsConnected(false)
        },
      })
    },
    [addNodeEvent, setCharacterState, setInterrupted, stopRun]
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
