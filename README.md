# Squad

Rede social de jogos com fórum, reviews, guias, indicações da comunidade, recomendações por IA e uma comunidade com chat em tempo real, chamadas de voz, câmera e compartilhamento de tela.

**Stack:** React (Vite) + CSS · Node.js/Express · PostgreSQL + Prisma · Socket.io · WebRTC

## Como rodar

Pré-requisitos: Node.js 18+ e Docker (ou PostgreSQL instalado).

```bash
# 1. Banco de dados
docker compose up -d

# 2. Backend
cd server
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev          # http://localhost:4000

# 3. Frontend (em outro terminal)
cd client
npm install
npm run dev          # http://localhost:5173
```

Para ativar as recomendações e a moderação com IA, coloque sua `ANTHROPIC_API_KEY` no `server/.env`.

## Usuários de teste

Senha de todos: `123456`

- `squad@squad.dev` (equipe)
- `squad2@squad.dev`
