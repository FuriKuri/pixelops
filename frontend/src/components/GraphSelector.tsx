import { useGraphStore } from '../store/graphStore'
import { useGraphList } from '../hooks/useGraphList'
import type { GraphInfo, GraphStructure, CharacterState } from '../types/api'

const API_BASE = 'http://localhost:8000'

async function fetchStructure(graphId: string): Promise<GraphStructure> {
  const res = await fetch(`${API_BASE}/api/graphs/${graphId}/structure`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function GraphSelector() {
  useGraphList()
  const graphs = useGraphStore((s) => s.graphs)
  const selectedGraph = useGraphStore((s) => s.selectedGraph)
  const selectGraph = useGraphStore((s) => s.selectGraph)
  const setLayout = useGraphStore((s) => s.setLayout)
  const updateCharacter = useGraphStore((s) => s.updateCharacter)

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const graph = graphs.find((g) => g.id === e.target.value) ?? null
    selectGraph(graph)
    if (!graph) return
    try {
      const { graph: fullGraph, layout } = await fetchStructure(graph.id)
      // Update selected graph with full node/edge info
      selectGraph(fullGraph)
      setLayout(layout)
      // Initialize characters from node_positions
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
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-700">
      <label className="text-sm font-medium text-gray-300 whitespace-nowrap">Graph:</label>
      <select
        value={selectedGraph?.id ?? ''}
        onChange={handleChange}
        className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
      >
        <option value="">-- Select a graph --</option>
        {graphs.map((g: GraphInfo) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      {selectedGraph?.description && (
        <span className="text-xs text-gray-400 max-w-xs truncate">{selectedGraph.description}</span>
      )}
    </div>
  )
}
