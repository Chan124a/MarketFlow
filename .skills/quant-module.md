---
name: quant-module
description: Use when adding or changing MarketFlow quantitative strategies, Python quant dependencies, or the NestJS quant proxy.
---

# Quant Module

Use this skill when working on the Python quantitative analysis service or its NestJS integration. The goal is to keep quantitative logic in Python, keep TypeScript as the app/API integration layer, and preserve the local `mise` + `npm` + `uv` workflow.

---

## Prerequisites
- [ ] `mise install` has installed Node.js, Python, and `uv`, or equivalent local tools are available.
- [ ] `npm run setup` or `mise run setup` has installed npm dependencies and synced the Python environment.
- [ ] Backend port `3001` and quant port `8000` are available for local verification.

## Steps

### 1. Keep Quant Logic in Python
Add or modify strategies under `quant/`. Manage Python dependencies in `quant/pyproject.toml` and sync them with:

```bash
cd quant && uv sync
```

Run the quant service directly while developing:

```bash
cd quant && uv run uvicorn app:app --reload --port 8000
```

### 2. Keep NestJS as the Integration Layer
Expose app-facing quant APIs under `backend/src/quant/`. The NestJS service should proxy to the Python service using `QUANT_SERVICE_URL`, defaulting to `http://localhost:8000`.

Current backend API surface:

```text
GET /api/quant/health
GET /api/quant/strategies
GET /api/quant/signals
```

### 3. Reuse Cached Market Data
When a strategy needs current index data, get it from `IndicesService` in the backend and pass it to Python. Do not duplicate Tencent Finance fetching logic in the quant service unless the strategy specifically requires a separate data source.

### 4. Add Frontend UI Through Backend APIs
Frontend components should call backend endpoints such as `/api/quant/signals`, not the Python service directly. This keeps browser-facing configuration consistent with the rest of the app.

## Verification

Run lightweight checks:

```bash
cd backend && npm run build
cd frontend && npm run build
cd quant && PYTHONPYCACHEPREFIX=/tmp/marketflow-pycache uv run python -m py_compile app.py
```

When services are running, verify:

```bash
curl http://localhost:8000/health
curl http://localhost:3001/api/quant/health
curl http://localhost:3001/api/quant/signals
```

## Notes
- Use `uv add <package>` from `quant/` for new Python dependencies so `pyproject.toml` stays authoritative.
- Do not implement quantitative strategy logic in TypeScript unless it is only request validation or response shaping.
- Call out API, strategy, dependency, and data-source changes in PR notes.
