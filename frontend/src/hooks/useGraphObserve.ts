import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useGraphStore } from '../store/graphStore'
import type { NodeStartEvent, NodeProgressEvent, NodeEndEvent, InterruptEvent } from '../types/api'
import { API_BASE } from '../config'

/**
 * Passively observe a graph that is being executed externally.
 * Auto-connects when graphId is set and reconnects on disconnect.
 */
export function useGraphObserve(graphId: string | null) {
  const [isObserving, setIsObserving] = useState(false)
  const ctrlRef = useRef<AbortController | null>(null)
  const { addNodeEvent, setCharacterState, startRun, stopRun, setInterrupted, appendNodeOutput, clearNodeOutput } = useGraphStore()

  const disconnect = useCallback(() => {
    ctrlRef.current?.abort()
    ctrlRef.current = null
    setIsObserving(false)
  }, [])

  const observe = useCallback(
    (id: string) => {
      const ctrl = new AbortController()
      ctrlRef.current = ctrl

      fetchEventSource(`${API_BASE}/graphs/${id}/observe`, {
        method: 'GET',
        signal: ctrl.signal,
        onopen: async (res) => {
          if (res.ok) {
            setIsObserving(true)
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
                // Mark as running when first event arrives
                startRun()
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
              case 'done': {
                stopRun()
                // Reconnect to keep observing future runs
                if (!ctrl.signal.aborted) {
                  setTimeout(() => {
                    if (!ctrl.signal.aborted) observe(id)
                  }, 500)
                }
                break
              }
            }
          } catch {
            // ignore parse errors
          }
        },
        onerror: () => {
          setIsObserving(false)
          // Reconnect after a delay
          setTimeout(() => {
            if (!ctrl.signal.aborted && graphId) observe(id)
          }, 3000)
          throw new Error('stream error')
        },
        onclose: () => {
          setIsObserving(false)
          // Reconnect to keep observing
          if (!ctrl.signal.aborted && graphId) {
            setTimeout(() => {
              if (!ctrl.signal.aborted) observe(id)
            }, 1000)
          }
        },
      })
    },
    [graphId, addNodeEvent, setCharacterState, startRun, stopRun, setInterrupted, appendNodeOutput, clearNodeOutput]
  )

  // Auto-connect when graphId changes
  useEffect(() => {
    if (graphId) {
      observe(graphId)
    }
    return () => {
      disconnect()
    }
  }, [graphId, observe, disconnect])

  return { isObserving, disconnect }
}
