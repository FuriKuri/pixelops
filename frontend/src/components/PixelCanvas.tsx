import { useEffect, useRef } from 'react'
import { useGraphStore } from '../store/graphStore'
import { GameLoop } from '../engine/GameLoop'
import { Renderer } from '../engine/Renderer'
import { Camera } from '../engine/Camera'
import { TileMap } from '../engine/TileMap'
import { Character } from '../engine/Character'
import { ParticleSystem } from '../engine/ParticleSystem'
import { EdgeEffect } from '../engine/EdgeEffect'
import { HandoffEffect } from '../engine/HandoffEffect'
import { GraphEdgeRenderer } from '../engine/GraphEdgeRenderer'
import { getCharacterColor } from '../engine/sprites/PlaceholderSprites'
import { useEngineSync } from '../hooks/useEngineSync'

export function PixelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const cameraRef = useRef<Camera | null>(null)
  const tileMapRef = useRef<TileMap | null>(null)
  const gameLoopRef = useRef<GameLoop | null>(null)
  const engineCharsRef = useRef<Map<string, Character>>(new Map())
  const particleSystemRef = useRef<ParticleSystem>(new ParticleSystem())
  const edgeEffectRef = useRef<EdgeEffect>(new EdgeEffect())
  const handoffEffectRef = useRef<HandoffEffect>(new HandoffEffect())
  const graphEdgeRendererRef = useRef<GraphEdgeRenderer>(new GraphEdgeRenderer())

  const layout = useGraphStore((s) => s.layout)
  const selectedGraph = useGraphStore((s) => s.selectedGraph)
  const selectedGraphEdges = selectedGraph?.edges

  // Init engine on mount
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new Renderer(canvas)
    const camera = new Camera()
    const tileMap = new TileMap()
    const particleSystem = particleSystemRef.current
    const edgeEffect = edgeEffectRef.current
    const handoffEffect = handoffEffectRef.current
    const graphEdgeRenderer = graphEdgeRendererRef.current

    rendererRef.current = renderer
    cameraRef.current = camera
    tileMapRef.current = tileMap

    camera.setViewport(renderer.width, renderer.height)
    const detachCamera = camera.attachToCanvas(canvas)

    const gameLoop = new GameLoop((dt) => {
      // Update
      for (const char of engineCharsRef.current.values()) {
        char.update(dt)
      }
      particleSystem.update(dt)
      edgeEffect.update(dt)
      handoffEffect.update(dt)
      graphEdgeRenderer.update(dt)

      // Render
      renderer.clear()
      tileMap.render(renderer.ctx, camera)
      graphEdgeRenderer.render(renderer.ctx, camera)
      edgeEffect.render(renderer.ctx, camera)
      handoffEffect.render(renderer.ctx, camera)
      for (const char of engineCharsRef.current.values()) {
        char.render(renderer.ctx, camera)
      }
      particleSystem.render(renderer.ctx, camera)
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

  // Load layout -> TileMap + engine characters
  useEffect(() => {
    if (!layout) return
    const tileMap = tileMapRef.current
    const camera = cameraRef.current
    const renderer = rendererRef.current
    if (!tileMap || !camera) return

    tileMap.loadFromLayout(layout)

    // Create engine characters at node positions
    const newChars = new Map<string, Character>()
    let colorIndex = 0
    for (const [nodeId, pos] of Object.entries(layout.node_positions)) {
      const color = getCharacterColor(colorIndex++)
      const char = new Character(nodeId, nodeId, color, { x: pos.x, y: pos.y })
      char.particleSystem = particleSystemRef.current
      newChars.set(nodeId, char)
    }
    engineCharsRef.current = newChars

    // Load graph edges for persistent connection rendering
    if (selectedGraphEdges) {
      graphEdgeRendererRef.current.load(layout.node_positions, selectedGraphEdges)
    }

    // Center camera on map midpoint
    camera.setViewport(renderer?.width ?? 800, renderer?.height ?? 600)
    camera.centerOn(tileMap.width / 2, tileMap.height / 2)
  }, [layout, selectedGraphEdges])

  // Sync SSE events -> engine character states
  useEngineSync(engineCharsRef, tileMapRef, edgeEffectRef, handoffEffectRef)

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border border-gray-200 dark:border-gray-700 rounded w-full h-full transition-colors"
        style={{ imageRendering: 'pixelated' }}
      />
      {!selectedGraph && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">
            Select a graph to begin
          </p>
        </div>
      )}
    </div>
  )
}
