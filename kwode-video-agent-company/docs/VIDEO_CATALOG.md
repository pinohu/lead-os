# Video Catalog

The video catalog is the menu of things the factory can produce. It lives
in two files:

| File | Purpose |
|---|---|
| `packages/video-catalog/catalog/master-types.yaml` | 50 master video types (universal) |
| `packages/video-catalog/catalog/niche-overrides.yaml` | Niche-specific extensions / forbiddens / hooks |

## Schema

```yaml
- video_type_id: string                # stable id used by API + database
  category: string                     # e.g. social, faith, healthcare
  title: string
  description: string
  target_audience: string
  funnel_stage: TOFU | MOFU | BOFU | N/A
  recommended_duration: number          # seconds
  recommended_aspect_ratios: [string]
  required_inputs: [string]
  optional_inputs: [string]
  ideal_tools: [tool_id]                # references tool-registry/registry/tools.yaml
  agent_chain: [agent_id]               # references agents/definitions/agents.yaml
  qa_requirements: [string]             # subset of QA_CATEGORIES
  monetization_path: [plan_name]        # references billing/src/plans.ts
```

## Master categories

The 50 master types cover:

1. Business introduction
2. Service explainer
3. Product explainer
4. Local service provider
5. Directory listing
6. Social short-form vertical
7. Video ads
8. Landing page
9. Sales funnel
10. Personalized outreach
11. Testimonial / review
12. Case study
13. Before / after
14. FAQ
15. How-to
16. Educational
17. Training module
18. Onboarding
19. SOP / process
20. Customer support
21. Internal operations
22. Recruitment
23. Investor pitch
24. Grant proposal
25. Real estate listing
26. Airbnb / hospitality
27. Church / ministry
28. Children's story
29. Faith / inspirational
30. Healthcare education
31. Manufacturing training
32. Academic course
33. Authority site
34. SEO content
35. Blog-to-video
36. Podcast-to-video
37. Webinar repurposing
38. Event recap
39. Personalized celebration
40. AI avatar / talking head
41. Faceless
42. Animated story
43. Cinematic narrative
44. Data / report explanation
45. Local SEO
46. GBP post
47. Email nurture
48. Client portal
49. Membership / community
50. E-commerce product

## Niche overrides

Niches in `niche-overrides.yaml` reference a subset of master types
plus extra constraints:

```yaml
plumbing:
  extends_types: [business-intro, service-explainer, local-service-provider, gbp-post, video-ad]
  pinned_hooks:
    - "Small leaks. Big bills."
  forbidden_phrases: ["guaranteed cheapest"]
  recommended_durations_sec: [30, 45, 60]
```

Covered niches:

- plumbing, hvac, roofing, pest-control, landscaping, cleaning
- real-estate-agent, med-spa, dental, auto-repair
- legal-immigration, home-care-senior-care
- church-ministry, childrens-education
- healthcare-education, nursing-education
- manufacturing-training, industrial-engineering
- saas-software, affiliate-authority, ecommerce-product
- government-contracting, investor-pitch

## API

```
GET /api/video-types                # list all 50 master types
GET /api/video-types?niche=plumbing # list types pinned for a niche
GET /api/video-types/:id            # full schema for one type
```
