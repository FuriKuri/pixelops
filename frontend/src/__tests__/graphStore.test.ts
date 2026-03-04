import { describe, it, expect, beforeEach } from 'vitest'
import { useGraphStore } from '../store/graphStore'
import type { CharacterState, LayoutData, NodeEvent } from '../types/api'

// Reset store state before each test
beforeEach(() => {
  useGraphStore.getState().reset()
})

const makeCharacter = (id: string): CharacterState => ({
  id,
  name: `Node ${id}`,
  state: 'idle',
  position: { x: 0, y: 0 },
})

const makeLayout = (): LayoutData => ({
  width: 20,
  height: 20,
  node_positions: {
    input: { x: 2, y: 2 },
    llm_call: { x: 2, y: 7 },
    output: { x: 2, y: 12 },
  },
})

const makeNodeEvent = (node_id: string): NodeEvent => ({
  node_id,
  status: 'running',
  timestamp: Date.now(),
  data: {},
})

describe('graphStore', () => {
  it('initialises with empty state', () => {
    const state = useGraphStore.getState()
    expect(state.graphs).toEqual([])
    expect(state.selectedGraph).toBeNull()
    expect(state.isRunning).toBe(false)
    expect(state.nodeEvents).toEqual([])
    expect(state.layout).toBeNull()
    expect(state.characters.size).toBe(0)
  })

  it('setLayout stores layout data', () => {
    const layout = makeLayout()
    useGraphStore.getState().setLayout(layout)
    expect(useGraphStore.getState().layout).toEqual(layout)
  })

  it('setLayout with null clears layout', () => {
    useGraphStore.getState().setLayout(makeLayout())
    useGraphStore.getState().setLayout(null)
    expect(useGraphStore.getState().layout).toBeNull()
  })

  it('updateCharacter adds a new character', () => {
    const char = makeCharacter('input')
    useGraphStore.getState().updateCharacter(char)
    expect(useGraphStore.getState().characters.get('input')).toEqual(char)
  })

  it('updateCharacter overwrites existing character', () => {
    const char = makeCharacter('input')
    useGraphStore.getState().updateCharacter(char)
    const updated: CharacterState = { ...char, state: 'running' }
    useGraphStore.getState().updateCharacter(updated)
    expect(useGraphStore.getState().characters.get('input')?.state).toBe('running')
  })

  it('setCharacterState updates state of existing character', () => {
    const char = makeCharacter('llm_call')
    useGraphStore.getState().updateCharacter(char)
    useGraphStore.getState().setCharacterState('llm_call', 'running')
    expect(useGraphStore.getState().characters.get('llm_call')?.state).toBe('running')
  })

  it('setCharacterState is a no-op for unknown character', () => {
    useGraphStore.getState().setCharacterState('ghost', 'running')
    expect(useGraphStore.getState().characters.get('ghost')).toBeUndefined()
  })

  it('addNodeEvent appends events in order', () => {
    const e1 = makeNodeEvent('input')
    const e2 = makeNodeEvent('llm_call')
    useGraphStore.getState().addNodeEvent(e1)
    useGraphStore.getState().addNodeEvent(e2)
    const { nodeEvents } = useGraphStore.getState()
    expect(nodeEvents).toHaveLength(2)
    expect(nodeEvents[0].node_id).toBe('input')
    expect(nodeEvents[1].node_id).toBe('llm_call')
  })

  it('reset clears all state', () => {
    // Populate state
    useGraphStore.getState().setLayout(makeLayout())
    useGraphStore.getState().updateCharacter(makeCharacter('input'))
    useGraphStore.getState().addNodeEvent(makeNodeEvent('input'))
    useGraphStore.getState().startRun()

    useGraphStore.getState().reset()

    const state = useGraphStore.getState()
    expect(state.isRunning).toBe(false)
    expect(state.nodeEvents).toEqual([])
    expect(state.layout).toBeNull()
    expect(state.characters.size).toBe(0)
    expect(state.selectedGraph).toBeNull()
  })

  it('startRun sets isRunning and clears nodeEvents', () => {
    useGraphStore.getState().addNodeEvent(makeNodeEvent('old'))
    useGraphStore.getState().startRun()
    const state = useGraphStore.getState()
    expect(state.isRunning).toBe(true)
    expect(state.nodeEvents).toEqual([])
    expect(state.isInterrupted).toBe(false)
  })

  it('stopRun clears isRunning', () => {
    useGraphStore.getState().startRun()
    useGraphStore.getState().stopRun()
    expect(useGraphStore.getState().isRunning).toBe(false)
  })

  it('setInterrupted toggles isInterrupted', () => {
    useGraphStore.getState().setInterrupted(true)
    expect(useGraphStore.getState().isInterrupted).toBe(true)
    useGraphStore.getState().setInterrupted(false)
    expect(useGraphStore.getState().isInterrupted).toBe(false)
  })
})
