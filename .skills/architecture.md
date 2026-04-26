---
name: marketflow-architecture
description: Comprehensive overview of MarketFlow's backend/frontend modules, data flow, and UI components.
---

# MarketFlow Architecture

Use this skill to quickly grasp how MarketFlow's backend and frontend are structured, how data flows through the system, and how the UI components are organized.

---

## Architecture Overview

### 1. Backend (NestJS)
The backend is a real-time market data aggregator.
- **`IndicesModule`**: Fetches raw data from Tencent Finance and parses it.
- **`WebsocketModule`**: Broadcasts updates via Socket.io.

### 2. Frontend (Next.js)
The frontend is a real-time dashboard using App Router.
- **`Dashboard`**: Manages global state and Socket.io connection.
- **`SVG Charts`**: Custom-built `TrendChart` and `CandleChart` for zero-dependency visualization.

---

## Data Lifecycle

1. **Fetch**: `IndicesService` calls `fetcher.ts` every 30s.
2. **Cache**: Fetched data is cached in memory within the service.
3. **Notify**: `IndicesService` emits internal events via `EventsService`.
4. **Broadcast**: `IndicesGateway` broadcasts `indices:update` to clients.

---

## Verification Logic

When modifying the architecture, verify that:
1. REST endpoints (e.g., `/api/indices`) still return the cached state.
2. WebSocket clients still receive the 30s broadcast.
3. Chart coordinates are correctly mapped within the SVG viewboxes.

---

## Notes
- **Source**: Tencent Finance APIs (`gtimg.cn`).
- **Convention**: Red = Increase, Green = Decrease (CN market standard).
- **Files**: See `backend/src/indices/fetcher.ts` for API parsing logic.
