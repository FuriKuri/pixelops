export interface Position {
  x: number
  y: number
}

export interface NodeInfo {
  id: string
  label: string
  type: string
  position?: Position
}

export interface EdgeInfo {
  source: string
  target: string
  label?: string
  conditional: boolean
}

export interface GraphInfo {
  id: string
  name: string
  description?: string
  nodes: NodeInfo[]
  edges: EdgeInfo[]
}

export interface LayoutData {
  width: number
  height: number
  node_positions: Record<string, Position>
}

export interface GraphStructure {
  graph: GraphInfo
  layout: LayoutData
}

// SSE event types (named events from backend)
export interface NodeStartEvent {
  type: 'node_start'
  node_id: string
  timestamp: number
  data: { step: number; triggers: string[] }
}

export interface NodeProgressEvent {
  type: 'node_progress'
  node_id: string
  timestamp: number
  data: { token: string }
}

export interface NodeEndEvent {
  type: 'node_end'
  node_id: string
  timestamp: number
  data: { step: number; output: Record<string, unknown> }
}

export interface InterruptEvent {
  waiting_for: string[]
  timestamp: number
}

export interface DoneEvent {
  timestamp: number
}

export type SSENodeEvent = NodeStartEvent | NodeProgressEvent | NodeEndEvent

// Legacy NodeEvent – kept for store compatibility
export interface NodeEvent {
  node_id: string
  status: 'pending' | 'running' | 'completed' | 'error'
  timestamp: number
  data?: Record<string, unknown>
}

export interface CharacterState {
  id: string
  name: string
  state: 'pending' | 'running' | 'completed' | 'error' | 'idle'
  position: Position
}
