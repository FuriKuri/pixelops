import { useRef, useEffect } from 'react'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white">
      <main className="flex-1 flex items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-700 rounded"
        />
      </main>
      <aside className="w-80 border-l border-gray-700 p-4">
        <h1 className="text-xl font-bold mb-4">PixelOps</h1>
        <p className="text-gray-400 text-sm">No graph loaded</p>
      </aside>
    </div>
  )
}

export default App
