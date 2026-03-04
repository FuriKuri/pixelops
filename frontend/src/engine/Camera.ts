import { MIN_ZOOM, MAX_ZOOM, DEFAULT_ZOOM, TILE_SIZE } from './constants.ts'

export class Camera {
  x: number = 0
  y: number = 0
  private _zoom: number = DEFAULT_ZOOM
  private _viewportWidth: number = 0
  private _viewportHeight: number = 0
  private dragging: boolean = false
  private dragStartX: number = 0
  private dragStartY: number = 0
  private camStartX: number = 0
  private camStartY: number = 0

  get zoom(): number {
    return this._zoom
  }

  get viewportWidth(): number {
    return this._viewportWidth
  }

  get viewportHeight(): number {
    return this._viewportHeight
  }

  setViewport(width: number, height: number): void {
    this._viewportWidth = width
    this._viewportHeight = height
  }

  setZoom(value: number): void {
    this._zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(value)))
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: Math.floor((worldX * TILE_SIZE - this.x) * this._zoom),
      y: Math.floor((worldY * TILE_SIZE - this.y) * this._zoom),
    }
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX / this._zoom + this.x) / TILE_SIZE,
      y: (screenY / this._zoom + this.y) / TILE_SIZE,
    }
  }

  centerOn(tileX: number, tileY: number): void {
    this.x = tileX * TILE_SIZE - this._viewportWidth / (2 * this._zoom)
    this.y = tileY * TILE_SIZE - this._viewportHeight / (2 * this._zoom)
  }

  attachToCanvas(canvas: HTMLCanvasElement): () => void {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        this.dragging = true
        this.dragStartX = e.clientX
        this.dragStartY = e.clientY
        this.camStartX = this.x
        this.camStartY = this.y
        canvas.style.cursor = 'grabbing'
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!this.dragging) return
      const dx = (e.clientX - this.dragStartX) / this._zoom
      const dy = (e.clientY - this.dragStartY) / this._zoom
      this.x = this.camStartX - dx
      this.y = this.camStartY - dy
    }

    const onMouseUp = () => {
      this.dragging = false
      canvas.style.cursor = 'grab'
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.deltaY < 0) {
        this.setZoom(this._zoom + 1)
      } else {
        this.setZoom(this._zoom - 1)
      }
    }

    canvas.style.cursor = 'grab'
    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('wheel', onWheel)
    }
  }
}
