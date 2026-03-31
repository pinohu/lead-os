# Parallel Agent Workflow

Use multiple agents in parallel to maximize throughput on large tasks. This is the standard approach for LeadOS development.

## Pattern: Build + Test + Deploy
Launch 4 background tasks simultaneously:
```
Agent 1: npm run build (erie-pro) — background
Agent 2: npm run build (hybrid runtime) — background
Agent 3: npm run build (neatcircle) — background
Agent 4: npm test (hybrid runtime) — background
```
Wait for all to complete, then commit + push + deploy.

## Pattern: Multi-Codebase Changes
When changes span both erie-pro and kernel:
```
Agent 1: Fix erie-pro issues (reads + edits + builds)
Agent 2: Fix kernel issues (reads + edits + builds)
```
Both run in parallel since codebases are independent. Commit separately, push once.

## Pattern: Comprehensive Audit
Launch 3 explore agents in parallel:
```
Agent 1 (Explore): Audit pages and routes
Agent 2 (Explore): Audit data files and config
Agent 3 (Explore): Audit components and CSS
```
Compile findings, then launch fix agents.

## Pattern: User Simulation Testing
Launch 3 agents simulating different personas:
```
Agent 1: Consumer/homeowner journey testing
Agent 2: Service provider/business journey testing
Agent 3: Content quality auditor (cross-niche)
```
Each uses WebFetch to load actual deployed pages and assess quality.

## Pattern: Continuous Monitoring
Set up a cron job for recurring cycles:
```
CronCreate: every 18 minutes
- Build all 3 codebases
- Run tests
- Check live sites
- Report any issues
- Fix and deploy if needed
```
Cancel with CronDelete when cycle is complete.

## Key Rules
- Always use `run_in_background: true` for builds and tests
- Use `TaskOutput` with `block: true` to wait for results
- Never launch more than 3 agents at once (context limits)
- Commit each major phase separately for clean git history
- Always verify deployed endpoints after push (wait 10-12 seconds)
