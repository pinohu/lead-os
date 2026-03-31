# Audit-Fix-Optimize Cycle

Run a comprehensive audit-fix-optimize cycle on the LeadOS monorepo. This is the standard quality assurance workflow.

## The Cycle

### Step 1: Build All 3 Codebases (parallel)
```bash
cd erie-pro && npm run build
cd lead-os-hosted-runtime-wt-hybrid && npm run build
cd neatcircle-beta && npm run build
```
All three must produce 0 errors. Report page counts.

### Step 2: Run Test Suite
```bash
cd lead-os-hosted-runtime-wt-hybrid && npm test
```
Must show 4,151+ tests, 0 failures.

### Step 3: Live Site Health Check
```bash
curl https://lead-os-nine.vercel.app/api/health  # Must return {"status":"ok"}
curl -so /dev/null -w "%{http_code}" https://erie-pro.vercel.app/  # Must be 200
curl -so /dev/null -w "%{http_code}" https://www.neatcircle.com/  # Must be 200
```

### Step 4: Endpoint Verification
```bash
# Kernel
POST /api/capture with {"email":"test@test.com"} → success: true
# Erie-pro
POST /api/lead with {"name":"Test","email":"t@t.com","niche":"plumbing"} → success: true
POST /api/contact with {"email":"t@t.com","message":"test"} → success: true
POST /api/claim with full provider data → success: true
```

### Step 5: Git Status Check
- If uncommitted changes exist → commit with descriptive message + push
- If clean → report "no action needed"

### Step 6: Deploy If Needed
- Kernel: `npx vercel --prod --yes` from repo root (root directory set via API)
- Erie-pro: auto-deploys from git, or `npx vercel --prod --yes` from erie-pro/
- After deploy, wait 10s then re-verify endpoints

## Fixing Issues
When a build fails:
1. Read the error output carefully
2. Identify the failing file and line
3. Fix the root cause (don't just suppress the error)
4. Rebuild to verify
5. Run tests to check for regressions
6. Commit with descriptive message explaining what was fixed and why

## Expected Results
- erie-pro: 630 pages, 0 errors
- hybrid runtime: 539 pages, 0 errors, 4,151 tests pass
- neatcircle: 152 pages, 0 errors
- Total: 1,321 pages across 3 sites
