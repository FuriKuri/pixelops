export type UpdateCallback = (deltaTime: number) => void

export class GameLoop {
  private animationFrameId: number | null = null
  private lastTimestamp: number = 0
  private _isRunning: boolean = false
  private onUpdate: UpdateCallback

  constructor(onUpdate: UpdateCallback) {
    this.onUpdate = onUpdate
  }

  get isRunning(): boolean {
    return this._isRunning
  }

  start(): void {
    if (this._isRunning) return
    this._isRunning = true
    this.lastTimestamp = 0
    this.animationFrameId = requestAnimationFrame((ts) => this.tick(ts))
  }

  stop(): void {
    if (!this._isRunning) return
    this._isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private tick(timestamp: number): void {
    if (!this._isRunning) return

    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp
    }

    const deltaTime = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1)
    this.lastTimestamp = timestamp

    this.onUpdate(deltaTime)

    this.animationFrameId = requestAnimationFrame((ts) => this.tick(ts))
  }
}
