# Vercel Deployment Strategy

## Three Projects on One Team

| Project | ID | Root Directory | Auto-Deploy |
|---------|-----|---------------|-------------|
| lead-os | prj_K6ls4j85woFkbgI5KhsHUtL1nMQ4 | lead-os-hosted-runtime-wt-hybrid | Yes (from git) |
| erie-pro | prj_ZrLsCE8EKeas6mpWaUSWPgFdcatp | (repo root — erie-pro IS the root) | Yes (from git) |
| neatcircle-beta | prj_N4ZiOoahdoThvrBRNoeghIm9J6mu | neatcircle-beta | Yes (from git) |

Team ID: `team_fuTLGjBMk3NAD32Bm5hA7wkr`

## Deploying the Kernel
The kernel's root directory was set via Vercel API:
```bash
curl -X PATCH "https://api.vercel.com/v9/projects/prj_K6ls4j85woFkbgI5KhsHUtL1nMQ4?teamId=team_fuTLGjBMk3NAD32Bm5hA7wkr" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rootDirectory":"lead-os-hosted-runtime-wt-hybrid"}'
```
Deploy from REPO ROOT (not subdirectory — that would double the path):
```bash
cd lead-os  # repo root
npx vercel --prod --yes
```

## Deploying Erie-Pro
```bash
cd erie-pro
npx vercel --prod --yes
```

## Auth Token Location
`C:\Users\VRLab\AppData\Roaming\com.vercel.cli\Data\auth.json`

## Post-Deploy Verification
Always wait 10-12 seconds after deploy, then:
```bash
curl -sI https://lead-os-nine.vercel.app/ | head -3  # Should be 200
curl -s https://lead-os-nine.vercel.app/api/health    # Should be {"status":"ok"}
curl -sI https://erie-pro.vercel.app/ | head -3       # Should be 200
```

## Common Issues
- **Kernel 404**: Root directory not set → fix via API PATCH
- **API routes 404**: `outputDirectory: ".next"` in vercel.json → REMOVE IT (Vercel's Next.js adapter handles this)
- **API capture 401**: Endpoint not in PUBLIC_EXACT set in middleware.ts → add it
- **Erie-pro stale deploy**: Git push triggers auto-deploy on lead-os project (wrong root) → manually deploy erie-pro
- **Double path error**: Deploying kernel from subdirectory when rootDirectory is already set → deploy from repo root instead
