---
name: deploy-marketflow
description: Instructions for running, building, and deploying MarketFlow with mise, PM2, and Nginx.
---

# Deploy MarketFlow

Guide for running the full stack in development and moving the project to a production environment.

---

## Local Toolchain Development

Use `mise` to pin Node.js, Python, and uv versions without containers.

```bash
mise install
mise run setup
mise run dev
```

This starts:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Quant service: `http://localhost:8000`

This starts:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Quant service: `http://localhost:8000`

Verify the local services:

```bash
curl http://localhost:3001/api/indices
curl http://localhost:8000/health
```

## Prerequisites
- [ ] `mise` installed locally, or Node.js 20, Python 3.12, and uv installed manually.
- [ ] PM2 installed globally: `npm install -g pm2`.
- [ ] Port 3000 (frontend), 3001 (backend), and 8000 (quant) available.

## Steps

### 1. Build Both Services
Run the production build scripts.
```bash
cd backend && npm run build
cd ../frontend && npm run build
```

### 2. Start with PM2
Use PM2 to manage the processes.
```bash
pm2 start "npm run start:prod" --name marketflow-backend --cwd ./backend
pm2 start "npm run start" --name marketflow-frontend --cwd ./frontend
```

### 3. Configure Reverse Proxy
Set up Nginx to handle incoming traffic and WebSocket upgrades (see `architecture.md` for logic).

## Verification
1. Check process status: `pm2 status`.
2. Verify API: `curl http://localhost:3001/api/indices`.
3. Verify quant service: `curl http://localhost:8000/health`.
4. Verify Frontend: `curl -I http://localhost:3000`.

---

## Notes
- Always run `pm2 save` after starting services to persist across reboots.
- Ensure the frontend's API calls point to the correct production backend URL.
- In local development, `NEXT_PUBLIC_BACKEND_URL` defaults to `http://localhost:3001`.
