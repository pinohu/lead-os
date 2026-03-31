# UX & Accessibility Standards

## WCAG AA Compliance Checklist
Every page must meet these standards:

### Color Contrast
- Body text on background: minimum 4.5:1 ratio
- `--text-soft` / `--muted-foreground`: minimum 35% lightness (8:1 on white)
- Never use opacity below 0.6 on text
- Test with: contrast ratio calculator

### Focus States
All interactive elements need visible focus:
```css
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

### Semantic HTML
- `<header role="banner">` for site header
- `<main id="main-content">` for primary content
- `<footer role="contentinfo">` for footer
- `<nav aria-label="Primary navigation">` for nav
- `<section aria-label="descriptive name">` for content sections

### Skip Link
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to content</a>
```

### Form Accessibility
- Every `<input>` has a `<Label htmlFor="id">` or `aria-label`
- Every form has `action` and `method` attributes
- Submit buttons have clear text (not just icons)
- Error messages are associated with inputs via `aria-describedby`

### Images
- All `<img>` have `alt` text
- Decorative images have `alt=""`
- Lucide icons used instead of images where possible (no alt needed)

## UX Standards

### Forms Must Lead Somewhere
- Every form submits to a real API endpoint
- Every button has an `href` or `onClick` — NO dead buttons
- Blog "Read Article" → links to niche services (not dead end)
- Guides "Read Full Guide" → links to quote form (not dead end)

### No Placeholder Content Visible to Users
- Never show "sample reviews" disclaimers
- Never show `(814) 555-XXXX` placeholder phone numbers
- Provider URLs must point to internal pages, not non-existent external domains
- Price ranges should be specific enough to be useful ($150-$350, not $50-$5,000)

### Emergency Pages
- Must have prominent call-to-action (phone or directory link)
- Must be niche-specific (frozen pipes for plumbing, not generic)
- Response time messaging should be aggressive, not hedged

### Admin Pages
- Must be protected (env var check, auth middleware, or both)
- Must have `robots: { index: false, follow: false }` metadata
- Never expose revenue, lead, or provider performance data publicly

### Content Quality Rules
- No boilerplate text used on wrong niche categories
- "Lake-effect climate and older housing stock" ONLY for home services
- Every meta description MUST be unique per page
- About page MUST have human identity (founders, story, location)
- Breadcrumbs on all niche pages
