import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, PackageOpen } from "lucide-react";
import { PackageBundleProvisionForm } from "@/components/PackageBundleProvisionForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPackageAudienceContract,
  getPackageIdeaEvaluationGuardrails,
  getPackagePlanNames,
  getPackageServiceReplacementStrategy,
  getUniversalPackageCredentialFields,
  provisionablePackages,
} from "@/lib/package-catalog";

export const metadata: Metadata = {
  title: "Complete AI Agency Solutions | Lead OS",
  description:
    "Choose the business outcome your client bought, collect the required intake details, and launch the complete B2B or B2B2C solution.",
};

const packageRules = [
  "Do not default to per-seat pricing; better automation should reduce the customer's manual seats, not cannibalize the operator's revenue.",
  "Make the pricing trade-off explicit: per-seat SaaS monetizes customer headcount and becomes weaker as automation reduces seats, while work-based AI-native pricing monetizes completed outcomes.",
  "Name the incumbent Achilles heel: if the AI agent reduces customer employee count, per-seat revenue falls exactly when the product gets more efficient.",
  "Use the software-budget versus services-budget gap as strategy: traditional tools may capture about 1% of spend, while AI-native service replacement should pursue 4% to 10% when it does the work.",
  "Treat work-based pricing as higher-value but proof-heavy: longer pilots, acceptance evidence, and last-10-percent reliability work are the trade-off for charging on outcomes.",
  "Price superhuman capabilities by value and volume, not seat equivalents; 24/7 patience, 200-language fluency, and parallel handling should not be compressed into one human-login price.",
  "Choose the pricing model that benefits when AI improves; if better automation shrinks revenue, the package is still trapped in SaaS thinking.",
  "Sell against service budgets: outsourced work, internal labor, agency operations, admin follow-up, production, routing, reporting, and fulfillment.",
  "Prioritize service-heavy markets such as insurance brokerage, accounting, tax audit, compliance, and healthcare administration where services spend dwarfs software spend.",
  "Expand the service-replacement map into financial and administrative work: accounting, tax audit, payroll, insurance brokerage, compliance, and banking operations.",
  "Treat banking operations as mission-critical AI service territory: KYC, loan origination, debt recovery, and fraud monitoring require reliability beyond demo polish.",
  "Target healthcare administration and legal services where specialized knowledge makes the last 10% of accuracy the real product.",
  "Look for fragmented non-tech verticals such as logistics, trucking, fuel cards, HVAC, home services, real estate, and debt financing where software has captured too little of the budget.",
  "Use customer support, multilingual support, and language-practice workflows as service wedges because AI agents are patient, always available, and fluent across languages.",
  "Prioritize easiest replacement markets where services spend dwarfs software spend and work is already outsourced or staffed as a human service.",
  "Use financial/admin, banking infrastructure, healthcare administration, legal application-layer services, HVAC and fragmented home services, construction, trucking/logistics, and multilingual support as first-pass wedges.",
  "Use boring schlep such as payroll, tax, trucking compliance, insurance workflows, KYC, and debt recovery as an advantage because painstaking drudgery creates process power.",
  "Use fragmented non-technical markets like HVAC, construction, home services, trucking, and local field operations where weak software adoption leaves room to mint agents into operations.",
  "Use multilingual support where AI patience and fluency across hundreds of languages can replace hard-to-staff human teams, including international contractor and DoorDasher-style support.",
  "Prefer workflows that are already outsourced or staffed as human services, because the buyer already has a service budget to replace.",
  "Use high-attrition labor as a wedge: support and admin functions with 50% to 80% attrition are strong candidates for AI-native service replacement.",
  "Price the work delivered: completed tasks, accepted outputs, recovered revenue, qualified outcomes, and hours saved.",
  "Use the larger service wallet as the benchmark; a package that truly replaces service work should be able to justify a larger share than a software tool.",
  "Frame business process automation as service performance, not productivity support: the package should monitor work, take next actions, produce proof, and escalate only the exceptions humans should judge.",
  "Make automation self-regulating: continuously compare outputs with stated goals and adjust prompts, routing, tests, approvals, handoffs, and package priorities when performance drifts.",
  "Price automation by tasks completed, work delivered, accepted outputs, and service capacity created rather than seats, logins, dashboards, or generic productivity claims.",
  "Reject solution-in-search-of-problem packages and superficially plausible AI ideas; validate existential pain, top-three priority, founder-market fit, tar pit risk, and pricing before launch.",
  "Use charge validation as the binary test: the best signal is customers complaining about a high price but still paying.",
  "Define the Binary Test as charging real money to see whether the customer will open their wallet; the result should teach quickly because they either pay or reveal weak value.",
  "Use refusal to pay as a product signal, not an embarrassment: the package may not solve a top-three problem, the segment may be wrong, or the outcome may not yet overcome the price tag.",
  "Use the Binary Test to find the right customer segment: the best segment pays fastest, has the clearest budget logic, and feels the least friction around buying the outcome.",
  "Do not validate only by undercutting. Premium pricing can teach whether better APIs, setup, documentation, delivery, or outcome proof is valuable enough to command more, as early Stripe did with developer-friendly payments.",
  "The ideal pricing signal is complain but pay: the customer feels the price, says so, and still pays because the unsolved problem is more expensive.",
  "Treat social coordination apps as the tar-pit warning: universal pain is not enough unless the package names the hard structural barrier it solves differently.",
  "Flag the classic weekend-plans app trap: text-thread pain, event lists, and friend invites look easy until social dynamics and switching behavior kill adoption.",
  "Treat fun discovery apps with skepticism: restaurant discovery, music discovery, and hobby-finding ideas are picked-over spaces where curiosity rarely proves urgent budget.",
  "Reject abstract societal problem packaging until the package names a tractable workflow, buyer, budget, and specific pain point.",
  "Give consumer hardware, social networks, and ad tech extra scrutiny because these low-hit-rate idea spaces need unusually strong distribution, monetization, and hard-part proof.",
  "Avoid tar pits by Googling prior attempts, talking to founders who failed, writing the structural hard-part hypothesis, running Fire or Promotion, and comparing the idea against boring service workflows.",
  "Use one intake form to launch one solution, a selected bundle, or the full catalog as a finished operating path.",
  "Provisioning creates the delivery hub, downstream pages, assets, routing logic, reports, acceptance checks, managed handoffs, and outcome receipts.",
  "Every decision, handoff, approval, exception, and outcome should feed the closed loop so the customer's organization becomes queryable.",
  "Replace open-loop operations: measure outputs against stated goals and adjust prompts, routing, tests, handoffs, and package priorities until the system self-corrects.",
  "Make work legible to AI by producing artifacts for meetings, decisions, tickets, approvals, exceptions, QA traces, and customer outcomes instead of hiding context in private DMs or inbox fragments.",
  "Make the whole organization queryable: every process, decision, workflow, exception, and outcome should be legible to AI so the operating system improves stability and correctness.",
  "Give AI a continuous operating-system view of the company, not a one-off tool snapshot.",
  "Capture communication logs from email, Pylon-style support tools, shared channels, and support queues as first-class operating memory.",
  "Capture technical activity from GitHub commits, pull requests, issues, review notes, deployments, and shipped-work evidence.",
  "Capture planning data from Notion, Google Docs, specs, decision memos, delivery hubs, and package workspaces.",
  "Capture recorded interactions such as sales calls, customer calls, daily standups, transcripts, and follow-up commitments.",
  "Make the organization legible by default so agents can inspect what actually shipped and whether it addressed customer needs.",
  "Run artifact-rich environments with AI notetakers, Slack transcripts, GitHub logs, customer outcomes, and dashboards for revenue, sales, engineering, hiring, and operations.",
  "Minimize private DMs and email-only decisions; move important work into transparent channels and package surfaces where embedded agents can observe and route it.",
  "Give agents employee-grade context through dashboards that connect revenue, sales, engineering, hiring, customer feedback, tickets, Slack, GitHub, and package performance.",
  "Let the intelligence layer replace middle-management status routing where possible, with humans at the edge as builders, operators, QA owners, approvers, and agent wranglers.",
  "Use autonomous sprint planning loops where agents compare shipped work with customer needs and propose predictable next-cycle plans instead of lossy manual status rollups.",
  "Base autonomous coordination on queryable evidence: tickets, Pylon/email feedback, Notion or Google Docs plans, GitHub commits and issues, sales calls, standup recordings, and delivery evidence.",
  "Use Linear-style tickets, Slack, GitHub, standup recordings, shipped-work evidence, and customer needs to cut planning noise, shorten sprint cycles, and target nearly 10x more useful work.",
  "Remove human middleware where the intelligence layer can route information directly; fewer translation layers should mean faster movement from signal to decision.",
  "Use token maxing as the queryable-org scaling rule: high API bills are acceptable when they replace HR, admin, engineering, support coordination, and management routing.",
  "Replace classic management hierarchy with an intelligence layer that routes information and removes human middleware.",
  "Define ICs as builder operators across engineering, support, sales, and operations; bring working prototypes, not static decks.",
  "Define DRIs by one person, one outcome: strategy and customer outcome ownership with no committee hiding.",
  "Make the DRI a strategy-and-customer-outcome owner, not a status router, headcount manager, or classic middle manager.",
  "Attach one named DRI to one specific result with visible proof, decision rights, and no hierarchy to hide behind.",
  "Let the intelligence layer replace middle-management information routing so the DRI guides goals, constraints, evals, and escalation rules.",
  "Place the DRI at the edge of customer and operator reality, close enough to judge exceptions while agents coordinate the repeatable work.",
  "Use the DRI as a token-maxing lever: one accountable operator with agents should replace large engineering, admin, or coordination teams.",
  "Protect information velocity by moving signals from artifacts to agents, decisions, and customer-visible changes without manual interpretation chains.",
  "AI founders lead by using AI tools themselves, building and coaching by example instead of delegating AI strategy.",
  "Use IC, DRI, and AI Founder archetypes to maximize token usage rather than headcount.",
  "Remove middle-manager human middleware to create direct velocity gains from artifact to agent, owner, and decision.",
  "Design for one capable operator with AI agents to do work that previously required a larger cross-functional team.",
  "Keep engineering, HR, admin, support, and operations departments lean by maxing tokens before coordination headcount.",
  "Treat speed as the first startup moat: ship AI-native service improvements faster than labs or incumbents can route them through their product process.",
  "Use queryable organization data to compress sprint cycles, cut planning noise, and target nearly 10x more useful work from the same expert team.",
  "Push safe package changes toward one-day sprint cycles where a DRI defines the spec, agents implement, and acceptance evidence decides release readiness.",
  "Exploit incumbent craft overhead: PM layers, operations reviews, PRDs, spec docs, approvals, and launch gates slow customer-visible change.",
  "Start AI-native from day one instead of unwinding legacy SOPs, live-product assumptions, and human-first development rituals.",
  "Use forward-deployed engineering as a speed loop: sit with customers, spot boring manual pain, automate it in the live workflow, and feed eval data back into the next iteration.",
  "Evaluate every package through the AI Seven Powers stack: speed foundation, process power, counterpositioning, switching costs, network economy, cornered resource, scale economies, and branding.",
  "Treat speed as the foundation power: relentless execution, one-day sprint cycles, AI software factories, and forward-deployed customer learning should move faster than PRD-heavy craft cultures.",
  "Build process power in the final 5% to 10%: mission-critical workflows such as KYC, loan origination, legal review, accounting, healthcare administration, and compliance need 99% reliability beyond a demo.",
  "Counterposition against incumbents with work-delivered pricing: per-seat SaaS hesitates to automate fully because fewer customer employees can mean fewer seats to sell.",
  "Create switching costs through lengthy onboarding, custom rules, integrations, fraud-monitoring-style paths, debt recovery logic, approvals, acceptance history, and workflows minted into operations.",
  "Use the eval flywheel as a network economy: every pass, failure, human override, exception, and customer acceptance receipt should improve context engineering and future workflow performance.",
  "Corner resources that outsiders cannot see: proprietary customer workflow data, tailored time-in-motion observations, specialized evals, domain edge cases, and optimized model routes.",
  "Use scale economies where infrastructure is reusable: static crawls, model optimizations, evaluation harnesses, integrations, compliance checks, and deployment pipelines should get cheaper per outcome.",
  "Build brand as trust under risk: buyers should remember the package as the known reliable service outcome even when underlying model capabilities converge.",
  "Exploit schlep blindness: payroll, tax accounting, trucking compliance, insurance operations, banking infrastructure, and regulated admin are defensible because competitors avoid the boring details.",
  "Turn delivery into a system of record: customer history, decisions, approvals, outcomes, exceptions, eval traces, and reporting receipts should live in the package so leaving means losing operating memory.",
  "Make the Outcome Graph the moat: every run should record buyer persona, niche, pain point, offer, workflow steps, accepted outputs, failed outputs, human overrides, pricing tested, renewals, churn reasons, hours saved, revenue recovered, and tasks completed.",
  "Represent the strongest lessons from other tools without cloning them: agency resale, CRM-grade trust, integration readiness, GTM data execution, brand governance, agent operations, and ontology depth must all translate into Lead OS service outcomes.",
  "Borrow the agency platform lesson through branded client portals, resale packaging, onboarding checklists, rebilling proof, and package collateral that help operators sell the result again.",
  "Borrow the CRM platform lesson through customer timelines, permissions, audit trails, imports, exports, acceptance receipts, and system-of-record memory.",
  "Borrow the integration platform lesson by showing what works now, which connectors improve it, and which managed handoff covers the gap until the client grants access.",
  "Borrow the GTM tooling lesson by making targeting, enrichment, deliverability, outbound proof, campaign status, pipeline movement, and revenue evidence visible in the package.",
  "Borrow the production automation lesson by exposing agent run logs, approvals, retries, exception queues, human overrides, uptime, and reliability scoring.",
  "Turn every failed output, accepted output, human override, and exception into vertical evals, scenario validations, prompts, routing rules, and reusable package logic.",
  "Create a Certified Outcome standard: delivery is not defensible until launch proof, acceptance receipts, pricing logic, escalation rules, operating guide, and outcome report are attached.",
  "Use the package marketplace as a compounding loop: clone the best working pattern, improve it with Outcome Graph data, specialize it by vertical, and distribute the certified version.",
  "Tie outcome billing proof to the graph so every invoice can point to accepted outputs, qualified leads, booked calls, recovered revenue, hours saved, or tasks completed.",
  "Identify painstaking drudgery by watching tailored time-in-motion workflows, not by guessing from a landing page or high-level industry map.",
  "Map the nitty-gritty path: how requests arrive by email, forms, calls, tickets, or spreadsheets; how they get enriched; and where manual data entry, call centers, or judgment bridge gaps.",
  "Look for hidden backend logic, informal checks, exception paths, reconciliation habits, and operator know-how that are invisible from superficial demos.",
  "Use 50% to 80% attrition in support or admin roles as a signal that the work is torturous enough for AI-native service replacement.",
  "Treat boring execution spaces like payroll, tax accounting, trucking compliance, insurance operations, and regulated admin as discovery territory.",
  "Validate boring spaces through the schlep: physical observation, frontline interviews, and workflow shadowing beat high-level assumptions.",
  "Look for overlooked operator pain like phone orders, 1-800-number workflows, spreadsheets, faxes, inbox queues, and specialist tribal knowledge that software builders rarely see.",
  "Find lossy human middleware: status rollups, fragmented handoffs, manager interpretation, duplicated updates, and manual coordination that closed loops can make queryable.",
  "Use truck-stop-style field research: go where the work happens, talk to frontline operators, and find fuel-card-like wedges that only appear through the schlep.",
  "Use forward-deployed validation: map tailored time-in-motion, request enrichment, call-center bridges, manual entry, approvals, and judgment points before packaging the offer.",
  "Prioritize mission-critical workflows where failures can cost real money, such as KYC, loan origination, legal review, accounting close, compliance checks, and customer operations.",
  "Separate the hackathon demo from production: an 80% prototype is not the product when the final 5% to 20% of consistency determines whether the service can be trusted.",
  "Treat the last 10% as validation, not cleanup: edge cases and specialized knowledge reveal whether the boring workflow can reach 99% reliability.",
  "Filter drudgery opportunities for existential pain: lost revenue, firing risk, compliance exposure, missed promotion, or business failure if the workflow stays manual.",
  "Run the Fire or Promotion test before packaging: the pain should make the buyer fear being fired, missing a promotion, avoiding the work, or losing business momentum.",
  "Separate the fire side from the promotion side: acute pain includes professional downside, while strong solutions create visible advancement or next-year growth upside.",
  "Reject nice-to-have packages that are not a top-three customer problem right now, even when the workflow feels useful.",
  "Use willingness to pay as the acuteness proof: the best customers complain about a high price but still pay because the unsolved pain is worse.",
  "Use pricing as a binary validation test: refusal to pay means weak pain, complaining but paying means real pain, and an instant yes often means the package is underpriced.",
  "Treat open-wallet behavior as the cleanest validation event: if the buyer will not pay, keep learning before calling the package a real business.",
  "Use pricing tests to segment demand: compare who pays, who stalls, who asks for a discount, and who connects the package directly to a budgeted pain.",
  "When the package is meaningfully better, test a premium instead of racing to the bottom; price should validate value, not merely hide weak differentiation.",
  "Look for opportunities lying in plain sight: high-stakes daily work that operators already endure and that can become a very large company when solved reliably.",
  "Mint specialized evals and datasets into customer operations so speed compounds into process power rather than one-off feature churn.",
  "Find and defend narrow vertical treasure before broad labs notice it; harden edge cases while bigger competitors prioritize platform goals.",
  "Build process power beyond the demo: reject wrapper thinking, push mission-critical workflows toward 99% accuracy, and encode the vertical edge cases competitors cannot see.",
  "Turn process automation into a moat through the painstaking last 10% needed for 99% accuracy in banking, legal, accounting, compliance, healthcare, and other high-stakes service environments.",
  "Make backend complexity part of the moat: policy rules, retries, audit trails, permissions, reconciliations, integrations, imports, exports, and reporting contracts should compound.",
  "Mint agents into customer operations with custom evals, thresholds, workflow rules, and acceptance receipts that create real switching costs.",
  "Use pilots to learn internal operations, then turn custom rules, integrations, reporting, approvals, and acceptance history into infrastructure the customer depends on.",
  "Run the company as an intelligence operating system: humans define specs, tests, approvals, and edge-case judgment while agents generate and operate the repeatable work.",
  "Treat the last 10% as the product: use TDD-style agent loops, scenario validations, eval flywheels, and domain edge-case work to push demos toward production reliability.",
  "Run engineering as a spec-and-test software factory: humans own harnesses and judgment while agents iterate on implementation until the harness passes.",
  "Replace line-by-line review with probabilistic review gates: scenario performance, confidence evidence, and acceptance receipts decide whether the output is reliable enough.",
  "Design for the thousandx engineer by surrounding one expert with agents, context engineering, prompt engineering, evals, and intelligence loops that incumbents struggle to adopt.",
  "Max tokens before headcount when AI spend replaces repetitive service labor; humans should wrangle agents and handle complex exceptions.",
  "Accept uncomfortably high API bills when token spend replaces HR, admin, engineering, and coordination headcount while keeping the organization leaner and faster.",
  "Rebuild the organization around token usage before headcount: agents handle repeatable operations while humans move to the edges as builders, operators, QA owners, approvers, and agent wranglers.",
  "Optional CRM, billing, calendar, phone, email, SMS, social, or publishing access improves live integrations but never blocks the base delivery.",
];

const packageRuleHighlights = [
  "Sell accepted outcomes, tasks completed, recovered revenue, and service capacity rather than seats or dashboards.",
  "Choose wedges where services spend, outsourced labor, high attrition, or regulated drudgery already creates budget urgency.",
  "Force demand proof with Fire or Promotion and the Binary Test: acute buyers may complain about price, but they still pay.",
  "Make the package a closed loop: every handoff, exception, approval, and acceptance receipt improves the next run.",
  "Make the Outcome Graph the defensibility layer: delivery history, vertical evals, Certified Outcomes, and outcome billing proof compound with every run.",
  "Represent what Lead OS borrows from other tools as operational requirements: resale motion, record trust, connectors, GTM data, brand rules, agent ops, and ontology depth.",
] as const;

const packageRuleThemes = [
  {
    title: "Outcome Pricing",
    summary: "The business should benefit when AI removes manual work.",
    keywords: ["per-seat", "pricing", "work delivered", "tasks completed", "wallet", "Binary Test", "open-wallet"],
  },
  {
    title: "Service Wedges",
    summary: "Start where buyers already pay for the service outcome.",
    keywords: ["outsourced", "banking", "healthcare", "legal", "HVAC", "trucking", "support", "attrition"],
  },
  {
    title: "Demand Guardrails",
    summary: "Reject pleasant-sounding ideas that do not carry urgent budget.",
    keywords: ["solution-in-search", "superficially", "tar pit", "Fire or Promotion", "top-three", "charge"],
  },
  {
    title: "Reliability Moats",
    summary: "Treat the last 10% of reliability as the actual product.",
    keywords: ["closed loop", "queryable", "artifact", "process power", "last 10%", "99%", "eval", "software factory"],
  },
  {
    title: "Outcome Graph",
    summary: "Use delivery evidence as the data moat, eval moat, switching-cost moat, and billing proof.",
    keywords: ["Outcome Graph", "Certified Outcome", "accepted output", "human override", "outcome billing", "marketplace"],
  },
  {
    title: "Tool Patterns",
    summary: "Borrow proven operating strengths from adjacent tools while keeping Lead OS centered on service outcomes.",
    keywords: ["agency platform", "CRM platform", "integration platform", "GTM tooling", "production automation", "other tools", "represented"],
  },
] as const;

function matchingPackageRules(keywords: readonly string[]) {
  const normalizedKeywords = keywords.map((keyword) => keyword.toLowerCase());
  return packageRules
    .filter((rule) => normalizedKeywords.some((keyword) => rule.toLowerCase().includes(keyword)))
    .slice(0, 7);
}

export default function PackagesPage() {
  const deliverableCount = provisionablePackages.reduce((total, pkg) => total + pkg.deliverables.length, 0);

  return (
    <main className="w-full max-w-none overflow-x-hidden p-0">
      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_0.8fr] lg:items-start">
          <div>
            <Badge variant="secondary" className="mb-4">
              Complete solution catalog
            </Badge>
            <h1 className="max-w-4xl text-3xl font-extrabold leading-tight text-foreground sm:text-5xl">
              Sell complete outcomes, not tools.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              This is the fulfillment entry point for productized AI agencies, consultants, founders, and operators.
              Pick the business result the client bought, collect the outcome context once, and Lead OS provisions the
              complete solution the business can use or show to its own audience.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="#package-list">
                  View agency solutions <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/onboard">Create operator account</Link>
              </Button>
            </div>
          </div>

          <aside className="rounded-lg border border-border bg-muted/35 p-4" aria-label="Solution launch decision frame">
            <div className="mb-3 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Package decision frame</h2>
            </div>
            <ul className="grid gap-3 pl-0">
              {packageRuleHighlights.map((rule) => (
                <li key={rule} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid gap-2">
              {packageRuleThemes.map((theme) => {
                const rules = matchingPackageRules(theme.keywords);
                return (
                  <details key={theme.title} className="rounded-md border border-border bg-background/70 p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-foreground">
                      {theme.title} <span className="font-normal text-muted-foreground">({rules.length} checks)</span>
                    </summary>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{theme.summary}</p>
                    <ul className="mt-3 grid gap-2 pl-0">
                      {rules.map((rule) => (
                        <li key={rule} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                );
              })}
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b border-border bg-muted/20">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-2xl font-extrabold text-foreground">B2B</p>
            <p className="text-sm text-muted-foreground">The paying buyer is a business operator: agency, consultant, SaaS team, franchise, founder, or service provider.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-2xl font-extrabold text-foreground">B2B2C</p>
            <p className="text-sm text-muted-foreground">Some solutions include lead, patient, shopper, applicant, student, or prospect-facing surfaces for the client's audience.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-2xl font-extrabold text-foreground">{deliverableCount}</p>
            <p className="text-sm text-muted-foreground">Finished outputs across intake, content, voice, ads, routing, reporting, billing, and delivery surfaces.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-2xl font-extrabold text-foreground">0 seats</p>
            <p className="text-sm text-muted-foreground">Packages are framed around service outcomes and operational throughput, not user licenses.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <PackageBundleProvisionForm
          packages={provisionablePackages.map((pkg) => ({
            slug: pkg.slug,
            title: pkg.title,
            customerOutcome: pkg.customerOutcome,
          }))}
          fields={getUniversalPackageCredentialFields()}
        />
      </section>

      <section id="package-list" className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <Badge variant="outline" className="mb-3">
            Sellable customer outcomes
          </Badge>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Choose the result the client business wants, then launch the complete solution.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Audience labels below separate the buyer from the end-user experience: B2B solutions stay inside the client
            business, while B2B2C solutions also create surfaces for the client's downstream audience.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {provisionablePackages.map((pkg) => (
            <Card key={pkg.slug} className="flex flex-col">
              <CardHeader>
                <div className="mb-2 flex items-center gap-2">
                  <PackageOpen className="h-5 w-5 text-primary" />
                  <Badge variant="outline">{pkg.deliverables.length} built pieces</Badge>
                </div>
                <CardTitle>{pkg.title}</CardTitle>
                <CardDescription>{pkg.customerOutcome}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="mb-4 grid gap-2 text-sm">
                  {(() => {
                    const audience = getPackageAudienceContract(pkg);
                    return (
                      <p>
                        <span className="font-semibold text-foreground">Audience model:</span>{" "}
                        <Badge variant={audience.model === "B2B2C" ? "default" : "outline"}>{audience.model}</Badge>{" "}
                        <span className="text-muted-foreground">{audience.summary}</span>
                      </p>
                    );
                  })()}
                  <p>
                    <span className="font-semibold text-foreground">Business buyer:</span>{" "}
                    <span className="text-muted-foreground">{pkg.buyerPersona}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Client business receives:</span>{" "}
                    <span className="text-muted-foreground">{pkg.launchPromise}</span>
                  </p>
                  {pkg.pricingModel ? (
                    <p>
                      <span className="font-semibold text-foreground">Suggested pricing:</span>{" "}
                      <span className="text-muted-foreground">{pkg.pricingModel}</span>
                    </p>
                  ) : null}
                  <p>
                    <span className="font-semibold text-foreground">Service replacement:</span>{" "}
                    <span className="text-muted-foreground">{getPackageServiceReplacementStrategy(pkg).outcomePricing}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Per-seat risk:</span>{" "}
                    <span className="text-muted-foreground">{getPackageServiceReplacementStrategy(pkg).perSeatRisk}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Idea guardrail:</span>{" "}
                    <span className="text-muted-foreground">{getPackageIdeaEvaluationGuardrails(pkg).superficialPlausibilityCheck}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Acute pain:</span>{" "}
                    <span className="text-muted-foreground">{getPackageIdeaEvaluationGuardrails(pkg).existentialPainTest}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Hard part:</span>{" "}
                    <span className="text-muted-foreground">{getPackageIdeaEvaluationGuardrails(pkg).hardPartHypothesis}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Available on:</span>{" "}
                    <span className="text-muted-foreground">{getPackagePlanNames(pkg)}</span>
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href={`/packages/${pkg.slug}`}>
                    Launch this solution <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
