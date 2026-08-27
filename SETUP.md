# Smart Bio GPT — Local Setup

Two services: **`backend/`** (Express API) and **`bio-insight-ai-main/`** (Vite + React SPA).
The frontend talks **only** to the backend; the backend owns auth, persistence, the
external bio-database aggregation, and the AI calls.

```
Browser ──> bio-insight-ai-main (Vite :8080)
                     │  REST + JWT
                     ▼
             backend (Express :5000/api)
              ├─ Supabase (Auth + Postgres)
              ├─ OpenRouter (AI)
              ├─ UniProt / RCSB PDB / AlphaFold / ChEMBL / STRING
              └─ SMTP (nodemailer, optional)
```

## 1. Prerequisites

- Node.js **>= 20**
- A Supabase project (free tier is fine)
- An OpenRouter API key (optional — chat falls back to deterministic answers without it)

## 2. Database

In the Supabase dashboard → **SQL Editor**, paste and run
[`backend/db/schema.sql`](backend/db/schema.sql). This creates `chats`, `messages`,
`favorites`, `search_history`, their indexes, RLS policies, and the `updated_at` trigger.

## 3. Backend

```bash
cd backend
cp .env.example .env
# edit .env — see the table below
npm install
npm run dev            # http://localhost:5000
```

| Variable | Required | Notes |
|---|---|---|
| `SUPABASE_URL` | ✅ | Project URL |
| `SUPABASE_ANON_KEY` | ✅ | Used for sign-in / sign-up / JWT verification |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ for chat/favorites | Server-only. Without it, DB writes are blocked by RLS |
| `OPENROUTER_API_KEY` | optional | Enables real AI answers |
| `OPENROUTER_MODEL` | optional | Defaults to `google/gemini-2.0-flash-001` |
| `CORS_ORIGINS` | optional | Comma-separated; defaults include `:8080` and `:5173` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | optional | Welcome email via nodemailer; skipped if unset |

Verify:

```bash
curl http://localhost:5000/api/health          # {"status":"ok",...}
curl http://localhost:5000/api/status          # feature flags, cache + circuit-breaker state
curl -XPOST http://localhost:5000/api/bio/search \
  -H 'content-type: application/json' -d '{"query":"TP53"}'
```

## 4. Frontend

```bash
cd bio-insight-ai-main
cp .env.example .env      # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev               # http://localhost:8080
```

## 5. API surface

All under `/api`. `✅` = requires `Authorization: Bearer <supabase-access-token>`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health`, `/health/ready`, `/status` | – | liveness / readiness / diagnostics |
| POST | `/auth/register` | – | sign up (+ welcome email) |
| POST | `/auth/login` | – | sign in → `{ token, refreshToken, user }` |
| POST | `/auth/refresh` | – | rotate an expired access token |
| GET | `/auth/me` | ✅ | current user |
| POST | `/bio/search` | optional | resolve query → normalized protein dossier |
| GET | `/bio/protein/:accession` | optional | dossier by accession |
| GET | `/structure/:identifier` | optional | resolve PDB / AlphaFold coordinates URL |
| POST | `/chat/message` | ✅ | send message, get AI reply (protein held in context) |
| GET | `/chat` | ✅ | list research sessions |
| GET | `/chat/:id` | ✅ | session + messages |
| PATCH | `/chat/:id` | ✅ | rename session |
| DELETE | `/chat/:id` | ✅ | delete session |
| GET | `/user/favorites` | ✅ | list saved proteins |
| POST | `/user/favorites` | ✅ | save a protein |
| DELETE | `/user/favorites/:accession` | ✅ | remove |
| GET | `/user/history` | ✅ | recent searches |

## Resilience notes

- Every external provider has its own timeout, bounded exponential-backoff retry,
  and circuit breaker. A dead provider degrades one section of a result instead of
  failing the request (`Promise.allSettled` aggregation).
- Protein dossiers are cached in-process (TTL, `BIO_CACHE_TTL_MS`) behind a
  Redis-shaped interface (`backend/src/utils/cache.js`).
- The API is stateless (no in-process sessions) and handles `SIGTERM`/`SIGINT`
  with connection draining — safe to run behind a load balancer / autoscaler.
