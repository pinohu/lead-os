import { siteConfig } from "@/lib/site-config";

export type PricingTier = {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

export type TimelineStep = {
  phase: string;
  title: string;
  description: string;
};

export type Feature = {
  title: string;
  description: string;
};

export type ServiceData = {
  slug: string;
  title: string;
  tagline: string;
  price: string;
  category: "core" | "blue-ocean";
  overview: string;
  deliverables: string[];
  features: Feature[];
  timeline: TimelineStep[];
  timelineRange: string;
  idealClient: string;
  idealClientDetails: string[];
  pricingTiers: PricingTier[];
  marketSize?: string;
  roiCallout?: string;
  tools?: string[];
};

export const services: ServiceData[] = [
  // ─── CORE SERVICES ───────────────────────────────────────────────
  {
    slug: "client-portal",
    title: "Client Portal Automation",
    tagline: "White-labeled portals with CRM, PM, invoicing, file sharing, scheduling, LMS",
    price: "$5K\u201325K",
    category: "core",
    overview:
      "Give your clients a seamless, branded experience with a custom portal that consolidates every touchpoint into one platform. From project management and invoicing to file sharing and scheduling, your portal becomes the single source of truth for client relationships. Built on your domain, designed in your brand, and configured to match your exact workflow.",
    deliverables: [
      "Custom domain setup and SSL configuration",
      "Branded portal design matching your visual identity",
      "Role-based dashboards for clients, staff, and admins",
      "Client onboarding flow with automated welcome sequences",
      "Secure file vault with permission-based access",
      "Integrated scheduling with calendar sync",
      "Multi-channel notification system (email, SMS, in-app)",
      "Mobile-responsive design across all devices",
    ],
    features: [
      {
        title: "White-Label Branding",
        description: "Your logo, colors, domain. Clients never see third-party branding.",
      },
      {
        title: "CRM Integration",
        description: "Track deals, contacts, and communications in one unified view.",
      },
      {
        title: "Project Management",
        description: "Kanban boards, task assignments, milestones, and progress tracking.",
      },
      {
        title: "Invoicing & Payments",
        description: "Automated billing, recurring invoices, and online payment processing.",
      },
      {
        title: "File Sharing & Vault",
        description: "Secure document storage with versioning and granular permissions.",
      },
      {
        title: "LMS Module",
        description: "Deliver training courses, track completion, and issue certificates.",
      },
    ],
    timeline: [
      { phase: "Week 1", title: "Discovery & Planning", description: "Requirements gathering, workflow mapping, and portal architecture design." },
      { phase: "Week 2\u20133", title: "Build & Configure", description: "Portal setup, branding, role configuration, and module activation." },
      { phase: "Week 4\u20135", title: "Integration & Testing", description: "Connect existing tools, migrate data, and conduct QA testing." },
      { phase: "Week 6", title: "Launch & Training", description: "Go-live deployment, staff training, and client onboarding." },
    ],
    timelineRange: "3\u20136 weeks",
    idealClient: "Service businesses, consultancies, and agencies wanting a professional client-facing platform that eliminates email chaos and scattered tools.",
    idealClientDetails: [
      "Managing 10+ active clients simultaneously",
      "Using 3+ disconnected tools for client communication",
      "Spending hours per week on manual status updates",
      "Wanting to project a premium, professional image",
    ],
    pricingTiers: [
      {
        name: "Essentials",
        price: "$5,000",
        description: "Core portal with branding and basic modules",
        features: [
          "Custom domain & branding",
          "Client dashboard",
          "File sharing vault",
          "Basic scheduling",
          "Email notifications",
          "Up to 50 client accounts",
        ],
      },
      {
        name: "Professional",
        price: "$15,000",
        description: "Full-featured portal with CRM and automation",
        features: [
          "Everything in Essentials",
          "CRM & pipeline management",
          "Project management module",
          "Invoicing & payments",
          "Automated onboarding flows",
          "Unlimited client accounts",
        ],
        highlighted: true,
      },
      {
        name: "Enterprise",
        price: "$25,000",
        description: "Complete platform with LMS and custom integrations",
        features: [
          "Everything in Professional",
          "LMS with course builder",
          "Custom API integrations",
          "Advanced reporting & analytics",
          "Multi-team / multi-brand support",
          "Priority support & SLA",
        ],
      },
    ],
  },
  {
    slug: "process-automation",
    title: "Process Automation",
    tagline: "Eliminate manual workflows. Connect systems, automate tasks, free your team",
    price: "$10K\u201350K",
    category: "core",
    overview:
      "Your team spends countless hours on repetitive tasks that machines handle better. We audit your operations, identify automation opportunities, and build trigger-based workflows that run 24/7 without human intervention. From data entry and follow-ups to report generation and approvals, every manual process becomes a candidate for elimination.",
    deliverables: [
      "Comprehensive process audit and bottleneck analysis",
      "Visual workflow mapping for all automated processes",
      "Trigger/action setup across all identified workflows",
      "Error handling with fallback logic and retry mechanisms",
      "Data transformations and field mapping between systems",
      "Real-time monitoring dashboard with alert notifications",
      "Complete documentation of all automation logic",
      "Staff training sessions with recorded walkthroughs",
    ],
    features: [
      {
        title: "Process Audit",
        description: "Deep-dive analysis of current workflows to identify the highest-ROI automation targets.",
      },
      {
        title: "Multi-Step Workflows",
        description: "Complex automation chains with conditional logic, branches, and parallel processing.",
      },
      {
        title: "Error Recovery",
        description: "Built-in retry logic, fallback paths, and human-in-the-loop escalation for edge cases.",
      },
      {
        title: "Real-Time Monitoring",
        description: "Live dashboards showing automation health, execution counts, and error rates.",
      },
      {
        title: "Data Transformation",
        description: "Automatic formatting, enrichment, and validation of data between systems.",
      },
      {
        title: "Staff Training",
        description: "Comprehensive training so your team can monitor, adjust, and extend automations.",
      },
    ],
    timeline: [
      { phase: "Week 1\u20132", title: "Process Audit", description: "Map existing workflows, identify bottlenecks, and prioritize automation candidates." },
      { phase: "Week 3\u20135", title: "Build & Configure", description: "Design and implement automation workflows with error handling." },
      { phase: "Week 6\u20138", title: "Testing & Optimization", description: "End-to-end testing, performance tuning, and edge case handling." },
      { phase: "Week 9\u201310", title: "Deployment & Training", description: "Go-live, team training, monitoring setup, and documentation handoff." },
    ],
    timelineRange: "4\u201310 weeks",
    idealClient: "Businesses spending 15+ hours per week on manual data entry, follow-ups, report generation, or approval workflows that could be automated.",
    idealClientDetails: [
      "Staff performing repetitive copy-paste between systems",
      "Manual report generation consuming 5+ hours weekly",
      "Delayed follow-ups causing lost revenue opportunities",
      "Error-prone manual data entry creating quality issues",
    ],
    pricingTiers: [
      {
        name: "Starter",
        price: "$10,000",
        description: "Automate 3\u20135 core workflows",
        features: [
          "Process audit (up to 10 workflows)",
          "3\u20135 automated workflows",
          "Basic error handling",
          "Monitoring dashboard",
          "Documentation",
          "2 training sessions",
        ],
      },
      {
        name: "Growth",
        price: "$25,000",
        description: "Comprehensive automation across departments",
        features: [
          "Everything in Starter",
          "10\u201315 automated workflows",
          "Advanced conditional logic",
          "Cross-department automation",
          "Custom data transformations",
          "30-day post-launch support",
        ],
        highlighted: true,
      },
      {
        name: "Scale",
        price: "$50,000",
        description: "Enterprise-grade automation infrastructure",
        features: [
          "Everything in Growth",
          "Unlimited workflows",
          "Custom API development",
          "Load balancing & redundancy",
          "SLA-backed monitoring",
          "90-day optimization period",
        ],
      },
    ],
  },
  {
    slug: "systems-integration",
    title: "Systems Integration",
    tagline: "Connect 6,000+ applications. API integrations, data sync, cross-platform workflows",
    price: "$15K\u201360K",
    category: "core",
    overview:
      "Data silos kill productivity. When your CRM doesn't talk to your accounting software, and your project management tool is disconnected from your communication platform, your team wastes hours bridging gaps manually. We connect every system in your tech stack into a unified, real-time data ecosystem where information flows automatically.",
    deliverables: [
      "Complete system audit and integration map",
      "API mapping and endpoint documentation",
      "Bi-directional data sync between all systems",
      "Data migration from legacy systems with validation",
      "Custom middleware for complex transformations",
      "Real-time monitoring dashboard with health checks",
      "Failover handling and disaster recovery protocols",
      "Integration documentation and runbooks",
    ],
    features: [
      {
        title: "System Audit",
        description: "Catalog every tool, data flow, and integration point across your organization.",
      },
      {
        title: "Bi-Directional Sync",
        description: "Real-time two-way data sync ensures every system has the latest information.",
      },
      {
        title: "Custom Middleware",
        description: "Purpose-built connectors for systems that lack native integration support.",
      },
      {
        title: "Data Migration",
        description: "Safe, validated migration from legacy systems with rollback capabilities.",
      },
      {
        title: "Monitoring & Alerts",
        description: "24/7 health monitoring with instant alerts when sync issues arise.",
      },
      {
        title: "Failover Protection",
        description: "Automatic failover and queue-based retry to prevent data loss during outages.",
      },
    ],
    timeline: [
      { phase: "Week 1\u20132", title: "Discovery & Audit", description: "System inventory, data flow mapping, and integration architecture design." },
      { phase: "Week 3\u20136", title: "API Development", description: "Build connectors, configure endpoints, and establish data mappings." },
      { phase: "Week 7\u201312", title: "Migration & Sync", description: "Data migration, bi-directional sync configuration, and validation." },
      { phase: "Week 13\u201316", title: "Monitoring & Launch", description: "Deploy monitoring, conduct load testing, and go live with full support." },
    ],
    timelineRange: "6\u201316 weeks",
    idealClient: "Companies with 5+ disconnected tools causing data silos, duplicate data entry, and inconsistent reporting across departments.",
    idealClientDetails: [
      "Operating 5+ software platforms that don't communicate",
      "Staff manually copying data between systems daily",
      "Reporting discrepancies across different tools",
      "Losing deals or customers due to information gaps",
    ],
    tools: ["Make.com", "Pabbly Connect", "KonnectzIT", "Boost.space", "Custom APIs"],
    pricingTiers: [
      {
        name: "Connect",
        price: "$15,000",
        description: "Integrate 3\u20135 core systems",
        features: [
          "System audit & mapping",
          "3\u20135 system integrations",
          "One-way data sync",
          "Basic monitoring",
          "Documentation",
          "30-day support",
        ],
      },
      {
        name: "Unify",
        price: "$35,000",
        description: "Full bi-directional sync across your stack",
        features: [
          "Everything in Connect",
          "8\u201312 system integrations",
          "Bi-directional real-time sync",
          "Custom middleware",
          "Data migration included",
          "60-day optimization",
        ],
        highlighted: true,
      },
      {
        name: "Enterprise",
        price: "$60,000",
        description: "Complete data ecosystem with redundancy",
        features: [
          "Everything in Unify",
          "Unlimited integrations",
          "Custom API development",
          "Failover & disaster recovery",
          "SLA-backed uptime",
          "90-day support + training",
        ],
      },
    ],
  },
  {
    slug: "training-platform",
    title: "Training Platform Creation",
    tagline: "Custom LMS with courses, certificates, progress tracking, compliance reporting",
    price: "$8K\u201325K",
    category: "core",
    overview:
      "Build a comprehensive learning management system tailored to your organization's training needs. Whether you're onboarding new employees, certifying professionals, or educating clients, our custom LMS platforms deliver engaging learning experiences with robust tracking and compliance reporting.",
    deliverables: [
      "LMS architecture design and technology selection",
      "Course builder setup with multimedia support",
      "Quiz and assessment engine with question banks",
      "Custom certificate designer with dynamic fields",
      "Progress dashboards for learners and administrators",
      "Auto-enrollment rules based on roles and departments",
      "Comprehensive reporting suite with export capabilities",
      "SCORM/xAPI support for third-party content",
    ],
    features: [
      {
        title: "Course Builder",
        description: "Drag-and-drop course creation with video, documents, quizzes, and interactive content.",
      },
      {
        title: "Assessment Engine",
        description: "Configurable quizzes with question banks, randomization, time limits, and passing scores.",
      },
      {
        title: "Certificate System",
        description: "Branded certificates with dynamic fields, QR verification, and expiration tracking.",
      },
      {
        title: "Progress Tracking",
        description: "Real-time dashboards showing completion rates, scores, and time-on-task metrics.",
      },
      {
        title: "Auto-Enrollment",
        description: "Rules-based enrollment triggered by role, department, hire date, or custom criteria.",
      },
      {
        title: "SCORM Support",
        description: "Import and track third-party SCORM/xAPI content alongside custom courses.",
      },
    ],
    timeline: [
      { phase: "Week 1\u20132", title: "Architecture & Design", description: "Requirements analysis, platform selection, and course structure planning." },
      { phase: "Week 3\u20134", title: "Platform Build", description: "LMS configuration, branding, and core module setup." },
      { phase: "Week 5\u20136", title: "Content & Testing", description: "Course migration, quiz configuration, and user acceptance testing." },
      { phase: "Week 7\u20138", title: "Launch & Training", description: "Deployment, admin training, and learner onboarding." },
    ],
    timelineRange: "4\u20138 weeks",
    idealClient: "Organizations needing employee training, certification programs, or client education portals with tracking and compliance documentation.",
    idealClientDetails: [
      "Running training through scattered documents and emails",
      "No visibility into who has completed required training",
      "Compliance audits requiring manual proof-of-training",
      "Growing team needing scalable onboarding processes",
    ],
    pricingTiers: [
      {
        name: "Foundation",
        price: "$8,000",
        description: "Core LMS with essential training tools",
        features: [
          "LMS platform setup & branding",
          "Course builder (up to 10 courses)",
          "Basic quiz engine",
          "Completion certificates",
          "Learner progress dashboard",
          "Email notifications",
        ],
      },
      {
        name: "Professional",
        price: "$15,000",
        description: "Advanced LMS with automation and reporting",
        features: [
          "Everything in Foundation",
          "Unlimited courses",
          "Advanced assessment engine",
          "Auto-enrollment rules",
          "Manager reporting dashboard",
          "SCORM import support",
        ],
        highlighted: true,
      },
      {
        name: "Enterprise",
        price: "$25,000",
        description: "Full-scale learning ecosystem",
        features: [
          "Everything in Professional",
          "Multi-tenant architecture",
          "Custom certificate designer",
          "API integrations",
          "Advanced analytics & exports",
          "Dedicated support & SLA",
        ],
      },
    ],
  },
  {
    slug: "business-intelligence",
    title: "Business Intelligence",
    tagline: "Real-time dashboards, automated reporting, financial analytics, KPI tracking",
    price: "$12K\u201330K",
    category: "core",
    overview:
      "Stop making decisions based on gut feeling or outdated spreadsheets. Our business intelligence solutions transform your raw data into actionable insights through real-time dashboards, automated reports, and predictive analytics. See your entire business performance at a glance and drill down into the metrics that matter.",
    deliverables: [
      "KPI workshop to define critical business metrics",
      "Custom dashboard design with interactive visualizations",
      "Automated data connectors to all source systems",
      "Scheduled and on-demand automated reports",
      "Threshold-based alerting rules with escalation",
      "Executive summary dashboards with key highlights",
      "Drill-down analytics for departmental deep-dives",
      "Forecast models using historical data trends",
    ],
    features: [
      {
        title: "KPI Framework",
        description: "Collaborative workshop to define the metrics that actually drive your business forward.",
      },
      {
        title: "Live Dashboards",
        description: "Real-time interactive dashboards with drill-down capability and mobile access.",
      },
      {
        title: "Automated Reports",
        description: "Scheduled reports delivered via email, Slack, or portal with zero manual effort.",
      },
      {
        title: "Smart Alerts",
        description: "Threshold-based notifications when KPIs deviate from targets or trends shift.",
      },
      {
        title: "Financial Analytics",
        description: "Revenue, margin, cash flow, and profitability analysis with trend visualization.",
      },
      {
        title: "Forecasting",
        description: "Predictive models using your historical data to project future performance.",
      },
    ],
    timeline: [
      { phase: "Week 1", title: "KPI Workshop", description: "Define metrics, data sources, and dashboard requirements with stakeholders." },
      { phase: "Week 2\u20133", title: "Data Architecture", description: "Connect data sources, build ETL pipelines, and validate data quality." },
      { phase: "Week 4\u20136", title: "Dashboard Build", description: "Design and build interactive dashboards, reports, and alerting rules." },
      { phase: "Week 7\u20138", title: "Deployment & Training", description: "Go-live, user training, and iterative refinement based on feedback." },
    ],
    timelineRange: "4\u20138 weeks",
    idealClient: "Growing businesses lacking visibility into performance, profitability, and pipeline health who need data-driven decision making.",
    idealClientDetails: [
      "Making strategic decisions without reliable data",
      "Spending hours manually compiling weekly/monthly reports",
      "Unable to answer basic questions about profitability by service or client",
      "No early warning system for declining metrics",
    ],
    pricingTiers: [
      {
        name: "Insight",
        price: "$12,000",
        description: "Core dashboards and automated reporting",
        features: [
          "KPI definition workshop",
          "3 interactive dashboards",
          "5 data source connectors",
          "Weekly automated reports",
          "Basic alerting rules",
          "30-day support",
        ],
      },
      {
        name: "Analytics",
        price: "$20,000",
        description: "Comprehensive BI with advanced analytics",
        features: [
          "Everything in Insight",
          "8 interactive dashboards",
          "Unlimited data connectors",
          "Daily automated reports",
          "Financial analytics module",
          "60-day optimization",
        ],
        highlighted: true,
      },
      {
        name: "Intelligence",
        price: "$30,000",
        description: "Full BI platform with forecasting",
        features: [
          "Everything in Analytics",
          "Unlimited dashboards",
          "Predictive forecasting models",
          "Executive summary automation",
          "Custom API data feeds",
          "90-day support + training",
        ],
      },
    ],
  },
  {
    slug: "digital-transformation",
    title: "Digital Transformation",
    tagline: "Complete technology overhaul from assessment to deployment",
    price: "$25K\u2013150K",
    category: "core",
    overview:
      "A complete technology overhaul for organizations ready to leave spreadsheets, paper processes, and legacy systems behind. We assess your current state, architect a modern solution, and implement it in phases with full change management support. From the first audit to the final deployment, we handle every aspect of your digital evolution.",
    deliverables: [
      "Technology audit and maturity assessment",
      "Gap analysis identifying critical improvement areas",
      "Solution architecture with technology recommendations",
      "Phased implementation roadmap with milestones",
      "Tool selection and vendor evaluation",
      "Data migration with validation and rollback plans",
      "Change management and adoption strategy",
      "Staff training with role-specific curricula",
      "Post-launch optimization and performance tuning",
    ],
    features: [
      {
        title: "Technology Audit",
        description: "Comprehensive assessment of current systems, processes, and digital maturity level.",
      },
      {
        title: "Solution Architecture",
        description: "Future-state design with detailed technology stack recommendations and integration plan.",
      },
      {
        title: "Phased Rollout",
        description: "Risk-minimized implementation in stages with clear milestones and go/no-go checkpoints.",
      },
      {
        title: "Change Management",
        description: "Structured approach to driving adoption with communication plans and champion networks.",
      },
      {
        title: "Data Migration",
        description: "Safe migration from legacy systems with data cleaning, mapping, and validation.",
      },
      {
        title: "Post-Launch Optimization",
        description: "Continuous refinement based on usage data, feedback, and evolving business needs.",
      },
    ],
    timeline: [
      { phase: "Week 1\u20134", title: "Assessment & Strategy", description: "Technology audit, gap analysis, and transformation roadmap development." },
      { phase: "Week 5\u201312", title: "Phase 1 Implementation", description: "Core system deployment, data migration, and initial integrations." },
      { phase: "Week 13\u201324", title: "Phase 2 Expansion", description: "Additional modules, advanced automation, and department-wide rollout." },
      { phase: "Week 25\u201336", title: "Optimization & Scale", description: "Performance tuning, advanced features, and organization-wide adoption." },
    ],
    timelineRange: "12\u201336 weeks",
    idealClient: "Established businesses running on spreadsheets, paper processes, or legacy systems that are holding back growth and operational efficiency.",
    idealClientDetails: [
      "Critical business data trapped in spreadsheets or paper files",
      "Legacy systems that vendors no longer support or update",
      "Unable to scale operations due to technology limitations",
      "Competitors gaining advantage through modern technology",
    ],
    pricingTiers: [
      {
        name: "Foundation",
        price: "$25,000",
        description: "Assessment and core system modernization",
        features: [
          "Technology audit & gap analysis",
          "Solution architecture",
          "Core system implementation",
          "Basic data migration",
          "Staff training (2 sessions)",
          "30-day post-launch support",
        ],
      },
      {
        name: "Transformation",
        price: "$75,000",
        description: "Multi-phase digital overhaul",
        features: [
          "Everything in Foundation",
          "2-phase implementation",
          "Advanced integrations",
          "Full data migration",
          "Change management program",
          "90-day optimization period",
        ],
        highlighted: true,
      },
      {
        name: "Enterprise",
        price: "$150,000",
        description: "Complete organizational transformation",
        features: [
          "Everything in Transformation",
          "3+ phase implementation",
          "Custom software development",
          "Enterprise integrations",
          "Full change management",
          "6-month support & optimization",
        ],
      },
    ],
  },
  {
    slug: "compliance-training",
    title: "Compliance Training",
    tagline: "8 ready-made courses: OSHA, HIPAA, AML, harassment, DEI, ethics, data privacy, workplace safety",
    price: "$3K\u201315K",
    category: "core",
    overview:
      "Deploy a complete compliance training program in weeks, not months. Our library of 8 professionally developed courses covers the most common regulatory requirements. Each course includes assessments, certificates, and audit-ready reporting. Assign courses by role, track completion automatically, and stay ahead of regulatory deadlines.",
    deliverables: [
      "8-course compliance library deployment",
      "Quiz configuration with passing score thresholds",
      "Branded certificate templates with verification",
      "Role-based auto-assignment rules",
      "Completion tracking with deadline enforcement",
      "Manager dashboards with team compliance overview",
      "Recertification scheduling with automated reminders",
      "Audit-ready reports with exportable documentation",
    ],
    features: [
      {
        title: "8-Course Library",
        description: "OSHA, HIPAA, AML, harassment, DEI, ethics, data privacy, and workplace safety.",
      },
      {
        title: "Auto-Assignment",
        description: "Rules-based enrollment ensures the right people take the right courses automatically.",
      },
      {
        title: "Certificate Generation",
        description: "Branded completion certificates with unique IDs and QR code verification.",
      },
      {
        title: "Compliance Tracking",
        description: "Real-time dashboards showing compliance rates by department, role, and individual.",
      },
      {
        title: "Recertification",
        description: "Automated reminders and re-enrollment when certifications approach expiration.",
      },
      {
        title: "Audit Reports",
        description: "One-click generation of audit-ready compliance reports with full documentation trail.",
      },
    ],
    timeline: [
      { phase: "Week 1", title: "Setup & Configuration", description: "Platform deployment, branding, and course library activation." },
      { phase: "Week 2", title: "Rules & Assignment", description: "Configure auto-assignment rules, role mapping, and notification templates." },
      { phase: "Week 3", title: "Testing & Validation", description: "End-to-end testing of courses, quizzes, certificates, and reporting." },
      { phase: "Week 4", title: "Launch & Enrollment", description: "Go-live, mass enrollment, and administrator training." },
    ],
    timelineRange: "2\u20134 weeks",
    idealClient: "Any business with employees that needs regulatory compliance documentation and wants to eliminate the hassle of manual tracking.",
    idealClientDetails: [
      "Tracking compliance in spreadsheets or paper records",
      "Facing upcoming audits with incomplete documentation",
      "No systematic way to ensure all employees complete required training",
      "Spending excessive time on annual recertification cycles",
    ],
    pricingTiers: [
      {
        name: "Starter",
        price: "$3,000",
        description: "Core compliance courses for small teams",
        features: [
          "4 compliance courses",
          "Basic quiz & certificates",
          "Manual enrollment",
          "Completion tracking",
          "Basic reporting",
          "Up to 50 employees",
        ],
      },
      {
        name: "Complete",
        price: "$8,000",
        description: "Full 8-course library with automation",
        features: [
          "All 8 compliance courses",
          "Auto-assignment rules",
          "Branded certificates",
          "Manager dashboards",
          "Recertification scheduling",
          "Up to 250 employees",
        ],
        highlighted: true,
      },
      {
        name: "Enterprise",
        price: "$15,000",
        description: "Organization-wide compliance with custom content",
        features: [
          "Everything in Complete",
          "Custom course additions",
          "Multi-location support",
          "Advanced audit reporting",
          "API integrations",
          "Unlimited employees",
        ],
      },
    ],
  },
  {
    slug: "managed-services",
    title: "Managed Services",
    tagline: "Ongoing technology management, optimization, support, and strategic reviews",
    price: "$1.5K\u20135K/mo",
    category: "core",
    overview:
      "Technology doesn't stop needing attention after deployment. Our managed services provide ongoing monitoring, optimization, and support so your systems run at peak performance without requiring internal IT staff. From daily health checks to quarterly strategic reviews, we become your dedicated technology operations team.",
    deliverables: [
      "Dedicated account manager as your single point of contact",
      "Monthly health reports with performance metrics and recommendations",
      "24/7 system monitoring with automated alerting",
      "Priority support with guaranteed response times",
      "Quarterly business reviews with optimization recommendations",
      "Security patches and platform updates",
      "Performance tuning and optimization",
      "Capacity planning and scaling recommendations",
    ],
    features: [
      {
        title: "24/7 Monitoring",
        description: "Round-the-clock system monitoring with instant alerts for any performance issues.",
      },
      {
        title: "Dedicated Manager",
        description: "A named account manager who understands your business and technology stack.",
      },
      {
        title: "Priority Support",
        description: "Guaranteed response times with escalation paths for critical issues.",
      },
      {
        title: "Monthly Reports",
        description: "Comprehensive health reports covering uptime, performance, and optimization opportunities.",
      },
      {
        title: "Quarterly Reviews",
        description: "Strategic business reviews to align technology with evolving business goals.",
      },
      {
        title: "Security & Updates",
        description: "Proactive security patches, platform updates, and vulnerability management.",
      },
    ],
    timeline: [
      { phase: "Week 1", title: "Onboarding", description: "System inventory, access setup, monitoring configuration, and baseline establishment." },
      { phase: "Week 2", title: "Monitoring Activation", description: "Deploy monitoring agents, configure alerts, and establish response protocols." },
      { phase: "Month 1", title: "Stabilization", description: "Identify and resolve immediate issues, optimize critical systems." },
      { phase: "Ongoing", title: "Continuous Management", description: "24/7 monitoring, monthly reports, quarterly reviews, and continuous optimization." },
    ],
    timelineRange: "Ongoing",
    idealClient: "Businesses that have deployed technology but lack internal IT staff to maintain, optimize, and evolve their systems over time.",
    idealClientDetails: [
      "No dedicated IT staff to manage deployed technology",
      "Systems degrading in performance over time",
      "Security concerns about unpatched software",
      "Needing strategic guidance on technology evolution",
    ],
    pricingTiers: [
      {
        name: "Essential",
        price: "$1,500/mo",
        description: "Core monitoring and support",
        features: [
          "Business-hours monitoring",
          "Monthly health reports",
          "Email support (24h response)",
          "Security patch management",
          "Quarterly review call",
          "Up to 5 systems monitored",
        ],
      },
      {
        name: "Professional",
        price: "$3,000/mo",
        description: "Comprehensive managed services",
        features: [
          "24/7 monitoring & alerting",
          "Dedicated account manager",
          "Priority support (4h response)",
          "Monthly optimization",
          "Quarterly strategic reviews",
          "Up to 15 systems monitored",
        ],
        highlighted: true,
      },
      {
        name: "Premium",
        price: "$5,000/mo",
        description: "Full-service technology operations",
        features: [
          "Everything in Professional",
          "1h critical response SLA",
          "Weekly optimization cycles",
          "Capacity planning & scaling",
          "Custom development hours",
          "Unlimited systems monitored",
        ],
      },
    ],
  },

  // ─── BLUE OCEAN NICHE SERVICES ───────────────────────────────────
  {
    slug: "re-syndication",
    title: "Real Estate Syndication Portals",
    tagline: "Investor portals, deal rooms, accreditation, K-1 distribution, capital calls",
    price: "$8K\u201320K setup + $1.5K\u20134K/mo",
    category: "blue-ocean",
    overview:
      "Purpose-built technology for real estate syndicators and fund managers. Give your investors a professional portal where they can review deals, track distributions, access K-1 documents, and monitor portfolio performance. From accredited investor verification to waterfall calculations, every aspect of syndication operations is streamlined.",
    deliverables: [
      "Investor dashboard with portfolio overview and performance metrics",
      "Deal room with document vault and secure data sharing",
      "Accredited investor verification workflow with compliance documentation",
      "K-1 distribution system with secure delivery and acknowledgment tracking",
      "Capital call tracking with automated notifications and status monitoring",
      "Distribution waterfall calculator with configurable return structures",
      "Investor communication portal with updates and announcements",
      "Comprehensive reporting suite with investor statements",
    ],
    features: [
      {
        title: "Investor Portal",
        description: "Branded dashboard where investors track distributions, returns, and portfolio performance.",
      },
      {
        title: "Deal Rooms",
        description: "Secure virtual data rooms for presenting opportunities with controlled document access.",
      },
      {
        title: "Accreditation Workflow",
        description: "Automated accredited investor verification with compliance documentation and audit trail.",
      },
      {
        title: "K-1 Distribution",
        description: "Secure K-1 delivery with investor acknowledgment tracking and deadline management.",
      },
      {
        title: "Capital Call Management",
        description: "Automated capital call notices, payment tracking, and follow-up sequences.",
      },
      {
        title: "Waterfall Calculator",
        description: "Configurable distribution waterfall engine supporting preferred returns and promotes.",
      },
    ],
    timeline: [
      { phase: "Week 1\u20132", title: "Discovery & Architecture", description: "Requirements analysis, fund structure mapping, and portal design." },
      { phase: "Week 3\u20135", title: "Portal Build", description: "Investor dashboard, deal room, and core module development." },
      { phase: "Week 6\u20137", title: "Integration & Testing", description: "Payment processing, document management, and end-to-end testing." },
      { phase: "Week 8", title: "Launch & Onboarding", description: "Portal deployment, investor onboarding, and admin training." },
    ],
    timelineRange: "6\u20138 weeks",
    idealClient: "Syndicators, fund managers, and real estate investment groups managing multiple investors and deals who need a professional, compliant investor experience.",
    idealClientDetails: [
      "Managing 10+ investors across multiple deals",
      "Distributing K-1s and statements via email manually",
      "No centralized system for capital calls and distributions",
      "Needing to verify accredited investor status compliantly",
    ],
    marketSize: "$21T",
    roiCallout: "Syndicators report 60% reduction in investor communication overhead and faster capital raises with professional portals.",
    pricingTiers: [
      {
        name: "Launch",
        price: "$8,000 setup + $1,500/mo",
        description: "Core investor portal for emerging syndicators",
        features: [
          "Investor dashboard",
          "Basic deal room",
          "Document management",
          "Distribution tracking",
          "Investor communications",
          "Up to 50 investors",
        ],
      },
      {
        name: "Growth",
        price: "$14,000 setup + $2,500/mo",
        description: "Full-featured platform for active syndicators",
        features: [
          "Everything in Launch",
          "Accreditation workflow",
          "K-1 distribution system",
          "Capital call management",
          "Waterfall calculator",
          "Up to 200 investors",
        ],
        highlighted: true,
      },
      {
        name: "Enterprise",
        price: "$20,000 setup + $4,000/mo",
        description: "Multi-fund platform for established operators",
        features: [
          "Everything in Growth",
          "Multi-fund support",
          "Custom reporting & analytics",
          "API integrations",
          "White-label branding",
          "Unlimited investors",
        ],
      },
    ],
  },
  {
    slug: "immigration-law",
    title: "Immigration Law Practice Management",
    tagline: "Multilingual portals, 5 case pipelines, USCIS tracking, document management",
    price: "$5K\u201312K setup + $800\u20132K/mo",
    category: "blue-ocean",
    overview:
      "Immigration law practices face unique challenges: multilingual clients, complex case pipelines, strict government deadlines, and mountains of documentation. Our purpose-built platform handles it all with a multilingual client portal, visa-specific workflows, USCIS status tracking, and automated deadline management so nothing falls through the cracks.",
    deliverables: [
      "Multilingual client portal (English, Spanish, French, Portuguese)",
      "5 visa-type pipelines (H-1B, EB-5, Family, Asylum, Naturalization)",
      "USCIS case status tracking with automated updates",
      "Document checklist system with secure upload and verification",
      "Deadline management with automated reminders and escalation",
      "Client communication portal with multilingual support",
      "Compliance calendar with regulatory date tracking",
    ],
    features: [
      {
        title: "Multilingual Portal",
        description: "Client-facing portal in English, Spanish, French, and Portuguese with auto-detection.",
      },
      {
        title: "5 Case Pipelines",
        description: "Pre-configured workflows for H-1B, EB-5, Family, Asylum, and Naturalization cases.",
      },
      {
        title: "USCIS Tracking",
        description: "Automated case status checks with client notifications on status changes.",
      },
      {
        title: "Document Management",
        description: "Visa-specific document checklists with secure upload, verification, and expiration tracking.",
      },
      {
        title: "Deadline Engine",
        description: "Automated deadline calculations with cascading reminders and attorney escalation.",
      },
      {
        title: "Compliance Calendar",
        description: "Firm-wide regulatory calendar with filing deadlines and priority date tracking.",
      },
    ],
    timeline: [
      { phase: "Week 1", title: "Discovery & Setup", description: "Practice analysis, pipeline configuration, and portal branding." },
      { phase: "Week 2\u20133", title: "Portal & Pipelines", description: "Client portal build, visa pipeline configuration, and document system setup." },
      { phase: "Week 4", title: "Integration & Testing", description: "USCIS tracking setup, deadline engine configuration, and end-to-end testing." },
      { phase: "Week 5", title: "Launch & Training", description: "Go-live, staff training, and client onboarding." },
    ],
    timelineRange: "4\u20135 weeks",
    idealClient: "Immigration attorneys, law firms, and visa consultancies managing multiple case types who need a purpose-built platform for their practice.",
    idealClientDetails: [
      "Managing 50+ active immigration cases simultaneously",
      "Serving clients who speak multiple languages",
      "Tracking deadlines manually across visa types",
      "Needing secure document collection from clients abroad",
    ],
    marketSize: "$9.9B",
    roiCallout: "Immigration firms using dedicated practice management see 40% faster case processing and 3x fewer missed deadlines.",
    pricingTiers: [
      {
        name: "Solo Practice",
        price: "$5,000 setup + $800/mo",
        description: "Essential tools for solo immigration attorneys",
        features: [
          "Bilingual client portal",
          "3 case pipelines",
          "Document management",
          "Deadline tracking",
          "Client communications",
          "Up to 100 active cases",
        ],
      },
      {
        name: "Firm",
        price: "$8,000 setup + $1,200/mo",
        description: "Full platform for growing immigration practices",
        features: [
          "Everything in Solo Practice",
          "4-language portal",
          "All 5 case pipelines",
          "USCIS tracking integration",
          "Compliance calendar",
          "Up to 500 active cases",
        ],
        highlighted: true,
      },
      {
        name: "Enterprise",
        price: "$12,000 setup + $2,000/mo",
        description: "Multi-office immigration platform",
        features: [
          "Everything in Firm",
          "Multi-office support",
          "Custom pipeline builder",
          "Advanced analytics",
          "API integrations",
          "Unlimited active cases",
        ],
      },
    ],
  },
  {
    slug: "construction",
    title: "Construction Project Management",
    tagline: "Project portals, safety compliance, daily reports, change orders, OSHA training",
    price: "$8K\u201328K setup + $3K\u20138K/mo",
    category: "blue-ocean",
    overview:
      "Construction projects generate massive amounts of data, documentation, and compliance requirements. Our platform gives general contractors and construction managers a centralized command center for project tracking, daily reporting, change order management, safety incident documentation, and OSHA compliance training\u2014all accessible from the job site on any device.",
    deliverables: [
      "Project tracking portal with milestone and phase management",
      "Digital daily report system with photo and weather logging",
      "Change order workflow with approval chains and cost tracking",
      "Safety incident tracking with OSHA-compliant documentation",
      "Integrated OSHA compliance training modules",
      "Subcontractor portal with document and insurance tracking",
      "Document management with version control and drawing sets",
      "Progress photo system with timeline comparison",
      "Budget tracking with cost-to-complete forecasting",
    ],
    features: [
      {
        title: "Project Command Center",
        description: "Real-time project dashboard with milestones, progress tracking, and critical path visibility.",
      },
      {
        title: "Daily Reports",
        description: "Digital daily logs with weather, manpower, equipment, materials, and photo documentation.",
      },
      {
        title: "Change Order Management",
        description: "Structured workflow for change order submission, review, approval, and cost impact tracking.",
      },
      {
        title: "Safety Compliance",
        description: "Incident reporting, toolbox talk logging, and OSHA inspection preparation tools.",
      },
      {
        title: "Subcontractor Portal",
        description: "Dedicated portal for subs to submit documents, track payments, and manage schedules.",
      },
      {
        title: "Budget Tracking",
        description: "Real-time budget monitoring with committed costs, actual costs, and cost-to-complete projections.",
      },
    ],
    timeline: [
      { phase: "Week 1\u20132", title: "Discovery & Configuration", description: "Project workflow mapping, portal design, and system architecture." },
      { phase: "Week 3\u20135", title: "Platform Build", description: "Portal development, module configuration, and mobile optimization." },
      { phase: "Week 6\u20137", title: "Integration & Training", description: "Accounting integration, subcontractor onboarding, and OSHA module deployment." },
      { phase: "Week 8", title: "Launch & Go-Live", description: "Production deployment, field team training, and active project migration." },
    ],
    timelineRange: "6\u20138 weeks",
    idealClient: "General contractors, construction managers, and specialty trades managing multiple projects who need centralized digital operations.",
    idealClientDetails: [
      "Managing 3+ active construction projects simultaneously",
      "Using paper-based daily reports and safety documentation",
      "Change order disputes due to poor documentation",
      "OSHA compliance gaps putting projects at risk",
    ],
    marketSize: "$1.8T",
    roiCallout: "Construction firms using digital project management report 25% fewer change order disputes and 50% faster daily reporting.",
    pricingTiers: [
      {
        name: "Project",
        price: "$8,000 setup + $3,000/mo",
        description: "Essential project management for small GCs",
        features: [
          "Project tracking portal",
          "Daily report system",
          "Document management",
          "Basic budget tracking",
          "Mobile access",
          "Up to 3 active projects",
        ],
      },
      {
        name: "Contractor",
        price: "$18,000 setup + $5,000/mo",
        description: "Full-featured platform for growing contractors",
        features: [
          "Everything in Project",
          "Change order management",
          "Safety incident tracking",
          "Subcontractor portal",
          "OSHA training modules",
          "Up to 10 active projects",
        ],
        highlighted: true,
      },
      {
        name: "Enterprise",
        price: "$28,000 setup + $8,000/mo",
        description: "Multi-project platform for large GCs",
        features: [
          "Everything in Contractor",
          "Multi-office support",
          "Advanced budget forecasting",
          "Custom integrations",
          "Executive analytics",
          "Unlimited projects",
        ],
      },
    ],
  },
  {
    slug: "franchise",
    title: "Franchise Operations Management",
    tagline: "Multi-location management, franchisee portals, brand compliance",
    price: "$10K\u201330K setup + $2K\u20136K/mo",
    category: "blue-ocean",
    overview:
      "Managing a franchise network means maintaining brand consistency while empowering individual operators. Our platform gives franchise brands a centralized command center for monitoring performance, enforcing compliance, delivering training, and communicating with franchisees\u2014all while giving operators the tools they need to run their locations efficiently.",
    deliverables: [
      "Franchisee portal with location-specific dashboards",
      "Brand compliance checklists with photo verification",
      "Multi-location performance dashboard with benchmarking",
      "Training and certification system for franchisee staff",
      "Performance benchmarking across locations",
      "Digital operations manuals portal with version control",
      "Communication hub with announcements and messaging",
      "Territory management with mapping and availability",
    ],
    features: [
      {
        title: "Franchisee Portal",
        description: "Dedicated portal for each location with performance data, tasks, and communications.",
      },
      {
        title: "Brand Compliance",
        description: "Digital checklists with photo verification to ensure brand standards across all locations.",
      },
      {
        title: "Performance Benchmarking",
        description: "Compare locations against each other and system-wide averages on key metrics.",
      },
      {
        title: "Training System",
        description: "Centralized training delivery with certification tracking for all franchise staff.",
      },
      {
        title: "Operations Manuals",
        description: "Digital, versioned operations manuals accessible from any device with update notifications.",
      },
      {
        title: "Territory Management",
        description: "Visual territory mapping with demographic data and availability tracking.",
      },
    ],
    timeline: [
      { phase: "Week 1\u20132", title: "Discovery & Architecture", description: "Franchise model analysis, portal design, and compliance framework setup." },
      { phase: "Week 3\u20135", title: "Platform Build", description: "Franchisee portal, compliance system, and training module development." },
      { phase: "Week 6\u20137", title: "Pilot & Testing", description: "Pilot deployment with select locations, feedback collection, and refinement." },
      { phase: "Week 8", title: "Network Rollout", description: "Full network deployment, franchisee onboarding, and corporate training." },
    ],
    timelineRange: "6\u20138 weeks",
    idealClient: "Franchise brands, multi-unit operators, and franchise development companies needing scalable operations management across locations.",
    idealClientDetails: [
      "Operating 5+ franchise locations with growing complexity",
      "Brand compliance inconsistencies across locations",
      "No centralized training or certification tracking",
      "Difficulty benchmarking location performance",
    ],
    marketSize: "$827B",
    roiCallout: "Franchise systems with centralized operations platforms see 35% better brand compliance scores and 20% faster new location ramp-up.",
    pricingTiers: [
      {
        name: "Emerging",
        price: "$10,000 setup + $2,000/mo",
        description: "Core tools for emerging franchise brands",
        features: [
          "Franchisee portal",
          "Brand compliance checklists",
          "Basic performance dashboard",
          "Operations manual portal",
          "Communication hub",
          "Up to 10 locations",
        ],
      },
      {
        name: "Growth",
        price: "$20,000 setup + $4,000/mo",
        description: "Full-featured platform for growing networks",
        features: [
          "Everything in Emerging",
          "Training & certification system",
          "Performance benchmarking",
          "Territory management",
          "Advanced analytics",
          "Up to 50 locations",
        ],
        highlighted: true,
      },
      {
        name: "Enterprise",
        price: "$30,000 setup + $6,000/mo",
        description: "Enterprise platform for large franchise systems",
        features: [
          "Everything in Growth",
          "Multi-brand support",
          "Custom integrations",
          "Franchise development tools",
          "Executive dashboards",
          "Unlimited locations",
        ],
      },
    ],
  },
  {
    slug: "staffing",
    title: "Staffing Agency Platform",
    tagline: "Candidate/client portals, placement pipelines, timesheet management",
    price: "$6K\u201315K setup + $1.5K\u20134K/mo",
    category: "blue-ocean",
    overview:
      "Staffing agencies juggle candidates, clients, placements, timesheets, and compliance across dozens of active assignments. Our purpose-built platform gives agencies separate portals for candidates and clients, a structured placement pipeline, integrated timesheet management, and compliance document tracking\u2014eliminating spreadsheets and manual processes.",
    deliverables: [
      "Candidate portal with profile management and job matching",
      "Client portal with job order submission and candidate review",
      "5-stage placement pipeline (Sourcing, Screening, Interview, Placement, Retention)",
      "Timesheet and hours tracking with approval workflows",
      "Automated invoice generation from approved timesheets",
      "Compliance document management with expiration tracking",
      "Performance reporting with placement metrics and revenue tracking",
    ],
    features: [
      {
        title: "Candidate Portal",
        description: "Self-service portal where candidates manage profiles, upload documents, and track applications.",
      },
      {
        title: "Client Portal",
        description: "Dedicated client interface for submitting job orders, reviewing candidates, and approving timesheets.",
      },
      {
        title: "Placement Pipeline",
        description: "Visual pipeline from sourcing through placement with stage-specific automation and alerts.",
      },
      {
        title: "Timesheet Management",
        description: "Digital timesheets with candidate submission, client approval, and automated invoicing.",
      },
      {
        title: "Compliance Tracking",
        description: "Document management for certifications, background checks, and work authorization with expiry alerts.",
      },
      {
        title: "Revenue Analytics",
        description: "Real-time tracking of bill rates, margins, revenue per recruiter, and client profitability.",
      },
    ],
    timeline: [
      { phase: "Week 1\u20132", title: "Discovery & Setup", description: "Workflow mapping, pipeline design, and portal architecture." },
      { phase: "Week 3\u20134", title: "Portal Build", description: "Candidate portal, client portal, and pipeline configuration." },
      { phase: "Week 5", title: "Integration & Testing", description: "Timesheet system, invoicing, and end-to-end testing." },
      { phase: "Week 6", title: "Launch & Training", description: "Go-live, recruiter training, and candidate/client onboarding." },
    ],
    timelineRange: "4\u20136 weeks",
    idealClient: "Staffing agencies, temp agencies, and executive recruiters managing multiple candidates and clients who need a unified operations platform.",
    idealClientDetails: [
      "Managing 100+ active candidates across multiple clients",
      "Tracking timesheets in spreadsheets or paper forms",
      "Manual invoice generation causing payment delays",
      "No centralized compliance document management",
    ],
    marketSize: "$218B",
    roiCallout: "Staffing agencies with integrated platforms report 45% faster time-to-fill and 30% improvement in timesheet accuracy.",
    pricingTiers: [
      {
        name: "Starter",
        price: "$6,000 setup + $1,500/mo",
        description: "Core platform for small agencies",
        features: [
          "Candidate portal",
          "Basic placement pipeline",
          "Document management",
          "Simple timesheet tracking",
          "Basic reporting",
          "Up to 200 candidates",
        ],
      },
      {
        name: "Professional",
        price: "$10,000 setup + $2,500/mo",
        description: "Full-featured platform for growing agencies",
        features: [
          "Everything in Starter",
          "Client portal",
          "Advanced pipeline automation",
          "Timesheet with approval workflow",
          "Automated invoicing",
          "Up to 1,000 candidates",
        ],
        highlighted: true,
      },
      {
        name: "Enterprise",
        price: "$15,000 setup + $4,000/mo",
        description: "Enterprise platform for large staffing firms",
        features: [
          "Everything in Professional",
          "Multi-branch support",
          "Revenue analytics",
          "Custom integrations",
          "Advanced compliance tracking",
          "Unlimited candidates",
        ],
      },
    ],
  },
  {
    slug: "church-management",
    title: "Church & Ministry Management",
    tagline: "Member portals, volunteer scheduling, donation tracking, event management",
    price: "$4K\u201310K setup + $500\u20131.5K/mo",
    category: "blue-ocean",
    overview:
      "Churches and ministries have unique operational needs that generic business software doesn't address. Our platform is purpose-built for faith-based organizations, offering member management, volunteer coordination, donation tracking with giving statements, event management, and ministry team collaboration\u2014all in a welcoming, easy-to-use interface.",
    deliverables: [
      "Member directory portal with family grouping and contact management",
      "Volunteer scheduling system with availability and skill matching",
      "Donation and tithe tracking with tax-deductible receipt generation",
      "Event management with registration, check-in, and capacity tracking",
      "Small group management with leaders, members, and curriculum tracking",
      "Communication hub with email, SMS, and push notifications",
      "Attendance tracking for services, events, and small groups",
      "Ministry team dashboards with role-specific views",
    ],
    features: [
      {
        title: "Member Portal",
        description: "Self-service directory where members update profiles, view events, and manage giving.",
      },
      {
        title: "Volunteer Scheduling",
        description: "Automated scheduling with availability preferences, skill matching, and swap requests.",
      },
      {
        title: "Giving & Donations",
        description: "Online giving, recurring donations, campaign tracking, and year-end tax statements.",
      },
      {
        title: "Event Management",
        description: "Event creation, registration, check-in kiosks, and capacity management.",
      },
      {
        title: "Small Groups",
        description: "Group management with leader tools, curriculum distribution, and attendance tracking.",
      },
      {
        title: "Communication Hub",
        description: "Segmented communication via email, SMS, and in-app messaging to the right people.",
      },
    ],
    timeline: [
      { phase: "Week 1", title: "Discovery & Setup", description: "Ministry structure mapping, portal design, and data migration planning." },
      { phase: "Week 2\u20133", title: "Platform Build", description: "Member portal, volunteer system, and giving module configuration." },
      { phase: "Week 4", title: "Testing & Migration", description: "Data migration, end-to-end testing, and leadership preview." },
      { phase: "Week 5", title: "Launch & Training", description: "Congregation rollout, volunteer training, and admin orientation." },
    ],
    timelineRange: "4\u20135 weeks",
    idealClient: "Churches, ministries, religious organizations, and faith-based nonprofits needing modern tools for member engagement and operations.",
    idealClientDetails: [
      "Congregation of 100+ members with growing complexity",
      "Manual volunteer scheduling causing gaps and burnout",
      "No integrated giving platform or year-end tax statements",
      "Difficulty communicating with specific ministry groups",
    ],
    marketSize: "$14B",
    roiCallout: "Churches using dedicated management platforms see 25% increase in volunteer retention and 40% growth in online giving.",
    pricingTiers: [
      {
        name: "Community",
        price: "$4,000 setup + $500/mo",
        description: "Essential tools for small churches",
        features: [
          "Member directory",
          "Basic volunteer scheduling",
          "Online giving page",
          "Event calendar",
          "Email communications",
          "Up to 250 members",
        ],
      },
      {
        name: "Ministry",
        price: "$7,000 setup + $1,000/mo",
        description: "Full-featured platform for growing churches",
        features: [
          "Everything in Community",
          "Advanced volunteer management",
          "Donation tracking & statements",
          "Small group management",
          "Attendance tracking",
          "Up to 1,000 members",
        ],
        highlighted: true,
      },
      {
        name: "Campus",
        price: "$10,000 setup + $1,500/mo",
        description: "Multi-campus platform for large churches",
        features: [
          "Everything in Ministry",
          "Multi-campus support",
          "Check-in kiosk system",
          "Advanced analytics",
          "Custom integrations",
          "Unlimited members",
        ],
      },
    ],
  },
  {
    slug: "creator-management",
    title: "Creator & Talent Management",
    tagline: "Talent portals, contract management, revenue tracking, content calendars",
    price: "$5K\u201315K setup + $1K\u20133K/mo",
    category: "blue-ocean",
    overview:
      "The creator economy demands specialized tools for managing talent rosters, brand partnerships, content schedules, and revenue streams. Our platform gives talent management agencies and creator collectives a centralized hub for every aspect of their operations\u2014from contract negotiation to royalty distribution, content calendar to media kit generation.",
    deliverables: [
      "Talent roster portal with profiles, stats, and availability",
      "Contract lifecycle management with templates and e-signature",
      "Brand deal pipeline from outreach through completion",
      "Revenue and royalty tracking with split calculations",
      "Content calendar with multi-platform scheduling",
      "Media kit builder with dynamic stats and portfolio",
      "Communication hub for talent, brands, and internal team",
      "Performance analytics with engagement and revenue metrics",
    ],
    features: [
      {
        title: "Talent Roster",
        description: "Comprehensive talent profiles with stats, rates, availability, and portfolio showcases.",
      },
      {
        title: "Contract Management",
        description: "Template-based contracts with negotiation tracking, e-signature, and milestone payment triggers.",
      },
      {
        title: "Deal Pipeline",
        description: "Visual pipeline for brand partnerships from initial outreach through delivery and payment.",
      },
      {
        title: "Revenue Tracking",
        description: "Multi-stream revenue tracking with agency/talent splits, royalties, and payment scheduling.",
      },
      {
        title: "Content Calendar",
        description: "Unified calendar across platforms with deadlines, approvals, and publishing workflows.",
      },
      {
        title: "Media Kit Builder",
        description: "Dynamic, branded media kits that pull live stats and can be shared via custom links.",
      },
    ],
    timeline: [
      { phase: "Week 1\u20132", title: "Discovery & Design", description: "Talent workflow mapping, deal structure analysis, and platform design." },
      { phase: "Week 3\u20134", title: "Platform Build", description: "Talent portal, deal pipeline, and contract system configuration." },
      { phase: "Week 5", title: "Integration & Testing", description: "Revenue tracking, content calendar, and end-to-end workflow testing." },
      { phase: "Week 6", title: "Launch & Onboarding", description: "Platform deployment, talent onboarding, and team training." },
    ],
    timelineRange: "4\u20136 weeks",
    idealClient: "Talent management agencies, MCNs, creator collectives, and music labels managing multiple creators with brand partnerships and revenue streams.",
    idealClientDetails: [
      "Managing 10+ creators or talent with active brand deals",
      "Tracking contracts and payments in spreadsheets",
      "No centralized content calendar across platforms",
      "Revenue reconciliation taking hours each month",
    ],
    marketSize: "$250B",
    roiCallout: "Talent agencies using dedicated platforms close 30% more brand deals and reduce payment reconciliation time by 60%.",
    pricingTiers: [
      {
        name: "Indie",
        price: "$5,000 setup + $1,000/mo",
        description: "Essential tools for small agencies",
        features: [
          "Talent roster portal",
          "Basic contract management",
          "Deal tracking",
          "Revenue overview",
          "Content calendar",
          "Up to 15 talent",
        ],
      },
      {
        name: "Agency",
        price: "$10,000 setup + $2,000/mo",
        description: "Full platform for growing agencies",
        features: [
          "Everything in Indie",
          "Contract lifecycle management",
          "Brand deal pipeline",
          "Revenue & royalty tracking",
          "Media kit builder",
          "Up to 50 talent",
        ],
        highlighted: true,
      },
      {
        name: "Network",
        price: "$15,000 setup + $3,000/mo",
        description: "Enterprise platform for MCNs and labels",
        features: [
          "Everything in Agency",
          "Multi-division support",
          "Advanced analytics",
          "Custom integrations",
          "White-label portal",
          "Unlimited talent",
        ],
      },
    ],
  },
  {
    slug: "compliance-productized",
    title: "Productized Compliance Training",
    tagline: "Productized delivery of 8 compliance courses for resale",
    price: "$3K\u20138K setup + $5\u201310/employee",
    category: "blue-ocean",
    overview:
      "Turn compliance training into a revenue stream. Our white-label compliance platform lets HR consultancies, PEOs, payroll companies, and insurance brokers offer a full 8-course compliance library to their clients under their own brand. Per-employee licensing, bulk enrollment, and multi-company management make it easy to scale.",
    deliverables: [
      "White-label compliance portal with your branding",
      "8-course compliance library (OSHA, HIPAA, AML, harassment, DEI, ethics, data privacy, workplace safety)",
      "Per-employee licensing system with usage tracking",
      "Bulk enrollment tools for multi-company deployment",
      "Multi-company dashboard for managing all client organizations",
      "Automated certificate generation with your branding",
      "Regulatory update system with course version management",
      "Reseller pricing engine with margin configuration",
    ],
    features: [
      {
        title: "White-Label Portal",
        description: "Fully branded compliance portal that your clients see as your product, not ours.",
      },
      {
        title: "8-Course Library",
        description: "Professionally developed courses covering the most common compliance requirements.",
      },
      {
        title: "Per-Employee Licensing",
        description: "Flexible pricing model that scales with your clients' employee counts.",
      },
      {
        title: "Multi-Company Management",
        description: "Manage dozens of client companies from a single admin dashboard.",
      },
      {
        title: "Reseller Pricing Engine",
        description: "Configure your markup, set volume discounts, and manage client pricing tiers.",
      },
      {
        title: "Regulatory Updates",
        description: "Courses are updated when regulations change, ensuring ongoing compliance.",
      },
    ],
    timeline: [
      { phase: "Week 1", title: "Platform Setup", description: "White-label configuration, branding, and pricing engine setup." },
      { phase: "Week 2", title: "Course Deployment", description: "8-course library activation, quiz configuration, and certificate setup." },
      { phase: "Week 3", title: "Testing & Configuration", description: "Multi-company testing, enrollment workflows, and admin training." },
      { phase: "Week 4", title: "Launch", description: "Go-live, first client onboarding, and sales enablement materials." },
    ],
    timelineRange: "3\u20134 weeks",
    idealClient: "HR consultancies, PEOs, payroll companies, and insurance brokers wanting to add compliance training as a revenue stream for their existing client base.",
    idealClientDetails: [
      "Serving 10+ client companies who need compliance training",
      "Looking for recurring revenue streams beyond core services",
      "Clients asking for compliance training recommendations",
      "Wanting a turnkey solution to resell under your brand",
    ],
    marketSize: "$7.6B",
    roiCallout: "Resellers typically see 60-80% gross margins on compliance training, with most recouping setup costs within the first 3 client deployments.",
    pricingTiers: [
      {
        name: "Starter",
        price: "$3,000 setup + $5/employee",
        description: "Launch your compliance training business",
        features: [
          "White-label portal",
          "4 compliance courses",
          "Per-employee licensing",
          "Basic enrollment tools",
          "Certificate generation",
          "Up to 5 client companies",
        ],
      },
      {
        name: "Professional",
        price: "$5,000 setup + $7/employee",
        description: "Full compliance offering for active resellers",
        features: [
          "Everything in Starter",
          "All 8 compliance courses",
          "Bulk enrollment tools",
          "Multi-company dashboard",
          "Reseller pricing engine",
          "Up to 25 client companies",
        ],
        highlighted: true,
      },
      {
        name: "Enterprise",
        price: "$8,000 setup + $10/employee",
        description: "Enterprise compliance platform for large resellers",
        features: [
          "Everything in Professional",
          "Custom course additions",
          "Advanced analytics",
          "API integrations",
          "Dedicated support",
          "Unlimited client companies",
        ],
      },
    ],
  },
];

export function getServiceBySlug(slug: string): ServiceData | undefined {
  if (!siteConfig.activeServiceSlugs.includes(slug)) {
    return undefined;
  }
  return services.find((s) => s.slug === slug);
}

export function getCoreServices(): ServiceData[] {
  const featured = new Set(siteConfig.featuredCoreServiceSlugs);
  return services.filter((s) => s.category === "core" && siteConfig.activeServiceSlugs.includes(s.slug))
    .sort((a, b) => Number(featured.has(b.slug)) - Number(featured.has(a.slug)));
}

export function getBlueOceanServices(): ServiceData[] {
  const featured = new Set(siteConfig.featuredBlueOceanServiceSlugs);
  return services.filter((s) => s.category === "blue-ocean" && siteConfig.activeServiceSlugs.includes(s.slug))
    .sort((a, b) => Number(featured.has(b.slug)) - Number(featured.has(a.slug)));
}

export function getAllSlugs(): string[] {
  return services
    .filter((s) => siteConfig.activeServiceSlugs.includes(s.slug))
    .map((s) => s.slug);
}
