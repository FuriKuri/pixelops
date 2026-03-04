import { useEffect, useRef } from 'react'
import { useGraphStore } from '../store/graphStore'
import { GameLoop } from '../engine/GameLoop'
import { Renderer } from '../engine/Renderer'
import { Camera } from '../engine/Camera'
import { TileMap } from '../engine/TileMap'
import { Character } from '../engine/Character'
import { getCharacterColor } from '../engine/sprites/PlaceholderSprites'
import { useEngineSync } from '../hooks/useEngineSync'

export function PixelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const cameraRef = useRef<Camera | null>(null)
  const tileMapRef = useRef<TileMap | null>(null)
  const gameLoopRef = useRef<GameLoop | null>(null)
  const engineCharsRef = useRef<Map<string, Character>>(new Map())

  const layout = useGraphStore((s) => s.layout)

  // Init engine on mount
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new Renderer(canvas)
    const camera = new Camera()
    const tileMap = new TileMap()

    rendererRef.current = renderer
    cameraRef.current = camera
    tileMapRef.current = tileMap

    camera.setViewport(renderer.width, renderer.height)
    const detachCamera = camera.attachToCanvas(canvas)

    const gameLoop = new GameLoop((dt) => {
      for (const char of engineCharsRef.current.values()) {
        char.update(dt)
      }
      renderer.clear()
      tileMap.render(renderer.ctx, camera)
      for (const char of engineCharsRef.current.values()) {
        char.render(renderer.ctx, camera)
      }
    })
    gameLoopRef.current = gameLoop
    gameLoop.start()

    return () => {
      gameLoop.stop()
      detachCamera()
      rendererRef.current = null
      cameraRef.current = null
      tileMapRef.current = null
      gameLoopRef.current = null
    }
  }, [])

  // Load layout → TileMap + engine characters
  useEffect(() => {
    if (!layout) return
    const tileMap = tileMapRef.current
    const camera = cameraRef.current
    const renderer = rendererRef.current
    if (!tileMap || !camera) return

    tileMap.loadFromLayout(layout)

    // Create engine characters at the walkable tile in front of each desk (y+1)
    const newChars = new Map<string, Character>()
    let colorIndex = 0
    for (const [nodeId, pos] of Object.entries(layout.node_positions)) {
      const color = getCharacterColor(colorIndex++)
      // Place character in front of their desk – y+1 is walkable floor
      const charPos = { x: pos.x, y: pos.y + 1 }
      newChars.set(nodeId, new Character(nodeId, nodeId, color, charPos))
    }
    engineCharsRef.current = newChars

    // Center camera on map midpoint
    camera.setViewport(renderer?.width ?? 800, renderer?.height ?? 600)
    camera.centerOn(tileMap.width / 2, tileMap.height / 2)
  }, [layout])

  // Sync SSE events → engine character states
  useEngineSync(engineCharsRef, tileMapRef)

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      className="border border-gray-700 rounded w-full h-full"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
