import type { Position } from '../types/api.ts'

interface BfsNode {
  x: number
  y: number
  parent: BfsNode | null
}

const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, -1], // up
  [1, 0],  // right
  [0, 1],  // down
  [-1, 0], // left
]

export function findPath(
  walkableGrid: boolean[][],
  start: Position,
  end: Position,
): Position[] | null {
  const height = walkableGrid.length
  if (height === 0) return null
  const width = walkableGrid[0].length

  const sx = Math.round(start.x)
  const sy = Math.round(start.y)
  const ex = Math.round(end.x)
  const ey = Math.round(end.y)

  if (sx < 0 || sx >= width || sy < 0 || sy >= height) return null
  if (ex < 0 || ex >= width || ey < 0 || ey >= height) return null
  if (!walkableGrid[ey][ex]) return null

  if (sx === ex && sy === ey) return [{ x: sx, y: sy }]

  const visited: boolean[][] = Array.from({ length: height }, () =>
    new Array<boolean>(width).fill(false),
  )
  visited[sy][sx] = true

  const queue: BfsNode[] = [{ x: sx, y: sy, parent: null }]

  while (queue.length > 0) {
    const current = queue.shift()!

    for (const [dx, dy] of DIRECTIONS) {
      const nx = current.x + dx
      const ny = current.y + dy

      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
      if (visited[ny][nx]) continue
      if (!walkableGrid[ny][nx]) continue

      const next: BfsNode = { x: nx, y: ny, parent: current }

      if (nx === ex && ny === ey) {
        return reconstructPath(next)
      }

      visited[ny][nx] = true
      queue.push(next)
    }
  }

  return null
}

function reconstructPath(node: BfsNode): Position[] {
  const path: Position[] = []
  let current: BfsNode | null = node
  while (current !== null) {
    path.unshift({ x: current.x, y: current.y })
    current = current.parent
  }
  return path
}
