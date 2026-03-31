---
name: shadcn-theme-system
description: Apply the LeadOS shadcn/ui design system with HSL color tokens, CVA component variants, Tailwind utility classes, and WCAG AA contrast requirements across marketing pages while preserving legacy dashboard CSS
---

# shadcn Theme System

**Tier:** METHODOLOGY (Tier 2)
**Category:** Design System & UI
**Domain:** Component styling, theming, accessibility, CSS architecture

## When to Use

Trigger this skill when:
- Creating or modifying marketing page components
- Fixing color, contrast, or styling inconsistencies
- Adding new component variants to the design system
- Resolving conflicts between shadcn and legacy dashboard CSS
- Auditing WCAG AA compliance on any page

## HSL Color Token Reference

All colors use HSL format in CSS custom properties. Never use raw hex or RGB in components.

```css
/* Primary -- Indigo identity */
--primary: 243 75% 59%;
--primary-foreground: 0 0% 100%;

/* Secondary -- Muted complement */
--secondary: 240 5% 96%;
--secondary-foreground: 240 6% 10%;

/* Accent -- Warm highlight */
--accent: 240 5% 96%;
--accent-foreground: 240 6% 10%;

/* Destructive -- Error/danger */
--destructive: 0 84% 60%;
--destructive-foreground: 0 0% 100%;

/* Surfaces */
--background: 0 0% 100%;
--foreground: 240 10% 4%;
--card: 0 0% 100%;
--card-foreground: 240 10% 4%;
--muted: 240 5% 96%;
--muted-foreground: 240 4% 46%;

/* Borders and rings */
--border: 240 6% 90%;
--input: 240 6% 90%;
--ring: 243 75% 59%;

/* Radius scale */
--radius: 0.5rem;
```

## Component Patterns

### Button -- 6 variants via CVA
- `default` -- primary bg, white text
- `destructive` -- red bg, white text
- `outline` -- border only, transparent bg
- `secondary` -- muted bg, dark text
- `ghost` -- no bg, hover reveals muted
- `link` -- underline, primary color, no bg

Sizes: `sm` (h-9 px-3), `default` (h-10 px-4 py-2), `lg` (h-11 px-8), `icon` (h-10 w-10)

### Card -- Composite pattern
Always compose with: `Card > CardHeader > CardTitle + CardDescription > CardContent > CardFooter`
Never skip `CardHeader` even for simple cards. The semantic structure drives accessibility.

### Badge -- 5 variants
- `default`, `secondary`, `destructive`, `outline`, `success`
- Success variant is a LeadOS addition (not upstream shadcn): `bg-emerald-100 text-emerald-800`

### Form inputs
Use `Input`, `Select`, `Textarea` from shadcn. All require a `Label` component. Wrap in `FormField > FormItem > FormLabel + FormControl + FormMessage` when inside react-hook-form.

## Dual-CSS Coexistence Rule

The kernel codebase runs BOTH styling systems simultaneously:
- **shadcn/Tailwind** -- All marketing pages, public-facing UI, new components
- **Legacy CSS modules** -- Dashboard, admin panels, internal tools

**Rules:**
1. Never import legacy `.module.css` files into shadcn-styled pages
2. Never apply Tailwind utility classes inside legacy dashboard components
3. The `globals.css` file contains BOTH systems -- edit with extreme care
4. When modifying `globals.css`, test both marketing AND dashboard pages

## WCAG AA Contrast Requirements

Minimum contrast ratios (enforced, not aspirational):
- **Normal text** (< 18px): 4.5:1 against background
- **Large text** (>= 18px bold or >= 24px): 3:1 against background
- **UI components** (buttons, inputs, icons): 3:1 against adjacent colors

Common violations to watch for:
- `muted-foreground` on `background` is 4.6:1 -- passes AA but barely. Do not lighten further.
- `primary` on `background` is 4.8:1 -- passes. Do not reduce saturation.
- White text on `primary` bg is 5.2:1 -- passes. This is the safest combination.

## Edge Cases

- **Never apply `border-border` to the `*` selector globally.** This breaks legacy dashboard form inputs, table borders, and third-party widget styling. Apply `border-border` only to specific shadcn components.
- **Dark mode tokens exist but are not active.** The `.dark` class variant is defined in globals.css but not toggled. Do not remove dark mode tokens -- they are planned for Phase 2.
- **cn() utility is mandatory.** Always merge classes with `cn()` from `lib/utils`, never concatenate strings: `cn("base-class", conditional && "extra-class")`.
- **Inter font stack.** The design system uses Inter as primary, with `font-sans` Tailwind class. Verify Inter loads in `layout.tsx` before assuming it renders.

## Workflow

1. Identify whether the target component is marketing (shadcn) or dashboard (legacy)
2. For marketing: use HSL tokens via Tailwind classes (`bg-primary`, `text-muted-foreground`)
3. For new variants: extend CVA config in the component file, not in globals.css
4. Run contrast check on any new color combinations
5. Test the page with both light background and card surfaces
6. Verify no legacy dashboard pages broke by checking `/dashboard` route

## Output Format

When reporting theme changes:
1. List components modified with old vs. new token values
2. Report WCAG AA contrast ratios for any new color pairings
3. Confirm dual-CSS coexistence -- no cross-contamination
4. Screenshot or describe visual result on both marketing and dashboard pages
