<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=200&section=header&text=Smart%20Bio%20GPT&fontSize=80&fontColor=fff&animation=twinkling&fontAlignY=35&desc=Conversational%20Protein%20%26%20Gene%20Intelligence&descAlignY=55&descAlign=50" width="100%"/>

<div align="center">

# 🧬 Smart Bio GPT

### *A conversational research workspace for proteins and genes — grounded in public databases, with an AI layer on top.*

[![GitHub Repo](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/saiprasad367/SmartBioGPT)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](docker-compose.yml)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](#-license)

</div>

---

## 📑 Table of Contents

1. [What it is](#-what-it-is)
2. [Feature tour](#-feature-tour)
3. [System architecture](#️-system-architecture)
4. [Tech stack](#️-tech-stack)
5. [Algorithms & techniques](#-algorithms--techniques)
6. [Repository layout](#-repository-layout)
7. [Prerequisites](#-prerequisites)
8. [Environment variables](#-environment-variables)
9. [Setup & run (one command)](#-setup--run-one-command)
10. [Using the app](#-using-the-app)
11. [API reference](#-api-reference)
12. [Database schema](#️-database-schema)
13. [Operations](#️-operations)
14. [Local development (no Docker)](#-local-development-no-docker)
15. [Troubleshooting](#-troubleshooting)
16. [License](#-license)

---

## 🎯 What it is

**Smart Bio GPT** turns a free-text query like `TP53`, `BRCA1` or `P04637` into a
**normalized protein dossier** assembled live from five public bioinformatics
databases, then lets you **ask follow-up questions in natural language** with the
protein held in context. Every AI answer is grounded in the retrieved data; when
the AI provider is unavailable the app still answers from the database records.

It is a **self-hosted distributed system** — a React SPA, an NGINX API gateway,
three Node microservices, PostgreSQL, Redis and a schema migrator — and the whole
thing comes up with a single `docker compose up`.

| | |
|---|---|
| **Data sources** | UniProt · RCSB PDB · AlphaFold DB · ChEMBL · STRING |
| **AI** | OpenRouter (any OpenAI-compatible model) with a deterministic fallback |
| **Auth** | Email + password (bcrypt) **and** Google OAuth (One Tap / GIS), first-party JWT |
| **Email** | Structured welcome email on sign-up (Gmail / any SMTP) |
| **Runs on** | Docker Compose — one gateway port, everything else internal |

---

## ✨ Feature tour

### 🔬 Protein / gene dossier
- One query resolves to a single canonical UniProt entry using a **ranked query
  cascade** (accession → reviewed human gene-exact → reviewed gene-exact →
  name match → loose), so `TP53` returns TP53, not something that merely mentions it.
- Aggregates **function, disease associations, DrugBank drugs, keywords,
  sequence, interaction partners** (UniProt + STRING, de-duplicated) and a
  **ChEMBL target annotation**.
- Enrichment calls run **concurrently and independently** — STRING or ChEMBL
  being down just removes that section, the researcher still gets a useful result.

### 🧪 3D structure resolution
- Any identifier (PDB id, UniProt accession, gene symbol) resolves to a
  **loadable 3D model**: experimental **RCSB PDB** coordinates when they exist
  (picking the **best resolution** among candidates), otherwise the
  **AlphaFold** predicted model (mmCIF).

### 💬 Grounded AI chat
- Chat sessions with persisted history; the active protein dossier is injected as
  authoritative context.
- **Model fallback chain** — if the primary OpenRouter model is rate-limited
  (429) or out of credits (402), the request auto-routes to a backup model.
- **Deterministic fallback** — with no API key or a total AI outage, answers are
  generated offline from the dossier (function, diseases, drugs, interactions),
  and flagged `degraded: true`.

### 🔐 Authentication
- Email/password with **bcrypt** (cost 12) and **Google Sign-In** on both the
  Login and Sign-up pages (Google Identity Services; the button hides itself if
  `GOOGLE_CLIENT_ID` is unset).
- Google sign-up **creates or links** an account and stores `google_id`, name,
  email and avatar.
- **Stateless JWT** access tokens (15 min) verified locally in every service +
  **opaque refresh tokens** (30 days) stored only as SHA-256 hashes, rotated on use.
- Transparent one-shot token refresh in the SPA on any 401.

### 📧 Welcome email
- Sent **from** the configured SMTP account **to** whatever address just
  registered (password *or* Google), for new users only, non-blocking.
- Apple-style HTML template (SF Pro type, hairline rules, single accent, pill
  CTA) with a **handwritten-style signature**, plus a plain-text part for
  deliverability.

### ⭐ Workspace
- Favorites (upsert, per-user unique) and automatic **search history** for
  signed-in users (written by `bio-service` via an internal call to `chat-service`).

---

## 🏗️ System architecture

```mermaid
graph TD
    U[User Browser] -->|HTTP :8088| GW[NGINX API Gateway<br/>only exposed port]
    GW -->|/| FE[React + Vite SPA<br/>static, served by NGINX]
    GW -->|/api/auth/*| AUTH[auth-service :4001<br/>JWT + Google OAuth + email]
    GW -->|/api/bio/*, /api/structure/*| BIO[bio-service :4002<br/>protein dossier aggregation]
    GW -->|/api/chat/*, /api/user/*| CHAT[chat-service :4003<br/>chat + AI + workspace]

    AUTH --> PG[(PostgreSQL 16<br/>users, refresh_tokens)]
    CHAT --> PG2[(PostgreSQL 16<br/>chats, messages, favorites, search_history)]
    AUTH -.rate-limit + cache.-> RS[(Redis 7)]
    BIO  -.cache + rate-limit.-> RS
    CHAT -.rate-limit.-> RS

    BIO -->|x-internal-key| CHAT
    BIO --> EXT[UniProt · RCSB PDB · AlphaFold · ChEMBL · STRING]
    CHAT --> AI[OpenRouter API]
    MIG[[migrator — one-shot<br/>applies db/schema.sql]] --> PG

    style GW fill:#111,stroke:#000,color:#fff
    style FE fill:#61DAFB,stroke:#21A1F1,color:#000
    style AUTH fill:#68A063,stroke:#4F7942,color:#fff
    style BIO fill:#68A063,stroke:#4F7942,color:#fff
    style CHAT fill:#68A063,stroke:#4F7942,color:#fff
    style PG fill:#316192,stroke:#1F3F5F,color:#fff
    style PG2 fill:#316192,stroke:#1F3F5F,color:#fff
    style RS fill:#D82C20,stroke:#A81E15,color:#fff
    style EXT fill:#FFB84D,stroke:#E69A2E,color:#000
    style AI fill:#FF6B9D,stroke:#E05580,color:#000
```

| Container | Role | Exposed |
|---|---|---|
| `gateway` | NGINX — routes `/api/*` to services, everything else to the SPA; blocks `/internal/*` | **`:8088` (host)** |
| `frontend` | React + Vite SPA, built to static files, served by NGINX | internal `:80` |
| `auth-service` | email/password + Google OAuth, issues JWT access + refresh tokens, sends welcome email | internal `:4001` |
| `bio-service` | protein dossier aggregation (UniProt/PDB/AlphaFold/ChEMBL/STRING) — **stateless** | internal `:4002` |
| `chat-service` | research chat + AI + user workspace (chats, messages, favorites, history) | internal `:4003` |
| `postgres` | PostgreSQL 16 — persistent volume `pgdata` | internal `:5432` |
| `redis` | shared cache + distributed rate-limit state — volume `redisdata` | internal `:6379` |
| `migrator` | one-shot: applies `db/schema.sql` (idempotent) then exits | — |

**Design principles**

- **Shared library, not shared service.** `@sbg/shared` (an npm workspace) holds
  all infra (logger, pg pool, Redis, cache, HTTP client, circuit breaker), web
  middleware (auth, validation, rate limit, error handling, `createApp`) and
  domain logic (bio providers, dossier aggregation, AI, pg repositories). Each
  service is a thin routing layer over it.
- **Auth doesn't become a bottleneck.** Access tokens are HS256 JWTs verified
  locally in every service with the shared `JWT_SECRET` — no callback to
  `auth-service` on each request.
- **Stateless services scale horizontally.** `docker compose up --scale bio-service=3`
  works; Redis keeps cache and rate-limit state consistent across replicas.
- **Graceful shutdown.** `SIGTERM`/`SIGINT` drain in-flight connections, then
  close the pg pool and Redis client.

---

## 🛠️ Tech stack

### Frontend — `bio-insight-ai-main/`

| Area | Choice |
|---|---|
| Language / build | **TypeScript**, **Vite 5**, `@vitejs/plugin-react-swc` |
| UI | **React 18**, **Tailwind CSS 3**, **shadcn/ui** (Radix primitives), `tailwindcss-animate`, `@tailwindcss/typography` |
| Motion | **Framer Motion** (page transitions, scroll progress) |
| 3D | **three.js**, `@react-three/fiber`, `@react-three/drei` |
| State / data | **Zustand** (auth store), **TanStack Query** (server state), **Axios** (interceptors: bearer inject + 401 refresh) |
| Routing | **React Router 6** with a `ProtectedRoute` guard |
| Forms / validation | `react-hook-form`, **Zod** |
| Markdown | `react-markdown` + `remark-gfm` (chat rendering) |
| Auth widget | **Google Identity Services** (`accounts.google.com/gsi/client`) |
| Charts | `recharts` |
| Tests | **Vitest**, Testing Library |

### Backend — `services/*` + `packages/shared`

| Area | Choice |
|---|---|
| Runtime | **Node.js 20** (CommonJS), npm **workspaces** monorepo |
| HTTP | **Express 4**, **Helmet**, **CORS** (allow-list), `express.json` (256 KB limit) |
| Logging | **Pino** + **pino-http** (JSON in prod, `pino-pretty` in dev), request-id + secret redaction |
| Validation | **Zod** schemas via a `validate({ body, params, query })` middleware |
| Auth | **jsonwebtoken** (HS256), **bcryptjs**, **google-auth-library** (ID-token verify) |
| Database | **PostgreSQL 16**, `pg` Pool, parameterized queries, `withTransaction` helper |
| Cache / coordination | **Redis 7** via **ioredis** |
| Rate limiting | **express-rate-limit** + **rate-limit-redis** (shared store) |
| Outbound HTTP | **Axios** per-provider clients with retry + circuit breaker |
| AI | **openai** SDK pointed at the **OpenRouter** base URL |
| Email | **nodemailer** (SMTP, pooled) |

### Infrastructure

**Docker** multi-stage builds · **Docker Compose** (`x-service-defaults` anchor,
healthchecks, `depends_on: condition`) · **NGINX** (gateway + SPA host, Docker DNS
resolver for lazy upstream resolution) · **Alpine** base images · non-root
container users.

---

## 🧠 Algorithms & techniques

This project is deliberately "boring where it counts" — no ML models are trained;
the intelligence is in **data resolution, aggregation and resilience**.

### 1. Ranked UniProt query resolution — `packages/shared/src/bio/uniprot.js`
A free-text term is ambiguous. Rather than one search, an **ordered cascade of
Lucene queries** is tried until one returns a hit:

```
accession:<q>                                             (if it matches the UniProt accession regex)
gene_exact:<q> AND reviewed:true AND organism_id:9606      (reviewed human, exact gene)
gene_exact:<q> AND reviewed:true                           (reviewed, any organism)
(gene:<q> OR protein_name:"<q>") AND reviewed:true AND organism_id:9606
(gene:<q> OR protein_name:"<q>") AND reviewed:true
gene_exact:<q>
<q>                                                        (last-resort free text)
```
Result: precision first (canonical reviewed entry), recall only as a fallback.

### 2. Concurrent multi-source aggregation with graceful degradation — `bio/dossier.js`
- UniProt is the **required spine** (a genuine miss throws `404`).
- ChEMBL, STRING and structure resolution run in parallel via
  **`Promise.allSettled`** — a rejection removes only that section.
- `sources[]` in the response reports which providers actually contributed.

### 3. Circuit breaker — `packages/shared/src/circuitBreaker.js`
A 3-state machine per external provider:

```
CLOSED ──(≥5 consecutive transient failures)──▶ OPEN
OPEN ──(after 30 s cool-down)──▶ HALF_OPEN ──(success)──▶ CLOSED
                                   └─────────(failure)──▶ OPEN
```
While `OPEN`, calls fail fast with `CIRCUIT_OPEN` instead of piling up slow
requests against a dead upstream. `HALF_OPEN` admits a bounded number of probes.

### 4. Resilient HTTP client — `packages/shared/src/httpClient.js`
- **Retryable-status classification**: `408, 425, 429, 500, 502, 503, 504` and
  network/abort errors are transient; `4xx` like `404`/`400` are **not** (and
  count as upstream *health*, closing the breaker).
- **Bounded exponential backoff with jitter**:
  `min(2000 · 2^(attempt-1), 8000) + random(0..250) ms`, default 2 retries.
- One Axios instance + one breaker **per provider**, so one slow database can't
  trip the others.
- Errors are normalized to a typed `ApiError` (`NOT_FOUND`, `TOO_MANY`,
  `UPSTREAM_ERROR`).

### 5. Two-tier cache — `packages/shared/src/cache.js`
- **L1**: in-process `lru-cache` (bounded, TTL).
- **L2**: Redis (shared across replicas, survives restarts).
- **Cache-aside `wrap(key, producer)`**: L1 → L2 → compute; a failing or
  `null`/`undefined` producer result is never cached; Redis being down degrades
  to L1-only rather than failing the call.
- Dossiers are keyed by the normalized (trimmed, lower-cased) query; default TTL
  6 h (`BIO_CACHE_TTL_MS`).

### 6. Best-structure selection — `bio/structure.js`
When a UniProt entry lists several PDB ids, the first 4 are queried at RCSB
concurrently and the entry with the **lowest (best) `resolution_combined`** wins;
if none resolve, fall back to the first id, then to AlphaFold.

### 7. Interaction merge & de-dup — `bio/dossier.js`
UniProt curated interactions and STRING functional partners are merged into one
list, de-duplicated case-insensitively by partner name (UniProt entries first,
keeping their accession; STRING entries contribute a confidence `score`), capped
at 20.

### 8. Authentication & session model — `jwt.js`, `tokens.js`, `authMiddleware.js`
- **Access token**: HS256 JWT, `{ sub, email, name }`, 15 min, issuer-checked,
  verified **locally** in every service.
- **Refresh token**: 48 random bytes, base64url; only its **SHA-256 hash** is
  stored; **rotated** on every use (old hash revoked, new pair issued); 30-day
  expiry.
- **Passwords**: bcrypt, cost factor 12.
- **Google**: ID token verified against Google's JWKS with audience =
  `GOOGLE_CLIENT_ID`; `email_verified` required.
- `requireInternalKey` guards service-to-service endpoints with a shared
  `x-internal-key`; the gateway returns `404` for any `/internal/*` path.

### 9. Distributed rate limiting — `rateLimit.js`
Fixed-window counters in a **shared Redis store** (`rate-limit-redis`), so limits
hold across every replica of a service:

| Limiter | Window | Max | Key |
|---|---|---|---|
| global (every service) | 60 s | 240 | user id or IP |
| AI (`/api/chat/message`) | 60 s | 20 | user id or IP |
| auth (`/api/auth/*`) | 15 min | 40 | IP |

### 10. Context-grounded prompt assembly + model fallback — `ai/chat.js`
- System prompt pins the assistant to mechanism-level, Markdown, evidence-aware
  answers; the compacted dossier is added as an **authoritative system message**.
- Only the **last 12** user/assistant turns are sent (each clamped to 8 000 chars).
- The request carries an OpenRouter **`models` fallback array**
  (`OPENROUTER_MODEL` + `OPENROUTER_FALLBACK_MODELS`); OpenRouter routes past a
  429/402 automatically.
- On any failure → **deterministic fallback** built from the dossier, marked
  `degraded: true`.

### 11. Operational hardening
Redis client uses an **offline command queue** (commands issued before the socket
is ready — e.g. the rate-limiter's Lua script load — are queued, not rejected);
HTTP keep-alive timeouts tuned above typical LB idle (`keepAliveTimeout 61 s`,
`headersTimeout 65 s`); `unhandledRejection` / `uncaughtException` are logged with
a real stack and the latter triggers a clean shutdown.

---

## 📁 Repository layout

```
SmartBioGPT/
├── docker-compose.yml            # brings up the entire system
├── .env.example                  # single env file for every service
├── db/
│   └── schema.sql                # applied by the one-shot `migrator` (idempotent)
├── infra/
│   └── gateway/                  # NGINX API gateway (Dockerfile + nginx.conf)
├── packages/
│   └── shared/                   # @sbg/shared — the library behind every service
│       └── src/
│           ├── logger.js  db.js  redis.js  cache.js
│           ├── httpClient.js  circuitBreaker.js  ApiError.js  asyncHandler.js
│           ├── createApp.js  startServer.js  validate.js
│           ├── authMiddleware.js  errorMiddleware.js  rateLimit.js  jwt.js
│           ├── bio/             # uniprot · chembl · stringdb · structure · dossier
│           ├── ai/              # chat.js (OpenRouter + fallback)
│           ├── auth/            # google.js (ID-token verify) · email.js (welcome mail)
│           └── data/            # users · refreshTokens · workspace (pg repositories)
├── services/
│   ├── auth-service/            # register / login / google / refresh / me / logout
│   ├── bio-service/             # /api/bio/* · /api/structure/* (stateless)
│   └── chat-service/            # /api/chat/* · /api/user/* · /internal/search-history
└── bio-insight-ai-main/         # React + Vite SPA (built, served by NGINX)
    └── src/
        ├── pages/               # Index · Login · Signup · Dashboard · NotFound
        ├── components/          # 3d · auth · chat · dashboard · landing · layout · protein · ui
        ├── store/               # authStore.ts (Zustand)
        └── lib/                 # api.ts (Axios client + typed endpoints)
```

---

## 📦 Prerequisites

- **Docker Desktop / Docker Engine** with **Compose v2** — that's the only hard
  requirement.
- Node.js 20+ **only** if you want to run services outside Docker.
- Optional accounts: a **Google Cloud** OAuth client, an **OpenRouter** API key,
  an **SMTP** account (e.g. a Gmail App Password).

---

## 🔧 Environment variables

Copy `.env.example` to `.env` and fill it in. Compose reads `.env` automatically.
**Keep each value on its own line — a trailing `# comment` becomes part of the value.**

### Required

| Variable | Example / how to get it |
|---|---|
| `POSTGRES_PASSWORD` | any strong password |
| `REDIS_PASSWORD` | any strong password |
| `JWT_SECRET` | ≥ 32 random chars — `openssl rand -base64 48` |
| `INTERNAL_API_KEY` | shared secret for service-to-service calls — `openssl rand -hex 24` |

### Gateway / URLs

| Variable | Default | Notes |
|---|---|---|
| `GATEWAY_PORT` | `8088` | Host port for the gateway. `8080` is often taken on Windows. |
| `APP_PUBLIC_URL` | `http://localhost:8088` | Used in emails and the AI `HTTP-Referer`. Keep the port in sync. |
| `CORS_ORIGINS` | `http://localhost:8088` | Comma-separated browser origins allowed to call the API directly. |

### Google OAuth — enables "Continue with Google"

| Variable | Notes |
|---|---|
| `GOOGLE_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials → **OAuth client ID** (type **Web application**). **Add `http://localhost:8088` as an Authorized JavaScript origin** or the button 400s. The client id is public (compiled into the SPA). Leave blank to hide the button. |
| `GOOGLE_CLIENT_SECRET` | Stored for completeness; the GIS ID-token flow used here does not require it server-side. |

### AI (OpenRouter) — optional; without it, chat uses the deterministic fallback

| Variable | Default | Notes |
|---|---|---|
| `OPENROUTER_API_KEY` | — | [openrouter.ai](https://openrouter.ai) key. A key with **no credits** can only use `:free` models. |
| `OPENROUTER_MODEL` | `minimax/minimax-m3:free` | Primary model. With a funded key, prefer `google/gemini-3.5-flash-lite`. |
| `OPENROUTER_FALLBACK_MODELS` | `nvidia/nemotron-3-super-120b-a12b:free` | Comma-separated; tried if the primary returns 429/402. |
| `OPENROUTER_MAX_TOKENS` | `1200` | Max completion tokens per answer. |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` | Override to point at another OpenAI-compatible endpoint. |

### Email / SMTP — optional; enables the welcome email

| Variable | Notes |
|---|---|
| `SMTP_HOST` | e.g. `smtp.gmail.com`. **Blank = email disabled.** |
| `SMTP_PORT` / `SMTP_SECURE` | `587` / `false` for STARTTLS (Gmail); `465` / `true` for SMTPS. |
| `SMTP_USER` / `SMTP_PASS` | For Gmail: your address + a **16-char App Password** (spaces are stripped in code). |
| `MAIL_FROM` | Must be the **authenticated address** for Gmail, e.g. `Smart Bio GPT <you@gmail.com>`. |
| `MAIL_REPLY_TO` | Optional; defaults to `SMTP_USER`. |
| `MAIL_SIGNATURE_NAME` / `MAIL_SIGNATURE_TITLE` | Handwritten-style signature in the email (default `Saiprasad` / `Creator, Smart Bio GPT`). |

### Tuning (optional)

| Variable | Default |
|---|---|
| `ACCESS_TOKEN_TTL` | `15m` |
| `REFRESH_TOKEN_TTL_DAYS` | `30` |
| `HTTP_TIMEOUT_MS` / `HTTP_RETRIES` | `12000` / `2` |
| `BIO_CACHE_TTL_MS` | `21600000` (6 h) |
| `LOG_LEVEL` | `info` |
| `POSTGRES_USER` / `POSTGRES_DB` | `smartbio` / `smartbiogpt` |

> **Secrets never go to Git.** `.env` and `.env.*` (except `.env.example`) are
> `.gitignore`d. Keep your Google secret, OpenRouter key and SMTP password local.

---

## 🚀 Setup & run (one command)

```bash
# 1. clone
git clone https://github.com/saiprasad367/SmartBioGPT.git
cd SmartBioGPT

# 2. configure
cp .env.example .env
#    edit .env — set POSTGRES_PASSWORD, REDIS_PASSWORD, JWT_SECRET, INTERNAL_API_KEY
#    (optionally GOOGLE_CLIENT_ID, OPENROUTER_API_KEY, SMTP_*)

# 3. run — builds images, starts Postgres/Redis, runs the migration, starts everything
docker compose up --build
```

Open **http://localhost:8088**.

First boot builds the images and applies `db/schema.sql`; later boots are fast.
Data survives restarts in the `pgdata` / `redisdata` volumes.

> **Windows note:** if the build errors with `error launching git: Access is denied`,
> prefix the command: `BUILDX_GIT_LABELS=false docker compose up --build`.

### Verify

```bash
curl http://localhost:8088/api/health              # {"status":"ok","service":"gateway"}
curl http://localhost:8088/api/auth/health         # features: { google, mail }
curl http://localhost:8088/api/chat/health         # features: { ai, model }
curl http://localhost:8088/api/bio/status          # cache stats + circuit-breaker state
docker compose ps                                  # every container should be "healthy"
```

---

## 🧑‍💻 Using the app

1. **Sign up** at `/signup` — email + password, or **Continue with Google**. A
   welcome email is sent if SMTP is configured.
2. **Search** a gene or protein on the dashboard (`TP53`, `BRCA1`, `EGFR`,
   `P04637`). You get the dossier: function, diseases, drugs, interactions,
   structure.
3. **Ask** follow-up questions — "what pathways is it in?", "known inhibitors?",
   "compare it to MDM2". The dossier stays in context.
4. **Inspect** the 3D structure (experimental PDB or AlphaFold model).
5. **Save** proteins to favorites; your searches are kept in history.

---

## 🔌 API reference

All routes are under `/api` through the gateway. `✅` = requires
`Authorization: Bearer <access-token>`; `~` = optional auth (used to record history).

| Method | Path | Auth | Service | Body / notes |
|---|---|:--:|---|---|
| `GET` | `/api/health` | – | gateway | liveness |
| `POST` | `/api/auth/register` | – | auth | `{ name, email, password }` → `{ user, token, refreshToken, expiresAt }` |
| `POST` | `/api/auth/login` | – | auth | `{ email, password }` |
| `POST` | `/api/auth/google` | – | auth | `{ idToken }` from Google Identity Services |
| `POST` | `/api/auth/refresh` | – | auth | `{ refreshToken }` → rotated pair |
| `GET` | `/api/auth/me` | ✅ | auth | current user |
| `POST` | `/api/auth/logout` | – | auth | `{ refreshToken }` — revokes it |
| `POST` | `/api/bio/search` | ~ | bio | `{ query }` → `{ data: ProteinDossier }` |
| `GET` | `/api/bio/protein/:accession` | ~ | bio | dossier by UniProt accession |
| `GET` | `/api/structure/:identifier` | ~ | bio | resolve PDB id / accession / gene → loadable model |
| `GET` | `/api/bio/status` | – | bio | cache + circuit-breaker snapshot |
| `POST` | `/api/chat/message` | ✅ | chat | `{ message, chatId?, proteinAccession? }` → `{ chatId, message, degraded }` |
| `GET` | `/api/chat` | ✅ | chat | list chat sessions |
| `GET` | `/api/chat/:id` | ✅ | chat | one session + messages |
| `PATCH` | `/api/chat/:id` | ✅ | chat | `{ title }` |
| `DELETE` | `/api/chat/:id` | ✅ | chat | delete session (cascades messages) |
| `GET` | `/api/user/favorites` | ✅ | chat | list favorites |
| `POST` | `/api/user/favorites` | ✅ | chat | `{ accession, name?, gene?, organism? }` (upsert) |
| `DELETE` | `/api/user/favorites/:accession` | ✅ | chat | remove favorite |
| `GET` | `/api/user/history` | ✅ | chat | recent searches (max 50) |

`POST /internal/search-history` exists on `chat-service` for `bio-service` only
(shared `x-internal-key`) and is **not** routable through the gateway.

### Example

```bash
BASE=http://localhost:8088

# register
TOKEN=$(curl -s -X POST $BASE/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada","email":"ada@example.com","password":"Passw0rd!23"}' \
  | python -c "import sys,json;print(json.load(sys.stdin)['token'])")

# dossier
curl -s -X POST $BASE/api/bio/search \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"query":"BRCA1"}' | python -m json.tool

# grounded chat
curl -s -X POST $BASE/api/chat/message \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"message":"What pathways is BRCA1 in?","proteinAccession":"P38398"}'
```

### Error shape

```json
{ "error": { "code": "PROTEIN_NOT_FOUND", "message": "No UniProt entry found for \"xyz\"" },
  "requestId": "…" }
```

---

## 🗄️ Database schema

PostgreSQL 16, extensions `pgcrypto` + `citext`. `db/schema.sql` is idempotent
(`CREATE ... IF NOT EXISTS`, `DROP TRIGGER IF EXISTS`) and applied by the
`migrator` container on every `up`.

| Table | Owner | Purpose | Key columns |
|---|---|---|---|
| `users` | auth-service | accounts | `id uuid pk`, `email citext unique`, `password_hash` (null for Google-only), `google_id unique`, `avatar_url`, `email_verified` |
| `refresh_tokens` | auth-service | session rotation | `token_hash text unique` (SHA-256), `user_id → users`, `expires_at`, `revoked_at` |
| `chats` | chat-service | chat sessions | `user_id → users`, `title`, `protein_accession`, `updated_at` (trigger) |
| `messages` | chat-service | chat turns | `chat_id → chats`, `role CHECK (user/assistant/system)`, `content`, `degraded` |
| `favorites` | chat-service | saved proteins | `UNIQUE (user_id, accession)`, `name`, `gene`, `organism` |
| `search_history` | chat-service (written by bio-service) | recent queries | `user_id → users`, `query`, `accession` |

All foreign keys are `ON DELETE CASCADE`; indexes cover the per-user, time-ordered
access patterns. `touch_updated_at()` triggers maintain `updated_at` on `users`
and `chats`.

---

## ⚙️ Operations

```bash
docker compose up --build                 # start / rebuild everything
docker compose up -d                       # start detached
docker compose down                        # stop (keeps data)
docker compose down -v                     # stop + WIPE database & cache volumes
docker compose logs -f chat-service        # follow one service
docker compose ps                          # container health
docker compose up -d --scale bio-service=3 # scale a stateless service

# apply a schema change (schema.sql is idempotent)
docker compose run --rm migrator

# psql into the database
docker exec -it smart-bio-gpt-postgres-1 psql -U smartbio -d smartbiogpt
```

Change the host port by editing **`GATEWAY_PORT`, `APP_PUBLIC_URL` and
`CORS_ORIGINS` together** in `.env`, then `docker compose up -d`.

### Production (Docker Compose + TLS)

`docker-compose.prod.yml` is a production overlay that adds a **Caddy TLS edge**
(automatic Let's Encrypt on 80/443), `restart: always`, log rotation and memory
limits. The same one-command workflow applies:

```bash
cp .env.production.example .env      # set PUBLIC_DOMAIN, ACME_EMAIL, secrets, …
docker compose up -d --build         # COMPOSE_FILE in .env merges the overlay
```

**Full AWS EC2 walkthrough — every console field, sizing, DNS, backups,
hardening, teardown: [`DEPLOY_AWS.md`](DEPLOY_AWS.md).**

---

## 💻 Local development (no Docker)

```bash
npm install                         # root — installs every workspace

# bring up Postgres + Redis yourself, then export:
export DATABASE_URL=postgres://smartbio:pass@localhost:5432/smartbiogpt
export REDIS_URL=redis://:pass@localhost:6379
export JWT_SECRET=dev-secret-at-least-16-chars
export INTERNAL_API_KEY=dev-internal-key
psql "$DATABASE_URL" -f db/schema.sql

npm run dev:auth      # :4001   (node --watch)
npm run dev:bio       # :4002
npm run dev:chat      # :4003

cd bio-insight-ai-main
npm install
VITE_API_URL=http://localhost:4001 npm run dev   # Vite dev server; point VITE_API_URL at a gateway
```

Tests: `npm test` in `packages/shared` (Node test runner) and in
`bio-insight-ai-main` (Vitest).

---

## 🧯 Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `bind: address already in use` / `:8080` | Another process holds the port. Change `GATEWAY_PORT` (+ `APP_PUBLIC_URL`, `CORS_ORIGINS`) in `.env`. Default is `8088`. |
| Build: `error launching git: Access is denied` (Windows) | `BUILDX_GIT_LABELS=false docker compose up --build` |
| "Continue with Google" shows a 400 | Add `http://localhost:8088` (your `APP_PUBLIC_URL`) as an **Authorized JavaScript origin** on the OAuth client. |
| Chat answers are `degraded: true` | No `OPENROUTER_API_KEY`, or the key has no credits (paid models → 402) / the model is 429. Set a `:free` model or fund the key; check `docker compose logs chat-service`. |
| No welcome email | `SMTP_HOST` blank, or `MAIL_FROM` ≠ the authenticated Gmail address, or a wrong App Password. Look for `SMTP transport ready` in `auth-service` logs. |
| `container name is already in use` on recreate | `docker compose down` then `docker compose up -d`. |
| Healthchecks flap | The images healthcheck `127.0.0.1` (not `localhost`) because NGINX binds IPv4 only — expected. |

---

## 📄 License

MIT © Sai Prasad — see the header of this section.

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

<div align="center">
<sub>Built for advancing biomedical research 🧬 &nbsp;·&nbsp; <a href="https://github.com/saiprasad367/SmartBioGPT">github.com/saiprasad367/SmartBioGPT</a></sub>
</div>
