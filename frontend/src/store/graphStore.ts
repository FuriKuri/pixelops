import { create } from 'zustand'
import type { GraphInfo, NodeEvent, LayoutData, CharacterState } from '../types/api'

interface GraphState {
  graphs: GraphInfo[]
  selectedGraph: GraphInfo | null
  isRunning: boolean
  nodeEvents: NodeEvent[]
  layout: LayoutData | null
  characters: Map<string, CharacterState>
  selectGraph: (graph: GraphInfo | null) => void
  setGraphs: (graphs: GraphInfo[]) => void
  startRun: () => void
  addNodeEvent: (event: NodeEvent) => void
  reset: () => void
  setLayout: (layout: LayoutData | null) => void
  updateCharacter: (character: CharacterState) => void
  setCharacterState: (id: string, state: CharacterState['state']) => void
}

export const useGraphStore = create<GraphState>((set) => ({
  graphs: [],
  selectedGraph: null,
  isRunning: false,
  nodeEvents: [],
  layout: null,
  characters: new Map(),
  selectGraph: (graph) => set({ selectedGraph: graph }),
  setGraphs: (graphs) => set({ graphs }),
  startRun: () => set({ isRunning: true, nodeEvents: [] }),
  addNodeEvent: (event) =>
    set((state) => ({ nodeEvents: [...state.nodeEvents, event] })),
  reset: () => set({ isRunning: false, nodeEvents: [], selectedGraph: null, layout: null, characters: new Map() }),
  setLayout: (layout) => set({ layout }),
  updateCharacter: (character) =>
    set((state) => {
      const next = new Map(state.characters)
      next.set(character.id, character)
      return { characters: next }
    }),
  setCharacterState: (id, characterState) =>
    set((state) => {
      const existing = state.characters.get(id)
      if (!existing) return {}
      const next = new Map(state.characters)
      next.set(id, { ...existing, state: characterState })
      return { characters: next }
    }),
}))
