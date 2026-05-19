# Erie Pro — Action, Status & Notifications (P0)

## Overview

Consumer service requests now get traceable IDs, confirmation emails, status pages, and honest API responses. Provider notification is only reported when a `notification_events` row exists with `templateSlug = provider_new_service_request` and `status = sent`.

## Data model choice

We added **separate tables** instead of extending `Lead`:

| Table | Purpose |
|-------|---------|
| `service_requests` | Consumer-facing request lifecycle (`ERIE-YYYY-NNNNNN`) |
| `notification_events` | Per-email delivery with retries |
| `notification_templates` | Seeded HTML templates |
| `status_events` | Timeline for `/request-status` |
| `user_actions` | Correlation-friendly audit trail |

`Lead` remains the routing/delivery record. `service_requests.leadId` links the two when routing runs.

## APIs

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/service-requests` | Create request, queue/send notifications, honest JSON |
| GET | `/api/service-requests/[requestId]/status?token=` | Consumer status + timeline |
| POST | `/api/notifications/retry` | Retry by `eventId` or `serviceRequestId` |
| GET | `/api/admin/notifications` | Admin list (session required) |
| POST | `/api/admin/notifications/retry` | Admin retry single event |

## Email providers

Set `EMAIL_PROVIDER` to one of: `console`, `emailit`, `resend`, `sendgrid`, `postmark`, `mailgun`, `smtp`.

- **Dev default:** `console` (logs to server console)
- **Existing integration:** leave `EMAILIT_API_KEY` set; provider auto-selects `emailit` when no `EMAIL_PROVIDER` is set
- **Production:** set `EMAIL_PROVIDER` and the matching API keys; otherwise events are marked failed with a warning log

## Retry policy

`queued` → `sending` → `sent` | `failed`

Failed sends retry after **1m**, **5m**, **15m** (max 3). After exhaustion, an `admin_notification_failure` event is queued to `ADMIN_EMAIL`.

## Frontend

Forms posting to `/api/service-requests`:

- `src/components/lead-form.tsx` (niche quote forms)
- `src/components/homepage-lead-form.tsx` (homepage / get-matched)
- `src/app/client-sites/[slug]/ClientServiceRequestForm.tsx` (client microsites)

Success UI: `ServiceRequestSuccess` — request ID, notification status, status URL, partial failure warnings.

Status page: `/request-status/[requestId]?token=` with `StatusTimeline`.

Admin: `/admin/notifications`

## Local testing (console email)

```bash
cd lead-os/erie-pro
cp .env.example .env   # if needed
# DATABASE_URL required
EMAIL_PROVIDER=console
npm run db:migrate
npm run dev
```

Submit a quote form. Check terminal for `[console] To: ...` log lines. Open the status link from the success panel.

## Production env vars

```env
EMAIL_PROVIDER=emailit          # or resend, sendgrid, postmark, mailgun
EMAILIT_API_KEY=...
EMAIL_FROM_NAME="Erie Pro"
EMAIL_FROM_ADDRESS=noreply@erie.pro
ADMIN_EMAIL=ops@example.com
NEXT_PUBLIC_APP_URL=https://erie.pro
```

## Migrations

```bash
npx prisma migrate deploy
npx prisma generate
```

Templates are upserted on first service request via `ensureNotificationTemplatesSeeded()`.
