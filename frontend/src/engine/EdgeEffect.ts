import type { Position } from '../types/api.ts'
import type { Camera } from './Camera.ts'
import { TILE_SIZE } from './constants.ts'

interface TravelingDot {
  progress: number // 0..1 along the path
  color: string
}

interface EdgeAnimation {
  path: Position[]
  dots: TravelingDot[]
  elapsed: number
  duration: number
}

const EDGE_DURATION = 0.5 // seconds
const DOT_COUNT = 4
const DOT_COLORS = ['#ffffff', '#aaddff', '#88bbff', '#ffffff']

export class EdgeEffect {
  private animations: EdgeAnimation[] = []

  trigger(path: Position[]): void {
    if (path.length < 2) return

    const dots: TravelingDot[] = []
    for (let i = 0; i < DOT_COUNT; i++) {
      dots.push({
        progress: -(i * 0.15), // stagger start
        color: DOT_COLORS[i % DOT_COLORS.length],
      })
    }

    this.animations.push({
      path,
      dots,
      elapsed: 0,
      duration: EDGE_DURATION,
    })
  }

  update(dt: number): void {
    for (let i = this.animations.length - 1; i >= 0; i--) {
      const anim = this.animations[i]
      anim.elapsed += dt

      const speed = 1 / anim.duration
      for (const dot of anim.dots) {
        dot.progress += speed * dt
      }

      if (anim.elapsed >= anim.duration + 0.3) {
        this.animations.splice(i, 1)
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const zoom = camera.zoom

    for (const anim of this.animations) {
      const fadeAlpha = anim.elapsed < anim.duration
        ? 1
        : Math.max(0, 1 - (anim.elapsed - anim.duration) / 0.3)

      // Draw faint path line
      if (anim.path.length >= 2) {
        ctx.strokeStyle = `rgba(136, 187, 255, ${0.3 * fadeAlpha})`
        ctx.lineWidth = Math.max(1, zoom * 0.5)
        ctx.beginPath()
        const first = anim.path[0]
        const sx = Math.floor((first.x * TILE_SIZE + TILE_SIZE / 2 - camera.x) * zoom)
        const sy = Math.floor((first.y * TILE_SIZE + TILE_SIZE / 2 - camera.y) * zoom)
        ctx.moveTo(sx, sy)
        for (let j = 1; j < anim.path.length; j++) {
          const p = anim.path[j]
          const px = Math.floor((p.x * TILE_SIZE + TILE_SIZE / 2 - camera.x) * zoom)
          const py = Math.floor((p.y * TILE_SIZE + TILE_SIZE / 2 - camera.y) * zoom)
          ctx.lineTo(px, py)
        }
        ctx.stroke()
      }

      // Draw traveling dots
      for (const dot of anim.dots) {
        if (dot.progress < 0 || dot.progress > 1) continue

        const pos = this.interpolatePath(anim.path, dot.progress)
        const dotScreenX = Math.floor((pos.x * TILE_SIZE + TILE_SIZE / 2 - camera.x) * zoom)
        const dotScreenY = Math.floor((pos.y * TILE_SIZE + TILE_SIZE / 2 - camera.y) * zoom)
        const dotSize = Math.max(1, Math.floor(zoom))

        ctx.globalAlpha = fadeAlpha
        ctx.fillStyle = dot.color
        ctx.fillRect(
          dotScreenX - Math.floor(dotSize / 2),
          dotScreenY - Math.floor(dotSize / 2),
          dotSize,
          dotSize,
        )
      }
    }

    ctx.globalAlpha = 1
  }

  private interpolatePath(path: Position[], t: number): Position {
    if (path.length === 0) return { x: 0, y: 0 }
    if (path.length === 1) return path[0]

    const totalSegments = path.length - 1
    const segFloat = t * totalSegments
    const segIndex = Math.min(Math.floor(segFloat), totalSegments - 1)
    const segT = segFloat - segIndex

    const a = path[segIndex]
    const b = path[segIndex + 1]
    return {
      x: a.x + (b.x - a.x) * segT,
      y: a.y + (b.y - a.y) * segT,
    }
  }
}
