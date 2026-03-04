import { useEffect, useRef } from 'react'
import { useGraphStore } from '../store/graphStore'

// Engine stubs – will be replaced once pixel-engine delivers src/engine/index.ts
interface EngineStub {
  setLayout?: (layout: unknown) => void
  updateCharacter?: (character: unknown) => void
  destroy?: () => void
}

function initEngine(_canvas: HTMLCanvasElement): EngineStub {
  // Minimal stub: just fill background so canvas isn't blank
  const ctx = _canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, _canvas.width, _canvas.height)
    ctx.fillStyle = '#3a3a5e'
    ctx.font = '14px monospace'
    ctx.fillText('PixelOps Engine loading...', 20, 30)
  }
  return {}
}

// Try to dynamically use real engine if available
async function tryLoadEngine(canvas: HTMLCanvasElement): Promise<EngineStub> {
  try {
    const engine = await import('../engine/index')
    if (typeof engine.initEngine === 'function') {
      return engine.initEngine(canvas) as EngineStub
    }
  } catch {
    // engine not ready yet
  }
  return initEngine(canvas)
}

export function PixelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<EngineStub | null>(null)
  const layout = useGraphStore((s) => s.layout)
  const characters = useGraphStore((s) => s.characters)

  // Init engine on mount
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    tryLoadEngine(canvas).then((eng) => {
      if (!cancelled) engineRef.current = eng
    })
    return () => {
      cancelled = true
      engineRef.current?.destroy?.()
      engineRef.current = null
    }
  }, [])

  // Sync layout to engine
  useEffect(() => {
    if (layout && engineRef.current?.setLayout) {
      engineRef.current.setLayout(layout)
    }
  }, [layout])

  // Sync characters to engine
  useEffect(() => {
    if (!engineRef.current?.updateCharacter) return
    characters.forEach((char) => {
      engineRef.current!.updateCharacter!(char)
    })
  }, [characters])

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      className="border border-gray-700 rounded w-full h-full object-contain"
    />
  )
}
