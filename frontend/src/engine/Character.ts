import type { Position } from '../types/api.ts'
import { TILE_SIZE, CHARACTER_SPEED } from './constants.ts'
import type { Camera } from './Camera.ts'
import { SpriteCache } from './sprites/SpriteCache.ts'
import { getCachedCharacter } from './sprites/PlaceholderSprites.ts'
import { SpeechBubble, type SpeechBubbleConfig } from './SpeechBubble.ts'

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

  constructor(id: string, name: string, color: string, position: Position) {
    this.id = id
    this.name = name
    this.color = color
    this.position = { ...position }
  }

  setPath(path: Position[]): void {
    if (path.length === 0) return
    this.path = path
    this.pathIndex = 0
    this.state = 'walking'
    this.targetPosition = path[path.length - 1]
  }

  setState(state: CharacterState): void {
    this.state = state
  }

  showBubble(config: SpeechBubbleConfig): void {
    this.speechBubble = new SpeechBubble(config)
  }

  hideBubble(): void {
    this.speechBubble = null
  }

  update(deltaTime: number): void {
    if (this.state !== 'walking' || this.path.length === 0) return

    const target = this.path[this.pathIndex]
    const dx = target.x - this.position.x
    const dy = target.y - this.position.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const step = CHARACTER_SPEED * deltaTime

    if (dist <= step) {
      this.position.x = target.x
      this.position.y = target.y
      this.pathIndex++

      if (this.pathIndex >= this.path.length) {
        this.path = []
        this.pathIndex = 0
        this.targetPosition = null
        this.state = 'working'
      }
    } else {
      this.position.x += (dx / dist) * step
      this.position.y += (dy / dist) * step
    }
  }

  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const screen = camera.worldToScreen(this.position.x, this.position.y)
    const zoom = camera.zoom

    const cached = getCachedCharacter(this.spriteCache, this.color, zoom)
    ctx.drawImage(cached, screen.x, screen.y, TILE_SIZE * zoom, TILE_SIZE * zoom)

    // State indicator dot
    const dotSize = Math.max(2, zoom)
    ctx.fillStyle = this.getStateColor()
    ctx.fillRect(
      screen.x + TILE_SIZE * zoom - dotSize - zoom,
      screen.y + zoom,
      dotSize,
      dotSize,
    )

    // Speech bubble
    if (this.speechBubble?.visible) {
      this.speechBubble.render(ctx, screen.x, screen.y, zoom)
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
