export interface NurtureEmail {
  stage: number;
  dayOffset: number;
  subject: string;
  previewText: string;
  bodyTemplate: string;
}

export const NICHE_NURTURE_TEMPLATES: Record<string, NurtureEmail[]> = {
  /* ------------------------------------------------------------------ */
  /*  SERVICE                                                            */
  /* ------------------------------------------------------------------ */
  service: [
    {
      stage: 1,
      dayOffset: 0,
      subject: "Your {{niche}} growth roadmap is inside",
      previewText: "See the exact steps to grow your service business faster.",
      bodyTemplate:
        "Hi {{firstName}}, thanks for taking the first step toward smarter growth for your {{niche}} business. We put together a quick roadmap showing the three highest-impact changes you can make this month. {{brandName}} helps {{niche}} businesses automate the busywork so you can focus on billable hours. Reply to this email if you have questions -- we read every one.",
    },
    {
      stage: 2,
      dayOffset: 2,
      subject: "The #1 mistake {{niche}} businesses make with leads",
      previewText: "Most service businesses lose half their leads before anyone follows up.",
      bodyTemplate:
        "Hi {{firstName}}, the single biggest revenue leak we see in {{niche}} businesses is slow follow-up. When a new inquiry sits for more than an hour, the odds of converting that lead drop by over 80%. {{brandName}} fixes this with instant automated responses that keep prospects engaged while your team finishes the current job. Let us show you how it works in a quick 15-minute demo.",
    },
    {
      stage: 3,
      dayOffset: 5,
      subject: "How [Company] doubled their {{niche}} bookings in 30 days",
      previewText: "Real results from a business like yours.",
      bodyTemplate:
        "Hi {{firstName}}, one of our {{niche}} clients went from 40 bookings a month to 83 in just 30 days -- without adding a single team member. The secret was automating their quote follow-up and review requests so no lead slipped through the cracks. {{brandName}} made the whole thing possible with a few simple workflows. Want to see if similar results are realistic for your business?",
    },
    {
      stage: 4,
      dayOffset: 10,
      subject: "3 automations every {{niche}} business should run",
      previewText: "Set these up once and they work for you 24/7.",
      bodyTemplate:
        "Hi {{firstName}}, here are three automations that consistently move the needle for {{niche}} businesses: instant callback texts for missed calls, automated review requests after completed jobs, and timed follow-ups for unsold estimates. Each one takes minutes to configure inside {{brandName}} and runs on autopilot. Which one would make the biggest difference for you right now?",
    },
    {
      stage: 5,
      dayOffset: 14,
      subject: "We saved a spot for your {{niche}} strategy session",
      previewText: "Free 15-minute call to map out your growth plan.",
      bodyTemplate:
        "Hi {{firstName}}, we reserved a strategy session slot for your {{niche}} business. In 15 minutes we will audit your current lead flow, identify the biggest gaps, and outline a concrete plan to fix them. No pitch, no pressure -- just actionable advice you can use whether or not you choose {{brandName}}. Book your slot before it fills up.",
    },
    {
      stage: 6,
      dayOffset: 21,
      subject: "Last chance: your {{niche}} assessment results expire soon",
      previewText: "Your personalized growth report is waiting.",
      bodyTemplate:
        "Hi {{firstName}}, the personalized assessment we prepared for your {{niche}} business is about to expire. It includes your lead response score, automation readiness rating, and a prioritized action plan. Log in to {{brandName}} to review your results and see which improvements will deliver the fastest ROI. After this week the report will no longer be available.",
    },
    {
      stage: 7,
      dayOffset: 30,
      subject: "What top {{niche}} businesses do differently",
      previewText: "The patterns behind the fastest-growing service companies.",
      bodyTemplate:
        "Hi {{firstName}}, after working with hundreds of {{niche}} businesses we have noticed a clear pattern: the top performers automate their follow-up, measure every lead source, and never let a review go unasked. {{brandName}} makes all three automatic. If you are ready to join them, reply to this email and we will get you set up this week.",
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  LEGAL                                                              */
  /* ------------------------------------------------------------------ */
  legal: [
    {
      stage: 1,
      dayOffset: 0,
      subject: "Your {{niche}} intake efficiency report is ready",
      previewText: "See how your firm compares on intake speed and conversion.",
      bodyTemplate:
        "Hi {{firstName}}, thank you for exploring how {{brandName}} can streamline your {{niche}} practice. We have prepared an intake efficiency snapshot based on your assessment answers. It highlights where consultations are falling through the cracks and how much revenue that gap represents. Open it now to see your scores and recommended next steps.",
    },
    {
      stage: 2,
      dayOffset: 2,
      subject: "Why top {{niche}} firms never miss a follow-up",
      previewText: "The follow-up system elite firms rely on.",
      bodyTemplate:
        "Hi {{firstName}}, the highest-performing {{niche}} firms share one trait: they respond to every inquiry within minutes, not hours. Automated intake qualification ensures no potential client is left waiting. {{brandName}} routes qualified leads to the right attorney instantly while sending prospects a professional acknowledgment. The result is more signed cases with less admin burden.",
    },
    {
      stage: 3,
      dayOffset: 5,
      subject: "Case study: how [Firm] cut intake time by 60%",
      previewText: "A real firm slashed intake overhead and signed more cases.",
      bodyTemplate:
        "Hi {{firstName}}, a mid-size {{niche}} firm used {{brandName}} to automate their intake screening, conflict checks, and retainer delivery. The result was a 60% reduction in intake time and a measurable jump in signed cases per month. Every step was compliant with bar advertising rules and data-privacy requirements. Want to explore what a similar setup would look like for your firm?",
    },
    {
      stage: 4,
      dayOffset: 10,
      subject: "3 compliance risks hiding in your {{niche}} workflow",
      previewText: "Manual processes create gaps regulators notice.",
      bodyTemplate:
        "Hi {{firstName}}, manual intake workflows in {{niche}} practices often hide compliance risks: missed conflict checks, inconsistent retainer language, and untracked prospect communications. {{brandName}} addresses all three with automated screening, template-driven documents, and a full audit trail. Protecting your practice starts with eliminating human error in repeatable processes.",
    },
    {
      stage: 5,
      dayOffset: 14,
      subject: "Your strategy session slot is reserved",
      previewText: "Free 15-minute intake audit for your firm.",
      bodyTemplate:
        "Hi {{firstName}}, we have reserved a complimentary strategy session for your {{niche}} practice. In 15 minutes we will review your intake funnel, identify the biggest conversion bottleneck, and map out a fix. No obligation -- just practical advice from a team that understands {{niche}} workflows. Claim your slot before it expires.",
    },
    {
      stage: 6,
      dayOffset: 21,
      subject: "Final reminder: your {{niche}} assessment expires tomorrow",
      previewText: "Your personalized firm report will not be available much longer.",
      bodyTemplate:
        "Hi {{firstName}}, the intake assessment we generated for your {{niche}} firm expires tomorrow. It contains your response-time score, conversion benchmarks, and a prioritized improvement plan. Log in to {{brandName}} to view it before access closes. Even if you are not ready to act today, the data is worth saving for your next planning session.",
    },
    {
      stage: 7,
      dayOffset: 30,
      subject: "What elite {{niche}} practices do that average ones do not",
      previewText: "Patterns from the highest-converting law firms.",
      bodyTemplate:
        "Hi {{firstName}}, after analyzing intake data from dozens of {{niche}} practices, the pattern is clear: elite firms qualify faster, follow up automatically, and measure every step. {{brandName}} gives you the tools to do all three without adding headcount. When you are ready to close more cases with less effort, reply and we will get started.",
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  HEALTH                                                             */
  /* ------------------------------------------------------------------ */
  health: [
    {
      stage: 1,
      dayOffset: 0,
      subject: "Your {{niche}} practice growth report is ready",
      previewText: "A snapshot of where your practice stands and where it can go.",
      bodyTemplate:
        "Hi {{firstName}}, thanks for exploring how {{brandName}} supports {{niche}} practices. We have generated a growth report based on your assessment, covering no-show rates, reactivation potential, and patient communication gaps. Open it now to see the data and our recommended first moves.",
    },
    {
      stage: 2,
      dayOffset: 2,
      subject: "The hidden cost of no-shows in {{niche}} practices",
      previewText: "Every empty chair is lost revenue you can recover.",
      bodyTemplate:
        "Hi {{firstName}}, the average {{niche}} practice loses thousands each month to no-shows. Automated appointment reminders via text and email cut that number by up to 60%. {{brandName}} sends HIPAA-compliant reminders at the right intervals so patients actually show up. Less wasted time, more revenue per day -- without any extra staff effort.",
    },
    {
      stage: 3,
      dayOffset: 5,
      subject: "How [Practice] added 50 patients per month with automation",
      previewText: "A real practice grew faster by automating the basics.",
      bodyTemplate:
        "Hi {{firstName}}, a {{niche}} practice used {{brandName}} to automate appointment reminders, post-visit follow-ups, and dormant-patient reactivation campaigns. Within 90 days they added 50 net new patient visits per month and reduced no-shows by half. The setup took less than two weeks. Let us show you what a similar plan would look like for your practice.",
    },
    {
      stage: 4,
      dayOffset: 10,
      subject: "3 patient experience gaps most {{niche}} practices miss",
      previewText: "Small fixes that make a big difference in retention.",
      bodyTemplate:
        "Hi {{firstName}}, the most common patient experience gaps in {{niche}} practices are slow scheduling responses, no post-visit check-in, and zero outreach to dormant patients. Each one is fixable with a simple automation inside {{brandName}}. Closing these gaps improves satisfaction scores and keeps your schedule full without marketing spend increases.",
    },
    {
      stage: 5,
      dayOffset: 14,
      subject: "Your strategy call is waiting",
      previewText: "Free 15-minute practice growth audit.",
      bodyTemplate:
        "Hi {{firstName}}, we have a strategy call slot reserved for your {{niche}} practice. In 15 minutes we will identify your top revenue leaks, map out the automations that fix them, and give you a concrete timeline. No obligation -- just actionable insight from a team that works exclusively with {{niche}} providers. Book your call now.",
    },
    {
      stage: 6,
      dayOffset: 21,
      subject: "Last chance: your {{niche}} assessment results expire soon",
      previewText: "Your personalized practice report is about to disappear.",
      bodyTemplate:
        "Hi {{firstName}}, the growth assessment we built for your {{niche}} practice expires this week. It includes your no-show recovery estimate, reactivation projections, and a step-by-step action plan. Log in to {{brandName}} to save your results before they are gone. The insights are valuable whether you act now or later.",
    },
    {
      stage: 7,
      dayOffset: 30,
      subject: "What high-growth {{niche}} practices do differently",
      previewText: "The habits that separate thriving practices from the rest.",
      bodyTemplate:
        "Hi {{firstName}}, the fastest-growing {{niche}} practices all share a few habits: they automate reminders, re-engage dormant patients, and ask for reviews after every visit. {{brandName}} makes all three automatic and HIPAA-compliant. When you are ready to grow without adding overhead, reply and we will build your plan.",
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  TECH                                                               */
  /* ------------------------------------------------------------------ */
  tech: [
    {
      stage: 1,
      dayOffset: 0,
      subject: "Your {{niche}} growth audit results are inside",
      previewText: "See where your product stands on activation, conversion, and retention.",
      bodyTemplate:
        "Hi {{firstName}}, thanks for running the {{niche}} growth audit with {{brandName}}. Your report covers trial activation, conversion bottlenecks, and churn risk signals. Each section includes benchmarks from similar SaaS products so you can see exactly where the biggest opportunities are. Open it now to get started.",
    },
    {
      stage: 2,
      dayOffset: 2,
      subject: "Why 80% of {{niche}} trial users never activate",
      previewText: "The activation gap is costing you more than you think.",
      bodyTemplate:
        "Hi {{firstName}}, most {{niche}} products lose the majority of trial users before they ever reach the aha moment. The fix is behavior-triggered onboarding that guides users to value milestones automatically. {{brandName}} scores users by engagement and triggers the right nudge at the right time so your team can focus on high-intent prospects.",
    },
    {
      stage: 3,
      dayOffset: 5,
      subject: "How [Company] cut churn 40% with automated onboarding",
      previewText: "A real SaaS company dramatically improved retention.",
      bodyTemplate:
        "Hi {{firstName}}, a {{niche}} company used {{brandName}} to deploy behavior-based onboarding sequences and automated health scoring. Churn dropped 40% in one quarter, and trial-to-paid conversion increased by a third. The system identifies at-risk accounts early so your team can intervene before cancellation. Ready to see what this looks like for your product?",
    },
    {
      stage: 4,
      dayOffset: 10,
      subject: "3 product-led growth plays for {{niche}} companies",
      previewText: "Proven tactics to scale without adding sales reps.",
      bodyTemplate:
        "Hi {{firstName}}, here are three PLG plays that consistently work for {{niche}} companies: milestone-based email nudges during trials, in-app expansion prompts for power users, and automated win-back campaigns for churned accounts. {{brandName}} handles all three out of the box. Which play would move the needle fastest for you?",
    },
    {
      stage: 5,
      dayOffset: 14,
      subject: "Your strategy session is reserved",
      previewText: "Free 15-minute growth roadmap for your product.",
      bodyTemplate:
        "Hi {{firstName}}, we have reserved a strategy session for your {{niche}} product. In 15 minutes we will walk through your activation funnel, identify the highest-ROI improvements, and outline a 30-day plan. No pitch, just data-driven advice from a team that lives and breathes {{niche}} growth. Book your slot before it fills up.",
    },
    {
      stage: 6,
      dayOffset: 21,
      subject: "Final reminder: your {{niche}} growth report expires soon",
      previewText: "Your benchmarks and action plan will not be available much longer.",
      bodyTemplate:
        "Hi {{firstName}}, the growth audit we generated for your {{niche}} product expires soon. It contains your activation rate benchmarks, churn risk flags, and a prioritized improvement roadmap. Log in to {{brandName}} to review and save your results. Even if timing is not right today, the data will be useful at your next planning cycle.",
    },
    {
      stage: 7,
      dayOffset: 30,
      subject: "The playbook top {{niche}} products use to scale",
      previewText: "Patterns from the fastest-growing SaaS companies.",
      bodyTemplate:
        "Hi {{firstName}}, the best-performing {{niche}} products share a pattern: they automate onboarding, score engagement in real time, and trigger human outreach only when it matters. {{brandName}} gives you the infrastructure to do all three from day one. When you are ready to scale smarter, reply and we will get you set up.",
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  CONSTRUCTION                                                       */
  /* ------------------------------------------------------------------ */
  construction: [
    {
      stage: 1,
      dayOffset: 0,
      subject: "Your {{niche}} operations report is ready",
      previewText: "See how your bid pipeline and follow-up stack up.",
      bodyTemplate:
        "Hi {{firstName}}, thanks for completing the {{niche}} operations assessment with {{brandName}}. Your report breaks down your bid pipeline, follow-up cadence, and scheduling efficiency with benchmarks from similar contractors. Open it now to see where the biggest revenue opportunities are hiding.",
    },
    {
      stage: 2,
      dayOffset: 2,
      subject: "Why the fastest {{niche}} contractors always win the bid",
      previewText: "Speed to estimate is the new competitive advantage.",
      bodyTemplate:
        "Hi {{firstName}}, in {{niche}}, the contractor who responds first wins the bid more often than not. Automated estimate follow-ups and instant inquiry acknowledgments give you a decisive edge. {{brandName}} makes sure every lead gets a professional response in minutes, not days, so you never lose a job to a slower competitor.",
    },
    {
      stage: 3,
      dayOffset: 5,
      subject: "How [Company] eliminated scheduling conflicts across 15 crews",
      previewText: "A real contractor streamlined operations with automation.",
      bodyTemplate:
        "Hi {{firstName}}, a {{niche}} company managing 15 crews used {{brandName}} to centralize scheduling, automate bid follow-ups, and track job progress in real time. Scheduling conflicts dropped to near zero and their bid close rate jumped significantly. Let us walk you through how a similar setup would work for your operation.",
    },
    {
      stage: 4,
      dayOffset: 10,
      subject: "3 automations every {{niche}} business needs today",
      previewText: "Set these up once and they pay for themselves.",
      bodyTemplate:
        "Hi {{firstName}}, the three automations that deliver the fastest ROI for {{niche}} businesses are: instant inquiry acknowledgments, timed estimate follow-up sequences, and automated review requests after job completion. Each one takes minutes to set up inside {{brandName}} and runs without any manual effort. Which one would help you most right now?",
    },
    {
      stage: 5,
      dayOffset: 14,
      subject: "Your strategy session slot is reserved",
      previewText: "Free 15-minute operations audit for your business.",
      bodyTemplate:
        "Hi {{firstName}}, we have a strategy session reserved for your {{niche}} business. In 15 minutes we will review your bid pipeline, identify follow-up gaps, and build a plan to close more jobs without adding overhead. No obligation -- just practical advice from a team that works with {{niche}} businesses every day. Claim your slot now.",
    },
    {
      stage: 6,
      dayOffset: 21,
      subject: "Last chance: your {{niche}} operations assessment expires tomorrow",
      previewText: "Your personalized report is about to expire.",
      bodyTemplate:
        "Hi {{firstName}}, the operations assessment we prepared for your {{niche}} business expires tomorrow. It includes your bid response score, follow-up benchmarks, and a prioritized action plan. Log in to {{brandName}} to save your results before they are gone. The insights are worth keeping for your next planning cycle.",
    },
    {
      stage: 7,
      dayOffset: 30,
      subject: "What top {{niche}} contractors do that average ones do not",
      previewText: "Habits that separate the busiest crews from the rest.",
      bodyTemplate:
        "Hi {{firstName}}, the top-performing {{niche}} contractors all do three things: they respond to inquiries the same day, follow up on every unsold estimate, and ask for reviews after every job. {{brandName}} automates all three so your team can stay focused on the jobsite. When you are ready to close more bids, reply and we will build your plan.",
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  REAL-ESTATE                                                        */
  /* ------------------------------------------------------------------ */
  "real-estate": [
    {
      stage: 1,
      dayOffset: 0,
      subject: "Your {{niche}} lead conversion report is inside",
      previewText: "See how your lead response and nurture compare to top producers.",
      bodyTemplate:
        "Hi {{firstName}}, thank you for running the {{niche}} lead conversion assessment with {{brandName}}. Your report covers response speed, nurture cadence, and conversion benchmarks from top-producing teams. Open it now to see where the biggest commission opportunities are hiding in your pipeline.",
    },
    {
      stage: 2,
      dayOffset: 2,
      subject: "The 5-minute rule that top {{niche}} agents swear by",
      previewText: "Speed to lead separates top producers from the rest.",
      bodyTemplate:
        "Hi {{firstName}}, in {{niche}}, responding within five minutes makes you dramatically more likely to win the appointment. Most agents take hours or even days. {{brandName}} sends instant, personalized responses to every portal lead so you are always first. Your team only talks to prospects who are ready to move forward.",
    },
    {
      stage: 3,
      dayOffset: 5,
      subject: "How [Agent] closed 12 more deals in 6 months with automation",
      previewText: "A real agent grew production without growing the team.",
      bodyTemplate:
        "Hi {{firstName}}, a {{niche}} agent used {{brandName}} to automate lead response, long-term nurture drips, and post-closing review requests. The result was 12 additional closings in six months with zero new hires. The system kept cold leads warm until they were ready to transact. Want to see what a similar setup would look like for your business?",
    },
    {
      stage: 4,
      dayOffset: 10,
      subject: "3 follow-up sequences every {{niche}} team should run",
      previewText: "Proven drip campaigns that convert portal leads.",
      bodyTemplate:
        "Hi {{firstName}}, the three nurture sequences that consistently convert for {{niche}} teams are: a 14-day hot-lead drip, a 6-month long-term nurture, and a past-client reactivation campaign. {{brandName}} includes templates for all three that you can deploy in minutes. Which sequence would impact your pipeline the most right now?",
    },
    {
      stage: 5,
      dayOffset: 14,
      subject: "Your strategy session is reserved",
      previewText: "Free 15-minute lead conversion audit.",
      bodyTemplate:
        "Hi {{firstName}}, we reserved a strategy session for your {{niche}} business. In 15 minutes we will audit your lead sources, identify conversion bottlenecks, and map out a plan to close more deals from the leads you already have. No pitch -- just actionable insight from a team that understands {{niche}} sales cycles. Book your call now.",
    },
    {
      stage: 6,
      dayOffset: 21,
      subject: "Final reminder: your {{niche}} assessment results expire tomorrow",
      previewText: "Your lead conversion benchmarks are about to disappear.",
      bodyTemplate:
        "Hi {{firstName}}, the lead conversion assessment we built for your {{niche}} business expires tomorrow. It includes your response-time score, nurture benchmarks, and a prioritized improvement plan. Log in to {{brandName}} to save your results before access closes. The data is valuable whether you act now or next quarter.",
    },
    {
      stage: 7,
      dayOffset: 30,
      subject: "What top-producing {{niche}} teams do differently",
      previewText: "Patterns from the agents closing the most deals.",
      bodyTemplate:
        "Hi {{firstName}}, the top-producing {{niche}} teams all share a pattern: instant response, long-term nurture, and systematic review generation. {{brandName}} automates all three so you can focus on appointments instead of admin. When you are ready to convert more of the leads you are already paying for, reply and we will get started.",
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  EDUCATION                                                          */
  /* ------------------------------------------------------------------ */
  education: [
    {
      stage: 1,
      dayOffset: 0,
      subject: "Your {{niche}} enrollment growth report is inside",
      previewText: "See how your admissions funnel compares to top programs.",
      bodyTemplate:
        "Hi {{firstName}}, thanks for completing the {{niche}} enrollment assessment with {{brandName}}. Your report covers inquiry response times, application completion rates, and enrollment conversion benchmarks. Open it now to see where prospective students are falling out of your funnel.",
    },
    {
      stage: 2,
      dayOffset: 2,
      subject: "Why top {{niche}} programs never lose a prospective student",
      previewText: "The follow-up system high-enrollment programs rely on.",
      bodyTemplate:
        "Hi {{firstName}}, the highest-enrollment {{niche}} programs respond to every inquiry within minutes and nurture applicants with personalized sequences. Students who feel seen enroll; students who feel ignored choose competitors. {{brandName}} automates the entire journey from first inquiry to orientation so no prospective student slips through the cracks.",
    },
    {
      stage: 3,
      dayOffset: 5,
      subject: "How [Institution] boosted enrollment 35% with automation",
      previewText: "A real program grew enrollment without adding admissions staff.",
      bodyTemplate:
        "Hi {{firstName}}, a {{niche}} institution used {{brandName}} to automate inquiry responses, application reminders, and admitted-student nurture campaigns. Enrollment grew 35% in one cycle without any increase in admissions headcount. The key was consistent, personalized outreach at every stage. Let us show you what a similar plan looks like for your program.",
    },
    {
      stage: 4,
      dayOffset: 10,
      subject: "3 admissions automations every {{niche}} program needs",
      previewText: "Close the gaps where prospective students drop off.",
      bodyTemplate:
        "Hi {{firstName}}, the three automations that consistently lift enrollment for {{niche}} programs are: instant inquiry acknowledgment, application deadline reminders, and post-acceptance engagement sequences. Each one addresses a known drop-off point in the admissions funnel. {{brandName}} makes all three simple to deploy and measure.",
    },
    {
      stage: 5,
      dayOffset: 14,
      subject: "Your strategy session is reserved",
      previewText: "Free 15-minute enrollment funnel audit.",
      bodyTemplate:
        "Hi {{firstName}}, we have reserved a strategy session for your {{niche}} program. In 15 minutes we will walk through your admissions funnel, identify the biggest drop-off points, and outline a concrete improvement plan. No obligation -- just practical advice from a team focused on {{niche}} enrollment growth. Book your slot now.",
    },
    {
      stage: 6,
      dayOffset: 21,
      subject: "Final reminder: your {{niche}} enrollment report expires soon",
      previewText: "Your admissions benchmarks and action plan are about to expire.",
      bodyTemplate:
        "Hi {{firstName}}, the enrollment growth report we built for your {{niche}} program expires soon. It includes your inquiry-to-enrollment conversion rate, response-time score, and a step-by-step improvement plan. Log in to {{brandName}} to save your results before they disappear. The insights will be useful whenever you are ready to act.",
    },
    {
      stage: 7,
      dayOffset: 30,
      subject: "What high-enrollment {{niche}} programs do differently",
      previewText: "Patterns from the programs that consistently hit targets.",
      bodyTemplate:
        "Hi {{firstName}}, the {{niche}} programs that consistently hit enrollment targets all share three habits: instant inquiry response, personalized nurture at every stage, and data-driven decision making. {{brandName}} powers all three. When you are ready to grow enrollment without growing your admissions team, reply and we will build your plan.",
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  FINANCE                                                            */
  /* ------------------------------------------------------------------ */
  finance: [
    {
      stage: 1,
      dayOffset: 0,
      subject: "Your {{niche}} practice efficiency report is inside",
      previewText: "See how your onboarding and conversion compare to top firms.",
      bodyTemplate:
        "Hi {{firstName}}, thank you for completing the {{niche}} practice assessment with {{brandName}}. Your report covers prospect conversion rates, onboarding speed, and client retention benchmarks. Open it now to see where the highest-value improvements are for your firm.",
    },
    {
      stage: 2,
      dayOffset: 2,
      subject: "Why compliant {{niche}} firms grow faster",
      previewText: "Automation and compliance are not mutually exclusive.",
      bodyTemplate:
        "Hi {{firstName}}, the fastest-growing {{niche}} firms have figured out that automation and compliance go hand in hand. Automated onboarding sequences ensure every disclosure is delivered, every form is collected, and every step is documented. {{brandName}} keeps your practice compliant while accelerating the client experience.",
    },
    {
      stage: 3,
      dayOffset: 5,
      subject: "How [Firm] onboards clients 60% faster with automation",
      previewText: "A real advisory firm transformed their client experience.",
      bodyTemplate:
        "Hi {{firstName}}, a {{niche}} firm used {{brandName}} to digitize their onboarding workflow -- from prospect intake to account opening. Onboarding time dropped 60%, compliance documentation was always complete, and new clients reported a dramatically better experience. Want to see how a similar setup would work for your practice?",
    },
    {
      stage: 4,
      dayOffset: 10,
      subject: "3 compliance risks hiding in your {{niche}} workflow",
      previewText: "Manual processes create audit exposure you may not see.",
      bodyTemplate:
        "Hi {{firstName}}, the three compliance risks we see most often in {{niche}} practices are: inconsistent disclosure delivery, gaps in prospect communication logs, and missed follow-up documentation. Each one creates audit exposure. {{brandName}} eliminates all three with automated workflows and a complete audit trail. Prevention is always cheaper than remediation.",
    },
    {
      stage: 5,
      dayOffset: 14,
      subject: "Your strategy session is reserved",
      previewText: "Free 15-minute practice efficiency audit.",
      bodyTemplate:
        "Hi {{firstName}}, we have reserved a strategy session for your {{niche}} practice. In 15 minutes we will review your onboarding flow, identify compliance gaps, and outline a plan to convert more prospects while reducing risk. No obligation -- just practical advice from a team that understands {{niche}} regulations. Book your slot now.",
    },
    {
      stage: 6,
      dayOffset: 21,
      subject: "Final reminder: your {{niche}} assessment expires tomorrow",
      previewText: "Your firm benchmarks and action plan are about to expire.",
      bodyTemplate:
        "Hi {{firstName}}, the practice efficiency assessment we prepared for your {{niche}} firm expires tomorrow. It includes your conversion benchmarks, onboarding speed scores, and a prioritized improvement roadmap. Log in to {{brandName}} to review and save your results before access closes.",
    },
    {
      stage: 7,
      dayOffset: 30,
      subject: "What elite {{niche}} practices do that average ones do not",
      previewText: "Patterns from the most efficient advisory firms.",
      bodyTemplate:
        "Hi {{firstName}}, the most successful {{niche}} practices share three traits: fast compliant onboarding, automated prospect nurture, and proactive client engagement. {{brandName}} makes all three possible without adding staff or complexity. When you are ready to grow your practice efficiently, reply and we will get started.",
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  FRANCHISE                                                          */
  /* ------------------------------------------------------------------ */
  franchise: [
    {
      stage: 1,
      dayOffset: 0,
      subject: "Your {{niche}} franchise growth report is inside",
      previewText: "See how your network stacks up on lead handling and compliance.",
      bodyTemplate:
        "Hi {{firstName}}, thanks for completing the {{niche}} franchise assessment with {{brandName}}. Your report covers lead routing consistency, brand compliance scores, and performance gaps across locations. Open it now to see where the biggest network-wide improvements are waiting.",
    },
    {
      stage: 2,
      dayOffset: 2,
      subject: "The #1 mistake {{niche}} franchise systems make with leads",
      previewText: "Inconsistent lead handling is killing network ROI.",
      bodyTemplate:
        "Hi {{firstName}}, the biggest revenue leak in {{niche}} franchise systems is inconsistent lead handling across locations. When some franchisees respond in minutes and others take days, the brand suffers and marketing dollars are wasted. {{brandName}} standardizes lead routing and follow-up across every location so your network performs like your best location.",
    },
    {
      stage: 3,
      dayOffset: 5,
      subject: "How [Brand] unified marketing across 30 locations",
      previewText: "A real franchise system achieved brand consistency at scale.",
      bodyTemplate:
        "Hi {{firstName}}, a {{niche}} franchise brand with 30 locations used {{brandName}} to centralize lead routing, enforce brand-compliant funnels, and give each franchisee a performance dashboard. The result was dramatically improved ROAS and near-perfect brand compliance across the network. Let us show you what a similar setup would look like for your system.",
    },
    {
      stage: 4,
      dayOffset: 10,
      subject: "3 franchise automations that pay for themselves in 30 days",
      previewText: "Quick wins that improve network performance immediately.",
      bodyTemplate:
        "Hi {{firstName}}, the three automations that deliver the fastest ROI for {{niche}} franchise systems are: territory-based lead routing, brand-compliant local landing pages, and cross-location performance benchmarking. Each one takes days, not months, to deploy inside {{brandName}}. Which one would make the biggest impact on your network right now?",
    },
    {
      stage: 5,
      dayOffset: 14,
      subject: "Your strategy session is reserved",
      previewText: "Free 15-minute franchise network audit.",
      bodyTemplate:
        "Hi {{firstName}}, we have a strategy session reserved for your {{niche}} franchise system. In 15 minutes we will review your lead routing logic, identify compliance gaps, and map out a plan to lift network-wide performance. No obligation -- just practical insights from a team that works with franchise brands every day. Claim your slot now.",
    },
    {
      stage: 6,
      dayOffset: 21,
      subject: "Final reminder: your {{niche}} franchise assessment expires tomorrow",
      previewText: "Your network benchmarks are about to disappear.",
      bodyTemplate:
        "Hi {{firstName}}, the franchise assessment we prepared for your {{niche}} system expires tomorrow. It includes your lead routing scores, compliance benchmarks, and a location-by-location improvement plan. Log in to {{brandName}} to save your results before access closes. The data is worth keeping for your next franchise operations review.",
    },
    {
      stage: 7,
      dayOffset: 30,
      subject: "What top-performing {{niche}} franchise systems do differently",
      previewText: "Patterns from the franchise brands that dominate their markets.",
      bodyTemplate:
        "Hi {{firstName}}, the highest-performing {{niche}} franchise systems all standardize three things: lead handling speed, brand-compliant marketing materials, and cross-location benchmarking. {{brandName}} automates all three at scale. When you are ready to bring every location up to your best location's performance, reply and we will get started.",
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  STAFFING                                                           */
  /* ------------------------------------------------------------------ */
  staffing: [
    {
      stage: 1,
      dayOffset: 0,
      subject: "Your {{niche}} agency performance report is inside",
      previewText: "See how your fill rate and time-to-fill compare.",
      bodyTemplate:
        "Hi {{firstName}}, thanks for running the {{niche}} agency performance assessment with {{brandName}}. Your report covers fill rates, time-to-fill benchmarks, and candidate sourcing efficiency. Open it now to see where the biggest placement revenue opportunities are in your pipeline.",
    },
    {
      stage: 2,
      dayOffset: 2,
      subject: "Why the fastest {{niche}} agencies always win the placement",
      previewText: "Speed to submit separates top agencies from the rest.",
      bodyTemplate:
        "Hi {{firstName}}, in {{niche}}, the agency that submits qualified candidates first wins the placement. Automated candidate scoring and instant job-match alerts give your recruiters a decisive speed advantage. {{brandName}} surfaces the best-fit candidates from your database the moment a new req comes in so your team submits first, every time.",
    },
    {
      stage: 3,
      dayOffset: 5,
      subject: "How [Agency] doubled fill rate with automated sourcing",
      previewText: "A real staffing agency transformed their placement metrics.",
      bodyTemplate:
        "Hi {{firstName}}, a {{niche}} agency used {{brandName}} to automate candidate matching, submission tracking, and client reporting. Their fill rate doubled and time-to-fill dropped by a third. Recruiters spent less time on admin and more time on high-value client and candidate conversations. Want to see what a similar setup would deliver for your agency?",
    },
    {
      stage: 4,
      dayOffset: 10,
      subject: "3 recruitment automations every {{niche}} agency needs",
      previewText: "Proven workflows that increase placements per recruiter.",
      bodyTemplate:
        "Hi {{firstName}}, the three automations that consistently boost placement volume for {{niche}} agencies are: AI-powered candidate-job matching, automated interview scheduling, and client-facing submission dashboards. {{brandName}} includes all three out of the box. Which automation would have the biggest impact on your team right now?",
    },
    {
      stage: 5,
      dayOffset: 14,
      subject: "Your strategy session is reserved",
      previewText: "Free 15-minute agency performance audit.",
      bodyTemplate:
        "Hi {{firstName}}, we reserved a strategy session for your {{niche}} agency. In 15 minutes we will review your recruitment workflow, identify the biggest bottlenecks, and outline a plan to increase placements without adding recruiters. No obligation -- just actionable advice from a team that understands {{niche}} operations. Book your call now.",
    },
    {
      stage: 6,
      dayOffset: 21,
      subject: "Final reminder: your {{niche}} assessment expires tomorrow",
      previewText: "Your agency benchmarks are about to expire.",
      bodyTemplate:
        "Hi {{firstName}}, the performance assessment we built for your {{niche}} agency expires tomorrow. It includes your fill rate benchmarks, time-to-fill scores, and a prioritized improvement plan. Log in to {{brandName}} to save your results before access closes. The data will be valuable at your next team planning session.",
    },
    {
      stage: 7,
      dayOffset: 30,
      subject: "What top {{niche}} agencies do that average ones do not",
      previewText: "Patterns from the highest-performing staffing firms.",
      bodyTemplate:
        "Hi {{firstName}}, the top-performing {{niche}} agencies share three traits: automated candidate matching, instant submission workflows, and data-driven client reporting. {{brandName}} powers all three so your recruiters focus on relationships, not admin. When you are ready to place more candidates with less effort, reply and we will build your plan.",
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  FAITH                                                              */
  /* ------------------------------------------------------------------ */
  faith: [
    {
      stage: 1,
      dayOffset: 0,
      subject: "Your {{niche}} community growth report is inside",
      previewText: "See how your engagement and outreach compare to thriving communities.",
      bodyTemplate:
        "Hi {{firstName}}, thanks for completing the {{niche}} community growth assessment with {{brandName}}. Your report covers visitor follow-up, member engagement, and giving participation rates. Open it now to see where the greatest growth opportunities are for your community.",
    },
    {
      stage: 2,
      dayOffset: 2,
      subject: "Why growing {{niche}} communities never miss a visitor follow-up",
      previewText: "First impressions determine whether visitors come back.",
      bodyTemplate:
        "Hi {{firstName}}, the fastest-growing {{niche}} communities all have one thing in common: every visitor receives a personal follow-up within 24 hours. Automated welcome sequences make this possible even with a small staff. {{brandName}} sends the right message at the right time so every visitor feels seen and invited back.",
    },
    {
      stage: 3,
      dayOffset: 5,
      subject: "How [Organization] doubled visitor retention with automation",
      previewText: "A real community dramatically improved their assimilation process.",
      bodyTemplate:
        "Hi {{firstName}}, a {{niche}} community used {{brandName}} to automate visitor follow-up, new member onboarding, and volunteer coordination. Visitor retention doubled and giving participation grew steadily over six months. The staff spent less time on logistics and more time on ministry. Let us show you what a similar approach would look like for your community.",
    },
    {
      stage: 4,
      dayOffset: 10,
      subject: "3 engagement automations every {{niche}} community needs",
      previewText: "Simple workflows that deepen connection and participation.",
      bodyTemplate:
        "Hi {{firstName}}, the three automations that consistently grow {{niche}} communities are: visitor welcome sequences, event reminder and follow-up campaigns, and recurring giving nudges for first-time donors. Each one strengthens connection without adding staff burden. {{brandName}} makes all three easy to set up and maintain. Which one would help your community most?",
    },
    {
      stage: 5,
      dayOffset: 14,
      subject: "Your strategy session is reserved",
      previewText: "Free 15-minute community growth audit.",
      bodyTemplate:
        "Hi {{firstName}}, we have a strategy session reserved for your {{niche}} community. In 15 minutes we will review your visitor follow-up process, engagement gaps, and growth opportunities. No obligation -- just practical advice from a team that cares about helping {{niche}} communities thrive. Book your session now.",
    },
    {
      stage: 6,
      dayOffset: 21,
      subject: "Final reminder: your {{niche}} assessment expires soon",
      previewText: "Your community growth report is about to disappear.",
      bodyTemplate:
        "Hi {{firstName}}, the growth assessment we built for your {{niche}} community expires soon. It includes your visitor retention score, engagement benchmarks, and a step-by-step action plan. Log in to {{brandName}} to save your results before they are gone. The insights will be useful whenever you are ready to take the next step.",
    },
    {
      stage: 7,
      dayOffset: 30,
      subject: "What thriving {{niche}} communities do differently",
      previewText: "Patterns from the communities that keep growing year after year.",
      bodyTemplate:
        "Hi {{firstName}}, the {{niche}} communities that grow consistently all share three habits: they follow up with every visitor, they nurture new members intentionally, and they make giving easy and recurring. {{brandName}} automates all three. When you are ready to grow your community without burning out your team, reply and we will help you get started.",
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  CREATIVE                                                           */
  /* ------------------------------------------------------------------ */
  creative: [
    {
      stage: 1,
      dayOffset: 0,
      subject: "Your {{niche}} business growth report is inside",
      previewText: "See how your pipeline and proposal process compare.",
      bodyTemplate:
        "Hi {{firstName}}, thanks for completing the {{niche}} business growth assessment with {{brandName}}. Your report covers inquiry volume, proposal win rates, and client acquisition efficiency. Open it now to see where the biggest revenue opportunities are in your pipeline.",
    },
    {
      stage: 2,
      dayOffset: 2,
      subject: "Why the best {{niche}} professionals never chase clients",
      previewText: "The inbound system that replaces cold outreach.",
      bodyTemplate:
        "Hi {{firstName}}, the most successful {{niche}} professionals have replaced cold outreach with inbound systems that attract qualified prospects automatically. Portfolio-driven funnels, automated inquiry qualification, and consistent follow-up create a steady pipeline without the feast-or-famine cycle. {{brandName}} makes the whole system work on autopilot.",
    },
    {
      stage: 3,
      dayOffset: 5,
      subject: "How [Studio] eliminated feast-or-famine cycles with automation",
      previewText: "A real creative business stabilized their revenue.",
      bodyTemplate:
        "Hi {{firstName}}, a {{niche}} studio used {{brandName}} to automate inquiry qualification, proposal follow-ups, and past-client re-engagement. Within three months they eliminated the feast-or-famine cycle that had plagued them for years. Revenue became predictable and the team could focus on creative work instead of sales. Want to see what this would look like for your business?",
    },
    {
      stage: 4,
      dayOffset: 10,
      subject: "3 client acquisition plays for {{niche}} businesses",
      previewText: "Proven strategies to keep your pipeline full.",
      bodyTemplate:
        "Hi {{firstName}}, the three client acquisition plays that work best for {{niche}} businesses are: portfolio-driven lead magnets, automated proposal follow-up sequences, and past-client reactivation campaigns. Each one addresses a different part of the revenue cycle. {{brandName}} handles all three out of the box. Which play would move the needle fastest for you?",
    },
    {
      stage: 5,
      dayOffset: 14,
      subject: "Your strategy session is reserved",
      previewText: "Free 15-minute pipeline audit for your business.",
      bodyTemplate:
        "Hi {{firstName}}, we reserved a strategy session for your {{niche}} business. In 15 minutes we will review your client acquisition process, identify the biggest bottlenecks, and map out a plan to fill your pipeline consistently. No pitch -- just practical advice from a team that works with {{niche}} professionals every day. Book your slot now.",
    },
    {
      stage: 6,
      dayOffset: 21,
      subject: "Final reminder: your {{niche}} assessment expires tomorrow",
      previewText: "Your pipeline benchmarks are about to expire.",
      bodyTemplate:
        "Hi {{firstName}}, the growth assessment we prepared for your {{niche}} business expires tomorrow. It includes your inquiry conversion rate, proposal win benchmarks, and a prioritized action plan. Log in to {{brandName}} to save your results before they disappear. The insights are valuable whether you act now or next quarter.",
    },
    {
      stage: 7,
      dayOffset: 30,
      subject: "What top-earning {{niche}} professionals do differently",
      previewText: "Patterns from the most profitable creative businesses.",
      bodyTemplate:
        "Hi {{firstName}}, the highest-earning {{niche}} professionals all share three habits: they qualify inquiries automatically, follow up on every proposal, and re-engage past clients systematically. {{brandName}} makes all three effortless. When you are ready to build a predictable pipeline, reply and we will get you set up.",
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  GENERAL                                                            */
  /* ------------------------------------------------------------------ */
  general: [
    {
      stage: 1,
      dayOffset: 0,
      subject: "Your {{niche}} growth roadmap is inside",
      previewText: "See the exact steps to accelerate your business growth.",
      bodyTemplate:
        "Hi {{firstName}}, thanks for taking the first step toward smarter growth with {{brandName}}. We have prepared a personalized roadmap showing the three highest-impact changes you can make this month. It covers lead response, follow-up automation, and conversion optimization. Open it now to see your scores and recommended actions.",
    },
    {
      stage: 2,
      dayOffset: 2,
      subject: "The #1 mistake most {{niche}} businesses make with leads",
      previewText: "Slow follow-up is the biggest revenue leak in most businesses.",
      bodyTemplate:
        "Hi {{firstName}}, the single biggest revenue leak we see across {{niche}} businesses is slow lead follow-up. When a prospect waits more than an hour for a response, conversion odds drop dramatically. {{brandName}} fixes this with instant automated responses and intelligent routing so every lead gets attention in minutes, not hours.",
    },
    {
      stage: 3,
      dayOffset: 5,
      subject: "How [Company] doubled conversions in 30 days with automation",
      previewText: "Real results from a business that made the switch.",
      bodyTemplate:
        "Hi {{firstName}}, one of our {{niche}} clients doubled their lead-to-customer conversion rate in 30 days by automating three things: instant response, timed follow-up sequences, and review requests. No new marketing spend, no new hires. {{brandName}} powered the entire system. Want to see if similar results are realistic for your business?",
    },
    {
      stage: 4,
      dayOffset: 10,
      subject: "3 automations every {{niche}} business should be running",
      previewText: "Set these up once and they work around the clock.",
      bodyTemplate:
        "Hi {{firstName}}, here are three automations that deliver consistent ROI for {{niche}} businesses: instant lead acknowledgment, multi-touch follow-up sequences, and automated review generation. Each takes minutes to configure inside {{brandName}} and runs 24/7 without any manual effort. Which one would make the biggest difference for you right now?",
    },
    {
      stage: 5,
      dayOffset: 14,
      subject: "We saved a spot for your strategy session",
      previewText: "Free 15-minute growth audit for your business.",
      bodyTemplate:
        "Hi {{firstName}}, we reserved a strategy session slot for your {{niche}} business. In 15 minutes we will review your lead pipeline, identify the biggest conversion gaps, and outline a concrete plan to fix them. No pitch, no pressure -- just practical advice you can use whether or not you choose {{brandName}}. Book your slot before it fills up.",
    },
    {
      stage: 6,
      dayOffset: 21,
      subject: "Last chance: your {{niche}} assessment results expire soon",
      previewText: "Your personalized growth report is waiting.",
      bodyTemplate:
        "Hi {{firstName}}, the personalized assessment we prepared for your {{niche}} business is about to expire. It includes your lead response score, automation readiness rating, and a prioritized action plan. Log in to {{brandName}} to review your results before access closes. The insights are worth saving even if timing is not right today.",
    },
    {
      stage: 7,
      dayOffset: 30,
      subject: "What top-performing {{niche}} businesses do differently",
      previewText: "Patterns from the fastest-growing companies in your space.",
      bodyTemplate:
        "Hi {{firstName}}, after working with hundreds of {{niche}} businesses we have seen a clear pattern: the top performers automate follow-up, measure every lead source, and generate reviews systematically. {{brandName}} makes all three automatic. If you are ready to join them, reply to this email and we will get you set up this week.",
    },
  ],
};
