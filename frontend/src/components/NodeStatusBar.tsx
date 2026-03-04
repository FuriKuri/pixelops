import { useGraphStore } from '../store/graphStore'

const STATUS_ICONS: Record<string, string> = {
  pending: '○',
  running: '◉',
  completed: '✓',
  error: '✗',
  idle: '–',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-gray-400',
  running: 'text-yellow-400',
  completed: 'text-green-400',
  error: 'text-red-400',
  idle: 'text-gray-500',
}

export function NodeStatusBar() {
  const characters = useGraphStore((s) => s.characters)
  const nodeEvents = useGraphStore((s) => s.nodeEvents)
  const selectedGraph = useGraphStore((s) => s.selectedGraph)

  const getLastMessage = (nodeId: string) => {
    const events = nodeEvents.filter((e) => e.node_id === nodeId)
    const last = events[events.length - 1]
    if (!last?.data) return null
    const msg = last.data.message ?? last.data.output ?? last.data.result
    return typeof msg === 'string' ? msg : null
  }

  const nodes = selectedGraph?.nodes ?? []

  return (
    <aside className="w-80 border-l border-gray-700 flex flex-col">
      <div className="px-4 py-3 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-gray-200">Node Status</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {nodes.length === 0 ? (
          <p className="px-4 py-3 text-xs text-gray-500">No graph loaded</p>
        ) : (
          nodes.map((node) => {
            const char = characters.get(node.id)
            const state = char?.state ?? 'idle'
            const isActive = state === 'running'
            const lastMsg = getLastMessage(node.id)
            return (
              <div
                key={node.id}
                className={`px-4 py-2 border-b border-gray-800 transition-colors ${
                  isActive ? 'bg-gray-800' : 'hover:bg-gray-850'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-base ${STATUS_COLORS[state] ?? 'text-gray-400'} font-mono`}>
                    {STATUS_ICONS[state] ?? '?'}
                  </span>
                  <span
                    className={`text-sm font-medium truncate ${
                      isActive ? 'text-yellow-300' : 'text-gray-200'
                    }`}
                  >
                    {node.label}
                  </span>
                </div>
                {lastMsg && (
                  <p className="mt-1 ml-5 text-xs text-gray-400 truncate">{lastMsg}</p>
                )}
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
