# Nexus Gamer Blog

A retro-styled gamer/anime fansite blog with real-time features. Dark theme with gold accents, starfield background, and Press Start 2P / Orbitron fonts.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TailwindCSS (artifact: retro-blog, path: /)
- API: Express 5 + Socket.IO (artifact: api-server, path: /api)
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (jsonwebtoken) + bcryptjs
- Validation: Zod, drizzle-zod
- API codegen: Orval (from OpenAPI spec at lib/api-spec/openapi.yaml)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/retro-blog/` — React+Vite frontend
  - `src/App.tsx` — main router (wouter)
  - `src/lib/auth.ts` — AuthContext + JWT token management
  - `src/lib/socket.ts` — Socket.IO client
  - `src/components/layout/` — Header, Sidebar, Footer, Layout
  - `src/pages/` — Home, PostDetail, Login, Register, CategoryPage, SearchPage
  - `src/pages/admin/` — Dashboard, PostEditor, Categories, Comments, Users
- `artifacts/api-server/` — Express + Socket.IO backend
  - `src/routes/` — auth, posts, comments, categories, tags, users, analytics, notifications
  - `src/middlewares/auth.ts` — JWT/bcrypt middleware
- `lib/db/` — Drizzle ORM schema + migrations
  - `src/schema/index.ts` — all DB tables
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/` — auto-generated React Query hooks + types

## Architecture decisions

- Socket.IO used for real-time: new post notifications, comment feed, online user count
- JWT stored in localStorage, injected via `setAuthTokenGetter()` in the api-client-react custom-fetch
- The API server uses a shared http.Server (not just express app) to enable Socket.IO
- All routes have `/api` prefix (enforced by artifact.toml proxy routing)
- Posts route supports fetching by both numeric ID and slug string

## Product

- Public: browse posts, filter by category/tag, search, read with markdown rendering
- Auth users: leave comments, like posts
- Admin/Owner: create/edit/delete posts with markdown editor, manage categories, moderate comments
- Owner: manage user roles (USER → ADMIN → OWNER)
- Real-time: live online count, new post banner notifications, real-time comment feed
- Default owner login: owner@site.com / admin123

## User preferences

- Blog is in Portuguese (Brazilian)
- Retro dark theme with gold (#D4A853) as primary accent
- Font stack: Press Start 2P (titles), Orbitron (headings), Exo 2 (body)

## Gotchas

- The api-server uses http.createServer wrapping the express app for Socket.IO compatibility
- Socket.IO path is `/api/socket.io` on both server and client
- When running `pnpm --filter @workspace/db run push`, the schema auto-detects changes

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
