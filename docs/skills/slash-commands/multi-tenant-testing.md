# Multi-Tenant Testing Strategy

The kernel includes a comprehensive multi-tenant stress test at:
`lead-os-hosted-runtime-wt-hybrid/tests/multi-tenant-stress.test.ts`

## Test Suite Overview
- **4,151 tests** across 70 suites, 333 test files
- Run with: `npm test` (uses Node.js built-in test runner)
- Average runtime: 12-14 seconds
- Test command: `node --test --test-concurrency=1 --experimental-test-isolation=none --experimental-strip-types tests/**/*.test.ts`

## Multi-Tenant Stress Test (10 subtests)
1. **Runtime store isolation**: 50 tenants × 5 leads, verify key isolation
2. **Scoring isolation**: Same signals, different niche configs → different scores
3. **Intelligence isolation**: Niche-specific buying triggers consistent per tenant
4. **Nurture sequence isolation**: 7-email sequences scoped by niche
5. **Experience profile isolation**: Different intents → different hero/mode/family
6. **Audit log isolation**: Events scoped to tenant, no cross-tenant leakage
7. **Rate limiter independence**: One tenant's rate limit doesn't affect another
8. **Concurrent intake processing**: 50 parallel intakes, no data corruption
9. **Dynamic intelligence**: 50 unique niche keywords → unique profiles
10. **Joy milestone isolation**: Different metrics → different milestones per tenant

## Key Test Patterns
```typescript
// Tenant isolation pattern
for (let t = 0; t < TENANT_COUNT; t++) {
  const tenantId = generateTenantId(t);
  // ... operate on tenant data
  // Verify: other tenant's data is NOT accessible
  const otherTenantId = generateTenantId((t + 1) % TENANT_COUNT);
  assert.ok(!otherKeys.includes(key));
}
```

## Common Test Fixes
- `StoredLeadRecord` changes → update test field names to match interface
- `TenantMetrics` expands → add new required fields to test fixtures
- `classifyLeadTemperature` returns "burning" not "fire" → update assertions
- `clearCache()` must be called before dynamic intelligence tests
- Test uses `metadata.tenantId` for tenant scoping (not a top-level field)

## Running Tests After Changes
Always run full suite after any lib/ change:
```bash
cd lead-os-hosted-runtime-wt-hybrid && npm test
```
If a test fails, read the assertion message — it usually says exactly what changed.
