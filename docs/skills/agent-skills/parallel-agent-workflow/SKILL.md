---
name: parallel-agent-workflow
description: Orchestrate parallel background agents for LeadOS development -- concurrent builds across 3 codebases, simultaneous audit agents, user simulation testing with 3 personas, and cron-based continuous monitoring cycles
---

# Parallel Agent Workflow

**Tier:** METHODOLOGY (Tier 2 -- Patterns & Standards)
**Category:** Agent Orchestration
**Domain:** Background agents, concurrent execution, persona simulation, monitoring cycles

## Overview

This skill defines the patterns for running multiple Claude Code agents in parallel to maximize throughput on LeadOS development tasks. Instead of building erie-pro, then kernel, then neatcircle sequentially, this skill runs all three as background agents simultaneously. It covers concurrent builds, parallel audit/fix agents, multi-persona user simulation, and scheduled monitoring cycles via cron.

## Core Capabilities

- Launch concurrent `next build` across all 3 codebases as background processes
- Run simultaneous code audit agents that each scan a different codebase
- Execute user simulation tests with 3 personas hitting different site sections in parallel
- Configure cron-based monitoring that runs completeness checks on a schedule
- Coordinate agent results into a unified report
- Handle agent failures without blocking other parallel agents

## When to Use

Trigger this skill when:
- "build everything", "build all three", "parallel build"
- "audit all codebases at once", "run audits in parallel"
- "simulate users", "user testing with personas"
- "set up monitoring", "check sites every hour"
- Any task that involves repeating the same operation across multiple codebases
- When wall-clock time matters more than sequential safety

## Methodology

### Pattern 1: Concurrent Builds
Launch all three builds as background agents:
```bash
# Agent 1 (background)
cd erie-pro && npm run build 2>&1 | tee /tmp/build-erie-pro.log

# Agent 2 (background)
cd lead-os-hosted-runtime-wt-hybrid && npm run build 2>&1 | tee /tmp/build-kernel.log

# Agent 3 (background)
cd neatcircle && npm run build 2>&1 | tee /tmp/build-neatcircle.log
```
Use `run_in_background` for each. Collect results when all complete. If one fails, the others continue.

### Pattern 2: Parallel Audit Agents
Spawn three audit agents, each responsible for one codebase:
- **Agent A:** Runs code-review skill on erie-pro
- **Agent B:** Runs code-review skill on kernel
- **Agent C:** Runs code-review skill on neatcircle

Each agent writes findings to a structured temp file. The orchestrator merges results after all agents complete.

### Pattern 3: User Simulation with 3 Personas
Define three test personas that exercise different site sections simultaneously:
- **Homeowner persona** -- Browses erie-pro niche pages, submits intake form, checks pricing
- **Admin persona** -- Logs into kernel admin, views analytics, manages tenants
- **Visitor persona** -- Hits neatcircle homepage, follows CTAs, checks mobile responsiveness

Each persona runs as a separate background agent with its own navigation sequence and assertion checklist.

### Pattern 4: Cron-Based Monitoring
Use CronCreate to schedule recurring health checks:
```
Schedule: every 60 minutes
Task: Run completeness-testing skill, report any new failures
Alert: If fail count > 0, output immediate warning
```
The cron job runs the 697-URL completeness test and compares results to the previous run. Only report changes (new failures or recovered URLs).

### Coordination Protocol
1. **Launch phase** -- Start all agents within the same message block
2. **Wait phase** -- Monitor for completion notifications (do not poll with sleep loops)
3. **Collect phase** -- Read results from each completed agent
4. **Merge phase** -- Combine results into a single unified report
5. **Escalate phase** -- If any agent failed, flag for manual review

## Edge Cases

- **Resource contention** -- Three simultaneous `next build` processes may exhaust memory. If OOM occurs, fall back to sequential builds with a note in the report.
- **Agent timeout** -- Background agents have a maximum runtime. If a build exceeds 10 minutes, it may be killed. Check for timeout signals in the output.
- **Partial failure** -- If Agent A fails but B and C succeed, report the partial success. Never discard successful results because one agent failed.
- **Cron overlap** -- If a monitoring cycle takes longer than the interval, skip the next cycle rather than running two simultaneously.
- **Log interleaving** -- Background agents writing to the same output can interleave. Use separate temp files per agent, never shared stdout.
- **Git conflicts** -- If two audit agents try to fix the same file, the second commit will conflict. The orchestrator must detect this and resolve sequentially.
- **Rate limits on production** -- Three persona agents hitting production simultaneously may trigger rate limiting. Stagger start times by 2 seconds.

## Output Format

```
## Parallel Agent Report

### Agent Status
| Agent | Task | Status | Duration | Errors |
|-------|------|--------|----------|--------|
| Build-EriePro | next build | COMPLETE | 2m 14s | 0 |
| Build-Kernel | next build | COMPLETE | 1m 47s | 0 |
| Build-NeatCircle | next build | COMPLETE | 0m 52s | 0 |

### Wall Clock Time
- Sequential estimate: 4m 53s
- Parallel actual: 2m 14s (saved 2m 39s)

### Merged Findings
- [combined results from all agents]

### Monitoring Schedule
- Cron: every 60 minutes
- Last run: [timestamp]
- Next run: [timestamp]
- Status: [active/paused]
```
