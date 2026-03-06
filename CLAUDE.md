# PixelOps

## Projekt
Installierbares Python-Package (`pip install pixelops`) zur Pixel-Art-Visualisierung von LangGraph-Agenten.
Jeder LangGraph-Node = ein Pixel-Charakter im virtuellen Büro.
Echtzeit-Visualisierung via SSE-Streaming.

## Projekt-Struktur
```
pixelops/          ← Das Python-Package (wird publisht)
  __init__.py        Einzige public API: pixelops.visualize()
  _server.py         FastAPI + Uvicorn, startet eingebetteten Server
  _registry.py       Nimmt compiled LangGraph-Graphen entgegen
  _routes.py         API-Endpunkte (/api/graphs, /api/graphs/{id}/run, ...)
  _executor.py       Streamt LangGraph-Events als SSE
  _schemas.py        Pydantic-Models (NodeEvent, GraphInfo, etc.)
  _layout.py         Topologisches Layout der Nodes
  static/            Vorgebautes Frontend (Vite build output)

frontend/          ← React/TypeScript Quellcode für das UI (nur Dev)
  src/engine/        Canvas 2D Pixel-Engine (Sprites, Pathfinding, Animations)
  src/components/    React UI-Komponenten
  src/hooks/         React Hooks (SSE-Streaming, State-Sync)
  src/store/         Zustand State Management

example_agents.py  ← Beispiel: LangGraph-Pipeline mit pixelops.visualize()
pyproject.toml     ← Package-Config (hatchling build)
```

**Wichtig:** Es gibt kein separates Backend-Verzeichnis. Der Server ist direkt im `pixelops/`-Package eingebettet.
`frontend/` wird nur zum Entwickeln des UIs gebraucht – der Build-Output landet in `pixelops/static/`.

## Nutzung (für Endanwender)
```python
import pixelops
pixelops.visualize(("Name", compiled_graph, "Beschreibung"), port=5555)
```

## Architektur
- **Package**: Python 3.10+ / FastAPI + LangGraph + Pydantic + SSE-Starlette
- **Frontend**: React 19 + TypeScript + Vite + Canvas 2D + Tailwind CSS
- **Kommunikation**: Server-Sent Events (SSE) für Echtzeit-Streaming
- **Build**: hatchling – Frontend wird vorgebaut in pixelops/static/ ausgeliefert

## Tech-Entscheidungen
- Canvas 2D (kein WebGL) – performant genug für Pixel-Art
- SSE statt WebSocket – einfacher, unidirektional reicht
- Grid-basiertes Layout (kein Force-directed) – vorhersagbar
- Zustand für Frontend State Management
- Eingebetteter FastAPI-Server (kein separates Backend)

## Coding-Standards
- Package: Python mit Type Hints, Pydantic Models, async/await
- Frontend: TypeScript strict, funktionale React-Komponenten
- Tests: pytest (Package), Vitest (Frontend)
- Keine externen CSS-Frameworks im Canvas – nur für UI-Panel

## Datei-Ownership (für Agent Teams)
- /pixelops/** → Package-Agent (Python, FastAPI, LangGraph)
- /frontend/src/engine/** → Pixel-Engine-Agent
- /frontend/src/components/** → Frontend-Agent
- /frontend/src/hooks/** → Frontend-Agent
- Tests → Integration-Tester

## Agent Team Konfiguration
Wenn Agent Teams genutzt werden:
- **Lead**: Koordiniert, reviewed, merged – implementiert NICHT selbst
- **package-dev**: Fokus auf /pixelops/. FastAPI + LangGraph + Package-Logik.
- **pixel-engine**: Fokus auf /frontend/src/engine/. Canvas, Sprites, Pathfinding.
- **frontend-ui**: Fokus auf /frontend/src/components/ und /hooks/. React UI.
- Jeder Teammate commitet auf eigenen Feature-Branch.
- Lead merged nach Review.