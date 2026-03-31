# Next.js Architecture Patterns (LeadOS)

## Static Generation Strategy
All erie-pro niche pages use `generateStaticParams()` to pre-render at build time:
```typescript
export async function generateStaticParams() {
  return getAllNicheSlugs().map((slug) => ({ niche: slug }));
}
```
Adding a niche to `niches.ts` automatically generates all 15 page types (main, blog, guides, faq, pricing, costs, compare, emergency, glossary, seasonal, checklist, directory, reviews, tips, certifications).

## Dynamic Metadata Pattern
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { niche: slug } = await params;
  const content = getNicheContent(slug);
  return {
    title: content?.metaTitle ?? `${slug} in Erie, PA`,
    description: content?.metaDescription ?? getLocalMetaDescription(slug),
  };
}
```
IMPORTANT: In Next.js 16, params are Promises — always `await params`.

## Middleware Architecture (Kernel)
`src/middleware.ts` handles:
- Auth on ALL /api/* routes (default deny)
- Public route whitelist via `PUBLIC_EXACT` Set and `PUBLIC_PREFIXES` array
- CORS preflight handling
- Rate limiting on /api/auth/* (10 req/min per IP)
- CSP headers on all responses
- Identity forwarding via x-authenticated-* headers
- Middleware signature verification

To make a new API route public, add it to `PUBLIC_EXACT` in middleware.ts.

## Subdomain Routing (Erie-Pro)
`src/middleware.ts` handles wildcard subdomains:
- `plumbing.erie.pro` → rewrites to `/plumbing`
- Dev mode: `?subdomain=plumbing` query param support
- Only validates against `VALID_NICHES` Set

## Form Handling Pattern
Forms submit to API routes via POST:
```tsx
<form action="/api/lead" method="POST">
  <input name="email" type="email" required />
  <input name="niche" type="hidden" value={slug} />
  <Button type="submit">Get Free Quote</Button>
</form>
```
API routes validate with regex, return JSON `{ success: true/false }`.

## CSS Architecture
- Erie-pro: Pure shadcn/Tailwind (globals.css has only HSL tokens + Tailwind directives)
- Kernel: Dual system — shadcn HSL tokens in `@layer base` + legacy custom vars in `:root`
- Dashboard pages use legacy CSS (.panel, .primary, .grid classes)
- Marketing pages use Tailwind + shadcn components
- NEVER use `* { @apply border-border }` globally — it breaks legacy CSS

## Security Headers (both apps)
Applied via next.config.ts:
- HSTS: 2 years, includeSubDomains, preload
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- CSP via middleware (kernel only)
