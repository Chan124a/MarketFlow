---
name: add-new-index
description: Procedural guide for adding a new market index code to both the backend fetcher and frontend categorization.
---

# Add a New Market Index

Follow these steps precisely whenever you need to add a new index or ticker to MarketFlow.

---

## Prerequisites
- [ ] Valid Tencent Finance code (e.g., `sh000001`, `hkHSI`, `usNDX`).
- [ ] Backend and Frontend dev servers running for verification.

## Steps

### 1. Identify and Verify the Code
Tencent Finance uses specific prefixes: `sh` (Shanghai), `sz` (Shenzhen), `hk` (Hong Kong), and `us` (US).
Verify it works:
```bash
curl "http://qt.gtimg.cn/q=<code>"
```

### 2. Register in Backend
File: `backend/src/indices/fetcher.ts`
Add the code and name to the `INDEX_CODES` object.

### 3. Register in Frontend
File: `frontend/app/page.tsx`
Add the code to the appropriate category in the `CATEGORIES` constant.

## Verification
1. Restart the backend: `cd backend && npm run start:dev`.
2. Check the API: `curl http://localhost:3001/api/indices | grep "<code>"`.
3. Open the browser and confirm the card appears and the modal displays chart data.

---

## Notes
- Intraday data (`time`/`3d`) is primarily available for `sh`/`sz` indices.
- `INDEX_CODES` in the backend is the single source of truth for display names.
