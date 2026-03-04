import { GraphSelector } from './components/GraphSelector'
import { PixelCanvas } from './components/PixelCanvas'
import { ControlPanel } from './components/ControlPanel'
import { NodeStatusBar } from './components/NodeStatusBar'

function App() {
  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900 text-white overflow-hidden">
      <GraphSelector />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <PixelCanvas />
        </main>
        <NodeStatusBar />
      </div>
      <ControlPanel />
    </div>
  )
}

export default App
