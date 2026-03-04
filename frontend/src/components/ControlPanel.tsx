import { useState } from 'react'
import { useGraphStore } from '../store/graphStore'
import { useGraphStream } from '../hooks/useGraphStream'

export function ControlPanel() {
  const selectedGraph = useGraphStore((s) => s.selectedGraph)
  const isRunning = useGraphStore((s) => s.isRunning)
  const nodeEvents = useGraphStore((s) => s.nodeEvents)
  const reset = useGraphStore((s) => s.reset)

  const { isConnected, error, start, stop } = useGraphStream(selectedGraph?.graph_id ?? null)

  const [hitlInput, setHitlInput] = useState('')
  const [hitlLoading, setHitlLoading] = useState(false)

  const lastEvent = nodeEvents[nodeEvents.length - 1]
  const needsHitl = lastEvent?.status === 'error' && lastEvent?.data?.requires_input === true

  const handleStop = () => {
    stop()
    reset()
  }

  const handleHitlSubmit = async () => {
    if (!selectedGraph || !hitlInput.trim()) return
    setHitlLoading(true)
    try {
      await fetch(`http://localhost:8000/api/graphs/${selectedGraph.graph_id}/input`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: hitlInput }),
      })
      setHitlInput('')
    } finally {
      setHitlLoading(false)
    }
  }

  const status = !selectedGraph
    ? 'idle'
    : isConnected
    ? 'running'
    : isRunning
    ? 'connecting'
    : 'idle'

  const statusColors: Record<string, string> = {
    idle: 'text-gray-400',
    connecting: 'text-yellow-400',
    running: 'text-green-400',
    completed: 'text-blue-400',
    error: 'text-red-400',
  }

  return (
    <div className="border-t border-gray-700 px-4 py-3 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className={`text-sm font-medium ${statusColors[status] ?? 'text-gray-400'}`}>
          ● {status.toUpperCase()}
        </span>
        {error && <span className="text-xs text-red-400">{error}</span>}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={start}
            disabled={!selectedGraph || isConnected}
            className="px-3 py-1 text-sm bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed rounded text-white transition-colors"
          >
            Start
          </button>
          <button
            onClick={handleStop}
            disabled={!isRunning && !isConnected}
            className="px-3 py-1 text-sm bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed rounded text-white transition-colors"
          >
            Stop
          </button>
        </div>
      </div>

      {needsHitl && (
        <div className="flex gap-2 mt-1">
          <input
            type="text"
            value={hitlInput}
            onChange={(e) => setHitlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleHitlSubmit()}
            placeholder="Human input required..."
            className="flex-1 bg-gray-800 border border-yellow-500 rounded px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
          />
          <button
            onClick={handleHitlSubmit}
            disabled={hitlLoading || !hitlInput.trim()}
            className="px-3 py-1 text-sm bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 rounded text-white transition-colors"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  )
}
