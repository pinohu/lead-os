# Completeness Testing

Run a full completeness test to verify every URL across all 3 sites returns HTTP 200.

## Erie-Pro: 660 niche URLs + 12 static + 3 API = 675 tests
```bash
# All 44 niches × 15 page types
PASS=0; FAIL=0
for niche in plumbing hvac electrical roofing landscaping dental legal cleaning auto-repair pest-control painting real-estate garage-door fencing flooring windows-doors moving tree-service appliance-repair foundation home-security concrete septic chimney pool-spa locksmith towing carpet-cleaning pressure-washing drywall insulation solar gutters handyman veterinary chiropractic accounting photography pet-grooming snow-removal restoration glass irrigation demolition; do
  for page in "" /blog /guides /faq /pricing /costs /compare /emergency /glossary /seasonal /checklist /directory /reviews /tips /certifications; do
    code=$(curl -so /dev/null -w "%{http_code}" "https://erie-pro.vercel.app/$niche$page")
    if [ "$code" != "200" ]; then echo "FAIL $code /$niche$page"; FAIL=$((FAIL+1)); else PASS=$((PASS+1)); fi
  done
done
echo "Niche pages: $PASS pass, $FAIL fail"

# Static pages
for page in / /services /areas /about /contact /for-business /for-business/claim /privacy /terms /admin /sitemap.xml /robots.txt; do
  code=$(curl -so /dev/null -w "%{http_code}" "https://erie-pro.vercel.app$page")
  echo "$code $page"
done

# API endpoints
curl -s -X POST https://erie-pro.vercel.app/api/lead -H "Content-Type: application/json" -d '{"name":"Test","email":"t@t.com","niche":"plumbing"}'
curl -s -X POST https://erie-pro.vercel.app/api/contact -H "Content-Type: application/json" -d '{"email":"t@t.com","message":"test"}'
curl -s -X POST https://erie-pro.vercel.app/api/claim -H "Content-Type: application/json" -d '{"niche":"plumbing","providerName":"Test","providerEmail":"t@t.com","phone":"8145551234"}'
```

## Kernel: 19 pages + 2 API = 21 tests
```bash
for page in / /pricing /industries /marketplace /onboard /dashboard /dashboard/joy /for/agencies /for/saas-founders /help /changelog /roadmap /contact /privacy /terms /setup /demo /calculator /directory; do
  code=$(curl -so /dev/null -w "%{http_code}" "https://lead-os-nine.vercel.app$page")
  echo "$code $page"
done
curl -s https://lead-os-nine.vercel.app/api/health
curl -s -X POST https://lead-os-nine.vercel.app/api/capture -H "Content-Type: application/json" -d '{"email":"t@t.com"}'
```

## NeatCircle: 1 test
```bash
curl -so /dev/null -w "%{http_code}" https://www.neatcircle.com/
```

## Expected: 697 URLs, 697 pass, 0 fail
Last verified: March 31, 2026 at 100% pass rate.

## 10-Loop Stress Test
Run all endpoint checks 10 consecutive times to verify stability:
```bash
for i in $(seq 1 10); do
  echo "=== LOOP $i/10 ==="
  # 13 key endpoints per loop
  curl -s https://lead-os-nine.vercel.app/api/health | python3 -c "..."
  curl -s -X POST https://lead-os-nine.vercel.app/api/capture ...
  # ... (see audit-fix-optimize skill for full loop)
done
```
Last result: 130/130 checks passed across 10 consecutive loops.
