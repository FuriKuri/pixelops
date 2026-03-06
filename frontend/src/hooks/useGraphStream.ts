import { useCallback, useRef, useState } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useGraphStore } from '../store/graphStore'
import type { NodeStartEvent, NodeProgressEvent, NodeEndEvent, InterruptEvent } from '../types/api'
import { API_BASE } from '../config'
const MAX_BACKOFF = 30000

export function useGraphStream(graphId: string | null) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ctrlRef = useRef<AbortController | null>(null)
  const { addNodeEvent, setCharacterState, startRun, stopRun, setInterrupted, appendNodeOutput, clearNodeOutput } = useGraphStore()

  const stop = useCallback(() => {
    ctrlRef.current?.abort()
    ctrlRef.current = null
    setIsConnected(false)
  }, [])

  const connect = useCallback(
    (id: string, input: Record<string, unknown>, attempt = 0) => {
      const ctrl = new AbortController()
      ctrlRef.current = ctrl

      fetchEventSource(`${API_BASE}/graphs/${id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
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
                clearNodeOutput(e.node_id)
                setCharacterState(e.node_id, 'running')
                addNodeEvent({ node_id: e.node_id, status: 'running', timestamp: e.timestamp })
                break
              }
              case 'node_progress': {
                const e = payload as NodeProgressEvent
                appendNodeOutput(e.node_id, e.data.token)
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
              case 'error': {
                const errMsg = payload.error ?? 'Unknown error'
                setError(`Graph error: ${errMsg}`)
                stopRun()
                setIsConnected(false)
                ctrlRef.current?.abort()
                break
              }
              case 'done': {
                stopRun()
                setIsConnected(false)
                ctrlRef.current?.abort()
                break
              }
            }
          } catch (parseErr) {
            // SSE parse error – silently ignore
          }
        },
        onerror: (err) => {
          setIsConnected(false)
          if (ctrl.signal.aborted) return
          const delay = Math.min(1000 * Math.pow(2, attempt), MAX_BACKOFF)
          setError(`Connection error, retrying in ${delay / 1000}s...`)
          setTimeout(() => {
            if (!ctrl.signal.aborted) connect(id, input, attempt + 1)
          }, delay)
          throw err
        },
        onclose: () => {
          setIsConnected(false)
        },
      })
    },
    [addNodeEvent, setCharacterState, setInterrupted, stopRun, appendNodeOutput, clearNodeOutput]
  )

  const start = useCallback((input: Record<string, unknown> = {}) => {
    if (!graphId) return
    stop()
    startRun()
    setError(null)
    connect(graphId, input)
  }, [graphId, stop, startRun, connect])

  return { isConnected, error, start, stop }
}
