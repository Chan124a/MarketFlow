# MarketFlow

大盘数据看板，用于展示 A 股、港股、美股主要指数数据，并通过 WebSocket 推送指数更新。

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 14 (App Router), React 18, Socket.io-client |
| Backend | NestJS 10, Socket.io, Axios |
| Quant | Python 3.12, uv, FastAPI, pandas, NumPy |
| Data Source | Tencent Finance APIs (`gtimg.cn`) |
| Visualization | Custom SVG Charts (Zero Dependencies) |

## Project Structure

MarketFlow is organized into a mono-repo structure with a separate backend and frontend. For a detailed breakdown of all directories and files, please refer to [**STRUCTURE.yml**](./STRUCTURE.yml).

- **`backend/`**: NestJS API and WebSocket server for market data aggregation.
- **`frontend/`**: Next.js App Router dashboard with custom SVG visualizations.
- **`quant/`**: Python FastAPI service for quantitative signals and future backtesting.
- **`.skills/`**: Standardized procedural instructions for automation agents.

## Features

- **Multi-Market Support:** 展示 A 股、港股、美股主要指数。
- **Real-time Updates:** 通过 WebSocket 接收每 30 秒一次的指数自动更新。
- **Interactive Visualization:** 支持分时图、日/周/月 K 线，以及长达 3 年的历史走势。
- **Custom Charting Engine:** 基于纯 SVG 构建，轻量高效，支持鼠标追踪和实时 Tooltip。
- **Intelligent Grouping:** 自动按 A 股、港股、美股进行区域划分。
- **Chinese Market Styling:** 遵循国内涨红跌绿的色彩习惯。


## Quick Start

### Lightweight Dev Environment

Use `mise` to pin Node.js, Python, and uv without containers:

```bash
mise install
mise run setup
mise run dev
```

This starts:

```text
frontend: http://localhost:3000
backend:  http://localhost:3001
quant:    http://localhost:8000
```

Useful checks:

```bash
curl http://localhost:3001/api/indices
curl http://localhost:8000/health
```

If you do not use `mise`, install Node.js 20, Python 3.12, and uv yourself, then run:

```bash
npm run setup
npm run dev
```

### 1. Start Backend Only

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

### 2. Start Frontend Only

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

### Quant

```bash
cd quant
uv sync
uv run uvicorn app:app --reload --port 8000
```

## API

### Quant Service

The Python quant service is available locally at:

```text
http://localhost:8000
```

Current endpoints:

```text
GET /health
GET /strategies
POST /signals
```

The NestJS backend also exposes proxy endpoints so the frontend can keep using the backend API surface:

```text
GET /api/quant/health
GET /api/quant/strategies
GET /api/quant/signals
```

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

根目录提供了轻量本机开发脚本：

```bash
npm run setup
npm run dev
```

With `mise`, use:

```bash
mise run setup
mise run dev
```

该脚本会并行运行：

```text
backend:  npm run start:dev
frontend: npm run dev
quant:    uv run uvicorn app:app --reload --port 8000
```

## Project Skills

Agent-facing project workflows live in `.skills/`:

- `.skills/add-new-index.md` explains how to verify a Tencent Finance code, register it in `backend/src/indices/fetcher.ts`, add it to the frontend category map, and verify the data flow.
- `.skills/deploy.md` documents production build, start, process-manager, and reverse-proxy steps for the backend and frontend.
- `.skills/refresh-skills.sh` generates a prompt from recent git changes to update or create skill files when workflows change.

When changes introduce a reusable workflow, update the relevant skill file or add a new one so future agents can repeat the process consistently.

## License

MIT
