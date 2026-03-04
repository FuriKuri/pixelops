import type { Camera } from './Camera.ts'
import { TILE_SIZE } from './constants.ts'

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
}

export interface ParticlePreset {
  count: number
  color: string | string[]
  speed: number
  spread: 'radial' | 'upward'
  lifetime: number
}

const PARTICLE_PRESETS: Record<string, ParticlePreset> = {
  work_sparkle: {
    count: 3,
    color: ['#d9d94a', '#ffff88', '#ffcc44'],
    speed: 12,
    spread: 'upward',
    lifetime: 0.8,
  },
  success_burst: {
    count: 8,
    color: ['#4ad94a', '#88ff88', '#22cc22'],
    speed: 30,
    spread: 'radial',
    lifetime: 0.4,
  },
  error_burst: {
    count: 8,
    color: ['#d94a4a', '#ff8888', '#cc2222'],
    speed: 30,
    spread: 'radial',
    lifetime: 0.4,
  },
}

const MAX_PARTICLES = 50

export class ParticleSystem {
  private particles: Particle[] = []

  emit(worldX: number, worldY: number, presetName: string): void {
    const preset = PARTICLE_PRESETS[presetName]
    if (!preset) return

    const colors = Array.isArray(preset.color) ? preset.color : [preset.color]

    for (let i = 0; i < preset.count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break

      let vx: number
      let vy: number

      if (preset.spread === 'radial') {
        const angle = (Math.PI * 2 * i) / preset.count + (Math.random() - 0.5) * 0.5
        vx = Math.cos(angle) * preset.speed * (0.5 + Math.random() * 0.5)
        vy = Math.sin(angle) * preset.speed * (0.5 + Math.random() * 0.5)
      } else {
        // upward
        vx = (Math.random() - 0.5) * preset.speed * 0.5
        vy = -preset.speed * (0.5 + Math.random() * 0.5)
      }

      const color = colors[Math.floor(Math.random() * colors.length)]
      this.particles.push({
        x: worldX * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * 4,
        y: worldY * TILE_SIZE + (Math.random() - 0.5) * 4,
        vx,
        vy,
        life: preset.lifetime,
        maxLife: preset.lifetime,
        color,
      })
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= dt

      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const zoom = camera.zoom

    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife)
      const screenX = Math.floor((p.x - camera.x) * zoom)
      const screenY = Math.floor((p.y - camera.y) * zoom)
      const size = Math.max(1, Math.floor(zoom))

      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      ctx.fillRect(screenX, screenY, size, size)
    }

    ctx.globalAlpha = 1
  }

  get count(): number {
    return this.particles.length
  }
}
