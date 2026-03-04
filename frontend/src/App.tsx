import { useState } from 'react'
import { GraphSelector } from './components/GraphSelector'
import { PixelCanvas } from './components/PixelCanvas'
import { ControlPanel } from './components/ControlPanel'
import { NodeStatusBar } from './components/NodeStatusBar'
import { useDarkMode } from './hooks/useDarkMode'

function App() {
  const { isDark, toggle } = useDarkMode()
  const [statusBarOpen, setStatusBarOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen w-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden transition-colors">
      <GraphSelector isDark={isDark} onToggleDark={toggle} />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <PixelCanvas />
        </main>
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <NodeStatusBar />
        </div>
      </div>
      <ControlPanel />
      {/* Mobile NodeStatusBar: collapsible panel at bottom */}
      <div className="md:hidden">
        <button
          onClick={() => setStatusBarOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          aria-expanded={statusBarOpen}
        >
          <span>Node Status</span>
          <span className="text-xs">{statusBarOpen ? 'Collapse' : 'Expand'}</span>
        </button>
        {statusBarOpen && (
          <div className="max-h-48 overflow-y-auto border-t border-gray-200 dark:border-gray-700">
            <NodeStatusBar />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
