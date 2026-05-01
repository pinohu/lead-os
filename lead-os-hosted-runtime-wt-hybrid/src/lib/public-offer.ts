export type PublicPlanId = "whitelabel-starter" | "whitelabel-growth" | "whitelabel-enterprise";

export interface PublicPlan {
  id: PublicPlanId;
  shortId: "starter" | "growth" | "professional";
  name: string;
  price: string;
  priceValue: number;
  description: string;
  limits: string;
  features: string[];
  recommended: boolean;
}

export const publicPlans: PublicPlan[] = [
  {
    id: "whitelabel-starter",
    shortId: "starter",
    name: "Starter",
    price: "$99/mo",
    priceValue: 9900,
    description: "For one operator validating a lead capture workspace.",
    limits: "100 leads/mo, 1,000 emails, 2 funnels, 3 integrations",
    features: [
      "Hosted lead capture workspace",
      "Basic lead scoring",
      "Email nurture workflow",
      "Embeddable capture script",
      "Operator dashboard access",
    ],
    recommended: false,
  },
  {
    id: "whitelabel-growth",
    shortId: "growth",
    name: "Growth",
    price: "$249/mo",
    priceValue: 24900,
    description: "For teams running several funnels or client workspaces.",
    limits: "500 leads/mo, 5,000 emails, 5 funnels, 10 integrations",
    features: [
      "Everything in Starter",
      "A/B testing surfaces",
      "Attribution views",
      "WhatsApp-ready channel toggle",
      "Three operator seats",
    ],
    recommended: true,
  },
  {
    id: "whitelabel-enterprise",
    shortId: "professional",
    name: "Professional",
    price: "$499/mo",
    priceValue: 49900,
    description: "For operators preparing a production multi-workspace rollout.",
    limits: "2,000 leads/mo, 25,000 emails, unlimited funnels, 10 operators",
    features: [
      "Everything in Growth",
      "Marketplace access surfaces",
      "Priority support lane",
      "Unlimited funnel definitions",
      "Production launch checklist",
    ],
    recommended: false,
  },
];

export const deliveredNow = [
  "A public website that explains the outcome, audience, pricing, and launch path.",
  "A universal intake that collects the client details needed to launch one package or any package bundle.",
  "A generated client delivery hub with capture, operator, reporting, billing, embed, and acceptance-check surfaces.",
  "Customer-ready package outputs that document what was created, where it lives, and what outcome it is meant to improve.",
  "Operator views for readiness, reporting, managed handoffs, and next expansion opportunities.",
];

export const notLiveUntilConfigured = [
  "Client-owned CRM or customer-list access activates direct record sync; until then, Lead OS provides import-ready handoffs.",
  "Client-owned billing access activates live checkout, invoices, subscriptions, claims, or commissions; until then, Lead OS provides payment-ready instructions.",
  "Approved email, SMS, WhatsApp, calendar, phone, or ad-account access activates live external actions; until then, Lead OS creates the scripts, sequences, routing, and approval-ready assets.",
  "Regulated claims, likeness use, financial promises, legal language, and medical content remain behind human approval checkpoints.",
];

export const userJourney = [
  {
    title: "Describe the workspace",
    body: "Enter your email, niche, and business model so the system can create the right lead workspace.",
  },
  {
    title: "Choose the operating plan",
    body: "Pick the plan limits that match the workspace you want to test or launch.",
  },
  {
    title: "Brand the experience",
    body: "Add the public brand name, accent color, website, and support email shown to leads and operators.",
  },
  {
    title: "Select channels",
    body: "Choose which integrations you intend to use. Channels stay inactive until credentials are connected.",
  },
  {
    title: "Use the result",
    body: "Copy the embed script, open the dashboard, and connect production services before sending real traffic.",
  },
];

export function getPublicPlan(id: string | null | undefined): PublicPlan | undefined {
  if (!id) return undefined;
  return publicPlans.find((plan) => plan.id === id || plan.shortId === id);
}
