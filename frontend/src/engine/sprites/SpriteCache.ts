interface CacheEntry {
  canvas: OffscreenCanvas
  zoom: number
}

export class SpriteCache {
  private cache: Map<string, CacheEntry> = new Map()

  private makeKey(spriteId: string, zoom: number): string {
    return `${spriteId}@${zoom}x`
  }

  get(spriteId: string, zoom: number): OffscreenCanvas | null {
    const entry = this.cache.get(this.makeKey(spriteId, zoom))
    return entry?.canvas ?? null
  }

  set(spriteId: string, zoom: number, canvas: OffscreenCanvas): void {
    this.cache.set(this.makeKey(spriteId, zoom), { canvas, zoom })
  }

  getOrCreate(
    spriteId: string,
    zoom: number,
    width: number,
    height: number,
    draw: (ctx: OffscreenCanvasRenderingContext2D) => void,
  ): OffscreenCanvas {
    const cached = this.get(spriteId, zoom)
    if (cached) return cached

    const canvas = new OffscreenCanvas(width * zoom, height * zoom)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get OffscreenCanvas 2D context')
    ctx.imageSmoothingEnabled = false
    ctx.scale(zoom, zoom)
    draw(ctx)
    this.set(spriteId, zoom, canvas)
    return canvas
  }

  clear(): void {
    this.cache.clear()
  }
}
