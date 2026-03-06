import { useEffect, useRef } from 'react'
import { useGraphStore } from '../store/graphStore'
import type { Character } from '../engine/Character'
import type { TileMap } from '../engine/TileMap'
import type { EdgeEffect } from '../engine/EdgeEffect'
import type { HandoffEffect } from '../engine/HandoffEffect'
import { findPath } from '../engine/Pathfinding'
import type { CharacterState as StoreCharState } from '../types/api'

export function useEngineSync(
  engineCharsRef: React.MutableRefObject<Map<string, Character>>,
  tileMapRef: React.MutableRefObject<TileMap | null>,
  edgeEffectRef: React.MutableRefObject<EdgeEffect>,
  handoffEffectRef: React.MutableRefObject<HandoffEffect>,
): void {
  const characters = useGraphStore((s) => s.characters)
  const nodeEvents = useGraphStore((s) => s.nodeEvents)
  const isInterrupted = useGraphStore((s) => s.isInterrupted)
  const isRunning = useGraphStore((s) => s.isRunning)

  const prevStatesRef = useRef<Map<string, StoreCharState['state']>>(new Map())
  const lastCompletedRef = useRef<string | null>(null)

  // Sync character states from store -> engine characters
  useEffect(() => {
    const prevStates = prevStatesRef.current

    // Collect transitions first (order-independent)
    const transitions: { id: string; storeChar: StoreCharState; engChar: Character; prevState: StoreCharState['state'] | undefined; newState: StoreCharState['state'] }[] = []

    for (const [id, storeChar] of characters) {
      const engChar = engineCharsRef.current.get(id)
      if (!engChar) continue

      const prevState = prevStates.get(id)
      const newState = storeChar.state
      if (prevState === newState) continue

      transitions.push({ id, storeChar, engChar, prevState, newState })
    }

    // Pass 1: Process completions first (so lastCompletedRef is set before running checks)
    for (const { id, engChar, newState } of transitions) {
      if (newState === 'completed') {
        prevStates.set(id, newState)
        engChar.setState('done')
        engChar.showBubble({ type: 'checkmark' })
        lastCompletedRef.current = id
      }
    }

    // Pass 2: Process running starts (handoff detection) and other states
    for (const { id, storeChar, engChar, newState } of transitions) {
      if (newState === 'completed') continue // already handled

      prevStates.set(id, newState)

      const tileMap = tileMapRef.current

      if (newState === 'running') {
        // Trigger handoff effect from last completed character
        const lastCompleted = lastCompletedRef.current
        if (lastCompleted && lastCompleted !== id) {
          const fromChar = engineCharsRef.current.get(lastCompleted)
          if (fromChar) {
            handoffEffectRef.current.trigger(
              fromChar.position,
              engChar.position,
              fromChar.color,
              engChar.color,
            )
          }
        }
        lastCompletedRef.current = null

        if (tileMap) {
          const walkableGrid = tileMap.getWalkableGrid()
          const dest = {
            x: Math.floor(storeChar.position.x),
            y: Math.floor(storeChar.position.y),
          }
          const path = findPath(
            walkableGrid,
            { x: Math.round(engChar.position.x), y: Math.round(engChar.position.y) },
            dest,
          )
          if (path && path.length > 1) {
            engChar.setPath(path)
            edgeEffectRef.current.trigger(path)
          } else {
            engChar.setState('working')
          }
        } else {
          engChar.setState('working')
        }
        engChar.showBubble({ type: 'hourglass', persistent: true })
      } else if (newState === 'error') {
        engChar.setState('error')
        engChar.showBubble({ type: 'error' })
      } else {
        engChar.setState('idle')
      }
    }
  }, [characters, engineCharsRef, tileMapRef, edgeEffectRef, handoffEffectRef])

  // Interval-based live bubble text updates from nodeOutputs
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      const nodeOutputs = useGraphStore.getState().nodeOutputs

      for (const [id, engChar] of engineCharsRef.current) {
        if (engChar.state !== 'working') continue
        const output = nodeOutputs.get(id)
        if (!output || output.length === 0) continue
        const displayText = output.length > 60 ? output.slice(-60) : output
        if (engChar.speechBubble && engChar.speechBubble.type === 'text') {
          engChar.speechBubble.updateContent(displayText)
        } else {
          engChar.showBubble({ type: 'text', content: displayText, persistent: true, streaming: true })
        }
      }
    }, 150)

    return () => clearInterval(interval)
  }, [isRunning, engineCharsRef])

  // Interrupt -> set running/walking characters to 'waiting' with persistent ? bubble
  const wasInterruptedRef = useRef(false)
  useEffect(() => {
    if (isInterrupted && !wasInterruptedRef.current) {
      wasInterruptedRef.current = true
      for (const engChar of engineCharsRef.current.values()) {
        if (engChar.state === 'working' || engChar.state === 'walking') {
          engChar.setState('waiting')
          engChar.showBubble({ type: 'question', persistent: true })
        }
      }
    } else if (!isInterrupted && wasInterruptedRef.current) {
      wasInterruptedRef.current = false
      // Hide persistent bubbles on resume; SSE events will drive new states
      for (const engChar of engineCharsRef.current.values()) {
        if (engChar.state === 'waiting') {
          engChar.hideBubble()
        }
      }
    }
  }, [isInterrupted, engineCharsRef])

  // Ignore nodeEvents dep - only used as trigger for interrupt detection via isInterrupted
  void nodeEvents
}
