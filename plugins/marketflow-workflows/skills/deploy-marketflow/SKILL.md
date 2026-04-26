---
name: deploy-marketflow
description: Use when building, validating, or deploying MarketFlow with the NestJS backend, Next.js frontend, PM2, and Nginx.
---

# Deploy MarketFlow

Use this workflow for production builds, server deployment, and deployment-related verification.

## Prerequisites

- Node.js and npm are installed on the target server.
- PM2 is available globally: `npm install -g pm2`.
- Backend port `3001` and frontend port `3000` are available or mapped by the proxy.
- Production environment variables are configured outside the repo.

## Build

Run builds from each app directory:

```bash
cd backend && npm run build
cd ../frontend && npm run build
```

## Start With PM2

From the repo root:

```bash
pm2 start "npm run start:prod" --name marketflow-backend --cwd ./backend
pm2 start "npm run start" --name marketflow-frontend --cwd ./frontend
pm2 save
```

## Reverse Proxy

Configure Nginx to route frontend traffic to the Next.js app and API/WebSocket traffic to the NestJS backend. Preserve WebSocket upgrade headers for Socket.io.

## Verification

1. Check `pm2 status`.
2. Verify the API: `curl http://localhost:3001/api/indices`.
3. Verify the frontend: `curl -I http://localhost:3000`.
4. Open the dashboard and confirm real-time updates continue.

## Notes

- Call out API, WebSocket, and data-source changes in deployment notes.
- Do not commit local environment files or secrets.
