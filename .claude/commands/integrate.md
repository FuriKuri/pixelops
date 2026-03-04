---
description: Integration aller Komponenten
---

Starte ein Agent Team mit folgender Konfiguration:

**Team Name**: integration
**Lead**: Koordiniert, reviewed, merged
**Teammates**:
- backend-dev: Startet Backend, überprüft API-Endpoints
- pixel-engine: Verbindet Engine mit SSE-Events
- frontend-ui: Verbindet UI mit Store und Engine

**Aufgaben**:
1. Backend starten und API-Kompatibilität prüfen
2. SSE-Stream an Engine anbinden (Events → Character States)
3. UI-Kontrollelemente mit Backend-API verbinden
4. E2E-Test: Graph auswählen → starten → Pixel-Animation sehen
5. HITL-Test: Interrupt → Input-Dialog → Fortsetzen