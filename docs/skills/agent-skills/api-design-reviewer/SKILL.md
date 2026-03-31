---
name: api-design-reviewer
description: Review API route design in LeadOS for REST conventions, input validation (email regex, phone digit check), proper error responses with status codes, auth middleware integration, dry-run mode patterns, and consistent JSON response format {success, data, error}
---

# API Design Reviewer

**Tier:** METHODOLOGY (Tier 2 -- Patterns & Standards)
**Category:** API Quality & Conventions
**Domain:** REST design, input validation, error handling, auth integration, response format

## Overview

This skill reviews API route handlers across LeadOS for adherence to the project's REST conventions. Every API route must validate inputs, return the standard `{success, data, error}` JSON envelope, use correct HTTP status codes, integrate with the auth middleware, and support dry-run mode where applicable. This skill catches inconsistencies before they reach production -- mismatched status codes, missing validation, unprotected routes, and response format drift.

## Core Capabilities

- Audit API routes for REST convention compliance (correct HTTP methods, resource naming)
- Verify input validation: email regex, phone digit check, required field presence
- Check error responses return proper HTTP status codes with descriptive messages
- Confirm auth middleware integration on protected routes
- Validate dry-run mode pattern for mutation endpoints
- Enforce the standard JSON response envelope `{success, data, error}`
- Detect inconsistencies across API routes within the same codebase

## When to Use

Trigger this skill when:
- "review API", "check API routes", "API audit"
- Creating or modifying any route handler in `app/api/`
- "are my APIs consistent?", "check error handling"
- Adding a new API endpoint to any codebase
- After refactoring API middleware or auth logic
- Before publishing API documentation

## Methodology

### R1: REST Conventions
- `GET` for reads (never mutate state)
- `POST` for creates and form submissions
- `PATCH` for partial updates
- `DELETE` for removals
- Resource names are plural nouns: `/api/tenants`, not `/api/tenant`
- No verbs in URLs: `/api/intake` (POST), not `/api/submit-intake`
- Query params for filtering: `/api/leads?status=new&tenant=erie-pro`

### R2: Input Validation
Every mutation endpoint must validate before processing:
- **Email:** Regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` -- return 400 on mismatch
- **Phone:** Strip non-digits, assert exactly 10 digits -- return 400 on mismatch
- **Required fields:** Check each with `?.trim()`, return 400 listing missing fields
All validation errors use the standard envelope: `{ success: false, data: null, error: 'description' }`

### R3: Standard Response Envelope
Every API response must use this format:
```typescript
type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};
```
- Success: `{ success: true, data: { id: '123' }, error: null }` with 200/201
- Client error: `{ success: false, data: null, error: 'Description' }` with 400/401/403/404
- Server error: `{ success: false, data: null, error: 'Internal server error' }` with 500

Never return plain strings, bare arrays, or non-envelope JSON.

### R4: HTTP Status Codes
| Code | When to Use |
|------|-------------|
| 200 | Successful GET, PATCH, DELETE |
| 201 | Successful POST that created a resource |
| 400 | Validation failure, malformed input |
| 401 | Missing or invalid auth token |
| 403 | Valid token but insufficient permissions |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Unhandled server error (always wrap in try/catch) |

### R5: Auth Middleware Integration
Protected routes must check auth before any processing:
- Read the auth token from the request headers or cookies
- Validate the token and extract tenant context
- Return 401 immediately if token is missing or invalid
- Return 403 if the token is valid but the user lacks permission for this resource
- Public routes must be listed in the PUBLIC_EXACT whitelist in middleware.ts

### R6: Dry-Run Mode
Mutation endpoints should accept `?dry_run=true` query param. When set, validate all inputs and return the would-be payload in `data.would_create` without persisting. Useful for form previews and integration testing.

## Edge Cases

- **Empty body on POST** -- Must return 400 with clear message, not crash with "cannot read property of undefined".
- **Extra fields in body** -- Strip unknown fields before processing. Never pass raw body to database queries.
- **Content-Type mismatch** -- If endpoint expects JSON but receives form-data, return 400 with "Expected application/json".
- **Large payloads** -- Set a body size limit (e.g., 1MB). Return 413 if exceeded.
- **Concurrent mutations** -- Two simultaneous POSTs to the same resource should not produce duplicate records. Use idempotency keys or upsert patterns.
- **Error message leakage** -- Never expose stack traces, database errors, or internal paths in the error field. Log internally, return a generic message to the client.
- **Rate limit response** -- 429 must include `Retry-After` header with seconds until the limit resets.

## Output Format

```
## API Design Review Report

**Routes audited:** [count]
**Compliant:** [count] | **Issues:** [count]

### Route Inventory
| Route | Method | Auth | Dry-Run | Envelope | Status |
|-------|--------|------|---------|----------|--------|
| /api/health | GET | Public | N/A | OK | PASS |
| /api/intake | POST | Public | Yes | OK | PASS |

### Issues
| # | Rule | Route | Description | Fix |
|---|------|-------|-------------|-----|
| 1 | R2 | /api/intake | No phone validation | Add 10-digit check |
| 2 | R3 | /api/webhook | Returns plain string | Wrap in envelope |
```
