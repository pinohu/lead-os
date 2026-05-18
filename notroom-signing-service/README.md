# Notroom Signing Service

National signing service platform — mobile notary, remote online notarization (RON), loan signing agent, and apostille services across Pennsylvania.

## Stack

- **React 18** + **TypeScript** (strict mode)
- **Vite 5** for build tooling
- **Tailwind CSS** + **shadcn/ui** (Radix UI primitives)
- **Supabase** — PostgreSQL, Auth, Edge Functions, Storage
- **React Router 6** — client-side routing with code splitting
- **TanStack Query** — server-state management
- **React Hook Form** + **Zod** — form handling and validation

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment file and fill in values
cp .env.example .env

# Start dev server (http://localhost:8080)
npm run dev
```

## Environment Variables

See `.env.example` for required and optional variables. At minimum you need:

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/public key |
| `VITE_EMAILIT_API_KEY` | No | Emailit email service API key |
| `VITE_SENTRY_DSN` | No | Sentry error tracking DSN |
| `VITE_GA_MEASUREMENT_ID` | No | Google Analytics measurement ID |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 8080 |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage report |

## Project Structure

```
src/
├── App.tsx                 # Routes (React.lazy code-split)
├── main.tsx                # Entry point + env validation
├── index.css               # Tailwind + CSS custom properties
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── marketing/          # Trust badges, testimonials, social proof
│   ├── lead-gen/           # Lead magnets, tripwire offers, quizzes
│   ├── local-seo/          # Area-specific SEO components
│   ├── Layout.tsx          # Main layout (header, footer, skip nav)
│   ├── SigningLayout.tsx    # Signing service page layout
│   ├── BookingForm.tsx     # Booking form with validation
│   └── CommunityPage.tsx   # Shared city/community page template
├── pages/
│   ├── areas/
│   │   ├── CityPage.tsx    # Dynamic city page (data-driven)
│   │   ├── ErieCounty.tsx  # County landing pages
│   │   └── ...
│   ├── services/           # Individual service pages
│   ├── admin/              # Admin dashboard pages
│   ├── signing/            # National signing service pages
│   └── ...
├── constants/              # Site config, pricing, SEO constants
├── contexts/               # React context providers (Auth)
├── data/                   # Community data, case studies
├── hooks/                  # Custom hooks
├── integrations/           # Supabase client + generated types
├── services/               # Email templates and service layer
├── types/                  # TypeScript type definitions
└── utils/                  # Validation, logging, analytics, etc.
supabase/
├── functions/              # Edge Functions (payments, SMS, webhooks)
└── migrations/             # Database migrations (PostgreSQL)
```

## Deployment

Configured for **Vercel** with automatic deploys on push to `main`. See `vercel.json` for security headers and SPA routing configuration.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed design documentation.
