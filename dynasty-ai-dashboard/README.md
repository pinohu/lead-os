# Dynasty AI Dashboard

Real-time monitoring dashboard for Dynasty AI infrastructure and agents.

## Features

- **Real-time Dashboard** — SSE-powered live updates for costs and agent activity
- **Service Status** — Health checks for all configured services
- **Cost Tracking** — Monitor API costs via relay backend
- **Agent Activity** — Live agent session monitoring with status indicators
- **Knowledge Base** — Browse MEMORY.md and daily logs
- **Settings** — Persistent configuration for alerts, monitoring, and agents
- **Authentication** — Per-user password auth with bcrypt, rate limiting, and JWT

## Tech Stack

- Next.js 14 (App Router), TypeScript (strict), Tailwind CSS
- NextAuth.js v4 + bcrypt, Zod validation, self-hosted Inter font

## Quick Start

```bash
npm install
cp .env.example .env.local

# Generate secrets
openssl rand -base64 32                    # → NEXTAUTH_SECRET
node -e "require('bcryptjs').hash('pw',10).then(h=>console.log(h))"  # → password hash

# Edit .env.local, then:
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXTAUTH_URL` | Yes | App base URL |
| `NEXTAUTH_SECRET` | Yes | JWT signing secret |
| `ALLOWED_USERS` | Preferred | Per-user auth: `email:bcrypt_hash,...` |
| `ALLOWED_EMAILS` | Fallback | Comma-separated emails (shared password) |
| `ADMIN_PASSWORD_HASH` | With ALLOWED_EMAILS | Shared bcrypt hash |
| `API_RELAY_URL` | No | Relay API (default: `localhost:9001`) |
| `SERVICE_ENDPOINTS` | No | `Name:URL,...` pairs for health checks |
| `KNOWLEDGE_BASE_PATH` | No | Path to clawd memory directory |
| `SETTINGS_DIR` | No | Persistent settings directory |

## Architecture

```
app/
├── api/                  # API routes (all auth-protected)
├── auth/signin/          # Login page
├── knowledge/            # Knowledge base browser
├── settings/             # Settings UI
├── app-shell.tsx         # Navigation sidebar
├── error.tsx             # Error boundary
├── global-error.tsx      # Global error boundary
├── layout.tsx            # Root layout (self-hosted font)
├── page.tsx              # Dashboard (SSE real-time)
└── providers.tsx         # SessionProvider
lib/
├── api-response.ts       # Standardized API response helpers
├── auth.ts               # NextAuth config + rate limiting
└── relay-client.ts       # Relay API client with TTL cache
middleware.ts             # Auth middleware
```

## Security

- Per-user passwords with bcrypt (no shared secret required)
- Brute-force protection: 5 attempts, 15-minute lockout
- All routes behind NextAuth middleware
- CSP, HSTS, X-Frame-Options, Permissions-Policy headers
- Path sandboxing on knowledge-base filesystem reads
- Zod validation on all API inputs
- SSE connection limit (max 50 concurrent)
- No hardcoded secrets or PII

## License

Proprietary — Dynasty AI 2024
