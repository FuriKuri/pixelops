import { useEffect, useRef } from 'react'
import { useGraphStore } from '../store/graphStore'
import type { Character } from '../engine/Character'
import type { TileMap } from '../engine/TileMap'
import type { EdgeEffect } from '../engine/EdgeEffect'
import { findPath } from '../engine/Pathfinding'
import type { CharacterState as StoreCharState } from '../types/api'

export function useEngineSync(
  engineCharsRef: React.MutableRefObject<Map<string, Character>>,
  tileMapRef: React.MutableRefObject<TileMap | null>,
  edgeEffectRef: React.MutableRefObject<EdgeEffect>,
): void {
  const characters = useGraphStore((s) => s.characters)
  const nodeEvents = useGraphStore((s) => s.nodeEvents)
  const isInterrupted = useGraphStore((s) => s.isInterrupted)

  const prevStatesRef = useRef<Map<string, StoreCharState['state']>>(new Map())

  // Sync character states from store -> engine characters
  useEffect(() => {
    const prevStates = prevStatesRef.current

    for (const [id, storeChar] of characters) {
      const engChar = engineCharsRef.current.get(id)
      if (!engChar) continue

      const prevState = prevStates.get(id)
      const newState = storeChar.state
      if (prevState === newState) continue

      console.log(`[EngineSync] ${id}: ${prevState ?? 'init'} -> ${newState}`)
      prevStates.set(id, newState)

      const tileMap = tileMapRef.current

      if (newState === 'running') {
        if (tileMap) {
          const walkableGrid = tileMap.getWalkableGrid()
          // Destination: tile in front of desk (y+1), which is walkable floor
          const dest = {
            x: Math.floor(storeChar.position.x),
            y: Math.floor(storeChar.position.y) + 1,
          }
          const path = findPath(
            walkableGrid,
            { x: Math.round(engChar.position.x), y: Math.round(engChar.position.y) },
            dest,
          )
          if (path && path.length > 1) {
            engChar.setPath(path) // walking -> auto transitions to 'working' on arrival
            // Trigger edge effect along the path
            edgeEffectRef.current.trigger(path)
          } else {
            engChar.setState('working')
          }
        } else {
          engChar.setState('working')
        }
        engChar.showBubble({ type: 'hourglass' })
      } else if (newState === 'completed') {
        engChar.setState('done')
        engChar.showBubble({ type: 'checkmark' })
      } else if (newState === 'error') {
        engChar.setState('error')
        engChar.showBubble({ type: 'error' })
      } else {
        // pending / idle
        engChar.setState('idle')
      }
    }
  }, [characters, engineCharsRef, tileMapRef, edgeEffectRef])

  // Interrupt -> set running/walking characters to 'waiting' with persistent ? bubble
  const wasInterruptedRef = useRef(false)
  useEffect(() => {
    if (isInterrupted && !wasInterruptedRef.current) {
      wasInterruptedRef.current = true
      for (const engChar of engineCharsRef.current.values()) {
        if (engChar.state === 'working' || engChar.state === 'walking') {
          engChar.setState('waiting')
          engChar.showBubble({ type: 'question', persistent: true })
          console.log(`[EngineSync] ${engChar.id}: -> waiting (interrupt)`)
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
