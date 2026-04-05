# Dynasty AI Dashboard

A real-time monitoring dashboard for Dynasty AI infrastructure and agents, built with Next.js 14 and React.

## Features

- **Service Status** — Real-time health checks for configured services
- **Cost Tracking** — Monitor API costs via relay backend
- **Agent Activity** — Live agent session monitoring
- **Knowledge Base** — Browse MEMORY.md and daily logs
- **Settings** — Configure alert thresholds, monitoring intervals, and agent settings
- **Authentication** — Password-protected access with configurable allowed emails

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Auth:** NextAuth.js v4 with credentials provider + bcrypt
- **Icons:** Lucide React

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template and configure
cp .env.example .env.local

# Generate a NEXTAUTH_SECRET
openssl rand -base64 32

# Generate a password hash for ADMIN_PASSWORD_HASH
node -e "require('bcryptjs').hash('your-password', 10).then(h => console.log(h))"

# Edit .env.local with your values
# - NEXTAUTH_SECRET (required)
# - ALLOWED_EMAILS (required)
# - ADMIN_PASSWORD_HASH (required)
# - SERVICE_ENDPOINTS (optional)
# - API_RELAY_URL (optional)

# Start development server
npm run dev
```

The dashboard will be available at `http://localhost:3000`.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXTAUTH_URL` | Yes | Base URL of the app (e.g., `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Yes | Random secret for JWT signing |
| `ALLOWED_EMAILS` | Yes | Comma-separated list of authorized emails |
| `ADMIN_PASSWORD_HASH` | Yes | bcrypt hash of the admin password |
| `API_RELAY_URL` | No | URL of the backend relay API (default: `http://localhost:9001`) |
| `SERVICE_ENDPOINTS` | No | Comma-separated `Name:URL` pairs for health checks |
| `KNOWLEDGE_BASE_PATH` | No | Path to clawd memory directory |

## API Endpoints

All API routes require authentication (enforced via Next.js middleware).

| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard` | Full dashboard state |
| GET | `/api/dashboard/stream` | Server-Sent Events for real-time updates |
| GET | `/api/services/status` | Service health check results |
| GET | `/api/costs` | Cost metrics from relay |
| GET | `/api/agents/activity` | Agent session data from relay |
| GET | `/api/knowledge-base` | Memory and documentation |
| GET | `/api/settings` | Current settings |
| POST | `/api/settings` | Update settings (JSON body) |

## Architecture

```
app/
├── api/                  # API routes (all auth-protected)
│   ├── auth/             # NextAuth handler
│   ├── dashboard/        # Dashboard data + SSE stream
│   ├── agents/activity/  # Agent session data
│   ├── costs/            # Cost tracking
│   ├── services/status/  # Health checks
│   ├── settings/         # User preferences
│   └── knowledge-base/   # Memory browser
├── auth/signin/          # Login page
├── error.tsx             # Error boundary
├── global-error.tsx      # Global error boundary
├── layout.tsx            # Root layout
├── page.tsx              # Main dashboard
└── providers.tsx         # SessionProvider wrapper
lib/
└── relay-client.ts       # Backend relay API client
middleware.ts             # Auth middleware (route protection)
```

## Security

- Password-based authentication with bcrypt hashing
- JWT session strategy with configurable secret
- All API routes protected by NextAuth middleware
- Content Security Policy headers
- No hardcoded secrets or PII in source code
- All service URLs configurable via environment variables

## License

Proprietary — Dynasty AI 2024
