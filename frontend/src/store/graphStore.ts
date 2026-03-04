import { create } from 'zustand'
import type { GraphInfo, NodeEvent } from '../types/api'

interface GraphState {
  graphs: GraphInfo[]
  selectedGraph: GraphInfo | null
  isRunning: boolean
  nodeEvents: NodeEvent[]
  selectGraph: (graph: GraphInfo | null) => void
  setGraphs: (graphs: GraphInfo[]) => void
  startRun: () => void
  addNodeEvent: (event: NodeEvent) => void
  reset: () => void
}

export const useGraphStore = create<GraphState>((set) => ({
  graphs: [],
  selectedGraph: null,
  isRunning: false,
  nodeEvents: [],
  selectGraph: (graph) => set({ selectedGraph: graph }),
  setGraphs: (graphs) => set({ graphs }),
  startRun: () => set({ isRunning: true, nodeEvents: [] }),
  addNodeEvent: (event) =>
    set((state) => ({ nodeEvents: [...state.nodeEvents, event] })),
  reset: () => set({ isRunning: false, nodeEvents: [], selectedGraph: null }),
}))
