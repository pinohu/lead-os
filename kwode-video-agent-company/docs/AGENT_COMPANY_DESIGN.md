# Agent Company Design

The Kwode Video Factory is modeled as a company with **21 departments**
and **50 agents**. All agent definitions live in
`packages/agents/definitions/agents.yaml` and are loaded into the
`AgentDefinition` table at seed time.

## Departments

| # | Department | Agents |
|---|---|---|
| A | Executive Office | chief-executive, chief-operating, chief-product, chief-revenue, chief-technical |
| B | Market Strategy | market-research, niche-selection, offer-design |
| C | Client Intake | client-intake, brand-profile, business-context |
| D | Creative Strategy | creative-brief, video-strategy, social-shorts, sales-funnel, personalized-outreach, testimonial-review |
| E | Scriptwriting | scriptwriter |
| F | Storyboard and Direction | storyboard-director, scene-planning |
| G | Visual Production | prompt-engineer, visual-consistency |
| H | Video Generation | vimax-coordinator, comfyui-coordinator |
| I | Audio and Voice | voiceover, caption-subtitle |
| J | Editing and Rendering | remotion-ffmpeg-render |
| K | QA, Compliance, and Brand Safety | qa-reviewer, brand-safety, legal-rights-consent |
| L | Client Approval | client-approval, revision-manager |
| M | Delivery and Publishing | delivery, publishing |
| N | Monetization and Billing | *(plans only in MVP; agent additions tracked in IMPLEMENTATION_STATUS.md)* |
| O | Analytics and Learning | analytics, cost-control, learning-memory |
| P | DevOps and Platform Reliability | devops-reliability |
| Q | Tool Integration | appsumo-tool-router, tool-integration |
| R | Erie.pro Provider Growth | erie-pro-provider-video, directory-listing-video, local-seo-video, gbp-video |
| S | YourDeputy Productization | *(handled via templates in catalog; agents reuse delivery + sales-funnel)* |
| T | Faith, Children, and Story Products | faith-story-video, childrens-story-video, real-estate-airbnb-video |
| U | Training and Education Products | training-video, healthcare-education-video, manufacturing-training-video |

## Agent definition shape

Each agent in `agents.yaml` carries:

```yaml
- agent_id: string
  name: string
  department: string
  mission: string
  responsibilities: [string]
  inputs: [string]
  outputs: [string]
  tools_allowed: [string]
  tools_disallowed: [string]
  memory_scope: job | client | brand | tenant | global | agent | ephemeral
  escalation_rules:
    - on: trigger
      action: action_id
  quality_gates: [string]
  success_metrics: [string]
  prompt_template: |
    Multi-line prompt with <<placeholders>>
  example_tasks: [string]
```

## Default agent chain

For most video types the chain is:

```
client-intake-agent
  ↓
brand-profile-agent
  ↓
creative-brief-agent  → CreativeBrief row, status: brief_ready → brief_approved
  ↓
scriptwriter-agent    → Script row, status: script_ready
  ↓
storyboard-director-agent → Storyboard + Scene[] rows, status: storyboard_ready
  ↓
scene-planning-agent      (enriches scenes with camera/audio notes)
  ↓
prompt-engineer-agent   → Prompt[] rows + GenerationRun (ViMax/mock), status: prompts_ready
  ↓
visual-consistency-agent
  ↓
vimax-coordinator-agent / comfyui-coordinator-agent (Asset rows)
  ↓
qa-reviewer-agent       → QAReview, status: qa_passed | qa_failed
  ↓
brand-safety-agent
  ↓
legal-rights-consent-agent
  ↓
client-approval-agent   → Approval, status: client_review
  ↓
delivery-agent          → Deliverable, status: delivered
```

For short formats (e.g. `social-shortform`, `gbp-post`) the chain is
compressed to: intake → brand → brief → script → storyboard → prompts → QA → delivery.

The chain for a given video type is defined as `agent_chain:` in
`packages/video-catalog/catalog/master-types.yaml`. The chain runner in
`packages/workflow-engine/src/agent-chain.ts` honors that list.

## Memory model

Agents read/write through `packages/memory/src/index.ts`. The default scope
for a creative agent is `job` so per-job experiments don't leak. Promoted
patterns (e.g. high-performing hook variants for an HVAC short) are written
at `client` or `tenant` scope by the **Learning and Memory Agent**.

## Escalation

Escalations are advisory in MVP — they appear in agent responses and audit
logs. A future Chief Operating Agent loop will read these and dispatch fixes.

## Quality gates

Quality gates are advisory inside each agent definition (they show up in
prompt context to the LLM), but the **hard** quality gates that cannot be
bypassed live in `packages/qa/src/checks.ts` (`evaluateHardRules`):

1. Any `Asset` with `consentStatus = "pending" | "rejected"` blocks delivery.
2. Any `ConsentRecord` for `face | voice | testimonial | logo | likeness`
   that isn't `approved` or `not_required` blocks delivery.
3. Any job flagged `metadata.medicalClaim | legalClaim | financialClaim`
   requires a human approval (`decidedBy` starts with `user:`) before
   delivery.
