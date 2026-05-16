# Deploy no Render — Nexus Gamer Blog

## Serviços necessários

### 1. PostgreSQL (banco de dados)
- Render → New → PostgreSQL
- Copie a "Internal Database URL" para usar nas variáveis de ambiente

### 2. Backend — API Server (Web Service)
- Render → New → Web Service
- Root directory: `artifacts/api-server`
- Build command: `cd ../.. && npm i -g pnpm && pnpm install && pnpm --filter @workspace/db run push && pnpm --filter @workspace/api-server run build`
- Start command: `node dist/index.mjs`
- Environment variables:
  - `DATABASE_URL` → URL do PostgreSQL do Render
  - `JWT_SECRET` → qualquer string secreta longa
  - `NODE_ENV` → production
  - `PORT` → 8080

### 3. Frontend — Retro Blog (Static Site)
- Render → New → Static Site
- Root directory: `artifacts/retro-blog`
- Build command: `cd ../.. && npm i -g pnpm && pnpm install && BASE_PATH=/ pnpm --filter @workspace/retro-blog run build`
- Publish directory: `dist/public`
- Environment variable:
  - `VITE_API_URL` → URL do backend (ex: https://nexus-api.onrender.com)

## Login do dono
- Email: zfmoro1@gmail.com
- Senha: admin123
