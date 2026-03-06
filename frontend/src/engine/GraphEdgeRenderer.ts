import type { Position, EdgeInfo } from '../types/api.ts'
import type { Camera } from './Camera.ts'
import { TILE_SIZE } from './constants.ts'

interface EdgeLine {
  from: Position
  to: Position
  conditional: boolean
}

export class GraphEdgeRenderer {
  private edges: EdgeLine[] = []
  private animTime: number = 0

  load(nodePositions: Record<string, Position>, edges: EdgeInfo[]): void {
    this.edges = []
    for (const edge of edges) {
      const from = nodePositions[edge.source]
      const to = nodePositions[edge.target]
      if (from && to) {
        // Backend sends `condition` (string|null), frontend type has `conditional` (boolean)
        const isConditional = edge.conditional || !!((edge as unknown as Record<string, unknown>).condition)
        this.edges.push({ from, to, conditional: isConditional })
      }
    }
  }

  update(dt: number): void {
    this.animTime += dt
  }

  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const zoom = camera.zoom

    for (const edge of this.edges) {
      const fromScreen = this.tileToScreen(edge.from, camera)
      const toScreen = this.tileToScreen(edge.to, camera)

      // Draw connection line
      ctx.save()
      ctx.globalAlpha = edge.conditional ? 0.25 : 0.35
      ctx.strokeStyle = edge.conditional ? '#d9904a' : '#88bbff'
      ctx.lineWidth = Math.max(1, zoom * 0.75)

      if (edge.conditional) {
        ctx.setLineDash([3 * zoom, 3 * zoom])
      }

      ctx.beginPath()
      ctx.moveTo(fromScreen.x, fromScreen.y)
      ctx.lineTo(toScreen.x, toScreen.y)
      ctx.stroke()
      ctx.setLineDash([])

      // Draw arrowhead
      this.drawArrow(ctx, fromScreen, toScreen, zoom, edge.conditional)

      ctx.restore()

      // Animated traveling dot
      this.drawTravelingDot(ctx, fromScreen, toScreen, zoom, edge.conditional)
    }
  }

  private drawArrow(
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
    zoom: number,
    conditional: boolean,
  ): void {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 1) return

    const nx = dx / dist
    const ny = dy / dist

    // Place arrow at 70% along the line
    const ax = from.x + dx * 0.7
    const ay = from.y + dy * 0.7
    const arrowSize = Math.max(3, zoom * 2.5)

    ctx.globalAlpha = conditional ? 0.35 : 0.5
    ctx.fillStyle = conditional ? '#d9904a' : '#88bbff'
    ctx.beginPath()
    ctx.moveTo(ax + nx * arrowSize, ay + ny * arrowSize)
    ctx.lineTo(ax - nx * arrowSize * 0.5 + ny * arrowSize * 0.5, ay - ny * arrowSize * 0.5 - nx * arrowSize * 0.5)
    ctx.lineTo(ax - nx * arrowSize * 0.5 - ny * arrowSize * 0.5, ay - ny * arrowSize * 0.5 + nx * arrowSize * 0.5)
    ctx.closePath()
    ctx.fill()
  }

  private drawTravelingDot(
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
    zoom: number,
    conditional: boolean,
  ): void {
    // Dot travels along edge every 3 seconds
    const period = 3
    const t = (this.animTime % period) / period

    const x = from.x + (to.x - from.x) * t
    const y = from.y + (to.y - from.y) * t
    const dotSize = Math.max(2, Math.floor(zoom * 1.2))

    // Fade in/out at ends
    const alpha = Math.min(t * 4, (1 - t) * 4, 1) * 0.5

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = conditional ? '#d9904a' : '#aaddff'
    ctx.fillRect(
      Math.floor(x) - Math.floor(dotSize / 2),
      Math.floor(y) - Math.floor(dotSize / 2),
      dotSize,
      dotSize,
    )
    ctx.restore()
  }

  private tileToScreen(pos: Position, camera: Camera): { x: number; y: number } {
    const zoom = camera.zoom
    return {
      x: Math.floor((pos.x * TILE_SIZE + TILE_SIZE / 2 - camera.x) * zoom),
      y: Math.floor((pos.y * TILE_SIZE + TILE_SIZE / 2 - camera.y) * zoom),
    }
  }
}
