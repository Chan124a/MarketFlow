# Repository Guidelines

## Project Structure & Module Organization

MarketFlow is split into a NestJS backend and a Next.js frontend.
- **Backend (`backend/`):** A NestJS app using a 30-second refresh loop to fetch index data from Tencent Finance. It uses a custom `fetcher.ts` for parsing and a Socket.io bridge for real-time broadcasts.
- **Frontend (`frontend/`):** A Next.js 14 app featuring custom SVG-based charting (no heavy external libraries). It uses a categorization system for A-shares, Hong Kong, and US markets.

Refer to `.skills/architecture.md` for a deep dive into data flow and component roles.

## Build, Test, and Development Commands

Run installs separately where dependencies are used:

```bash
npm install
cd backend && npm install
cd frontend && npm install
```

Key commands:

- `npm run dev` starts backend and frontend concurrently from the repo root.
- `cd backend && npm run start:dev` runs the NestJS API locally.
- `cd frontend && npm run dev` runs the Next.js app on `http://localhost:3000`.
- `cd backend && npm run build` compiles TypeScript to `backend/dist/`.
- `cd frontend && npm run build` builds the production frontend.
- `cd frontend && npm run lint` runs Next.js linting.

## Coding Style & Naming Conventions

Use TypeScript throughout. Follow the existing two-space indentation, single quotes, semicolons, and explicit interfaces for shared data shapes. Name React components in `PascalCase` (`IndexCard.tsx`) and NestJS classes by role (`IndicesService`, `IndicesController`, `IndicesGateway`). Keep backend feature code grouped by domain under `backend/src/<feature>/`, and prefer path aliases like `@/components/IndexCard` in frontend code.

## Testing Guidelines

No automated test runner is currently configured. For changes, run the relevant build and lint commands, then manually verify the dashboard loads, REST endpoints respond, and `indices:update` WebSocket events still refresh the UI. If adding tests, place frontend tests beside components or under `frontend/__tests__/`, and backend tests beside the module with `.spec.ts` naming.

## Project Skills

Reusable agent workflows have two layers:
- **Repo notes:** Source workflow notes live in `.skills/` and MUST follow the format defined in [**.skills/TEMPLATE.md**](./.skills/TEMPLATE.md), including YAML frontmatter.
- **Agent plugin:** Codex-discoverable skills live in `plugins/marketflow-workflows/skills/*/SKILL.md` and are registered through `.agents/plugins/marketplace.json`.
- **Workflow:** Use `add-new-index` when adding market index codes, `deploy-marketflow` when building or deploying the app, and `maintain-skills` when keeping repo notes and plugin skills current.
- **Maintenance:** The helper `.skills/refresh-skills.sh` can generate a prompt from recent git changes to keep the workflow notes current.
- **Hook reminders:** Run `bash .skills/install-hooks.sh 3` once per clone to enable a post-commit reminder that generates a skills refresh prompt every three commits. Use `1` for every commit or `0` to disable.

When a change introduces or modifies a repeatable process, update the matching `.skills/*.md` source note and mirror the change into the matching plugin `SKILL.md`. Create new skills in both places when the process should be reusable by agents.

## Commit & Pull Request Guidelines

Recent commits use short imperative summaries such as `modify README.md` and `add detail page.`. Keep messages concise and focused on one change. Pull requests should include a brief description, commands run, linked issue if applicable, and screenshots or screen recordings for UI changes. Call out API, WebSocket, or data-source behavior changes explicitly.

## Security & Configuration Tips

Do not hardcode secrets or commit local environment files. External market data comes from Tencent Finance APIs through `backend/src/indices/fetcher.ts`; handle upstream failures gracefully and preserve cached data behavior where possible.
