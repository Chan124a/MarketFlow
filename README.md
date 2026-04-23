# MarketFlow

大盘数据看板 - Real-time Chinese Stock Market Dashboard

实时展示上证指数、深证成指、创业板指、科创板指等大盘指数数据，支持 WebSocket 实时推送更新。

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, Socket.io-client |
| Backend (Main) | Fastify, Axios |
| Backend (Real-time) | NestJS, Socket.io, WebSocket |
| Data Source | 东方财富网 (East Money) |

## Project Structure

```
MarketFlow/
├── src/                    # Root Fastify server (simple dashboard)
│   ├── index.js           # Server entry
│   ├── fetcher.js        # Data fetching
│   └── public/
│       └── index.html    # Simple UI
├── backend/              # NestJS backend (real-time WebSocket)
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── indices/      # 指数模块
│       └── websocket/   # WebSocket 模块
├── frontend/             # Next.js 前端
│   └── app/
│       ├── layout.tsx
│       ├── page.tsx
│       └── globals.css
```

## Features

- 实时大盘指数展示（上证/深证/创业板/科创板）
- WebSocket 实时推送，自动更新
- 涨跌颜色提示
- 大盘走势分析

## Quick Start

### Option 1: Simple Dashboard (Fastify)

```bash
cd MarketFlow
npm install
npm start
```

访问 http://localhost:3000

### Option 2: Full Stack (NestJS + Next.js)

```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

访问前端页面 http://localhost:3000

后端 API 地址为 http://localhost:3001/api/indices

## API

### GET /api/indices

获取大盘指数数据

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "上证指数",
      "code": "sh000001",
      "price": 3256.67,
      "change": 12.34,
      "changePercent": 0.38
    }
  ]
}
```

## License

MIT# MarketFlow
