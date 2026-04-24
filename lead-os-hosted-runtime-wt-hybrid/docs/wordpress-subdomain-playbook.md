# WordPress Subdomain Playbook

## Recommended architecture

- Main marketing site on WordPress/shared hosting
- Lead OS Hosted Runtime on a dedicated subdomain app host
- Embed script or plugin injected into WordPress pages

## Suggested domain split

- `www.example.com` -> WordPress
- `leads.example.com` -> Lead OS Hosted Runtime

## WordPress integration modes

1. Site-wide widget
   - add the embed script to the footer
   - use the WordPress plugin from the embed repo

2. Specific CTA handoff
   - link buttons to:
     - `/assess/[slug]`
     - `/calculator`

3. Hybrid mode
   - embed chat/form widget on WordPress
   - host long-form funnels on the subdomain

---

## Documentation map

Public vs operator URLs for the kernel are summarized in [`PRODUCT-SURFACES.md`](./PRODUCT-SURFACES.md). Deployed runtimes expose a short hub at **`/docs`**.
