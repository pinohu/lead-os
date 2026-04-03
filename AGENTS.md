- Treat my requests as authorization to inspect, edit, and verify without routine confirmation.
- Make reasonable assumptions and document them afterward.
- Ask only for destructive or irreversible choices, missing secrets, external-account actions, or tool approvals.
- Carry tasks through implementation and validation end-to-end.

## Cursor Cloud specific instructions

### Repository structure

This is a multi-app monorepo with 4 independently deployable Next.js applications:

| App | Directory | Default Port | Framework |
|-----|-----------|-------------|-----------|
| Kernel Runtime (main) | `lead-os-hosted-runtime-wt-hybrid` | 3000 | Next.js 16 |
| Erie Pro | `erie-pro` | 3002 | Next.js 15 + Prisma |
| NeatCircle | `neatcircle-beta` | 3003 | Next.js 15 |
| Public Runtime | `lead-os-hosted-runtime-wt-public` | 3000 | Next.js 15 |

The `_n8n_sources/` directory contains reference n8n workflow repos — not part of the core product build.

### Running services

- **No env vars required** for development. All 137 integrations run in dry-run mode when API keys are absent.
- **Exception**: The Kernel Runtime middleware requires `LEAD_OS_AUTH_SECRET` for all API routes (even public ones like `/api/health`). Create `.env` with `LEAD_OS_AUTH_SECRET=dev-secret-for-local-development-only` in the kernel runtime directory.
- Erie Pro uses Prisma and requires `DATABASE_URL` + `DIRECT_URL` for database features. Without them, the app starts but DB-dependent pages will error.
- Start services with `npm run dev` in each app directory. Erie Pro defaults to port 3002. Use `npm run dev -- -p <port>` for NeatCircle or Public Runtime to avoid port conflicts.

### Testing

- **Kernel Runtime**: `npm test` in `lead-os-hosted-runtime-wt-hybrid/` runs 4,187 tests using Node.js native test runner with `--experimental-strip-types`. All tests use in-memory storage and dry-run mode.
- **Erie Pro**: `npm test` runs Vitest.
- **NeatCircle**: `npm test` runs Node.js native test runner.
- **Type checking**: `npx tsc --noEmit` in each app directory.
- **Linting**: NeatCircle has `npm run lint` but requires ESLint flat config setup (no config exists yet). Use `npx tsc --noEmit` as the primary lint tool across all apps.

### Key intake API for testing

The core hello-world operation is `POST /api/intake` with payload like:
```json
{"source":"contact_form","email":"test@example.com","firstName":"John","lastName":"Doe"}
```
Valid sources: `contact_form`, `assessment`, `roi_calculator`, `exit_intent`, `chat`, `webinar`, `checkout`, `manual`.

### Package manager

All apps use **npm** with `package-lock.json`. Node.js 22+ is required (engine constraint in kernel runtime).
