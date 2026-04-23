# MarketFlow

大盘数据看板，用于展示 A 股、港股、美股主要指数数据，并通过 WebSocket 推送指数更新。

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 14, React 18, Socket.io-client |
| Backend | NestJS 10, Socket.io, Axios |
| Data Source | Tencent Finance APIs |

## Project Structure

```text
MarketFlow/
├── backend/                  # NestJS API and WebSocket server
│   ├── src/
│   │   ├── main.ts           # Backend entry, listens on port 3001
│   │   ├── app.module.ts
│   │   ├── indices/          # Index API, service, and data fetcher
│   │   └── websocket/        # Socket.io gateway and adapter
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # Next.js dashboard
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── IndexCard.tsx
│   │   └── IndexDetailModal.tsx
│   └── package.json
├── package.json              # Root helper scripts
└── README.md
```

## Features

- 展示 A 股、港股、美股主要指数
- 通过 REST API 获取指数列表和详情
- 通过 WebSocket 接收指数更新
- 支持指数详情弹窗、K 线图和历史走势
- 涨跌颜色提示

## Quick Start

### 1. Start Backend

```bash
cd backend
npm install
npm run start:dev
```

后端服务地址：

```text
http://localhost:3001
```

后端根路径 `/` 没有页面，浏览器直接打开 `http://localhost:3001` 会返回 404。请访问 API 路径或启动前端页面。

### 2. Start Frontend

在另一个终端运行：

```bash
cd frontend
npm install
npm run dev
```

前端页面地址：

```text
http://localhost:3000
```

## Build

### Backend

```bash
cd backend
npm run build
```

构建产物输出到：

```text
backend/dist/
```

生产方式启动：

```bash
cd backend
npm run start:prod
```

### Frontend

```bash
cd frontend
npm run build
npm run start
```

## API

### GET /api/indices

获取指数列表。

```text
http://localhost:3001/api/indices
```

示例响应：

```json
{
  "success": true,
  "data": [
    {
      "code": "sh000001",
      "name": "上证指数",
      "price": 3256.67,
      "change": 12.34,
      "changePercent": 0.38,
      "volume": 123456,
      "timestamp": "2026-04-23T04:00:00.000Z"
    }
  ],
  "stale": false
}
```

### GET /api/indices/:code

获取单个指数。

```text
http://localhost:3001/api/indices/sh000001
```

### GET /api/indices/:code/details

获取指数详情、K 线和走势数据。

```text
http://localhost:3001/api/indices/sh000001/details
```

## WebSocket

前端连接后端 Socket.io 服务：

```text
http://localhost:3001
```

指数更新事件：

```text
indices:update
```

## Root Scripts

根目录提供了同时启动前后端的辅助脚本：

```bash
npm install
npm run dev
```

该脚本会并行运行：

```text
backend:  npm run start:dev
frontend: npm run dev
```

## License

MIT
