---
name: deploy-marketflow
description: Instructions for building and deploying MarketFlow to production using PM2 and Nginx.
---

# Deploy MarketFlow

Guide for moving the project from development to a production environment.

---

## Prerequisites
- [ ] Node.js and NPM installed on the target server.
- [ ] PM2 installed globally: `npm install -g pm2`.
- [ ] Port 3000 (frontend) and 3001 (backend) available.

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
3. Verify Frontend: `curl -I http://localhost:3000`.

---

## Notes
- Always run `pm2 save` after starting services to persist across reboots.
- Ensure the frontend's API calls point to the correct production backend URL.
