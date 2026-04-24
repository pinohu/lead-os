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
Must finish with **0 failing tests** in `lead-os-hosted-runtime-wt-hybrid` (`npm test`). Ignore any historical “N tests” figure in old docs.

### Step 3: Live Site Health Check
```bash
curl "https://YOUR_KERNEL_HOST/api/health"   # substitute production or staging URL
curl -so /dev/null -w "%{http_code}" "https://YOUR_ERIE_HOST/"   # optional: only if you operate this deploy
curl -so /dev/null -w "%{http_code}" "https://YOUR_NEATCIRCLE_HOST/"  # optional
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
- **erie-pro:** `npm run build` exits 0 — note the build’s own page count output if needed.
- **hybrid runtime:** `npm run build` exits 0; `npm test` exits 0.
- **neatcircle-beta:** `npm run build` (or Cloudflare preview pipeline) exits 0 per that package’s docs.
- Do **not** sum page counts across sites as a product metric unless you regenerate them from build logs on the same commit.
