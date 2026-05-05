---
name: marketflow-architecture
description: Use when you need to understand MarketFlow's backend/frontend modules, data flow, real-time update path, or chart component responsibilities before changing code.
---

# MarketFlow Architecture

Use this skill before touching shared data flow, WebSocket behavior, chart rendering, or module boundaries.

## Overview

MarketFlow is split into three apps:

- `backend/`: NestJS API and real-time market data service.
- `frontend/`: Next.js 14 dashboard with custom SVG charts.
- `quant/`: Python FastAPI service for quantitative signals and future backtesting.

The backend fetches Tencent Finance index data, caches the latest state, broadcasts updates through Socket.io, and proxies quant requests to the Python service. The frontend loads the cached data, keeps a Socket.io connection open, and refreshes cards/charts from `indices:update` events.

## Backend Roles

- `backend/src/indices/fetcher.ts`: Tencent Finance code list and response parsing.
- `IndicesService`: 30-second refresh loop, cache ownership, and update event emission.
- `IndicesController`: REST access to cached index state.
- `QuantModule`: App-facing API bridge to the Python quant service.
- `IndicesGateway`: Socket.io bridge that broadcasts index updates.

## Quant Roles

- `quant/app.py`: FastAPI service with `/health`, `/strategies`, and `/signals`.
- `backend/src/quant/quant.service.ts`: Sends cached index data to Python and returns quant responses.
- Quantitative logic belongs in Python; NestJS should stay as integration/proxy code.

## Frontend Roles

- `frontend/app/page.tsx`: Dashboard state, market categories, and index selection.
- `IndexCard`: Summary card for an index.
- `TrendChart` and `CandleChart`: Custom SVG chart rendering without heavyweight chart libraries.

## Data Lifecycle

1. `IndicesService` calls the fetcher every 30 seconds.
2. Parsed index records are cached in memory.
3. The service emits an internal update event.
4. `IndicesGateway` broadcasts `indices:update`.
5. The dashboard updates the visible cards and detail views.
6. `QuantService` sends cached index data to the Python service for `/api/quant/signals`.

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
- Keep `backend/src/indices/fetcher.ts` as the source of truth for index display names.
