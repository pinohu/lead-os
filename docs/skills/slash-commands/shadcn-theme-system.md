# shadcn/Tailwind Theme System

The LeadOS ecosystem uses a consistent shadcn/ui design system across erie-pro and the kernel.

## HSL Color Token System
All colors defined in `globals.css` using HSL without the `hsl()` wrapper:
```css
@layer base {
  :root {
    --primary: 243 75% 59%;        /* Indigo blue */
    --primary-foreground: 0 0% 100%;
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --muted: 240 5% 96%;
    --muted-foreground: 240 4% 35%; /* Improved contrast: was 46% */
    --border: 240 6% 90%;
    --ring: 243 75% 59%;
    --radius: 0.5rem;
    --success: 142 71% 45%;
    --destructive: 0 84% 60%;
  }
}
```

## Tailwind Config Pattern
```typescript
// tailwind.config.ts
colors: {
  primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
  // ... same pattern for all tokens
}
```

## Core Components (from erie-pro, ported to kernel)
- **Button**: 6 variants (default, destructive, outline, secondary, ghost, link) × 4 sizes
- **Card**: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **Badge**: 5 variants (default, secondary, destructive, outline, success)
- All use `cn()` utility (clsx + tailwind-merge) from `@/lib/cn.ts`
- All use class-variance-authority (CVA) for variant management

## Kernel Coexistence
The kernel has BOTH systems:
- **shadcn HSL tokens** (--primary, --background, --muted-foreground) in `@layer base`
- **Legacy custom vars** (--bg, --text, --accent, --surface) in regular `:root`
- They coexist because names don't collide
- Marketing pages use Tailwind classes; dashboard pages use legacy CSS
- The `@apply border-border` global rule was REMOVED to prevent dashboard interference

## Contrast Requirements (WCAG AA)
- `--text-soft` / `--muted-foreground`: minimum 35% lightness (8:1 ratio on white)
- Never use opacity below 0.6 on text over light backgrounds
- Focus rings: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`

## Adding New Components
1. Copy from erie-pro's `src/components/ui/`
2. Change import from `@/lib/utils` to `@/lib/cn` on the kernel
3. Install any missing Radix UI primitives
4. Test build — Tailwind purges unused classes automatically
