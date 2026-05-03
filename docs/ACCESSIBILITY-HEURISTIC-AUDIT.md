# Lead OS Accessibility And Heuristic Audit

This document captures the design guardrails applied after the May 2026 contrast and delivery audit. It uses Jakob Nielsen's 10 usability heuristics from Nielsen Norman Group as the review frame: https://www.nngroup.com/articles/ten-usability-heuristics/

## Non-Negotiable Interface Rules

- Text must be readable on its actual surface, including dark panels embedded in light pages.
- Primary actions must use semantic colors or dark 700-level Tailwind backgrounds when paired with white text.
- Disabled states must remain legible and use opacity 70 or stronger.
- Core buttons, links styled as buttons, inputs, selects, switches, calendar days, and modal close controls should present 44px-class targets where practical.
- Font sizes must come from stable type scales, not continuous viewport-based `clamp()` font sizing.
- Letter spacing must be normal or positive. Negative tracking is blocked.
- Links in content must be visibly link-like, with focus states and visited states.
- Motion, focus, and high-contrast modes must have explicit fallbacks.

## Nielsen Norman Heuristic Mapping

| Heuristic | Lead OS requirement | Code-level guardrail |
| --- | --- | --- |
| Visibility of system status | Loading, error, recovery, onboarding, payment, and completion states must be visible and plain. | `status-banner`, stronger danger/success tokens, onboarding recovery paths, post-deploy smoke checks. |
| Match with the real world | Copy should name buyer outcomes, work delivered, payment, account access, and recovery without internal-only phrasing. | Package pages keep first decisions concise; deeper doctrine is behind expandable sections. |
| User control and freedom | Users need Back, Start Over, Recover, Continue Without Stripe, dashboard exits, and modal close controls that are easy to find and operate. | Onboarding recovery actions, 44px close controls, stronger focus rings. |
| Consistency and standards | Reusable primitives must carry contrast, target size, disabled state, and focus behavior across the system. | Updated `Button`, `Input`, `Select`, `Textarea`, `Tabs`, `Calendar`, `Dialog`, `Sheet`, `Switch`, `Checkbox`, `RadioGroup`. |
| Error prevention | Risky states should be constrained before submission and configuration gaps should not strand users. | Environment detection, checkout fallback, session recovery, required-field constraints. |
| Recognition rather than recall | The interface should show current step, selected plan, selected market, integrations, and next action. | Onboarding progress, review summaries, package decision frame, visible helper text. |
| Flexibility and efficiency | New users need guided flows; experienced operators need direct package, dashboard, and launch paths. | Header routes, package launch actions, dashboard actions, scripts for audits and smoke checks. |
| Aesthetic and minimalist design | First-screen decisions should be short; dense strategy belongs in details sections. | Package doctrine moved below the first decision path and grouped into expandable themes. |
| Help users recover from errors | Error messages must describe the problem and provide a safe next step. | Recoverable onboarding messages for completed sessions, missing sessions, and Stripe setup gaps. |
| Help and documentation | Delivery teams need a durable checklist for what is checked and how to rerun it. | `npm run verify:a11y-static`, `npm run assess:local`, smoke scripts, this audit document. |

## Verification

Run these before shipping UI or delivery-package changes:

```bash
npm run verify:a11y-static
npm test
npm run build
```

The static accessibility audit scans the hosted runtime source for unsafe action color pairs, viewport-based font sizing, negative tracking, too-small action targets, disabled opacity regressions, and missing shared guardrails.
