import { TILE_SIZE, SPEECH_BUBBLE_DURATION } from './constants.ts'

export type BubbleType = 'text' | 'checkmark' | 'error' | 'question' | 'hourglass'

export interface SpeechBubbleConfig {
  type: BubbleType
  content?: string
  persistent?: boolean
  streaming?: boolean
}

export class SpeechBubble {
  type: BubbleType
  content: string
  streaming: boolean
  private persistent: boolean
  private createdAt: number
  private _visible: boolean = true

  constructor(config: SpeechBubbleConfig) {
    this.type = config.type
    this.content = config.content ?? ''
    this.persistent = config.persistent ?? false
    this.streaming = config.streaming ?? false
    this.createdAt = Date.now()
  }

  get visible(): boolean {
    if (this.persistent) return this._visible
    return Date.now() - this.createdAt < SPEECH_BUBBLE_DURATION
  }

  hide(): void {
    this._visible = false
  }

  updateContent(text: string): void {
    this.content = text
  }

  render(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, zoom: number): void {
    if (!this.visible) return

    if (this.type !== 'text') {
      this.renderIcon(ctx, screenX, screenY, zoom)
      return
    }

    const lines = this.wrapText(this.content, 20)
    const charWidth = 5 * zoom
    const padding = 2 * zoom
    const lineHeight = 8 * zoom

    // Append blinking "..." for streaming
    if (this.streaming) {
      const blink = Math.floor(Date.now() / 500) % 2 === 0
      if (blink) {
        const lastIdx = lines.length - 1
        lines[lastIdx] = lines[lastIdx] + '...'
      }
    }

    const maxLineWidth = Math.max(...lines.map(l => l.length)) * charWidth
    const bubbleWidth = maxLineWidth + padding * 2
    const bubbleHeight = lineHeight * lines.length + padding * 2
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

    // Render each line
    ctx.fillStyle = '#000000'
    ctx.font = `${6 * zoom}px monospace`
    ctx.textBaseline = 'top'
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], bubbleX + padding, bubbleY + padding + i * lineHeight)
    }
  }

  private renderIcon(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, zoom: number): void {
    const icon = this.getIcon()
    const charWidth = 5 * zoom
    const padding = 2 * zoom
    const textWidth = icon.length * charWidth
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

    // Icon text
    ctx.fillStyle = this.getTextColor()
    ctx.font = `${6 * zoom}px monospace`
    ctx.textBaseline = 'middle'
    ctx.fillText(icon, bubbleX + padding, bubbleY + bubbleHeight / 2)
  }

  private wrapText(text: string, maxCharsPerLine: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''
    for (const word of words) {
      if (currentLine.length + word.length + 1 > maxCharsPerLine && currentLine.length > 0) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = currentLine ? currentLine + ' ' + word : word
      }
      if (lines.length >= 3) break
    }
    if (currentLine && lines.length < 3) lines.push(currentLine)
    if (lines.length === 3 && words.length > lines.join(' ').split(' ').length) {
      lines[2] = lines[2].substring(0, maxCharsPerLine - 3) + '...'
    }
    return lines.length > 0 ? lines : ['']
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
