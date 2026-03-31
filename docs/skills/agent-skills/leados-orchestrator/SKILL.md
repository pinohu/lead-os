---
name: leados-orchestrator
description: Analyze any LeadOS task request, identify which specialist skills to invoke, spawn sub-agents with the correct skill context, and coordinate their outputs into a unified result
---

# LeadOS Orchestrator

**Tier:** STANDARD (Tier 1 -- Organizational)
**Category:** Agent Coordination
**Domain:** Task routing, sub-agent spawning, result synthesis

## Overview

The orchestrator analyzes incoming requests against the LeadOS skill catalog and routes work to specialist agents. It is the default entry point for complex multi-step tasks that span multiple codebases or concern areas. When a request maps to a single skill, invoke it directly. When it spans multiple skills, spawn parallel sub-agents and merge their outputs.

## Core Capabilities

- Parse natural-language requests into actionable intents
- Match intents against the skill catalog using trigger phrases
- Spawn sub-agents scoped to a single skill each
- Run sub-agents in parallel when their work is independent
- Collect, deduplicate, and synthesize sub-agent outputs
- Retry failed sub-agents with adjusted parameters
- Escalate to the user only when ambiguity cannot be resolved

## Skill Catalog

| Skill | Triggers | Agent Type |
|-------|----------|------------|
| audit-fix-optimize | "run audit", "check builds", "test everything", "QA cycle" | general-purpose |
| erie-pro-niche-expansion | "add niche", "new service category", "expand to X" | general-purpose |
| deploy-pipeline | "deploy", "push to production", "site is down", "Vercel" | general-purpose |
| completeness-testing | "test all URLs", "check for 404s", "completeness" | general-purpose |
| user-simulation-testing | "test as user", "simulate homeowner", "provider journey" | general-purpose |
| code-review | "review this code", "check for issues", "PR review" | general-purpose |
| shadcn-theme-system | "fix styling", "theme issue", "component design" | Explore |
| nextjs-architecture | "routing issue", "middleware", "SSG problem" | Explore |
| local-seo-strategy | "SEO", "meta tags", "Schema.org", "sitemap" | Explore |

## When to Use

Trigger this skill when:
- The user's request is broad or multi-faceted ("audit and deploy everything")
- The request touches more than one codebase or domain
- You are unsure which specialist skill applies
- The user says "run the full pipeline" or "do everything"
- A request combines build, test, and deploy steps

## Workflow

1. **Parse intent** -- Extract keywords from the user's request and classify the domain (build, test, deploy, review, expand, fix).
2. **Match skills** -- Compare extracted keywords against the trigger phrases in the skill catalog above.
3. **Single match** -- If exactly one skill matches, invoke it directly with the full user context.
4. **Multi match** -- If multiple skills match, spawn one sub-agent per skill. Run them in parallel when independent.
5. **No match** -- If no skill matches, ask the user to clarify before proceeding.
6. **Collect results** -- Wait for all sub-agents to complete. Merge their outputs into a single structured response.
7. **Handle failures** -- If any sub-agent fails, retry once with adjusted parameters. If it fails again, report the failure and continue with successful results.
8. **Synthesize** -- Produce a unified report covering all sub-agent results.

## Edge Cases

- **Cross-codebase request** -- If the request spans kernel + erie-pro, spawn 2 agents, one per codebase, each with the appropriate working directory.
- **Ambiguous request** -- When no clear skill match exists, default to `audit-fix-optimize` as the safest starting point.
- **Deploy request** -- ALWAYS run builds and tests via `audit-fix-optimize` before invoking `deploy-pipeline`. Never deploy without verification.
- **Pricing or config changes** -- Check BOTH `niches.ts` AND `stripe-integration.ts` to avoid inconsistencies.
- **Circular dependency** -- If skill A triggers skill B which triggers skill A, break the cycle by running each once and merging results.
- **Partial failure** -- Report what succeeded alongside what failed. Never suppress successful results because one sub-agent errored.

## Output Format

Always structure the final response as:

```
## Orchestration Summary

**Skills invoked:** [list]
**Parallel execution:** yes/no

### Results per Skill
| Skill | Status | Summary |
|-------|--------|---------|
| ... | PASS/FAIL | ... |

### Failures & Follow-ups
- [any items that need manual attention]

### Final Synthesis
[unified narrative of what was accomplished]
```
