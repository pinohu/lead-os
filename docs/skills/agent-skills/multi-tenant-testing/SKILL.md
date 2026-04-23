---
name: multi-tenant-testing
description: Run and maintain the 4151-test suite across 70 suites using Node.js native test runner, with 10-subtest multi-tenant stress test verifying tenant isolation, scoring independence, rate limiter separation, and concurrent intake safety
---

# Multi-Tenant Testing

**Tier:** METHODOLOGY (Tier 2 -- Patterns & Standards)
**Category:** Testing Strategy
**Domain:** Node.js native test runner, tenant isolation, concurrency safety, test suite maintenance

## Overview

This skill governs the testing methodology for LeadOS's multi-tenant architecture. The platform serves multiple tenants (erie-pro, kernel, neatcircle) from shared infrastructure, so testing must prove that tenant data never leaks, scoring engines operate independently, rate limiters do not cross-contaminate, and concurrent intake submissions from different tenants remain isolated. The 4151-test suite uses Node.js native `node:test` with `node:assert` -- no Jest, no Mocha.

## Core Capabilities

- Run the full 4151-test suite across 70 suites in all three codebases
- Execute the 10-subtest multi-tenant stress test covering isolation boundaries
- Write new tests using Node.js native test runner patterns (describe/it/assert)
- Verify tenant isolation: data, config, scoring, and rate limiting
- Test concurrent intake submissions across tenants
- Maintain test counts and detect regressions in suite size

## When to Use

Trigger this skill when:
- "run tests", "test suite", "how many tests pass?"
- Adding a new tenant or modifying tenant configuration
- Changing scoring logic, rate limiter config, or intake processing
- "is tenant data isolated?", "can tenants see each other's data?"
- Before any deployment (audit-fix-optimize invokes this)
- After modifying middleware or auth logic that gates tenant access

## Methodology

### Test Runner Convention
All tests use Node.js native test runner. Never introduce Jest or Vitest:
```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('TenantScoring', () => {
  it('should score tenant A independently of tenant B', () => {
    // test body
    assert.strictEqual(scoreA, expectedA);
  });
});
```

### Running the Full Suite
```bash
cd erie-pro && npm test          # ~2100 tests
cd ../lead-os-runtime && npm test  # ~1500 tests
cd ../neatcircle && npm test     # ~551 tests
```
Total expected: ~4151. If count drops, a test was deleted or skipped -- investigate immediately.

### The 10-Subtest Multi-Tenant Stress Test
This is the critical isolation test. It runs 10 subtests in sequence:
1. **Tenant config isolation** -- Tenant A config changes do not affect Tenant B
2. **Data partition** -- Queries scoped to Tenant A return zero Tenant B records
3. **Scoring independence** -- Scoring Tenant A leads does not alter Tenant B scores
4. **Rate limiter separation** -- Exhausting Tenant A rate limit does not block Tenant B
5. **Concurrent intake (2 tenants)** -- Simultaneous submissions from A and B both succeed
6. **Concurrent intake (3 tenants)** -- Add Tenant C, all three succeed concurrently
7. **Auth token scope** -- Tenant A token cannot access Tenant B endpoints
8. **Middleware tenant extraction** -- Subdomain correctly maps to tenant context
9. **Error isolation** -- Tenant A throwing an error does not crash Tenant B request
10. **Cleanup verification** -- After test, no cross-tenant data residue exists

### Writing New Tests
When adding a test:
1. Place it in the correct suite file (group by feature, not by tenant)
2. Use `describe` for the feature, `it` for each case
3. Use `assert.strictEqual`, `assert.deepStrictEqual`, `assert.throws` -- never loose equality
4. Add both positive and negative cases
5. Update the expected test count in documentation

### Test Data Strategy
- Use deterministic test data, never random. Seed values like `tenant-a-test-001`
- Clean up test data after each suite using `after()` hooks
- Never rely on external services -- mock all HTTP calls

## Edge Cases

- **Test count regression** -- If total drops below 4151, a suite was removed or tests were `.skip`-ed. Grep for `.skip` and `.todo` across all test files.
- **Flaky concurrent tests** -- If concurrent intake tests fail intermittently, check for shared mutable state. Each tenant context must be fully independent.
- **Node.js version mismatch** -- Native test runner behavior varies between Node 18 and 20. Pin the version in `.nvmrc` and CI config.
- **Timeout on stress tests** -- The 10-subtest stress test may take 5-10 seconds. Set `{ timeout: 30000 }` on the parent describe block.
- **Import path errors in monorepo** -- Tests must use relative imports from within their codebase, never cross-codebase imports.
- **Rate limiter state persistence** -- If rate limiter uses in-memory store, tests may leak state between runs. Reset the store in `beforeEach`.

## Output Format

```
## Multi-Tenant Test Report

| Codebase | Suites | Tests | Pass | Fail | Skip | Duration |
|----------|--------|-------|------|------|------|----------|
| erie-pro | 30 | 2100 | 2100 | 0 | 0 | 12.4s |
| kernel | 25 | 1500 | 1500 | 0 | 0 | 8.7s |
| neatcircle | 15 | 551 | 551 | 0 | 0 | 3.1s |
| **Total** | **70** | **4151** | **4151** | **0** | **0** | **24.2s** |

### Multi-Tenant Stress Test (10 subtests)
| # | Subtest | Status |
|---|---------|--------|
| 1 | Tenant config isolation | PASS |
| 2 | Data partition | PASS |
| ... | ... | ... |
| 10 | Cleanup verification | PASS |

### Issues
- [any failures, flaky tests, or count regressions]
```
