# Intake Widget — Manual QA Script

**Time required:** ~12 minutes
**Devices needed:** One phone (iPhone or Android) AND one desktop browser
**Frequency:** Run before any merge that touches `src/lib/intake/*`, `src/components/intake-*`, or `src/app/api/intake/*`. Run quarterly otherwise to catch drift.

This script verifies the intake widget end-to-end on real surfaces. The unit tests cover the business logic; this covers what humans actually see.

---

## Setup

1. Have ready: an inbox you can check (Gmail / iCloud / Outlook), and a phone you can receive SMS on.
2. Open the production URL on the device under test. For Erie: `https://erie.pro/plumbing`
3. Open a fresh incognito / private window. The A/B cookie is sticky for 30 days; incognito guarantees a clean variant assignment.
4. If you keep seeing the legacy form instead of the widget, force the variant via URL: append `?force_intake=1` is not implemented; instead, temporarily set `INTAKE_WIDGET_FORCE=intake` in Vercel env, redeploy, then revert.

---

## Test 1 — Happy path on mobile (~3 min)

The most-likely real-user flow. Run on the phone.

| Step | What you do | What should happen | ❌ Fail conditions |
|---|---|---|---|
| 1 | Open `https://erie.pro/plumbing` in incognito | Page loads in <3s. Widget appears above the fold or just below the hero. | Widget below page-2 fold; page takes >5s; widget not visible at all |
| 2 | Read the greeting | Starts with "Hi" — mentions plumbing — invites you to describe the problem | Generic copy; wrong niche; no greeting visible |
| 3 | Tap one of the suggestion chips (e.g. "Water leaking under the sink") | Chip text populates the input field | Tap does nothing; field stays empty |
| 4 | Tap Send | Within 4 seconds: assistant reply appears, conversation advances to "location" step | Spinner for >4s with no reply; error message; conversation stalls |
| 5 | Type your ZIP, tap Next | Acknowledgment + advance to "urgency" step | Stays on location step; throws error on valid 5-digit ZIP |
| 6 | Tap "Right now — water is running / shutoff failed" | Reply mentions "(814) 200-0328" concierge line if no claimed provider, OR provider name if claimed. Advance to "budget" step. | Reply omits expected-response time; no mention of pricing or timeline |
| 7 | Tap "$500 – $2,000" | Advances to "contact" step | Crash; step skips contact and goes to complete |
| 8 | Fill name, email, phone. Verify phone formats as `(XXX) XXX-XXXX` as you type | Phone auto-formats. Email validation triggers if you leave field with invalid value. | Phone not formatted; no email validation |
| 9 | Read the TCPA consent text — verify it mentions phone, SMS, email, opt-out via STOP, and erie.pro domain | Text is correct and complete | TCPA text missing, truncated, or wrong domain |
| 10 | Tap consent checkbox; tap Submit request | Success state shows within ~3s with provider name (if claimed) or concierge number (if unmatched). | Stuck on loading; submit fails; success state missing |
| 11 | Within 60s, check your email | Confirmation email received with your status token | No email; email arrives but TCPA log missing |

Note any deviations.

---

## Test 2 — Touch targets and readability on mobile (~2 min)

Specifically check that the widget is usable with thumbs.

- [ ] All buttons are at least 44×44 px tap targets (iOS HIG minimum). Test by tapping with the pad of your thumb, not the tip.
- [ ] No horizontal scroll on the page at any step.
- [ ] Suggestion chips wrap to multiple lines if needed — don't overflow.
- [ ] Long TCPA text wraps cleanly; doesn't push the submit button below the fold without scroll.
- [ ] Keyboard appears for text inputs (problem, ZIP, name, email, phone) and dismisses on Send/Next.
- [ ] Input zoom on iOS: tapping inputs should NOT zoom the viewport (font-size on inputs must be ≥16px).

---

## Test 3 — Edge cases (~3 min)

| Case | Action | Expected |
|---|---|---|
| Empty problem | Type 1-2 characters, hit Send | Send button stays disabled, OR error "please add more detail" |
| Wrong niche guess | On `/dental`, type "my toilet is leaking" | Widget acknowledges, may ask to confirm (candidate niches shown) or just route to plumbing. Should NOT route to dental. |
| Skip optional steps | At "location", tap "Skip — I'm in the Erie area" | Advances cleanly without ZIP |
| Skip budget | At "budget", tap "Skip — I'd rather not say" | Advances to contact |
| No phone given | Submit with only email | Should succeed. Routes via email only. |
| Bad email | Type "not-an-email", tab away | Inline error appears below field |
| Multi-tap submit | Tap submit twice rapidly | Only one Lead row created (idempotent) — verify in DB |
| Mid-conversation reload | Reload browser at urgency step | Conversation may restart from problem step. Should not crash. |

---

## Test 4 — Fallback to legacy form (~1 min)

Verify the kill switch works.

1. Get the A/B cookie reset (incognito or clear cookies).
2. In Vercel env, temporarily set `INTAKE_WIDGET_FORCE=form`. Redeploy or wait for next request (depending on caching).
3. Visit `https://erie.pro/plumbing` again.
4. Expect: legacy `LeadForm` with input fields (not chat bubbles).
5. Revert env var.

---

## Test 5 — Desktop spot-check (~2 min)

Run the happy path (Test 1) on desktop too. Specifically verify:

- [ ] Widget doesn't stretch to full viewport width on large screens — should be max ~600px.
- [ ] Hover states work on suggestion chips and buttons.
- [ ] Tab order is sensible (problem → send → next field).
- [ ] Browser zoom to 200% — layout doesn't break.

---

## Test 6 — Database sanity (~1 min)

After completing one full happy-path conversation:

```sql
-- Find your conversation
SELECT id, "currentStep", "outcomeStatus", "leadId", "createdAt"
FROM intake_conversations
ORDER BY "createdAt" DESC
LIMIT 5;

-- Verify the linked Lead has the urgency-derived fields
SELECT id, niche, temperature, "slaDeadline", source, "tcpaConsent", "tcpaConsentText"
FROM leads
WHERE id = '<paste leadId here>';
```

Pass if:
- `outcomeStatus = 'completed'`
- `currentStep = 'complete'`
- `leadId` is non-null on the conversation
- `temperature` matches the urgency you picked (`hot` for emergency, `warm` for this-week, `cold` for researching)
- `slaDeadline` is within the expected window (1h/24h/48h from now)
- `tcpaConsent = true` and `tcpaConsentText` populated

---

## What to do if something fails

1. Note the step number and what went wrong.
2. Check the Vercel logs for the request: `/api/intake/start`, `/api/intake/message`, or `/api/intake/complete`.
3. If the widget itself failed: check browser console for client-side errors.
4. If routing failed: check `routeLead` execution in logs.
5. File a bug with: device, browser, exact step, screenshot, request id from logs.
6. If it's a P0 (widget completely broken): set `INTAKE_WIDGET_FORCE=form` in Vercel env to fall everyone back to the legacy form, then debug.

---

## Sign-off

| Tester | Date | Variant tested | Pass/Fail | Notes |
|---|---|---|---|---|
| | | intake | | |
| | | form (Test 4 only) | | |

Keep these records in `docs/qa/intake-widget-runs/` for trend analysis.
