# LeadOS Codebase Overview

You are working on LeadOS — a multi-tenant lead generation operating system. The monorepo at `C:\Users\VRLab\OneDrive - Gannon University\Microsoft Copilot Chat Files\Desktop\APPS\LeadOS` contains three deployable applications:

## Three Applications

### 1. Lead OS Kernel (`lead-os-hosted-runtime-wt-hybrid/`)
- **Purpose**: Multi-tenant SaaS backend + dashboard — the engine
- **URL**: https://lead-os-nine.vercel.app
- **Stack**: Next.js 16.2, React 19, TypeScript 5.9, Tailwind + shadcn/ui
- **Pages**: 539 (60 UI + 498 API routes)
- **Tests**: 4,151 (100% pass rate)
- **Key features**: 4D lead scoring, AI nurture sequences, 137+ integrations, Joy Layer, multi-tenant isolation, RBAC, 2FA/SSO
- **Pricing**: $299/$599/$1,299/$2,999 per month
- **Middleware**: Auth on all /api/* routes, public routes whitelisted in `src/middleware.ts`
- **Vercel config**: Root directory set to `lead-os-hosted-runtime-wt-hybrid` via API

### 2. Erie Pro (`erie-pro/`)
- **Purpose**: Geographic territory platform — local service directory for Erie, PA
- **URL**: https://erie-pro.vercel.app
- **Stack**: Next.js 15.5, React 19, TypeScript 5.9, Tailwind + shadcn/ui (52 components)
- **Pages**: 630 (44 niches × 15 page types + static pages)
- **Key features**: Territory claim model, 3-tier premium system, lead routing with SLA, demand-based pricing ($300-$1,500/mo)
- **Data files**: niches.ts (44 entries), niche-content.ts (3,276 lines), glossary-data.ts (44 niches), seasonal-data.ts (44 niches), internal-linking.ts, local-seo.ts, provider-store.ts, premium-rewards.ts
- **API endpoints**: /api/lead, /api/claim, /api/contact

### 3. NeatCircle (`neatcircle-beta/`)
- **Purpose**: Agency marketing site — sells managed services to agencies
- **URL**: https://neatcircle.com
- **Stack**: Next.js 15.5, React 19, TypeScript 5.9, Tailwind + shadcn/ui
- **Pages**: 152

## Key Architecture Decisions
- Kernel handles backend logic; erie-pro and neatcircle handle marketing
- All external integrations run in dry-run mode without env vars
- shadcn HSL color tokens coexist with kernel's legacy CSS variables
- Erie-pro uses `generateStaticParams()` for all dynamic routes — new niches auto-generate all 15 page types
- Vercel deployment: kernel uses `rootDirectory: lead-os-hosted-runtime-wt-hybrid`, erie-pro auto-deploys from git

## GitHub
- Repo: https://github.com/pinohu/lead-os
- Branch: master
- Team: team_fuTLGjBMk3NAD32Bm5hA7wkr
