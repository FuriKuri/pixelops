# PixelOps – Task Tracker

> Letztes Update: 2026-03-04

## Phase 1: Setup [DONE]

- [x] 1.1: Monorepo-Struktur erstellen → Agent: Solo | Effort: S
- [x] 1.2: Backend-Grundgerüst (FastAPI, CORS, Health-Check) → Agent: Solo | Effort: S
- [x] 1.3: Frontend-Grundgerüst (Vite, React, TypeScript, Canvas) → Agent: Solo | Effort: S
- [x] 1.4: CLAUDE.md, Agents, Commands einrichten → Agent: Solo | Effort: S
- [x] 1.5: Shared Types definieren (API-Schema als OpenAPI + TypeScript) → Agent: Solo | Effort: M

## Phase 2: Kernimplementierung [DONE]

### Backend (backend-dev)

- [x] 2.1: Pydantic Schemas (GraphInfo, NodeInfo, EdgeInfo, LayoutData, NodeEvent) → Agent: backend-dev | Effort: S | Status: done (in schemas.py)
- [x] 2.2: Graph Registry (register, list, get_structure) → Agent: backend-dev | Depends: 2.1 | Effort: M | Status: done (registry.py)
- [x] 2.3: Layout Generator (Graph-Topologie → Grid-Positionen) → Agent: backend-dev | Depends: 2.2 | Effort: L | Status: done (layout_generator.py)
- [x] 2.4: SSE Streaming Endpoint (/graphs/{id}/run) → Agent: backend-dev | Depends: 2.2 | Effort: L | Status: done (executor.py + routes.py)
- [x] 2.5: HITL Endpoint (/graphs/{id}/input) → Agent: backend-dev | Depends: 2.4 | Effort: M | Status: done (executor.py resume_graph)
- [x] 2.6: 1 einfacher Demo-Graph (Simple Chat) → Agent: backend-dev | Depends: 2.2 | Effort: S | Status: done (graphs/simple_chat.py)

### Pixel Engine (pixel-engine)

- [x] 2.7: Game Loop + Canvas Setup → Agent: pixel-engine | Effort: M | Status: done (GameLoop.ts, Renderer.ts)
- [x] 2.8: Sprite System (Loader, Cache, Renderer) → Agent: pixel-engine | Effort: L | Status: done (SpriteSheet.ts, SpriteCache.ts, PlaceholderSprites.ts)
- [x] 2.9: TileMap Renderer (Floor, Walls, Furniture) → Agent: pixel-engine | Depends: 2.8 | Effort: M | Status: done (TileMap.ts)
- [x] 2.10: Character System (Sprite-Animation, State Machine) → Agent: pixel-engine | Depends: 2.8 | Effort: L | Status: done (Character.ts)
- [x] 2.11: BFS Pathfinding → Agent: pixel-engine | Depends: 2.9 | Effort: M | Status: done (Pathfinding.ts)
- [x] 2.12: Speech Bubbles → Agent: pixel-engine | Depends: 2.10 | Effort: S | Status: done (SpeechBubble.ts)
- [x] 2.13: Camera/Viewport (Zoom, Pan) → Agent: pixel-engine | Depends: 2.7 | Effort: M | Status: done (Camera.ts)

### Frontend UI (frontend-ui)

- [x] 2.14: Zustand Store (GraphStore, AgentStore) → Agent: frontend-ui | Effort: M | Status: done (graphStore.ts erweitert)
- [x] 2.15: useGraphStream Hook (SSE Consumer) → Agent: frontend-ui | Depends: 2.14 | Effort: M | Status: done (useGraphStream.ts)
- [x] 2.16: useGraphList Hook (GET /graphs) → Agent: frontend-ui | Depends: 2.14 | Effort: S | Status: done (useGraphList.ts)
- [x] 2.17: GraphSelector Komponente → Agent: frontend-ui | Depends: 2.16 | Effort: S | Status: done (GraphSelector.tsx)
- [x] 2.18: PixelCanvas Wrapper (React ↔ Engine Bridge) → Agent: frontend-ui | Depends: 2.14 | Effort: M | Status: done (PixelCanvas.tsx)
- [x] 2.19: ControlPanel (Start/Stop/Status) → Agent: frontend-ui | Depends: 2.15 | Effort: M | Status: done (ControlPanel.tsx)
- [x] 2.20: NodeStatusBar (Sidebar) → Agent: frontend-ui | Depends: 2.15 | Effort: S | Status: done (NodeStatusBar.tsx)

## Phase 3: Integration [DONE]

- [x] 3.1: SSE-Events → Engine Character States mapping → Agent: connector | Depends: 2.4, 2.10 | Effort: L | Status: done (useEngineSync.ts + TileMap Type-Fix)
- [x] 3.2: Layout-Daten → TileMap-Generierung → Agent: connector | Depends: 2.3, 2.9 | Effort: M | Status: done (PixelCanvas.tsx mit echten Engine-Instanzen)
- [x] 3.3: HITL InputDialog + Backend-Anbindung → Agent: connector | Depends: 2.5, 2.19 | Effort: M | Status: done (ControlPanel.tsx SSE-Resume)
- [x] 3.4: E2E Integration Test → Agent: tester | Depends: 3.1, 3.2 | Effort: M | Status: done (19 Backend + 12 Frontend Tests)

### Bekannte Issues (Phase 3)
- `aget_state({})` wirft "No checkpointer set" → SSE endet mit `error` statt `done`. Fix: Checkpointer konfigurieren oder Error graceful handlen.

## Phase 4: Polish [DONE]

- [x] 4.1: 2 weitere Demo-Graphen (Research Agent, Multi-Agent) → Agent: backend-dev | Effort: M | Status: done (research_agent.py, multi_agent_team.py)
- [x] 4.2: Animations-Polish (Transitions, Effekte) → Agent: pixel-engine | Effort: M | Status: done (ParticleSystem, EdgeEffect, Walking-Bob, Idle-Breathing)
- [x] 4.3: Dark Mode + Responsive → Agent: frontend-ui | Effort: S | Status: done (useDarkMode, responsive NodeStatusBar, Loading States)
- [x] 4.4: README + Setup-Anleitung → Agent: Solo | Effort: S | Status: done (README.md)
- [x] 4.5: Docker Compose für lokales Deployment → Agent: Solo | Effort: S | Status: done (docker-compose.yml, Dockerfiles)

---

## Zusammenfassung

| Phase | Total | Done | Open | Blocked |
|-------|-------|------|------|---------|
| 1: Setup | 5 | 5 | 0 | 0 |
| 2: Kern | 20 | 20 | 0 | 0 |
| 3: Integration | 4 | 4 | 0 | 0 |
| 4: Polish | 5 | 5 | 0 | 0 |
| **Gesamt** | **34** | **34** | **0** | **0** |

## Abhängigkeitsgraph (Phase 2)

```
Backend:    2.1 ──→ 2.2 ──→ 2.3
                  │      └──→ 2.4 ──→ 2.5
                  │      └──→ 2.6
                  │
Engine:     2.7 ──→ 2.13
            2.8 ──→ 2.9 ──→ 2.11
                  └──→ 2.10 ──→ 2.12
                  │
Frontend:   2.14 ──→ 2.15 ──→ 2.19
                  │        └──→ 2.20
                  ├──→ 2.16 ──→ 2.17
                  └──→ 2.18
```

## Agent-Workload

| Agent | Tasks | Effort (S/M/L) |
|-------|-------|-----------------|
| backend-dev | 2.2, 2.3, 2.4, 2.5, 2.6, 4.1 | 1S + 2M + 2L + 1M = 6 Tasks |
| pixel-engine | 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 4.2 | 1S + 3M + 2L + 1M + 1M = 8 Tasks |
| frontend-ui | 2.14, 2.15, 2.16, 2.17, 2.18, 2.19, 2.20, 4.3 | 2S + 3M + 2M + 1S = 8 Tasks |
| integration-tester | 3.1, 3.2, 3.3, 3.4 | 1L + 3M = 4 Tasks |
