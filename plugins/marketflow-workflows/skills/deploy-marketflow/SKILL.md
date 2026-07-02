---
name: deploy-marketflow
description: Use when building, validating, or deploying MarketFlow with mise, the Rust backend, Next.js frontend, Python quant service, PM2, and Nginx.
---

# Deploy MarketFlow

Use this workflow for local toolchain development, production builds, server deployment, and deployment-related verification.

## Local Toolchain Development

Use `mise` to pin Node.js, Rust, Python, and uv versions without containers:

```bash
mise install
mise run setup
mise run dev
```

This starts:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001` (Rust)
- Quant service: `http://localhost:8000`

Verify the local services:

```bash
curl http://localhost:3001/api/indices
curl http://localhost:8000/health
```

## Prerequisites

- `mise` is installed locally, or Node.js 20, Rust 1.94+, Python 3.12, and uv are installed manually.
- PM2 is available globally: `npm install -g pm2`.
- Backend port `3001`, frontend port `3000`, and quant port `8000` are available or mapped by the proxy.
- Production environment variables are configured outside the repo.

## Build

Run builds from each default app directory:

```bash
cd rust-backend && cargo build --release
cd ../frontend && npm run build
```

## Start With PM2

From the repo root:

```bash
pm2 start "cargo run --release -- serve" --name marketflow-backend --cwd ./rust-backend
pm2 start "npm run start" --name marketflow-frontend --cwd ./frontend
pm2 start "uv run uvicorn app:app --port 8000" --name marketflow-quant --cwd ./quant
pm2 save
```

## Reverse Proxy

Configure Nginx to route frontend traffic to the Next.js app and API/WebSocket traffic to the Rust backend. Preserve WebSocket upgrade headers for Socket.io.

## Verification

1. Check `pm2 status`.
2. Verify the API: `curl http://localhost:3001/api/indices`.
3. Verify the quant service: `curl http://localhost:8000/health`.
4. Verify the frontend: `curl -I http://localhost:3000`.
5. Open the dashboard and confirm real-time updates continue.

## Notes

- Call out API, WebSocket, and data-source changes in deployment notes.
- Do not commit local environment files or secrets.
- In local development, `NEXT_PUBLIC_BACKEND_URL` defaults to `http://localhost:3001`.
- The legacy NestJS backend remains in `backend/` for rollback. Use `npm run dev:backend:legacy` or `npm run start:backend:legacy` only when explicitly reverting.
