import { useEffect } from 'react'
import { useGraphStore } from '../store/graphStore'
import type { GraphInfo } from '../types/api'

const API_BASE = 'http://localhost:8000'

export function useGraphList() {
  const setGraphs = useGraphStore((s) => s.setGraphs)

  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE}/api/graphs`)
      .then((res) => res.json())
      .then((data: GraphInfo[]) => {
        if (!cancelled) setGraphs(data)
      })
      .catch(() => {
        // silently fail if backend not available
      })
    return () => { cancelled = true }
  }, [setGraphs])
}
