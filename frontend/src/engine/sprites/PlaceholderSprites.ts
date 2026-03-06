import { TILE_SIZE } from '../constants.ts'
import { SpriteCache } from './SpriteCache.ts'

export const CHARACTER_COLORS: Record<string, string> = {
  blue: '#4a90d9',
  red: '#d94a4a',
  green: '#4ad94a',
  yellow: '#d9d94a',
  purple: '#9b4ad9',
  orange: '#d9904a',
}

const COLOR_NAMES = Object.keys(CHARACTER_COLORS)

export const TILE_COLORS: Record<string, string> = {
  floor: '#8c8c8c',
  wall: '#4a4a4a',
  empty: '#000000',
}

export function getCharacterColor(index: number): string {
  const name = COLOR_NAMES[index % COLOR_NAMES.length]
  return CHARACTER_COLORS[name]
}

export function drawPlaceholderCharacter(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  color: string,
): void {
  // Body
  ctx.fillStyle = color
  ctx.fillRect(4, 4, 8, 10)
  // Head
  ctx.fillStyle = '#ffd5b0'
  ctx.fillRect(5, 1, 6, 5)
  // Eyes
  ctx.fillStyle = '#000000'
  ctx.fillRect(6, 3, 1, 1)
  ctx.fillRect(9, 3, 1, 1)
}

export function drawPlaceholderTile(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  tileType: string,
): void {
  const color = TILE_COLORS[tileType] ?? TILE_COLORS.empty
  ctx.fillStyle = color
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE)

  if (tileType === 'wall') {
    // Wall brick pattern
    ctx.fillStyle = '#3a3a3a'
    ctx.fillRect(0, 0, 16, 1)
    ctx.fillRect(0, 7, 16, 1)
    ctx.fillRect(7, 0, 1, 8)
    ctx.fillRect(0, 8, 1, 8)
    ctx.fillRect(15, 8, 1, 8)
  } else if (tileType === 'floor') {
    // Floor grid lines
    ctx.fillStyle = '#7a7a7a'
    ctx.fillRect(0, 15, 16, 1)
    ctx.fillRect(15, 0, 1, 16)
  }
}

export function getCachedTile(cache: SpriteCache, tileType: string, zoom: number): OffscreenCanvas {
  return cache.getOrCreate(`tile_${tileType}`, zoom, TILE_SIZE, TILE_SIZE, (ctx) => {
    drawPlaceholderTile(ctx, tileType)
  })
}

export function getCachedCharacter(cache: SpriteCache, color: string, zoom: number): OffscreenCanvas {
  return cache.getOrCreate(`char_${color}`, zoom, TILE_SIZE, TILE_SIZE, (ctx) => {
    drawPlaceholderCharacter(ctx, color)
  })
}
