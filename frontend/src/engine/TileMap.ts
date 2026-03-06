import type { LayoutData } from '../types/api.ts'
import { TILE_SIZE } from './constants.ts'
import type { Camera } from './Camera.ts'
import { SpriteCache } from './sprites/SpriteCache.ts'
import { getCachedTile } from './sprites/PlaceholderSprites.ts'

export type TileType = 'floor' | 'wall' | 'empty'

export class TileMap {
  private tiles: TileType[][] = []
  private _width: number = 0
  private _height: number = 0
  private spriteCache: SpriteCache = new SpriteCache()

  get width(): number {
    return this._width
  }

  get height(): number {
    return this._height
  }

  getTile(x: number, y: number): TileType {
    if (x < 0 || x >= this._width || y < 0 || y >= this._height) return 'empty'
    return this.tiles[y][x]
  }

  isWalkable(x: number, y: number): boolean {
    const tile = this.getTile(x, y)
    return tile === 'floor'
  }

  getWalkableGrid(): boolean[][] {
    const grid: boolean[][] = []
    for (let y = 0; y < this._height; y++) {
      grid[y] = []
      for (let x = 0; x < this._width; x++) {
        grid[y][x] = this.isWalkable(x, y)
      }
    }
    return grid
  }

  loadFromLayout(layout: LayoutData): void {
    this._width = layout.width
    this._height = layout.height

    // Initialize all as floor
    this.tiles = []
    for (let y = 0; y < this._height; y++) {
      this.tiles[y] = []
      for (let x = 0; x < this._width; x++) {
        this.tiles[y][x] = 'floor'
      }
    }

    // Add walls around the border
    for (let x = 0; x < this._width; x++) {
      this.tiles[0][x] = 'wall'
      this.tiles[this._height - 1][x] = 'wall'
    }
    for (let y = 0; y < this._height; y++) {
      this.tiles[y][0] = 'wall'
      this.tiles[y][this._width - 1] = 'wall'
    }

    this.spriteCache.clear()
  }

  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const zoom = camera.zoom
    const scaledTile = TILE_SIZE * zoom
    const viewX = camera.x
    const viewY = camera.y
    const viewWidth = camera.viewportWidth
    const viewHeight = camera.viewportHeight

    // Calculate visible tile range
    const startCol = Math.max(0, Math.floor(viewX / TILE_SIZE))
    const startRow = Math.max(0, Math.floor(viewY / TILE_SIZE))
    const endCol = Math.min(this._width, Math.ceil((viewX + viewWidth / zoom) / TILE_SIZE))
    const endRow = Math.min(this._height, Math.ceil((viewY + viewHeight / zoom) / TILE_SIZE))

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tileType = this.tiles[row][col]
        const screenX = Math.floor((col * TILE_SIZE - viewX) * zoom)
        const screenY = Math.floor((row * TILE_SIZE - viewY) * zoom)

        const cached = getCachedTile(this.spriteCache, tileType, zoom)
        ctx.drawImage(cached, screenX, screenY, scaledTile, scaledTile)
      }
    }
  }
}
