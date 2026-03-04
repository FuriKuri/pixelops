# PixelOps

## Projekt
Webbasierte Pixel-Art-Visualisierung für LangGraph-Agenten-Graphen.
Jeder LangGraph-Node = ein Pixel-Charakter im virtuellen Büro.
Echtzeit-Visualisierung via SSE-Streaming.

## Architektur
- **Backend**: Python 3.12 + FastAPI + LangGraph + LangChain
- **Frontend**: React 19 + TypeScript + Vite + Canvas 2D + Tailwind CSS
- **Kommunikation**: Server-Sent Events (SSE) für Echtzeit-Streaming
- **Monorepo**: /backend und /frontend als getrennte Packages

## Tech-Entscheidungen
- Canvas 2D (kein WebGL) – performant genug für Pixel-Art
- SSE statt WebSocket – einfacher, unidirektional reicht
- Grid-basiertes Layout (kein Force-directed) – vorhersagbar
- Zustand für Frontend State Management
- Freie Sprite-Assets (JIK-A-4 Metro City oder eigene)

## Coding-Standards
- Backend: Python mit Type Hints, Pydantic Models, async/await
- Frontend: TypeScript strict, funktionale React-Komponenten
- Tests: pytest (Backend), Vitest (Frontend)
- Keine externen CSS-Frameworks im Canvas – nur für UI-Panel

## Datei-Ownership (für Agent Teams)
- /backend/** → Backend-Agent
- /frontend/src/engine/** → Pixel-Engine-Agent
- /frontend/src/components/** → Frontend-Agent
- /frontend/src/hooks/** → Frontend-Agent
- Tests → Integration-Tester

## Agent Team Konfiguration
Wenn Agent Teams genutzt werden:
- **Lead**: Koordiniert, reviewed, merged – implementiert NICHT selbst
- **backend-dev**: Fokus auf /backend/. FastAPI + LangGraph.
- **pixel-engine**: Fokus auf /frontend/src/engine/. Canvas, Sprites, Pathfinding.
- **frontend-ui**: Fokus auf /frontend/src/components/ und /hooks/. React UI.
- Jeder Teammate commitet auf eigenen Feature-Branch.
- Lead merged nach Review.