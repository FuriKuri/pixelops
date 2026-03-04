export class Renderer {
  readonly canvas: HTMLCanvasElement
  readonly ctx: CanvasRenderingContext2D
  private _zoom: number = 2

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2D context')
    this.ctx = ctx
    this.ctx.imageSmoothingEnabled = false
    this.resize()
  }

  get zoom(): number {
    return this._zoom
  }

  set zoom(value: number) {
    this._zoom = Math.max(1, Math.min(4, Math.round(value)))
    this.ctx.imageSmoothingEnabled = false
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1
    const rect = this.canvas.getBoundingClientRect()
    this.canvas.width = Math.floor(rect.width * dpr)
    this.canvas.height = Math.floor(rect.height * dpr)
    this.ctx.scale(dpr, dpr)
    this.ctx.imageSmoothingEnabled = false
  }

  clear(): void {
    const dpr = window.devicePixelRatio || 1
    this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr)
  }

  get width(): number {
    const dpr = window.devicePixelRatio || 1
    return this.canvas.width / dpr
  }

  get height(): number {
    const dpr = window.devicePixelRatio || 1
    return this.canvas.height / dpr
  }
}
