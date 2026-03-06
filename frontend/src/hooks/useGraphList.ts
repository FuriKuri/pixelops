import { useEffect, useState } from 'react'
import { useGraphStore } from '../store/graphStore'
import type { GraphInfo } from '../types/api'
import { API_BASE } from '../config'

export function useGraphList() {
  const setGraphs = useGraphStore((s) => s.setGraphs)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    fetch(`${API_BASE}/graphs`)
      .then((res) => res.json())
      .then((data: GraphInfo[]) => {
        if (!cancelled) {
          setGraphs(data)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false)
        // silently fail if backend not available
      })
    return () => {
      cancelled = true
    }
  }, [setGraphs])

  return { isLoading }
}
