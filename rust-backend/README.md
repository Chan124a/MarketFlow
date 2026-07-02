# MarketFlow Rust Backend

This directory contains a Rust prototype for the Tencent Finance quote fetching,
parsing, REST API, and Socket.io push responsibilities currently handled by the
default MarketFlow backend.

The legacy NestJS backend still exists in `../backend` for rollback and
comparison, but root `npm run dev`, `npm run start`, and `mise run dev` now use
this Rust backend by default.

The HTTP layer uses `axum` because it is stable, lightweight, Tokio-native, and
fits cleanly with the existing `reqwest` async fetcher. Socket.io compatibility
is provided through `socketioxide`, so the current frontend `socket.io-client`
connection and `indices:update` event do not need to change.

## API Compatibility

The Rust server exposes the paths currently used by the frontend:

- `GET /api/indices`
- `GET /api/indices/:code`
- `GET /api/indices/:code/details`
- `GET /api/stocks`
- `GET /api/stocks/:code/financials`
- `GET /api/quant/health`
- `GET /api/quant/strategies`
- `GET /api/quant/signals`
- Socket.io event: `indices:update`

Responses keep the existing `{ success, data }` shape, with `stale` on list
responses. `IndexData` JSON fields are camelCase-compatible with the frontend.

The server refreshes index and stock quote caches every 30 seconds. If Tencent
Finance fetches fail, the last successful cache remains available.

Quant proxy endpoints call `QUANT_SERVICE_URL`, defaulting to
`http://localhost:8000`.

## Commands

```bash
cargo fmt
cargo test
cargo run -- serve
cargo run -- indices
cargo run -- stocks
cargo run -- all
```

The default CLI mode is `indices`, matching the current dashboard index list.

## Port Configuration

The Rust backend listens on port `3001` by default:

```bash
cargo run -- serve
```

To use another port:

```bash
RUST_BACKEND_PORT=3002 cargo run -- serve
```

The existing frontend defaults to `http://localhost:3001`, so no frontend code
change is required. To compare against another backend port:

```bash
cd ../frontend
NEXT_PUBLIC_BACKEND_URL=http://localhost:3002 npm run dev
```

## Legacy NestJS Rollback

The legacy backend is retained under `../backend`.

```bash
npm run setup:legacy-backend
npm run dev:backend:legacy
npm run start:backend:legacy
```
