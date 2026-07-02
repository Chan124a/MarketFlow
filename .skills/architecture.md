---
name: marketflow-architecture
description: Comprehensive overview of MarketFlow's backend/frontend modules, data flow, and UI components.
---

# MarketFlow Architecture

Use this skill to quickly grasp how MarketFlow's backend and frontend are structured, how data flows through the system, and how the UI components are organized.

---

## Architecture Overview

### 1. Backend (Rust, Default)
The default backend is a Rust real-time market data aggregator under `rust-backend/`.
- **`fetcher.rs`**: Fetches raw data from Tencent Finance and parses quote, detail, and financial data.
- **`server.rs`**: Exposes the REST API with axum, proxies app-facing quant API requests to the Python quant service, runs the 30-second refresh loop, keeps in-memory caches, and broadcasts updates through Socket.io-compatible `socketioxide`.
- **Legacy `backend/`**: The NestJS implementation is retained only for rollback and output comparison.

### 2. Frontend (Next.js)
The frontend is a real-time dashboard using App Router.
- **`Dashboard`**: Manages global state and Socket.io connection.
- **`SVG Charts`**: Custom-built `TrendChart` and `CandleChart` for zero-dependency visualization.

### 3. Quant Service (Python)
The quant service is a FastAPI app under `quant/`.
- **`/health`**: Container/service health check.
- **`/strategies`**: Lists available Python strategies.
- **`/signals`**: Accepts current index data and returns generated signals.

---

## Data Lifecycle

1. **Fetch**: `rust-backend/src/server.rs` calls the Rust fetcher every 30s.
2. **Cache**: Fetched index and stock data is cached in memory.
3. **Broadcast**: The Rust Socket.io layer broadcasts `indices:update` to clients after successful index refreshes.
4. **Quant**: Rust `/api/quant/signals` sends cached index data to the Python service.

---

## Verification Logic

When modifying the architecture, verify that:
1. REST endpoints (e.g., `/api/indices`) still return the cached state.
2. WebSocket clients still receive the 30s broadcast.
3. Chart coordinates are correctly mapped within the SVG viewboxes.
4. Local `mise` development still starts frontend, the Rust backend, and quant services.
5. Quant checks pass through both `http://localhost:8000/health` and `http://localhost:3001/api/quant/health`.

---

## Notes
- **Source**: Tencent Finance APIs (`gtimg.cn`).
- **Quant**: Quantitative logic belongs in Python under `quant/`; the Rust backend proxies and integrates it by default.
- **Convention**: Red = Increase, Green = Decrease (CN market standard).
- **Files**: See `rust-backend/src/fetcher.rs` for default API parsing logic. The legacy NestJS parser remains at `backend/src/indices/fetcher.ts`.
