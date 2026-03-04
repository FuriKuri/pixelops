import { useEffect, useState } from 'react'

const STORAGE_KEY = 'pixelops-theme'

function getInitialDark(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light') return false
    if (stored === 'dark') return true
  } catch {
    // ignore storage errors
  }
  // Default: dark (pixel-art app)
  return true
}

export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(getInitialDark)

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    try {
      localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light')
    } catch {
      // ignore storage errors
    }
  }, [isDark])

  const toggle = () => setIsDark((prev) => !prev)

  return { isDark, toggle }
}
