# PixelOps – Test Results

## Automated Tests

### Backend (pytest)

```
cd backend && source .venv/bin/activate && python -m pytest tests/ -v
```

| File | Tests | Status |
|------|-------|--------|
| test_graph_registry.py | 8 | ✅ pass |
| test_layout_generator.py | 6 | ✅ pass |
| test_sse_streaming.py | 5 | ✅ pass |
| **Total** | **19** | **✅ 19/19** |

Last run: 2026-03-04

### Frontend (Vitest)

```
cd frontend && npx vitest run
```

| File | Tests | Status |
|------|-------|--------|
| graphStore.test.ts | 12 | ✅ pass |
| **Total** | **12** | **✅ 12/12** |

Last run: 2026-03-04

---

## Manual E2E Test Plan

### Prerequisites

1. Start backend:
   ```
   cd backend && source .venv/bin/activate && uvicorn app.main:app --reload
   ```
2. Start frontend:
   ```
   cd frontend && npm run dev
   ```
3. Open browser at `http://localhost:5173`

### Test Steps

#### TC-01: Graph List Loads

1. Open app in browser
2. Observe the graph selector panel

**Expected:** "Simple Chat" graph is listed
**Actual:** _______________

---

#### TC-02: Graph Structure + Layout

1. Select "Simple Chat" from the graph list
2. Observe the canvas

**Expected:** Canvas shows 3 characters (`input`, `llm_call`, `output`) arranged vertically
**Actual:** _______________

---

#### TC-03: Run Graph – SSE Streaming

1. Select "Simple Chat"
2. Click "Run"
3. Observe canvas and event log

**Expected:**
- Characters animate in sequence: `input` → `llm_call` → `output`
- Each character shows "running" state while active
- Characters settle to "completed" state after finishing
- Event log shows `node_start` / `node_end` pairs for each node

**Actual:** _______________

---

#### TC-04: Character State Transitions

1. During a run, watch each character on canvas

**Expected:**
- `idle` → `running` when node_start fires
- `running` → `completed` when node_end fires
- No characters remain in `running` state after the run ends

**Actual:** _______________

---

#### TC-05: Unknown Graph – 404

1. Navigate directly to `http://localhost:8000/api/graphs/doesnotexist/run` (POST via curl or Postman)

**Expected:** HTTP 404 with detail message
**Actual:** _______________

---

#### TC-06: Health Endpoint

1. GET `http://localhost:8000/health`

**Expected:** `{"status": "ok"}`
**Actual:** _______________

---

### Sign-off

| Tester | Date | Result |
|--------|------|--------|
| | | |
