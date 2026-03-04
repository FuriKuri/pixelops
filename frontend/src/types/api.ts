export interface Position {
  x: number
  y: number
}

export interface NodeInfo {
  id: string
  label: string
  type: string
  position: Position
}

export interface EdgeInfo {
  source: string
  target: string
  label?: string
  conditional: boolean
}

export interface GraphInfo {
  graph_id: string
  name: string
  description?: string
  nodes: NodeInfo[]
  edges: EdgeInfo[]
}

export interface LayoutData {
  graph_id: string
  positions: Record<string, Position>
  grid_width: number
  grid_height: number
}

export interface NodeEvent {
  graph_id: string
  node_id: string
  status: 'pending' | 'running' | 'completed' | 'error'
  timestamp: string
  data?: Record<string, unknown>
}
