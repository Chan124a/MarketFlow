---
name: add-new-index
description: Use when adding a new market index or ticker code to MarketFlow, including backend Tencent Finance registration and frontend market categorization.
---

# Add New Index

Follow this workflow whenever adding a market index or ticker to the dashboard.

## Prerequisites

- A valid Tencent Finance code such as `sh000001`, `hkHSI`, or `usNDX`.
- Backend and frontend dependencies installed.

## Steps

1. Verify the upstream code:

```bash
curl "http://qt.gtimg.cn/q=<code>"
```

2. Register the code in `backend/src/indices/fetcher.ts`.

Add the code and display name to `INDEX_CODES`.

3. Register the code in `frontend/app/page.tsx`.

Add the code to the correct `CATEGORIES` group for A-shares, Hong Kong, or US markets.

4. Keep names centralized.

Use `INDEX_CODES` as the display-name source of truth. Avoid duplicating display names in frontend categories unless the existing code requires it.

## Verification

1. Start or restart the backend with `cd backend && npm run start:dev`.
2. Check the API with `curl http://localhost:3001/api/indices`.
3. Confirm the new code appears in the API response.
4. Open the dashboard and confirm the card appears in the correct category.
5. Open the detail view and confirm chart data renders when upstream data supports it.

## Notes

- Tencent Finance prefixes include `sh`, `sz`, `hk`, and `us`.
- Intraday `time` and `3d` chart data is mainly available for `sh` and `sz` indices.
- Preserve graceful upstream failure handling and cached data behavior.
