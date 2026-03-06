declare global {
  interface Window {
    __PIXELOPS_BASE__?: string
  }
}

const BASE = window.__PIXELOPS_BASE__ ?? ''

export const API_BASE = `${BASE}/api`
