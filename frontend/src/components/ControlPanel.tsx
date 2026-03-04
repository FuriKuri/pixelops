import { useState } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useGraphStore } from '../store/graphStore'
import { useGraphStream } from '../hooks/useGraphStream'
import type { NodeStartEvent, NodeEndEvent } from '../types/api'

const API_BASE = 'http://localhost:8000'

export function ControlPanel() {
  const selectedGraph = useGraphStore((s) => s.selectedGraph)
  const isRunning = useGraphStore((s) => s.isRunning)
  const isInterrupted = useGraphStore((s) => s.isInterrupted)
  const setInterrupted = useGraphStore((s) => s.setInterrupted)
  const addNodeEvent = useGraphStore((s) => s.addNodeEvent)
  const setCharacterState = useGraphStore((s) => s.setCharacterState)
  const stopRun = useGraphStore((s) => s.stopRun)
  const reset = useGraphStore((s) => s.reset)

  const { isConnected, error, start, stop } = useGraphStream(selectedGraph?.id ?? null)

  const [hitlInput, setHitlInput] = useState('')
  const [hitlLoading, setHitlLoading] = useState(false)

  const handleStop = () => {
    stop()
    reset()
  }

  const handleHitlSubmit = async () => {
    if (!selectedGraph || !hitlInput.trim()) return
    const inputValue = hitlInput
    setHitlInput('')
    setHitlLoading(true)
    setInterrupted(false)

    fetchEventSource(`${API_BASE}/api/graphs/${selectedGraph.id}/input`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: inputValue }),
      onopen: async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
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
              setInterrupted(true)
              addNodeEvent({ node_id: '__interrupt__', status: 'pending', timestamp: payload.timestamp })
              setHitlLoading(false)
              break
            }
            case 'done': {
              stopRun()
              setHitlLoading(false)
              break
            }
          }
        } catch {
          // ignore parse errors
        }
      },
      onerror: () => {
        setHitlLoading(false)
        throw new Error('stream error') // stop retrying
      },
      onclose: () => {
        setHitlLoading(false)
      },
    })
  }

  const status = !selectedGraph
    ? 'idle'
    : isInterrupted
    ? 'waiting'
    : isConnected
    ? 'running'
    : isRunning
    ? 'connecting'
    : 'idle'

  const statusColors: Record<string, string> = {
    idle: 'text-gray-400',
    connecting: 'text-yellow-400',
    running: 'text-green-400',
    waiting: 'text-orange-400',
    error: 'text-red-400',
  }

  const statusLabel: Record<string, string> = {
    idle: 'IDLE',
    connecting: 'Connecting...',
    running: 'RUNNING',
    waiting: 'WAITING',
    error: 'ERROR',
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 md:py-3 flex flex-col gap-2 bg-white dark:bg-gray-900 transition-colors">
      <div className="flex items-center gap-2 md:gap-3">
        <span className={`text-xs md:text-sm font-medium ${statusColors[status] ?? 'text-gray-400'}`}>
          {status === 'connecting' ? (
            <span className="animate-pulse">● {statusLabel[status]}</span>
          ) : (
            <span>● {statusLabel[status] ?? status.toUpperCase()}</span>
          )}
        </span>
        {error && <span className="text-xs text-red-400 truncate max-w-xs">{error}</span>}
        <div className="flex gap-1.5 md:gap-2 ml-auto">
          <button
            onClick={start}
            disabled={!selectedGraph || isConnected}
            className="px-2 md:px-3 py-1 text-xs md:text-sm bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed rounded text-white transition-colors"
          >
            Start
          </button>
          <button
            onClick={handleStop}
            disabled={!isRunning && !isConnected}
            className="px-2 md:px-3 py-1 text-xs md:text-sm bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed rounded text-white transition-colors"
          >
            Stop
          </button>
        </div>
      </div>

      {isInterrupted && (
        <div className="flex gap-2 mt-1 items-center">
          <span className="text-orange-400 text-sm">?</span>
          <input
            type="text"
            value={hitlInput}
            onChange={(e) => setHitlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !hitlLoading && handleHitlSubmit()}
            placeholder="Human input required..."
            className="flex-1 bg-gray-100 dark:bg-gray-800 border border-orange-500 rounded px-2 py-1 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-orange-400 transition-colors"
            autoFocus
            disabled={hitlLoading}
          />
          <button
            onClick={handleHitlSubmit}
            disabled={hitlLoading || !hitlInput.trim()}
            className="px-3 py-1 text-sm bg-orange-600 hover:bg-orange-500 disabled:opacity-40 rounded text-white transition-colors"
          >
            {hitlLoading ? '...' : 'Submit'}
          </button>
        </div>
      )}
    </div>
  )
}
