import { useGraphStore } from '../store/graphStore'
import { useGraphList } from '../hooks/useGraphList'
import type { GraphInfo } from '../types/api'

export function GraphSelector() {
  useGraphList()
  const graphs = useGraphStore((s) => s.graphs)
  const selectedGraph = useGraphStore((s) => s.selectedGraph)
  const selectGraph = useGraphStore((s) => s.selectGraph)

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const graph = graphs.find((g) => g.graph_id === e.target.value) ?? null
    selectGraph(graph)
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-700">
      <label className="text-sm font-medium text-gray-300 whitespace-nowrap">Graph:</label>
      <select
        value={selectedGraph?.graph_id ?? ''}
        onChange={handleChange}
        className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
      >
        <option value="">-- Select a graph --</option>
        {graphs.map((g: GraphInfo) => (
          <option key={g.graph_id} value={g.graph_id}>
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
