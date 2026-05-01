import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

export interface DocCatalogEntry {
  slug: string;
  title: string;
  description: string;
  file: string;
  category: "Start" | "Operations" | "Trust" | "Architecture" | "Go-to-market";
  featured?: boolean;
}

export const docsCatalog: DocCatalogEntry[] = [
  {
    slug: "start-here",
    title: "Start here",
    description: "Novice path for understanding the monorepo, kernel runtime, setup, production checks, and source-of-truth docs.",
    file: "START-HERE.md",
    category: "Start",
    featured: true,
  },
  {
    slug: "operator-runbook",
    title: "Operator runbook",
    description: "Daily checks, diagnostics, control-plane actions, workers, queues, pricing posture, and incident triage.",
    file: "OPERATOR_RUNBOOK.md",
    category: "Operations",
    featured: true,
  },
  {
    slug: "deployment",
    title: "Deployment",
    description: "Migrations, Vercel/Railway notes, worker posture, required environment variables, and production launch checks.",
    file: "DEPLOYMENT.md",
    category: "Operations",
    featured: true,
  },
  {
    slug: "product-surfaces",
    title: "Product surfaces",
    description: "Public, operator-only, API, and documentation surfaces that exist in this deployment.",
    file: "PRODUCT-SURFACES.md",
    category: "Architecture",
    featured: true,
  },
  {
    slug: "audience-messaging-audit",
    title: "Audience messaging audit",
    description: "B2B, B2B2C, client-business, and downstream-audience positioning rules for the public site.",
    file: "AUDIENCE-MESSAGING-AUDIT.md",
    category: "Go-to-market",
  },
  {
    slug: "claims-verification",
    title: "Claims verification",
    description: "What the app can truthfully claim and which checks validate production-facing promises.",
    file: "CLAIMS-VERIFICATION.md",
    category: "Trust",
  },
  {
    slug: "sla-source",
    title: "Full SLA source",
    description: "Complete SLA template source, including placeholders, exclusions, credits, support, backup, and legal review notes.",
    file: "SLA.md",
    category: "Trust",
  },
  {
    slug: "incident-response",
    title: "Incident response",
    description: "Incident handling, escalation, remediation, and operator communication guide.",
    file: "INCIDENT-RESPONSE.md",
    category: "Operations",
  },
  {
    slug: "retry-dlq-policy",
    title: "Retry and DLQ policy",
    description: "Retry, dead-letter queue, and failed job handling policy.",
    file: "RETRY-DLQ-POLICY.md",
    category: "Operations",
  },
  {
    slug: "system-hardening",
    title: "System hardening",
    description: "Security and production-hardening notes for the hosted runtime.",
    file: "SYSTEM-HARDENING.md",
    category: "Trust",
  },
  {
    slug: "soc2-controls",
    title: "SOC2 controls",
    description: "SOC2 control mapping and operational evidence checklist.",
    file: "SOC2-CONTROLS.md",
    category: "Trust",
  },
  {
    slug: "env-vault-to-canonical",
    title: "Environment vault to canonical",
    description: "Environment variable normalization and canonical naming guide.",
    file: "ENV-VAULT-TO-CANONICAL.md",
    category: "Operations",
  },
  {
    slug: "go-to-market-use-cases",
    title: "Go-to-market use cases",
    description: "Revenue plays and go-to-market use cases exposed by the runtime.",
    file: "GO-TO-MARKET-USE-CASES.md",
    category: "Go-to-market",
  },
  {
    slug: "erie-pro",
    title: "Erie Pro",
    description: "Territory and local-services notes for Erie-style deployments.",
    file: "ERIE-PRO.md",
    category: "Go-to-market",
  },
  {
    slug: "gmb-landing-page-pipeline",
    title: "GMB landing page pipeline",
    description: "Google Business Profile landing-page and local search pipeline notes.",
    file: "gmb-landing-page-pipeline.md",
    category: "Go-to-market",
  },
  {
    slug: "n8n-starter-pack",
    title: "n8n starter pack",
    description: "Starter workflows and automation concepts for n8n-backed delivery.",
    file: "n8n-starter-pack.md",
    category: "Operations",
  },
  {
    slug: "three-visit-milestone-framework",
    title: "Three-visit milestone framework",
    description: "Customer-journey milestone framework for repeat visits and progressive conversion.",
    file: "three-visit-milestone-framework.md",
    category: "Go-to-market",
  },
  {
    slug: "wordpress-subdomain-playbook",
    title: "WordPress subdomain playbook",
    description: "WordPress and subdomain deployment notes for related surfaces.",
    file: "wordpress-subdomain-playbook.md",
    category: "Operations",
  },
];

const docsDirectory = path.join(process.cwd(), "docs");

export function getDocEntry(slug: string): DocCatalogEntry | undefined {
  return docsCatalog.find((entry) => entry.slug === slug);
}

export async function readDocMarkdown(entry: DocCatalogEntry): Promise<string> {
  return readFile(path.join(docsDirectory, entry.file), "utf8");
}
