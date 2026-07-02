---
name: marketflow-architecture
description: Use when you need to understand MarketFlow's backend/frontend modules, data flow, real-time update path, or chart component responsibilities before changing code.
---

# MarketFlow Architecture

Use this skill before touching shared data flow, WebSocket behavior, chart rendering, or module boundaries.

## Overview

MarketFlow is split into three active apps plus one legacy rollback backend:

- `rust-backend/`: Default Rust API and Socket.io-compatible real-time market data service.
- `frontend/`: Next.js 14 dashboard with custom SVG charts.
- `quant/`: Python FastAPI service for quantitative signals and future backtesting.
- `backend/`: Legacy NestJS API and real-time service retained for rollback and comparison.

The Rust backend fetches Tencent Finance index data, caches the latest state, broadcasts updates through Socket.io-compatible `socketioxide`, and proxies quant requests to the Python service. The frontend loads the cached data, keeps a Socket.io connection open, and refreshes cards/charts from `indices:update` events.

## Backend Roles

- `rust-backend/src/fetcher.rs`: Tencent Finance code list and response parsing.
- `rust-backend/src/server.rs`: 30-second refresh loop, cache ownership, REST API, Socket.io-compatible update broadcasting, and app-facing quant proxy.
- `backend/`: Legacy NestJS implementation. Keep it available for rollback unless explicitly removed.

## Quant Roles

- `quant/app.py`: FastAPI service with `/health`, `/strategies`, and `/signals`.
- `rust-backend/src/server.rs`: Sends cached index data to Python and returns quant responses.
- Quantitative logic belongs in Python; the Rust backend should stay as integration/proxy code.

## Frontend Roles

- `frontend/app/page.tsx`: Dashboard state, market categories, and index selection.
- `IndexCard`: Summary card for an index.
- `TrendChart` and `CandleChart`: Custom SVG chart rendering without heavyweight chart libraries.

## Data Lifecycle

1. The Rust server calls the fetcher every 30 seconds.
2. Parsed index records are cached in memory.
3. The Rust Socket.io layer broadcasts `indices:update`.
5. The dashboard updates the visible cards and detail views.
6. The Rust quant proxy sends cached index data to the Python service for `/api/quant/signals`.

## Verification

After architecture or data-flow changes:

1. Confirm `GET /api/indices` returns the cached state.
2. Confirm clients receive `indices:update` events.
3. Confirm SVG charts still map coordinates inside their viewboxes.
4. Confirm local `mise` development starts frontend, backend, and quant services.
5. Confirm quant checks pass through both `http://localhost:8000/health` and `http://localhost:3001/api/quant/health`.

## Notes

- External data source: Tencent Finance APIs through `gtimg.cn`.
- Market color convention: red means increase, green means decrease.
- Keep `rust-backend/src/fetcher.rs` as the default source of truth for index display names. Mirror legacy NestJS only when maintaining rollback parity.
