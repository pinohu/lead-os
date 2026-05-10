# ConvertBox Webhook Payload Spec

This spec defines how Erie.Pro ConvertBox submissions should enter LeadOS or the Erie.Pro lead intake pipeline. It intentionally avoids account credentials and only documents field names, routing, and validation expectations.

## Destination

Preferred destination:

- Erie.Pro inbound lead endpoint, if available in the deployed app.
- LeadOS intake endpoint, if Erie.Pro forwards leads to LeadOS.
- Email fallback only during testing, not as the final operating path.

## Required Payload Fields

Every ConvertBox lead should include:

```json
{
  "source": "convertbox",
  "site": "erie-pro",
  "box_name": "EP-03 Service - Fast Quote - v1",
  "campaign_group": "Erie.Pro - Core",
  "service_label": "Plumbing",
  "service_slug": "plumbing",
  "service_family": "Emergency Home Response",
  "page_url": "https://erie.pro/services/plumbing/pricing",
  "page_path": "/services/plumbing/pricing",
  "page_type": "pricing",
  "intent": "fast_quote",
  "urgency": "urgent",
  "timeline": "today",
  "first_name": "Example",
  "phone": "555-555-5555",
  "email": "person@example.com",
  "zip": "16501",
  "description": "Short visitor-provided request",
  "sms_consent": true,
  "form_version": "v1"
}
```

## Optional Attribution Fields

Add these when available:

```json
{
  "utm_source": "",
  "utm_medium": "",
  "utm_campaign": "",
  "utm_content": "",
  "utm_term": "",
  "referrer": "",
  "device_type": "",
  "returning_visitor": false
}
```

## Validation

Reject or quarantine submissions when:

- `source` is not `convertbox`.
- `site` is not `erie-pro`.
- `phone` and `email` are both missing.
- `page_url` is missing.
- `service_slug` is missing for service-specific boxes.

Accept as nurture, not urgent, when:

- The submission only includes email.
- The box is `EP-07 Research - Checklist Capture - v1`.
- The timeline is later than 30 days.

Mark as high priority when:

- `urgency` is `emergency` or `urgent`.
- `timeline` is `now`, `today`, or `this_week`.
- The box is `EP-02 Emergency - Callback Request - v1`.
- The page type is `emergency`, `pricing`, `provider`, or `compare`.

## Dedupe

Within a 24-hour window, treat submissions as potential duplicates when the same visitor submits:

- same phone and same service slug
- same email and same service slug
- same page URL and same phone

When duplicates happen, keep the newest description and preserve the original first-touch attribution.

## Privacy and UX Notes

- Do not request sensitive medical, legal, or financial details inside ConvertBox.
- For health and counseling categories, ask only for appointment intent and preferred contact details.
- For funeral homes, estate sales, and senior care, use calm copy and avoid urgency tactics unless the visitor explicitly indicates a time-sensitive need.
- Store SMS consent as a separate field.
