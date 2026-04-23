# Claude Code Skills — Setup Guide

This guide explains how to install the LeadOS agent skill infrastructure on a new Claude Code instance.

## Prerequisites

- Claude Code CLI installed (`npm install -g @anthropic-ai/claude-code` or desktop app)
- Git access to https://github.com/pinohu/lead-os
- Node.js 22+

## Quick Setup

```bash
# 1. Clone the repo
git clone https://github.com/pinohu/lead-os.git
cd lead-os

# 2. Copy skills to Claude's global directory
cp -r docs/skills/agent-skills/* ~/.claude/skills/
cp -r docs/skills/slash-commands/* ~/.claude/commands/

# 3. Install dependencies for all 3 apps
cd lead-os-runtime && npm install && cd ..
cd erie-pro && npm install && cd ..
cd neatcircle-beta && npm install && cd ..

# 4. Verify skills are loaded
ls ~/.claude/skills/       # Should show 16 folders
ls ~/.claude/commands/     # Should show 13 .md files

# 5. Start Claude Code — skills auto-discover
claude
```

## Alternative: Use the Portable Archive

A pre-built archive is available at the repo root:

```bash
# Extract into home directory
cd ~
tar -xzf lead-os/docs/skills/claude-code-portable-kit.tar.gz
```

## What Gets Installed

### 16 Agent-Callable Skills (`~/.claude/skills/`)

Each skill is a folder containing `SKILL.md` with YAML frontmatter metadata. Agents can call these skills hundreds of times per run.

#### Tier 1 — Standard (Organizational Infrastructure)
| Skill | Purpose |
|-------|---------|
| `leados-orchestrator` | Routes requests to specialist skills, spawns sub-agents |
| `audit-fix-optimize` | Build all 3 codebases, run 4,151 tests, verify, fix, deploy |
| `completeness-testing` | Test all 697 URLs across 3 production sites |
| `code-review` | TypeScript, accessibility, security, dead links, WCAG AA |
| `deploy-pipeline` | Vercel production deploy with pre/post verification |
| `ux-accessibility` | WCAG AA enforcement, form rules, admin protection |

#### Tier 2 — Methodology (High-Value Work Structures)
| Skill | Purpose |
|-------|---------|
| `erie-pro-niche-expansion` | Add niches: 5 data files, Erie-specific content |
| `shadcn-theme-system` | HSL tokens, CVA variants, dual-CSS coexistence |
| `user-simulation-testing` | 3-persona parallel agents testing UX quality |
| `local-seo-strategy` | 44 niches x 15 pages, Schema.org, unique meta |
| `enterprise-pricing` | $299-$2,999 kernel + $300-$1,500 territory pricing |
| `nextjs-architecture` | SSG, middleware auth, subdomain routing |
| `multi-tenant-testing` | 4,151 tests, 10-subtest stress test |
| `parallel-agent-workflow` | Concurrent builds, simultaneous audits |
| `business-operations` | Territory claims, lead routing, premium tiers |
| `api-design-reviewer` | REST conventions, validation, error responses |

### 13 Slash Commands (`~/.claude/commands/`)

Human-callable via `/command-name` in the Claude Code chat. These are the legacy format but still fully functional.

## Skill Format

Each `SKILL.md` follows this structure:

```markdown
---
name: skill-name
description: Single-line description that serves as a routing signal for agents — must be specific, mention document types, trigger phrases, and expected outputs
---

# Skill Title

**Tier:** STANDARD | METHODOLOGY | PERSONAL
**Category:** Engineering | Business | Operations
**Domain:** Specific area

## Overview
What this skill does in 2-3 sentences.

## Core Capabilities
- Bullet list of what it can do

## When to Use
Trigger phrases: "run audit", "check builds", "deploy to production"

## Workflow
1. Step-by-step methodology
2. With specific commands and patterns
3. Including verification steps

## Edge Cases
- What to do when X fails
- How to handle Y scenario

## Output Format
Structured output specification (tables, JSON, etc.)
```

### Key Rules

1. **Description must be a single line** — if a formatter breaks it, Claude won't parse it
2. **80-150 lines per skill** — lean enough to load fast, detailed enough to execute
3. **Agent-first design** — descriptions are routing signals, not labels
4. **Edge cases are explicit** — agents don't have human common sense
5. **Outputs are composable** — each skill produces results another agent can consume

## Skill Tiers

| Tier | Purpose | Example |
|------|---------|---------|
| **Tier 1 — Standard** | Consistent across the org. Everyone uses these. | audit-fix-optimize, code-review |
| **Tier 2 — Methodology** | High-value work structures from senior practitioners. | erie-pro-niche-expansion, business-operations |
| **Tier 3 — Personal** | Individual workflow optimizations. | Custom per-developer scripts |

## Updating Skills

Skills are version-controlled. To update:

```bash
# Edit the skill
nano ~/.claude/skills/audit-fix-optimize/SKILL.md

# Or copy updated versions from the repo
cp docs/skills/agent-skills/audit-fix-optimize/SKILL.md ~/.claude/skills/audit-fix-optimize/
```

## Community Resources

- [awesome-claude-code-toolkit](https://github.com/rohitg00/awesome-claude-code-toolkit) — 135 agents, 35 skills, 42 commands
- [claude-skills](https://github.com/alirezarezvani/claude-skills) — 507 production-ready skills
- [awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills) — Curated skill list
- [Claude Code Skills Docs](https://code.claude.com/docs/en/skills) — Official documentation
