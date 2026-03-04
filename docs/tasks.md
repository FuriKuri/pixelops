# PixelOps – Task Tracker

## Phase 1: Setup [Solo]

- [x] 1.1: Monorepo-Struktur erstellen → Agent: Solo | Effort: S
- [x] 1.2: Backend-Grundgerüst (FastAPI, CORS, Health-Check) → Agent: Solo | Effort: S
- [x] 1.3: Frontend-Grundgerüst (Vite, React, TypeScript, Canvas) → Agent: Solo | Effort: S
- [x] 1.4: CLAUDE.md, Agents, Commands einrichten → Agent: Solo | Effort: S
- [x] 1.5: Shared Types definieren (API-Schema als OpenAPI + TypeScript) → Agent: Solo | Effort: M

## Phase 2: Kernimplementierung [Agent Teams]

### Backend (backend-dev)

- [ ] 2.1: Pydantic Schemas (GraphInfo, NodeInfo, EdgeInfo, LayoutData, NodeEvent) → Agent: backend-dev | Effort: S
- [ ] 2.2: Graph Registry (register, list, get_structure) → Agent: backend-dev | Depends: 2.1 | Effort: M
- [ ] 2.3: Layout Generator (Graph-Topologie → Grid-Positionen) → Agent: backend-dev | Depends: 2.2 | Effort: L
- [ ] 2.4: SSE Streaming Endpoint (/graphs/{id}/run) → Agent: backend-dev | Depends: 2.2 | Effort: L
- [ ] 2.5: HITL Endpoint (/graphs/{id}/input) → Agent: backend-dev | Depends: 2.4 | Effort: M
- [ ] 2.6: 1 einfacher Demo-Graph (Simple Chat) → Agent: backend-dev | Depends: 2.2 | Effort: S

### Pixel Engine (pixel-engine)

- [ ] 2.7: Game Loop + Canvas Setup → Agent: pixel-engine | Effort: M
- [ ] 2.8: Sprite System (Loader, Cache, Renderer) → Agent: pixel-engine | Effort: L
- [ ] 2.9: TileMap Renderer (Floor, Walls, Furniture) → Agent: pixel-engine | Depends: 2.8 | Effort: M
- [ ] 2.10: Character System (Sprite-Animation, State Machine) → Agent: pixel-engine | Depends: 2.8 | Effort: L
- [ ] 2.11: BFS Pathfinding → Agent: pixel-engine | Depends: 2.9 | Effort: M
- [ ] 2.12: Speech Bubbles → Agent: pixel-engine | Depends: 2.10 | Effort: S
- [ ] 2.13: Camera/Viewport (Zoom, Pan) → Agent: pixel-engine | Depends: 2.7 | Effort: M

### Frontend UI (frontend-ui)

- [ ] 2.14: Zustand Store (GraphStore, AgentStore) → Agent: frontend-ui | Effort: M
- [ ] 2.15: useGraphStream Hook (SSE Consumer) → Agent: frontend-ui | Depends: 2.14 | Effort: M
- [ ] 2.16: useGraphList Hook (GET /graphs) → Agent: frontend-ui | Depends: 2.14 | Effort: S
- [ ] 2.17: GraphSelector Komponente → Agent: frontend-ui | Depends: 2.16 | Effort: S
- [ ] 2.18: PixelCanvas Wrapper (React ↔ Engine Bridge) → Agent: frontend-ui | Depends: 2.14 | Effort: M
- [ ] 2.19: ControlPanel (Start/Stop/Status) → Agent: frontend-ui | Depends: 2.15 | Effort: M
- [ ] 2.20: NodeStatusBar (Sidebar) → Agent: frontend-ui | Depends: 2.15 | Effort: S

## Phase 3: Integration [Agent Teams]

- [ ] 3.1: SSE-Events → Engine Character States mapping → Agent: integration-tester | Depends: 2.4, 2.10 | Effort: L
- [ ] 3.2: Layout-Daten → TileMap-Generierung → Agent: integration-tester | Depends: 2.3, 2.9 | Effort: M
- [ ] 3.3: HITL InputDialog + Backend-Anbindung → Agent: integration-tester | Depends: 2.5, 2.19 | Effort: M
- [ ] 3.4: E2E Integration Test → Agent: integration-tester | Depends: 3.1, 3.2 | Effort: M

## Phase 4: Polish [Subagents]

- [ ] 4.1: 2 weitere Demo-Graphen (Research Agent, Multi-Agent) → Agent: backend-dev | Effort: M
- [ ] 4.2: Animations-Polish (Transitions, Effekte) → Agent: pixel-engine | Effort: M
- [ ] 4.3: Dark Mode + Responsive → Agent: frontend-ui | Effort: S
- [ ] 4.4: README + Setup-Anleitung → Agent: Solo | Effort: S
- [ ] 4.5: Docker Compose für lokales Deployment → Agent: Solo | Effort: S
