# Smart Bio GPT — Setup

A self-hosted, distributed system. **One command** brings up every service,
the database, the cache, the API gateway and the web app in Docker.

```
                         ┌──────────────────────┐
  browser  ──────────▶   │  gateway (nginx)     │   http://localhost:8080
                         └───────┬──────────────┘
             ┌───────────────────┼─────────────────────┬───────────────┐
             ▼                   ▼                     ▼               ▼
      frontend (SPA)      auth-service           bio-service      chat-service
                           :4001                  :4002            :4003
                             │                      │                │
                     ┌───────┴───────┐              │        ┌───────┴───────┐
                     ▼               ▼              ▼        ▼               ▼
                 Postgres :5432        Redis :6379 (cache + rate-limit state, all services)
                 (auth-service, chat-service)
```

| Container      | Role |
|----------------|------|
| `gateway`      | nginx — the only exposed port (`8080`); routes `/api/*` to services, everything else to the SPA |
| `frontend`     | React + Vite SPA, built and served as static files |
| `auth-service` | email/password + **Google OAuth**, issues JWT access + refresh tokens |
| `bio-service`  | protein dossier aggregation (UniProt / RCSB PDB / AlphaFold / ChEMBL / STRING), stateless |
| `chat-service` | research chat + AI, chats/messages/favorites/search-history |
| `postgres`     | self-hosted database (persistent volume `pgdata`) |
| `redis`        | shared cache + distributed rate-limit state (volume `redisdata`) |
| `migrator`     | one-shot — applies `db/schema.sql`, then exits |

## 1. Prerequisites

- Docker Desktop / Docker Engine with Compose v2
- (that's it — Node is only needed for local, non-Docker development)

## 2. Configure

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

| Variable | Required | How to get it |
|---|---|---|
| `POSTGRES_PASSWORD` | ✅ | any strong password |
| `REDIS_PASSWORD` | ✅ | any strong password |
| `JWT_SECRET` | ✅ | `openssl rand -base64 48` |
| `INTERNAL_API_KEY` | ✅ | `openssl rand -hex 24` |
| `GOOGLE_CLIENT_ID` | for Google login | Google Cloud Console → APIs & Services → Credentials → **OAuth client ID** (Web application). Add `http://localhost:8080` as an *Authorized JavaScript origin*. |
| `OPENROUTER_API_KEY` | optional | [openrouter.ai](https://openrouter.ai) — without it, chat falls back to deterministic database summaries |
| `SMTP_*` | optional | any SMTP provider — enables the welcome email |

## 3. Run

```bash
docker compose up --build
```

Open **http://localhost:8080**.

First boot builds the images and runs the migration; subsequent boots are fast.
Data survives restarts in the `pgdata` / `redisdata` volumes.

```bash
docker compose down          # stop
docker compose down -v       # stop + wipe the database
docker compose logs -f auth-service
```

## 4. Health

```bash
curl http://localhost:8080/api/health            # gateway
curl http://localhost:8080/api/bio/status        # circuit-breaker + cache state
docker compose ps                                # per-container health
```

## 5. API surface (through the gateway, all under `/api`)

`✅` = requires `Authorization: Bearer <access-token>`

| Method | Path | Auth | Service |
|---|---|---|---|
| GET | `/health` | – | gateway |
| POST | `/auth/register` | – | auth |
| POST | `/auth/login` | – | auth |
| POST | `/auth/google` | – | auth — body `{ idToken }` from Google Identity Services |
| POST | `/auth/refresh` | – | auth |
| GET | `/auth/me` | ✅ | auth |
| POST | `/auth/logout` | ✅ | auth |
| POST | `/bio/search` | optional | bio |
| GET | `/bio/protein/:accession` | optional | bio |
| GET | `/structure/:identifier` | optional | bio |
| POST | `/chat/message` | ✅ | chat |
| GET/PATCH/DELETE | `/chat`, `/chat/:id` | ✅ | chat |
| GET/POST/DELETE | `/user/favorites`, `/user/favorites/:accession` | ✅ | chat |
| GET | `/user/history` | ✅ | chat |

## 6. Local development (without Docker)

```bash
npm install                       # root — installs all workspaces
# run Postgres + Redis however you like, export DATABASE_URL / REDIS_URL / JWT_SECRET / INTERNAL_API_KEY
psql "$DATABASE_URL" -f db/schema.sql
npm run dev:auth   # :4001
npm run dev:bio    # :4002
npm run dev:chat   # :4003
cd bio-insight-ai-main && npm run dev   # :8080  (set VITE_API_URL to a gateway or a service)
```

## Resilience notes

- Every external provider has its own timeout, bounded exponential-backoff
  retry, and circuit breaker (`bio-service`). A dead provider degrades one
  section of a result instead of failing the request.
- Dossiers are cached in Redis (shared across replicas) with an in-process L1.
- Services are stateless and handle `SIGTERM` with connection draining — safe
  to scale with `docker compose up --scale bio-service=3`.
- Access tokens are verified locally in each service (shared `JWT_SECRET`), so
  auth never becomes a bottleneck.
