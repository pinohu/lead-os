# erie.pro — Distributed Local Lead Monopoly System

A geographic territory platform for local lead acquisition and exclusive provider routing. Part of the LeadOS ecosystem.

## Live

- **Site**: https://erie-pro.vercel.app
- **Kernel**: https://lead-os-nine.vercel.app (LeadOS backend)
- **Marketing**: https://www.neatcircle.com (NeatCircle edge layer)

## Architecture

```
erie.pro                    → City authority hub (198 pages)
plumbing.erie.pro           → Niche authority site (16 page types)
plumbing.erie.pro/pete      → Provider mini-website
lead-os-nine.vercel.app     → LeadOS kernel (scoring, nurture, marketplace)
```

### 5-Layer System

| Layer | Component | Status |
|-------|-----------|--------|
| Layer 1: National Authority | 24 authority sites, backlink distribution | Built |
| Layer 2: City Hub | erie.pro homepage, services, areas, about, contact | Built |
| Layer 3: Niche Authority | 16 page types × 24 niches = 384+ content pages | Built |
| Layer 4: Lead Engine | Routing (SLA + failover), scoring, notifications, call tracking | Built |
| Layer 5: Providers | Mini-websites, 3-tier premium system, Stripe checkout | Built |

## Tech Stack

- **Framework**: Next.js 15 (App Router, SSG)
- **UI**: 52 shadcn/ui components + Tailwind CSS 3
- **Icons**: Lucide React
- **Fonts**: Inter (Google Fonts)
- **Design**: HSL color tokens with dark mode
- **Deployment**: Vercel

## Page Types per Niche (16)

| Page | Route | Purpose |
|------|-------|---------|
| Main | `/plumbing` | Consumer quote form |
| Blog | `/plumbing/blog` | 10+ article topics |
| Guides | `/plumbing/guides` | 5 comprehensive guides |
| FAQ | `/plumbing/faq` | 6+ questions (Accordion) |
| Pricing | `/plumbing/pricing` | Quick price reference |
| Costs | `/plumbing/costs` | Detailed cost breakdown |
| Compare | `/plumbing/compare` | Provider comparison guide |
| Emergency | `/plumbing/emergency` | Emergency services |
| Glossary | `/plumbing/glossary` | 15+ industry terms |
| Seasonal | `/plumbing/seasonal` | 4-season maintenance (Tabs) |
| Checklist | `/plumbing/checklist` | Interactive hiring checklist |
| Directory | `/plumbing/directory` | Provider directory |
| Reviews | `/plumbing/reviews` | Review hub |
| Tips | `/plumbing/tips` | Quick actionable tips |
| Certifications | `/plumbing/certifications` | What certs matter |
| Provider | `/plumbing/[provider]` | Full business presence |

## 24 Niches

Plumbing ($700) · HVAC ($800) · Electrical ($700) · Roofing ($900) · Landscaping ($450) · Dental ($1,200) · Legal ($1,500) · Cleaning ($350) · Auto Repair ($500) · Pest Control ($400) · Painting ($450) · Real Estate ($1,000) · Garage Door ($450) · Fencing ($400) · Flooring ($600) · Windows & Doors ($600) · Moving ($350) · Tree Service ($500) · Appliance Repair ($350) · Foundation ($800) · Home Security ($600) · Concrete ($500) · Septic ($500) · Chimney ($400)

## 3-Tier Premium System

| Tier | Multiplier | Key Benefits |
|------|-----------|-------------|
| Standard | 1.0x | Exclusive leads, landing page, scoring, nurture |
| Premium | 1.5x | + Featured badge, national listing, reviews, GBP, 2 social/mo |
| Elite | 2.5x | + Branded content, competitor intel, 4 social/mo, dedicated mgr |

## Key Systems

- **Lead Routing**: Primary → 90s SLA → Backup → Overflow
- **Perk Manager**: Auto-toggle all perks on subscription change
- **Local SEO**: 15 neighborhoods, 11 zips, climate data, PA regulations
- **Internal Linking**: 1,200+ cross-niche connections
- **Subdomain Routing**: Middleware for niche.erie.pro → /niche
- **City Factory**: 7 city templates ready to deploy

## Development

```bash
cd erie-pro
npm install
npm run dev    # http://localhost:3002
npm run build  # 198 SSG pages
```

## Deployment

```bash
npx vercel deploy --prod
```

## Strategy

See [STRATEGY.md](./STRATEGY.md) for the complete distributed lead monopoly system strategy.

## License

MIT
