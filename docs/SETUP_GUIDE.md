# Lead OS Setup Guide

Step-by-step instructions for setting up Lead OS for local development and deploying to production.

## 1. Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Runtime for both packages |
| npm | 10+ | Dependency management |
| PostgreSQL | 15+ | Production persistence (optional for dev) |
| Git | 2.x | Version control |

Optional:
- Docker (for running PostgreSQL locally)
- Railway CLI (`npm i -g @railway/cli`) for runtime deployment
- Vercel CLI (`npm i -g vercel`) for edge deployment
- Wrangler CLI (`npm i -g wrangler`) for Cloudflare Workers deployment

## 2. Clone and Install

```bash
git clone https://github.com/pinohu/lead-os.git
cd lead-os

# Install kernel runtime dependencies
cd lead-os-runtime
npm install

# Install edge layer dependencies
cd ../neatcircle-beta
npm install
```

## 3. Database Setup

### Option A: PostgreSQL (recommended for production-like development)

```bash
# Create the database
createdb lead_os

# Or with Docker
docker run -d \
  --name lead-os-db \
  -e POSTGRES_DB=lead_os \
  -e POSTGRES_USER=leados \
  -e POSTGRES_PASSWORD=leados \
  -p 5432:5432 \
  postgres:15

# Connection string for Docker setup:
# postgresql://leados:leados@localhost:5432/lead_os
```

The runtime auto-creates all required tables on first connection. No manual migration step is needed.

### Option B: In-Memory (quick start, no persistence across restarts)

Skip database setup entirely. The runtime defaults to in-memory storage when no database URL is configured. This is suitable for local development and testing but not for production.

## 4. Configure Environment Variables

### Kernel Runtime

```bash
cd lead-os-runtime
cp .env.sample .env
```

Edit `.env` with your values. At minimum, set these for a functional development environment:

```bash
# Required for persistence (skip for in-memory mode)
LEAD_OS_DATABASE_URL=postgresql://leados:leados@localhost:5432/lead_os

# Tenant identity
LEAD_OS_TENANT_ID=dev-tenant
NEXT_PUBLIC_BRAND_NAME=My Dev Brand
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPPORT_EMAIL=dev@example.com

# Safety: keep false for development
LEAD_OS_ENABLE_LIVE_SENDS=false

# Operator access
LEAD_OS_OPERATOR_EMAILS=dev@example.com
LEAD_OS_AUTH_SECRET=dev-secret-change-in-production

# CRM (required for lead sync -- get keys from SuiteDash)
SUITEDASH_PUBLIC_ID=your-public-id
SUITEDASH_SECRET_KEY=your-secret-key

# Email (required for magic links and nurture)
EMAILIT_API_KEY=your-emailit-key
```

All other variables are optional and enable additional channels/integrations when set.

### Edge Layer

```bash
cd neatcircle-beta
cp .env.sample .env.local
```

Edit `.env.local` with your values:

```bash
NEXT_PUBLIC_BRAND_NAME=My Dev Brand
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_SUPPORT_EMAIL=dev@example.com

# CRM and email (same keys as runtime)
SUITEDASH_PUBLIC_ID=your-public-id
SUITEDASH_SECRET_KEY=your-secret-key
EMAILIT_API_KEY=your-emailit-key

# AITable for event tracking
AITABLE_API_TOKEN=your-aitable-token
AITABLE_DATASHEET_ID=your-datasheet-id
```

## 5. Start Development Servers

Open two terminal windows:

### Terminal 1: Kernel Runtime

```bash
cd lead-os/lead-os-runtime
npm run dev
# Starts on http://localhost:3000
```

### Terminal 2: Edge Layer

```bash
cd lead-os/neatcircle-beta
npm run dev
# Starts on http://localhost:3001
```

## 6. Verify Installation

### Health Check

```bash
# Kernel runtime health
curl http://localhost:3000/api/health

# Expected response:
# {
#   "success": true,
#   "service": "lead-os-hosted-runtime",
#   "tenantId": "dev-tenant",
#   "brandName": "My Dev Brand",
#   ...
# }
```

### Automation Health

```bash
curl http://localhost:3000/api/automations/health

# Shows provider configuration status and channel availability.
```

### Test Intake

```bash
curl -X POST http://localhost:3000/api/intake \
  -H "Content-Type: application/json" \
  -d '{
    "source": "manual",
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "service": "lead-capture"
  }'
```

### Test Decision Engine

```bash
curl -X POST http://localhost:3000/api/decision \
  -H "Content-Type: application/json" \
  -d '{
    "source": "contact_form",
    "hasEmail": true,
    "askingForQuote": true
  }'
```

### Run Tests

```bash
cd lead-os-runtime
npm test

cd ../neatcircle-beta
npm test
```

## 7. Deploy to Production

### 7.1 Kernel Runtime on Railway

```bash
cd lead-os-runtime

# Login and link to your Railway project
railway login
railway link

# Add a PostgreSQL plugin in the Railway dashboard, or set LEAD_OS_DATABASE_URL
# manually pointing to your database.

# Set environment variables in Railway dashboard or CLI:
railway variables set LEAD_OS_TENANT_ID=production-tenant
railway variables set NEXT_PUBLIC_BRAND_NAME="Your Brand"
railway variables set NEXT_PUBLIC_SITE_URL=https://api.yourdomain.com
railway variables set LEAD_OS_ENABLE_LIVE_SENDS=true
railway variables set SUITEDASH_PUBLIC_ID=your-id
railway variables set SUITEDASH_SECRET_KEY=your-key
railway variables set EMAILIT_API_KEY=your-key
railway variables set LEAD_OS_OPERATOR_EMAILS=admin@yourdomain.com
railway variables set LEAD_OS_AUTH_SECRET=$(openssl rand -hex 32)
railway variables set CRON_SECRET=$(openssl rand -hex 32)
# ... set additional provider keys as needed

# Deploy
railway up
```

Railway uses the `railway.json` configuration:
- Builds with Nixpacks (`npm install && npm run build`)
- Starts with `npm run start` (binds to `0.0.0.0:$PORT`)
- Health check on `/api/health`
- Auto-restarts on failure (max 5 retries)

### 7.2 Edge Layer on Vercel

```bash
cd neatcircle-beta

# Login to Vercel
vercel login

# Set environment variables in Vercel dashboard or CLI
# Deploy
vercel --prod
```

### 7.3 Edge Layer on Cloudflare Workers (alternative)

```bash
cd neatcircle-beta

# Build for Cloudflare
npm run cf:build

# Preview locally
npm run cf:preview

# Deploy to production
npm run cf:deploy
```

### 7.4 Set Up Cron Jobs

Configure a cron service (Railway cron, Vercel cron, or external) to call the nurture endpoint periodically:

```bash
# Every 6 hours, process nurture sequences
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://api.yourdomain.com/api/cron/nurture
```

## 8. Post-Deployment Verification

Run these checks after every production deployment:

```bash
RUNTIME_URL=https://api.yourdomain.com

# 1. Health check
curl "$RUNTIME_URL/api/health"
# Verify: success=true, correct tenantId, persistenceMode="postgresql"

# 2. Automation health
curl "$RUNTIME_URL/api/automations/health"
# Verify: liveMode=true, expected providers show as configured

# 3. Widget boot (if using embeds)
curl "$RUNTIME_URL/api/widgets/boot"
# Verify: correct brandName, accent, enabled channels

# 4. Embed manifest
curl "$RUNTIME_URL/api/embed/manifest"
# Verify: niches listed, funnels populated, widget types enabled

# 5. n8n manifest (if using n8n)
curl "$RUNTIME_URL/api/n8n/manifest"
# Verify: workflow list, canProvision status

# 6. Test intake (dry run)
curl -X POST "$RUNTIME_URL/api/intake" \
  -H "Content-Type: application/json" \
  -d '{"source":"manual","firstName":"Deploy","lastName":"Check","email":"deploy-check@example.com","dryRun":true}'
# Verify: success=true, leadKey returned
```

### Checklist

- [ ] `/api/health` returns `success: true`
- [ ] `persistenceMode` is `postgresql` (not `memory`)
- [ ] `liveMode` matches `LEAD_OS_ENABLE_LIVE_SENDS` setting
- [ ] CRM provider (SuiteDash) shows as configured
- [ ] Email provider (Emailit) shows as configured
- [ ] Widget origins are set (not open CORS in production)
- [ ] Operator emails are configured
- [ ] Cron secret is set and unique
- [ ] Auth secret is set and unique
- [ ] Nurture cron job is scheduled
- [ ] Custom domain configured and SSL active
