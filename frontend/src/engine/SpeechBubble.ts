import { TILE_SIZE, SPEECH_BUBBLE_DURATION } from './constants.ts'

export type BubbleType = 'text' | 'checkmark' | 'error' | 'question' | 'hourglass'

export interface SpeechBubbleConfig {
  type: BubbleType
  content?: string
  persistent?: boolean
}

export class SpeechBubble {
  type: BubbleType
  content: string
  private persistent: boolean
  private createdAt: number
  private _visible: boolean = true

  constructor(config: SpeechBubbleConfig) {
    this.type = config.type
    this.content = config.content ?? ''
    this.persistent = config.persistent ?? false
    this.createdAt = Date.now()
  }

  get visible(): boolean {
    if (this.persistent) return this._visible
    return Date.now() - this.createdAt < SPEECH_BUBBLE_DURATION
  }

  hide(): void {
    this._visible = false
  }

  render(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, zoom: number): void {
    if (!this.visible) return

    const icon = this.getIcon()
    const text = this.type === 'text' ? this.content : icon
    const charWidth = 5 * zoom
    const padding = 2 * zoom
    const textWidth = text.length * charWidth
    const bubbleWidth = textWidth + padding * 2
    const bubbleHeight = 8 * zoom
    const bubbleX = screenX + (TILE_SIZE * zoom - bubbleWidth) / 2
    const bubbleY = screenY - bubbleHeight - 2 * zoom

    // Bubble background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight)

    // Bubble border
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = zoom
    ctx.strokeRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight)

    // Tail triangle
    const tailX = screenX + (TILE_SIZE * zoom) / 2
    const tailY = bubbleY + bubbleHeight
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.moveTo(tailX - 2 * zoom, tailY)
    ctx.lineTo(tailX, tailY + 2 * zoom)
    ctx.lineTo(tailX + 2 * zoom, tailY)
    ctx.closePath()
    ctx.fill()

    // Tail border
    ctx.beginPath()
    ctx.moveTo(tailX - 2 * zoom, tailY)
    ctx.lineTo(tailX, tailY + 2 * zoom)
    ctx.lineTo(tailX + 2 * zoom, tailY)
    ctx.strokeStyle = '#000000'
    ctx.stroke()

    // Text
    ctx.fillStyle = this.getTextColor()
    ctx.font = `${6 * zoom}px monospace`
    ctx.textBaseline = 'middle'
    ctx.fillText(text, bubbleX + padding, bubbleY + bubbleHeight / 2)
  }

  private getIcon(): string {
    switch (this.type) {
      case 'checkmark': return '\u2713'
      case 'error': return 'X'
      case 'question': return '?'
      case 'hourglass': return '...'
      case 'text': return this.content
    }
  }

  private getTextColor(): string {
    switch (this.type) {
      case 'checkmark': return '#22aa22'
      case 'error': return '#dd2222'
      case 'question': return '#2222dd'
      case 'hourglass': return '#888888'
      case 'text': return '#000000'
    }
  }
}
