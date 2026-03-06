import type { Position } from '../types/api.ts'
import { TILE_SIZE, CHARACTER_SPEED } from './constants.ts'
import type { Camera } from './Camera.ts'
import { SpriteCache } from './sprites/SpriteCache.ts'
import { getCachedCharacter } from './sprites/PlaceholderSprites.ts'
import { SpeechBubble, type SpeechBubbleConfig } from './SpeechBubble.ts'
import type { ParticleSystem } from './ParticleSystem.ts'

export type CharacterState = 'idle' | 'walking' | 'working' | 'done' | 'error' | 'waiting'

export class Character {
  readonly id: string
  readonly name: string
  readonly color: string
  position: Position
  targetPosition: Position | null = null
  state: CharacterState = 'idle'
  private path: Position[] = []
  private pathIndex: number = 0
  private spriteCache: SpriteCache = new SpriteCache()
  speechBubble: SpeechBubble | null = null

  // Animation time accumulator (seconds)
  private animTime: number = 0
  // Walking easing: track progress along current path segment
  private segmentProgress: number = 0
  private segmentStart: Position = { x: 0, y: 0 }
  // State flash effect
  private flashColor: string | null = null
  private flashTimer: number = 0
  private readonly flashDuration: number = 0.2
  // Idle look-around timer
  private idleLookTimer: number = 0
  private idleLookCooldown: number = 3 + Math.random() * 2
  private isLookingAround: boolean = false
  private lookAroundTimer: number = 0
  private readonly lookAroundDuration: number = 0.3
  // Working particle timer
  private workParticleTimer: number = 0
  // Reference to particle system (set externally)
  particleSystem: ParticleSystem | null = null

  constructor(id: string, name: string, color: string, position: Position) {
    this.id = id
    this.name = name
    this.color = color
    this.position = { ...position }
    this.segmentStart = { ...position }
  }

  setPath(path: Position[]): void {
    if (path.length === 0) return
    this.path = path
    this.pathIndex = 0
    this.state = 'walking'
    this.targetPosition = path[path.length - 1]
    this.segmentStart = { ...this.position }
    this.segmentProgress = 0
  }

  setState(newState: CharacterState): void {
    const prevState = this.state
    this.state = newState

    // Trigger flash effects on certain transitions
    if (newState === 'done' && prevState !== 'done') {
      this.flashColor = '#4ad94a'
      this.flashTimer = this.flashDuration
      this.particleSystem?.emit(this.position.x, this.position.y, 'success_burst')
    } else if (newState === 'error' && prevState !== 'error') {
      this.flashColor = '#d94a4a'
      this.flashTimer = this.flashDuration
      this.particleSystem?.emit(this.position.x, this.position.y, 'error_burst')
    }

    // Reset idle timers when entering idle
    if (newState === 'idle') {
      this.idleLookTimer = 0
      this.idleLookCooldown = 3 + Math.random() * 2
    }

    // Reset work particle timer
    if (newState === 'working') {
      this.workParticleTimer = 0
    }
  }

  showBubble(config: SpeechBubbleConfig): void {
    this.speechBubble = new SpeechBubble(config)
  }

  hideBubble(): void {
    this.speechBubble = null
  }

  update(deltaTime: number): void {
    this.animTime += deltaTime

    // Update flash timer
    if (this.flashTimer > 0) {
      this.flashTimer -= deltaTime
      if (this.flashTimer <= 0) {
        this.flashTimer = 0
        this.flashColor = null
      }
    }

    // Walking: interpolate along path with easing
    if (this.state === 'walking' && this.path.length > 0) {
      this.updateWalking(deltaTime)
    }

    // Idle: look-around timer
    if (this.state === 'idle') {
      this.updateIdleAnimation(deltaTime)
    }

    // Working: emit particles periodically
    if (this.state === 'working') {
      this.workParticleTimer += deltaTime
      if (this.workParticleTimer >= 0.5) {
        this.workParticleTimer = 0
        this.particleSystem?.emit(this.position.x, this.position.y, 'work_sparkle')
      }
    }
  }

  private updateWalking(deltaTime: number): void {
    const target = this.path[this.pathIndex]
    const segDx = target.x - this.segmentStart.x
    const segDy = target.y - this.segmentStart.y
    const segDist = Math.sqrt(segDx * segDx + segDy * segDy)

    if (segDist < 0.001) {
      // Already at target, advance
      this.position.x = target.x
      this.position.y = target.y
      this.advancePath()
      return
    }

    // How far through this segment (linear progress based on speed)
    const linearStep = (CHARACTER_SPEED * deltaTime) / segDist
    this.segmentProgress = Math.min(1, this.segmentProgress + linearStep)

    const easedT = this.segmentProgress
    this.position.x = this.segmentStart.x + segDx * easedT
    this.position.y = this.segmentStart.y + segDy * easedT

    if (this.segmentProgress >= 1) {
      this.position.x = target.x
      this.position.y = target.y
      this.advancePath()
    }
  }

  private advancePath(): void {
    this.pathIndex++
    if (this.pathIndex >= this.path.length) {
      this.path = []
      this.pathIndex = 0
      this.targetPosition = null
      this.state = 'working'
      this.segmentProgress = 0
    } else {
      this.segmentStart = { ...this.position }
      this.segmentProgress = 0
    }
  }

  private updateIdleAnimation(deltaTime: number): void {
    if (this.isLookingAround) {
      this.lookAroundTimer -= deltaTime
      if (this.lookAroundTimer <= 0) {
        this.isLookingAround = false
        this.idleLookTimer = 0
        this.idleLookCooldown = 3 + Math.random() * 2
      }
    } else {
      this.idleLookTimer += deltaTime
      if (this.idleLookTimer >= this.idleLookCooldown) {
        this.isLookingAround = true
        this.lookAroundTimer = this.lookAroundDuration
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const screen = camera.worldToScreen(this.position.x, this.position.y)
    const zoom = camera.zoom
    let renderY = screen.y

    // Walking bob: sine wave oscillation +-1px
    if (this.state === 'walking') {
      renderY += Math.sin(this.animTime * 10) * zoom * 0.0625 * TILE_SIZE
    }

    // Idle breathing: gentle Y oscillation +-0.5px, period 2s
    if (this.state === 'idle') {
      renderY += Math.sin(this.animTime * Math.PI) * zoom * 0.03125 * TILE_SIZE
    }

    // Flash effect: draw colored rect behind character
    if (this.flashTimer > 0 && this.flashColor) {
      const flashAlpha = this.flashTimer / this.flashDuration
      const flashPad = 2 * zoom
      ctx.globalAlpha = flashAlpha * 0.6
      ctx.fillStyle = this.flashColor
      ctx.fillRect(
        screen.x - flashPad,
        renderY - flashPad,
        TILE_SIZE * zoom + flashPad * 2,
        TILE_SIZE * zoom + flashPad * 2,
      )
      ctx.globalAlpha = 1
    }

    // Draw character sprite
    const cached = getCachedCharacter(this.spriteCache, this.color, zoom)

    // Idle look-around: slight color tint via globalAlpha overlay
    if (this.isLookingAround) {
      // Draw with slight brightness shift
      ctx.globalAlpha = 0.85
      ctx.drawImage(cached, screen.x, renderY, TILE_SIZE * zoom, TILE_SIZE * zoom)
      ctx.globalAlpha = 0.15
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(screen.x, renderY, TILE_SIZE * zoom, TILE_SIZE * zoom)
      ctx.globalAlpha = 1
    } else {
      ctx.drawImage(cached, screen.x, renderY, TILE_SIZE * zoom, TILE_SIZE * zoom)
    }

    // State indicator dot
    const dotSize = Math.max(2, zoom)
    ctx.fillStyle = this.getStateColor()
    ctx.fillRect(
      screen.x + TILE_SIZE * zoom - dotSize - zoom,
      renderY + zoom,
      dotSize,
      dotSize,
    )

    // Name label below sprite
    const nameFont = `bold ${Math.max(7, 6 * zoom)}px monospace`
    ctx.font = nameFont
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const nameX = screen.x + (TILE_SIZE * zoom) / 2
    const nameY = renderY + TILE_SIZE * zoom + 4 * zoom
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2 * zoom * 0.3
    ctx.strokeText(this.name, nameX, nameY)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(this.name, nameX, nameY)
    ctx.textAlign = 'left'

    // Waiting state: pulsing question bubble
    if (this.state === 'waiting' && this.speechBubble?.visible) {
      const pulseScale = 1 + Math.sin(this.animTime * 4) * 0.05
      ctx.save()
      const bubbleCenterX = screen.x + (TILE_SIZE * zoom) / 2
      const bubbleCenterY = renderY - 6 * zoom
      ctx.translate(bubbleCenterX, bubbleCenterY)
      ctx.scale(pulseScale, pulseScale)
      ctx.translate(-bubbleCenterX, -bubbleCenterY)
      this.speechBubble.render(ctx, screen.x, renderY, zoom)
      ctx.restore()
    } else if (this.speechBubble?.visible) {
      this.speechBubble.render(ctx, screen.x, renderY, zoom)
    }
  }

  private getStateColor(): string {
    switch (this.state) {
      case 'idle': return '#888888'
      case 'walking': return '#4a90d9'
      case 'working': return '#d9d94a'
      case 'done': return '#4ad94a'
      case 'error': return '#d94a4a'
      case 'waiting': return '#d9904a'
    }
  }
}
