// ---------------------------------------------------------------------------
// Agent Templates — pre-built agent team configurations for common use cases.
// Each template deploys a fully configured team with roles, tools, and budgets.
// ---------------------------------------------------------------------------

import {
  createAgentTeam,
  addAgent,
  type AgentTeam,
  type AgentRole,
} from "./paperclip-orchestrator.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentTemplateRole {
  name: string;
  role: AgentRole;
  tools: string[];
  model: string;
  systemPrompt: string;
  maxTokensPerTask: number;
  budgetPerDay: number;
}

export interface AgentTeamTemplate {
  id: string;
  name: string;
  description: string;
  roles: AgentTemplateRole[];
  maxBudgetPerDay: number;
  maxConcurrentTasks: number;
}

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

const PROSPECTING_TEMPLATE: AgentTeamTemplate = {
  id: "prospecting-team",
  name: "Prospecting Team",
  description:
    "Automated lead research, enrichment, and qualification pipeline",
  roles: [
    {
      name: "Lead Researcher",
      role: "prospector",
      tools: ["firecrawl", "skyvern"],
      model: "gpt-4o",
      systemPrompt:
        "You are a lead researcher. Find and compile prospect lists from public sources. Focus on decision-makers in the target niche.",
      maxTokensPerTask: 4000,
      budgetPerDay: 5,
    },
    {
      name: "Data Enricher",
      role: "enricher",
      tools: ["firecrawl"],
      model: "gpt-4o-mini",
      systemPrompt:
        "You enrich raw lead data with company size, revenue, tech stack, and social profiles. Validate email addresses.",
      maxTokensPerTask: 2000,
      budgetPerDay: 3,
    },
    {
      name: "Lead Qualifier",
      role: "qualifier",
      tools: ["langchain"],
      model: "gpt-4o",
      systemPrompt:
        "You score and qualify leads based on ICP fit, engagement signals, and buying intent. Assign hot/warm/cold labels.",
      maxTokensPerTask: 3000,
      budgetPerDay: 4,
    },
  ],
  maxBudgetPerDay: 15,
  maxConcurrentTasks: 5,
};

const CONTENT_TEMPLATE: AgentTeamTemplate = {
  id: "content-team",
  name: "Content Team",
  description:
    "Generates angles, scripts, and publishes content across platforms",
  roles: [
    {
      name: "Angle Generator",
      role: "content-creator",
      tools: ["social-asset-engine"],
      model: "gpt-4o",
      systemPrompt:
        "You generate compelling content angles based on trending topics and niche pain points. Output headline + hook + CTA.",
      maxTokensPerTask: 3000,
      budgetPerDay: 4,
    },
    {
      name: "Script Writer",
      role: "content-creator",
      tools: ["langchain"],
      model: "gpt-4o",
      systemPrompt:
        "You write short-form and long-form scripts for video, podcast, and blog content. Match the brand voice.",
      maxTokensPerTask: 5000,
      budgetPerDay: 5,
    },
    {
      name: "Platform Publisher",
      role: "content-creator",
      tools: ["social-linkedin-adapter", "social-instagram-adapter", "social-twitter-adapter"],
      model: "gpt-4o-mini",
      systemPrompt:
        "You adapt content for each platform's format and publish. Optimize hashtags, timing, and engagement hooks.",
      maxTokensPerTask: 2000,
      budgetPerDay: 3,
    },
  ],
  maxBudgetPerDay: 15,
  maxConcurrentTasks: 4,
};

const OUTREACH_TEMPLATE: AgentTeamTemplate = {
  id: "outreach-team",
  name: "Outreach Team",
  description: "Automated email sequences, follow-ups, and response tracking",
  roles: [
    {
      name: "Email Writer",
      role: "outreach-manager",
      tools: ["langchain"],
      model: "gpt-4o",
      systemPrompt:
        "You craft personalized outreach emails. Use the prospect's context to write compelling subject lines and body copy.",
      maxTokensPerTask: 3000,
      budgetPerDay: 5,
    },
    {
      name: "Sequence Manager",
      role: "outreach-manager",
      tools: ["activepieces"],
      model: "gpt-4o-mini",
      systemPrompt:
        "You manage email sequences and drip campaigns. Schedule sends, handle bounces, and optimize delivery timing.",
      maxTokensPerTask: 2000,
      budgetPerDay: 3,
    },
    {
      name: "Follow-up Tracker",
      role: "nurture-manager",
      tools: ["internal-crm"],
      model: "gpt-4o-mini",
      systemPrompt:
        "You track responses, categorize replies, and escalate hot leads. Maintain follow-up cadences.",
      maxTokensPerTask: 1500,
      budgetPerDay: 2,
    },
  ],
  maxBudgetPerDay: 12,
  maxConcurrentTasks: 6,
};

const FULL_STACK_TEMPLATE: AgentTeamTemplate = {
  id: "full-stack-team",
  name: "Full Stack Team",
  description:
    "Complete lead generation pipeline: prospecting, content, outreach, analytics, and nurturing",
  roles: [
    ...PROSPECTING_TEMPLATE.roles,
    ...CONTENT_TEMPLATE.roles,
    ...OUTREACH_TEMPLATE.roles,
    {
      name: "Analytics Reporter",
      role: "analytics-reporter",
      tools: ["internal-analytics", "langchain"],
      model: "gpt-4o",
      systemPrompt:
        "You compile daily and weekly performance reports. Track conversion rates, cost per lead, and ROI metrics.",
      maxTokensPerTask: 4000,
      budgetPerDay: 3,
    },
    {
      name: "Nurture Manager",
      role: "nurture-manager",
      tools: ["internal-crm", "activepieces"],
      model: "gpt-4o-mini",
      systemPrompt:
        "You manage long-term lead nurturing. Segment contacts, schedule touchpoints, and move leads through the funnel.",
      maxTokensPerTask: 2000,
      budgetPerDay: 2,
    },
  ],
  maxBudgetPerDay: 50,
  maxConcurrentTasks: 10,
};

const ALL_TEMPLATES: AgentTeamTemplate[] = [
  PROSPECTING_TEMPLATE,
  CONTENT_TEMPLATE,
  OUTREACH_TEMPLATE,
  FULL_STACK_TEMPLATE,
];

// ---------------------------------------------------------------------------
// Template deployment helper
// ---------------------------------------------------------------------------

async function deployTemplate(
  tenantId: string,
  niche: string,
  template: AgentTeamTemplate,
): Promise<AgentTeam> {
  const team = await createAgentTeam(tenantId, {
    name: `${template.name} — ${niche}`,
    description: template.description,
    tenantId,
    maxBudgetPerDay: template.maxBudgetPerDay,
    maxConcurrentTasks: template.maxConcurrentTasks,
  });

  for (const role of template.roles) {
    const prompt = role.systemPrompt.replace(
      /target niche/g,
      `"${niche}" niche`,
    );
    await addAgent(team.id, {
      ...role,
      systemPrompt: prompt,
    });
  }

  const { getAgentTeam } = await import("./paperclip-orchestrator.ts");
  return getAgentTeam(team.id);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function deployProspectingTeam(
  tenantId: string,
  niche: string,
): Promise<AgentTeam> {
  return deployTemplate(tenantId, niche, PROSPECTING_TEMPLATE);
}

export async function deployContentTeam(
  tenantId: string,
  niche: string,
): Promise<AgentTeam> {
  return deployTemplate(tenantId, niche, CONTENT_TEMPLATE);
}

export async function deployOutreachTeam(
  tenantId: string,
  niche: string,
): Promise<AgentTeam> {
  return deployTemplate(tenantId, niche, OUTREACH_TEMPLATE);
}

export async function deployFullStackTeam(
  tenantId: string,
  niche: string,
): Promise<AgentTeam> {
  return deployTemplate(tenantId, niche, FULL_STACK_TEMPLATE);
}

export function listAvailableTemplates(): AgentTeamTemplate[] {
  return ALL_TEMPLATES.map((t) => ({ ...t }));
}
