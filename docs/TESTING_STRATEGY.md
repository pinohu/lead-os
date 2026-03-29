# Testing Strategy

## Test Pyramid

```
        /  E2E  \          10% — Critical user flows
       / Integr. \         20% — API routes, DB queries
      /   Unit    \        70% — Pure functions, algorithms
```

## Unit Tests (70%)

**What to test:**
- Scoring algorithms (computeCompositeScore, temperature classification)
- Data transformations (lead normalization, niche config generation)
- Validation schemas (Zod schemas for intake, billing, etc.)
- Utility functions (LRU cache, logger, email template rendering)
- Business logic (plan enforcement, pricing calculations, deduplication)

**How to test:**
- Use Node.js native test runner (`node:test`) with `tsx` for TypeScript support
- One test file per source file, mirroring directory structure
- Descriptive test names: `should reject expired session token`
- No mocking needed for pure functions

**Run:** `npm test`

## Integration Tests (20%)

**What to test:**
- API route handlers (import GET/POST directly, call with Request objects)
- Database operations (use test database or in-memory fallback)
- Integration adapters (verify dry-run mode produces expected mock data)
- Middleware behavior (auth, rate limiting, CORS)

**How to test:**
- Create Request objects using test utilities (`createMockRequest`)
- Call route handler functions directly
- Assert on Response status, headers, and JSON body
- Use in-memory storage (no external dependencies)

**Run:** `npm run test:ci`

## End-to-End Tests (10%)

**What to test:**
- Homepage loads and renders correctly
- Health endpoint returns healthy
- Dashboard loads in demo mode
- Onboarding wizard progression
- Lead intake → scoring → dashboard display flow

**How to test:**
- Playwright with Chromium
- Start dev server automatically via `webServer` config
- Screenshot on failure for debugging
- HTML reporter for CI artifacts

**Run:** `npm run test:e2e`

## Test Naming Convention

```typescript
describe("computeCompositeScore", () => {
  it("should return Cold temperature for scores 0-34", () => { ... });
  it("should apply niche-specific weight biases", () => { ... });
  it("should handle missing optional fields gracefully", () => { ... });
});
```

## Mocking Strategy

- **Mock at boundaries:** Database calls, external HTTP requests, file system
- **Use dry-run mode:** All 110+ integrations return realistic mock data without API keys
- **Prefer fakes:** In-memory Map stores over mock objects
- **Never mock the unit under test**

## Coverage Targets

| Metric | Target |
|--------|--------|
| Line coverage (new code) | 80% |
| Branch coverage (new code) | 75% |
| Overall line coverage | 60% (increasing) |

## Running Tests

```bash
# Unit tests
npm test

# CI mode (spec reporter)
npm run test:ci

# E2E tests (requires Playwright)
npm run test:e2e

# Type checking
npx tsc --noEmit

# Full verification
npm run build && npm test
```

## Adding Tests for New Features

1. Write the test first (or alongside the implementation)
2. Test behavior, not implementation details
3. Include edge cases: empty input, maximum values, invalid types
4. Run the full suite before committing
5. If a test is flaky, fix immediately or quarantine with a tracking issue
