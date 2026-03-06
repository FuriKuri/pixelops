import { useState } from 'react'
import { useGraphStore } from '../store/graphStore'
import { useGraphList } from '../hooks/useGraphList'
import type { GraphInfo, GraphStructure, CharacterState } from '../types/api'

const API_BASE = ''

async function fetchStructure(graphId: string): Promise<GraphStructure> {
  const res = await fetch(`${API_BASE}/api/graphs/${graphId}/structure`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

interface GraphSelectorProps {
  isDark: boolean
  onToggleDark: () => void
}

export function GraphSelector({ isDark, onToggleDark }: GraphSelectorProps) {
  const { isLoading } = useGraphList()
  const graphs = useGraphStore((s) => s.graphs)
  const selectedGraph = useGraphStore((s) => s.selectedGraph)
  const selectGraph = useGraphStore((s) => s.selectGraph)
  const setLayout = useGraphStore((s) => s.setLayout)
  const updateCharacter = useGraphStore((s) => s.updateCharacter)

  const [loadingStructure, setLoadingStructure] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const graph = graphs.find((g) => g.id === e.target.value) ?? null
    selectGraph(graph)
    if (!graph) return
    setLoadingStructure(true)
    try {
      const { graph: fullGraph, layout } = await fetchStructure(graph.id)
      selectGraph(fullGraph)
      setLayout(layout)
      fullGraph.nodes.forEach((node) => {
        const position = layout.node_positions[node.id] ?? { x: 0, y: 0 }
        const character: CharacterState = {
          id: node.id,
          name: node.label,
          state: 'idle',
          position,
        }
        updateCharacter(character)
      })
    } catch {
      // keep the basic graph info if structure fetch fails
    } finally {
      setLoadingStructure(false)
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors">
      <label className="text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
        Graph:
      </label>

      {isLoading ? (
        <div className="flex-1 h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      ) : (
        <select
          value={selectedGraph?.id ?? ''}
          onChange={handleChange}
          disabled={loadingStructure}
          className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-colors"
        >
          <option value="">-- Select a graph --</option>
          {graphs.map((g: GraphInfo) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      )}

      {selectedGraph?.description && !isLoading && (
        <span className="text-xs text-gray-400 max-w-xs truncate hidden sm:block">
          {selectedGraph.description}
        </span>
      )}

      <button
        onClick={onToggleDark}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="ml-auto flex-shrink-0 p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-base leading-none"
        title={isDark ? 'Light mode' : 'Dark mode'}
      >
        {isDark ? '☀' : '☾'}
      </button>
    </div>
  )
}
