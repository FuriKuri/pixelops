export interface SpriteFrame {
  x: number
  y: number
  width: number
  height: number
}

export class SpriteSheet {
  readonly image: HTMLImageElement
  readonly frameWidth: number
  readonly frameHeight: number
  private _loaded: boolean = false

  constructor(src: string, frameWidth: number, frameHeight: number) {
    this.image = new Image()
    this.frameWidth = frameWidth
    this.frameHeight = frameHeight
    this.image.src = src
  }

  get loaded(): boolean {
    return this._loaded
  }

  async load(): Promise<void> {
    if (this._loaded) return
    return new Promise((resolve, reject) => {
      this.image.onload = () => {
        this._loaded = true
        resolve()
      }
      this.image.onerror = () => reject(new Error(`Failed to load sprite: ${this.image.src}`))
    })
  }

  getFrame(col: number, row: number): SpriteFrame {
    return {
      x: col * this.frameWidth,
      y: row * this.frameHeight,
      width: this.frameWidth,
      height: this.frameHeight,
    }
  }

  drawFrame(
    ctx: CanvasRenderingContext2D,
    frame: SpriteFrame,
    destX: number,
    destY: number,
    scale: number = 1,
  ): void {
    if (!this._loaded) return
    ctx.drawImage(
      this.image,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      destX,
      destY,
      frame.width * scale,
      frame.height * scale,
    )
  }
}
