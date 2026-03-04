import { create } from 'zustand'
import type { GraphInfo, NodeEvent, LayoutData, CharacterState } from '../types/api'

interface GraphState {
  graphs: GraphInfo[]
  selectedGraph: GraphInfo | null
  isRunning: boolean
  isInterrupted: boolean
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
  setInterrupted: (interrupted: boolean) => void
  stopRun: () => void
}

export const useGraphStore = create<GraphState>((set) => ({
  graphs: [],
  selectedGraph: null,
  isRunning: false,
  isInterrupted: false,
  nodeEvents: [],
  layout: null,
  characters: new Map(),
  selectGraph: (graph) => set({ selectedGraph: graph }),
  setGraphs: (graphs) => set({ graphs }),
  startRun: () => set({ isRunning: true, isInterrupted: false, nodeEvents: [] }),
  stopRun: () => set({ isRunning: false, isInterrupted: false }),
  addNodeEvent: (event) =>
    set((state) => ({ nodeEvents: [...state.nodeEvents, event] })),
  reset: () =>
    set({ isRunning: false, isInterrupted: false, nodeEvents: [], selectedGraph: null, layout: null, characters: new Map() }),
  setLayout: (layout) => set({ layout }),
  setInterrupted: (interrupted) => set({ isInterrupted: interrupted }),
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
