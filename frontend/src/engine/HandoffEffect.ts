import type { Position } from '../types/api.ts'
import type { Camera } from './Camera.ts'
import { TILE_SIZE } from './constants.ts'

interface TrailParticle {
  x: number
  y: number
  life: number
  maxLife: number
  color: string
}

interface HandoffAnimation {
  from: Position // world tile coords
  to: Position
  fromColor: string
  toColor: string
  progress: number // 0..1
  duration: number
  trail: TrailParticle[]
  trailTimer: number
  arrived: boolean
  fadeOut: number // post-arrival fade timer
}

const HANDOFF_DURATION = 1.2
const TRAIL_SPAWN_INTERVAL = 0.015
const TRAIL_LIFETIME = 0.5
const ARC_HEIGHT = 2.0 // tiles of arc above the straight line
const ARRIVE_FLASH_DURATION = 0.4

export class HandoffEffect {
  private animations: HandoffAnimation[] = []

  trigger(from: Position, to: Position, fromColor: string, toColor: string): void {
    this.animations.push({
      from: { x: from.x, y: from.y },
      to: { x: to.x, y: to.y },
      fromColor,
      toColor,
      progress: 0,
      duration: HANDOFF_DURATION,
      trail: [],
      trailTimer: 0,
      arrived: false,
      fadeOut: 0,
    })
  }

  update(dt: number): void {
    for (let i = this.animations.length - 1; i >= 0; i--) {
      const anim = this.animations[i]

      if (!anim.arrived) {
        anim.progress = Math.min(1, anim.progress + dt / anim.duration)

        // Spawn trail particles
        anim.trailTimer += dt
        while (anim.trailTimer >= TRAIL_SPAWN_INTERVAL) {
          anim.trailTimer -= TRAIL_SPAWN_INTERVAL
          const pos = this.getArcPosition(anim, anim.progress)
          const t = anim.progress
          const color = lerpColor(anim.fromColor, anim.toColor, t)
          anim.trail.push({
            x: pos.x,
            y: pos.y,
            life: TRAIL_LIFETIME,
            maxLife: TRAIL_LIFETIME,
            color,
          })
        }

        if (anim.progress >= 1) {
          anim.arrived = true
          anim.fadeOut = ARRIVE_FLASH_DURATION
        }
      } else {
        anim.fadeOut -= dt
      }

      // Update trail particles
      for (let j = anim.trail.length - 1; j >= 0; j--) {
        anim.trail[j].life -= dt
        if (anim.trail[j].life <= 0) {
          anim.trail.splice(j, 1)
        }
      }

      // Remove finished animations
      if (anim.arrived && anim.fadeOut <= 0 && anim.trail.length === 0) {
        this.animations.splice(i, 1)
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const zoom = camera.zoom

    for (const anim of this.animations) {
      // Draw a visible line from source to target
      const fromScreen = this.toScreen(anim.from, camera)
      const toScreen = this.toScreen(anim.to, camera)

      ctx.save()
      ctx.globalAlpha = 0.4
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = Math.max(1, zoom)
      ctx.setLineDash([4 * zoom, 4 * zoom])
      ctx.beginPath()
      ctx.moveTo(fromScreen.x, fromScreen.y)
      ctx.lineTo(toScreen.x, toScreen.y)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()

      // Draw trail particles
      for (const p of anim.trail) {
        const alpha = p.life / p.maxLife
        const sx = Math.floor((p.x - camera.x) * zoom)
        const sy = Math.floor((p.y - camera.y) * zoom)
        const size = Math.max(2, Math.floor(zoom * 1.5))

        ctx.globalAlpha = alpha * 0.8
        ctx.fillStyle = p.color
        ctx.fillRect(sx - Math.floor(size / 2), sy - Math.floor(size / 2), size, size)

        // Trail glow
        ctx.globalAlpha = alpha * 0.3
        ctx.fillStyle = '#ffffff'
        const glowSize = size + Math.max(2, Math.floor(zoom))
        ctx.fillRect(sx - Math.floor(glowSize / 2), sy - Math.floor(glowSize / 2), glowSize, glowSize)
      }

      // Draw the orb (if still in flight)
      if (!anim.arrived) {
        const pos = this.getArcPosition(anim, anim.progress)
        const sx = Math.floor((pos.x - camera.x) * zoom)
        const sy = Math.floor((pos.y - camera.y) * zoom)
        const orbSize = Math.max(6, Math.floor(zoom * 4))
        const color = lerpColor(anim.fromColor, anim.toColor, anim.progress)

        // Outer glow
        ctx.globalAlpha = 0.35
        ctx.fillStyle = '#ffffff'
        const outerGlow = orbSize * 2
        ctx.fillRect(
          sx - Math.floor(outerGlow / 2),
          sy - Math.floor(outerGlow / 2),
          outerGlow,
          outerGlow,
        )

        // Color glow
        ctx.globalAlpha = 0.6
        ctx.fillStyle = color
        const colorGlow = Math.floor(orbSize * 1.5)
        ctx.fillRect(
          sx - Math.floor(colorGlow / 2),
          sy - Math.floor(colorGlow / 2),
          colorGlow,
          colorGlow,
        )

        // Core orb
        ctx.globalAlpha = 1
        ctx.fillStyle = color
        ctx.fillRect(
          sx - Math.floor(orbSize / 2),
          sy - Math.floor(orbSize / 2),
          orbSize,
          orbSize,
        )

        // Bright center
        ctx.fillStyle = '#ffffff'
        const centerSize = Math.max(2, Math.floor(orbSize * 0.4))
        ctx.fillRect(
          sx - Math.floor(centerSize / 2),
          sy - Math.floor(centerSize / 2),
          centerSize,
          centerSize,
        )
      }

      // Arrival flash at target
      if (anim.arrived && anim.fadeOut > 0) {
        const alpha = anim.fadeOut / ARRIVE_FLASH_DURATION
        const ts = toScreen
        const flashSize = Math.max(8, Math.floor(zoom * 6 * (1 + (1 - alpha) * 0.5)))

        ctx.globalAlpha = alpha * 0.6
        ctx.fillStyle = anim.toColor
        ctx.fillRect(
          ts.x - Math.floor(flashSize / 2),
          ts.y - Math.floor(flashSize / 2),
          flashSize,
          flashSize,
        )

        ctx.globalAlpha = alpha * 0.9
        ctx.fillStyle = '#ffffff'
        const innerSize = Math.max(4, Math.floor(flashSize * 0.4))
        ctx.fillRect(
          ts.x - Math.floor(innerSize / 2),
          ts.y - Math.floor(innerSize / 2),
          innerSize,
          innerSize,
        )
      }
    }

    ctx.globalAlpha = 1
  }

  private toScreen(tilePos: Position, camera: Camera): { x: number; y: number } {
    const zoom = camera.zoom
    return {
      x: Math.floor((tilePos.x * TILE_SIZE + TILE_SIZE / 2 - camera.x) * zoom),
      y: Math.floor((tilePos.y * TILE_SIZE + TILE_SIZE / 2 - camera.y) * zoom),
    }
  }

  private getArcPosition(anim: HandoffAnimation, t: number): { x: number; y: number } {
    const fromPx = this.tileToPixelCenter(anim.from)
    const toPx = this.tileToPixelCenter(anim.to)

    // Linear interpolation
    const x = fromPx.x + (toPx.x - fromPx.x) * t
    const baseY = fromPx.y + (toPx.y - fromPx.y) * t

    // Arc: parabola peaking at t=0.5
    const arcOffset = -ARC_HEIGHT * TILE_SIZE * 4 * t * (1 - t)
    const y = baseY + arcOffset

    return { x, y }
  }

  private tileToPixelCenter(pos: Position): { x: number; y: number } {
    return {
      x: pos.x * TILE_SIZE + TILE_SIZE / 2,
      y: pos.y * TILE_SIZE + TILE_SIZE / 2,
    }
  }
}

/** Linearly interpolate between two hex colors */
function lerpColor(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16)
  const ag = parseInt(a.slice(3, 5), 16)
  const ab = parseInt(a.slice(5, 7), 16)
  const br = parseInt(b.slice(1, 3), 16)
  const bg = parseInt(b.slice(3, 5), 16)
  const bb = parseInt(b.slice(5, 7), 16)

  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const blue = Math.round(ab + (bb - ab) * t)

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`
}
