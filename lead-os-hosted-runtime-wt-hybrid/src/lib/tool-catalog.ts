/**
 * Lead OS Tool Catalog
 *
 * Central registry of all integrated and available tools in the Lead OS ecosystem.
 * Maps AppSumo lifetime tools and third-party services to Lead OS engines.
 *
 * Why: Provides a single source of truth for tool discovery, credential requirements,
 * and engine routing so any subsystem can query what is available at runtime.
 */

export type ToolCategory =
  | "crm"
  | "communication"
  | "capture"
  | "tracking"
  | "advertising"
  | "seo"
  | "automation"
  | "billing"
  | "content"
  | "data"
  | "booking"
  | "reviews"
  | "directories"
  | "commerce"
  | "builders";

export type IntegrationMethod = "api" | "webhook" | "embed" | "oauth" | "manual";

export type LeadOsEngine =
  | "ingress"
  | "capture"
  | "scoring"
  | "distribution"
  | "creative"
  | "psychology"
  | "monetization"
  | "fulfillment"
  | "analytics"
  | "automation";

export type ToolPriority = "critical" | "high" | "medium" | "low";

export interface ToolEntry {
  slug: string;
  name: string;
  category: ToolCategory;
  description: string;
  integrationMethod: IntegrationMethod;
  requiredCredentials: string[];
  leadOsMapping: LeadOsEngine;
  priority: ToolPriority;
  capabilities: string[];
}

export interface ToolCatalog {
  version: string;
  updatedAt: string;
  tools: ToolEntry[];
}

const CATALOG_VERSION = "1.0.0";
const CATALOG_UPDATED_AT = "2026-03-27T00:00:00Z";

const TOOLS: ToolEntry[] = [
  // ─── CRM ─────────────────────────────────────────────────────────────────
  {
    slug: "suitedash",
    name: "SuiteDash",
    category: "crm",
    description:
      "All-in-one CRM platform with client portal, project management, and invoicing. Serves as the primary client relationship layer in Lead OS.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "baseUrl"],
    leadOsMapping: "distribution",
    priority: "critical",
    capabilities: [
      "contact-management",
      "deal-pipeline",
      "client-portal",
      "invoicing",
      "project-management",
      "file-sharing",
    ],
  },
  {
    slug: "salesnexus",
    name: "SalesNexus",
    category: "crm",
    description:
      "CRM combined with email marketing automation, purpose-built for B2B sales teams. Provides pipeline tracking and drip campaign sequencing.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "distribution",
    priority: "medium",
    capabilities: [
      "contact-management",
      "email-sequences",
      "pipeline-tracking",
      "lead-import",
      "activity-logging",
    ],
  },
  {
    slug: "sms-it-crm",
    name: "SMS-iT CRM",
    category: "crm",
    description:
      "SMS-first CRM platform enabling two-way text conversations, bulk messaging, and keyword-triggered automations for lead nurturing.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "senderId"],
    leadOsMapping: "distribution",
    priority: "high",
    capabilities: [
      "sms-crm",
      "two-way-sms",
      "bulk-sms",
      "keyword-triggers",
      "contact-management",
      "drip-sms",
    ],
  },

  // ─── COMMUNICATION ───────────────────────────────────────────────────────
  {
    slug: "emailit",
    name: "Emailit",
    category: "communication",
    description:
      "Transactional and marketing email delivery service with SMTP relay and template management. Handles all outbound email from Lead OS.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "fromEmail", "fromName"],
    leadOsMapping: "fulfillment",
    priority: "critical",
    capabilities: [
      "transactional-email",
      "bulk-email",
      "smtp-relay",
      "email-templates",
      "delivery-tracking",
      "bounce-handling",
    ],
  },
  {
    slug: "wbiztool",
    name: "WbizTool",
    category: "communication",
    description:
      "WhatsApp Business API wrapper enabling automated messaging, chatbots, and broadcast campaigns through the WhatsApp channel.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "phoneNumberId", "accessToken"],
    leadOsMapping: "fulfillment",
    priority: "critical",
    capabilities: [
      "whatsapp-messaging",
      "whatsapp-broadcast",
      "whatsapp-templates",
      "chatbot-integration",
      "media-messages",
    ],
  },
  {
    slug: "thoughtly",
    name: "Thoughtly",
    category: "communication",
    description:
      "AI-powered voice agent platform for outbound calling, inbound qualification, and appointment setting at scale.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "agentId"],
    leadOsMapping: "fulfillment",
    priority: "critical",
    capabilities: [
      "ai-voice-calls",
      "outbound-dialing",
      "inbound-qualification",
      "appointment-setting",
      "call-transcription",
      "voicemail-drop",
    ],
  },
  {
    slug: "easy-text-marketing",
    name: "Easy Text Marketing",
    category: "communication",
    description:
      "SMS marketing platform with keyword opt-ins, list management, and scheduled broadcast messaging for local businesses.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "accountId"],
    leadOsMapping: "fulfillment",
    priority: "high",
    capabilities: [
      "sms-broadcast",
      "keyword-optin",
      "list-management",
      "scheduled-sms",
      "two-way-sms",
    ],
  },
  {
    slug: "clickconnector",
    name: "ClickConnector",
    category: "communication",
    description:
      "Omnichannel customer communication hub unifying live chat, email, WhatsApp, and social messages into a single inbox.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "workspaceId"],
    leadOsMapping: "distribution",
    priority: "high",
    capabilities: [
      "unified-inbox",
      "live-chat",
      "email-inbox",
      "whatsapp-inbox",
      "social-messaging",
      "chatbot-handoff",
    ],
  },
  {
    slug: "novocall",
    name: "Novocall",
    category: "communication",
    description:
      "Click-to-call and scheduled callback widget that connects website visitors to sales reps within seconds, reducing lead response time.",
    integrationMethod: "embed",
    requiredCredentials: ["widgetId", "apiKey"],
    leadOsMapping: "capture",
    priority: "high",
    capabilities: [
      "click-to-call",
      "callback-scheduling",
      "call-routing",
      "call-analytics",
      "sms-follow-up",
    ],
  },
  {
    slug: "consolto",
    name: "Consolto",
    category: "communication",
    description:
      "Embedded video chat and scheduling tool for sales consultations, enabling face-to-face selling directly from any website page.",
    integrationMethod: "embed",
    requiredCredentials: ["widgetId", "apiKey"],
    leadOsMapping: "fulfillment",
    priority: "medium",
    capabilities: [
      "video-chat",
      "in-page-meetings",
      "screen-sharing",
      "meeting-scheduling",
      "chat-messaging",
    ],
  },
  {
    slug: "vbout",
    name: "VBOUT",
    category: "communication",
    description:
      "Multi-channel marketing automation platform covering email, SMS, social, and push notifications with visual workflow builder.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "automation",
    priority: "high",
    capabilities: [
      "email-automation",
      "sms-automation",
      "social-scheduling",
      "push-notifications",
      "lead-scoring",
      "landing-pages",
    ],
  },

  // ─── CAPTURE ─────────────────────────────────────────────────────────────
  {
    slug: "claspo",
    name: "Claspo",
    category: "capture",
    description:
      "Popup and widget builder specializing in exit-intent overlays, countdown timers, and multi-step lead capture forms with A/B testing.",
    integrationMethod: "embed",
    requiredCredentials: ["siteId", "apiKey"],
    leadOsMapping: "capture",
    priority: "high",
    capabilities: [
      "exit-intent-popups",
      "countdown-timers",
      "multi-step-forms",
      "ab-testing",
      "targeting-rules",
      "lead-capture",
    ],
  },
  {
    slug: "formaloo",
    name: "Formaloo",
    category: "capture",
    description:
      "No-code form and survey builder with conditional logic, calculated fields, and CRM-ready data collection pipelines.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "workspaceSlug"],
    leadOsMapping: "capture",
    priority: "high",
    capabilities: [
      "form-builder",
      "survey-builder",
      "conditional-logic",
      "calculated-fields",
      "data-collection",
      "webhook-output",
    ],
  },
  {
    slug: "facepop",
    name: "FacePop",
    category: "capture",
    description:
      "Video popup tool that embeds personalized video messages on landing pages to capture attention and increase opt-in conversion rates.",
    integrationMethod: "embed",
    requiredCredentials: ["widgetId"],
    leadOsMapping: "psychology",
    priority: "medium",
    capabilities: [
      "video-popups",
      "personalized-video",
      "cta-overlay",
      "lead-capture",
      "engagement-tracking",
    ],
  },
  {
    slug: "guidejar",
    name: "Guidejar",
    category: "capture",
    description:
      "Interactive product tour and onboarding guide builder that walks prospects through value demonstrations without requiring a sales call.",
    integrationMethod: "embed",
    requiredCredentials: ["projectId", "apiKey"],
    leadOsMapping: "psychology",
    priority: "medium",
    capabilities: [
      "product-tours",
      "interactive-demos",
      "onboarding-flows",
      "step-by-step-guides",
      "conversion-tracking",
    ],
  },
  {
    slug: "ideta",
    name: "Ideta",
    category: "capture",
    description:
      "No-code chatbot builder for deploying conversational lead qualification flows on websites, WhatsApp, and Messenger.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "botId"],
    leadOsMapping: "capture",
    priority: "medium",
    capabilities: [
      "chatbot-builder",
      "conversational-forms",
      "lead-qualification",
      "multi-channel-bot",
      "nlp-integration",
    ],
  },

  // ─── TRACKING ────────────────────────────────────────────────────────────
  {
    slug: "happierleads",
    name: "Happierleads",
    category: "tracking",
    description:
      "Website visitor identification tool that de-anonymizes B2B traffic, revealing company names and contact info for outbound follow-up.",
    integrationMethod: "embed",
    requiredCredentials: ["trackingId", "apiKey"],
    leadOsMapping: "ingress",
    priority: "high",
    capabilities: [
      "visitor-identification",
      "company-reveal",
      "contact-reveal",
      "real-time-alerts",
      "crm-push",
    ],
  },
  {
    slug: "salespanel",
    name: "Salespanel",
    category: "tracking",
    description:
      "Visitor tracking and lead scoring platform that monitors on-site behavior, scores leads by engagement, and syncs intent data to CRM.",
    integrationMethod: "embed",
    requiredCredentials: ["trackingId", "apiKey"],
    leadOsMapping: "scoring",
    priority: "high",
    capabilities: [
      "visitor-tracking",
      "lead-scoring",
      "behavioral-analytics",
      "intent-signals",
      "crm-sync",
      "segment-builder",
    ],
  },
  {
    slug: "plerdy",
    name: "Plerdy",
    category: "tracking",
    description:
      "Conversion rate optimization suite with heatmaps, session recordings, funnel analysis, and SEO checker in one platform.",
    integrationMethod: "embed",
    requiredCredentials: ["siteId", "apiKey"],
    leadOsMapping: "analytics",
    priority: "medium",
    capabilities: [
      "heatmaps",
      "session-recordings",
      "funnel-analysis",
      "click-maps",
      "scroll-maps",
      "seo-checker",
    ],
  },
  {
    slug: "screpy",
    name: "Screpy",
    category: "tracking",
    description:
      "Website monitoring and SEO audit platform that tracks uptime, page speed, Core Web Vitals, and keyword rankings over time.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "analytics",
    priority: "medium",
    capabilities: [
      "uptime-monitoring",
      "seo-auditing",
      "core-web-vitals",
      "keyword-tracking",
      "page-speed-analysis",
    ],
  },
  {
    slug: "markopolo-ai",
    name: "Markopolo.ai",
    category: "tracking",
    description:
      "Cross-channel ad tracking and attribution platform that unifies performance data from Meta, Google, TikTok, and other ad networks.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "workspaceId"],
    leadOsMapping: "analytics",
    priority: "medium",
    capabilities: [
      "cross-channel-attribution",
      "ad-performance-tracking",
      "roas-reporting",
      "audience-sync",
      "campaign-analytics",
    ],
  },
  {
    slug: "callscaler",
    name: "CallScaler",
    category: "tracking",
    description:
      "Call tracking and analytics platform with dynamic number insertion, call recording, and source attribution for marketing campaigns.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "accountId"],
    leadOsMapping: "analytics",
    priority: "high",
    capabilities: [
      "call-tracking",
      "dynamic-number-insertion",
      "call-recording",
      "source-attribution",
      "call-analytics",
      "whisper-messages",
    ],
  },

  // ─── ADVERTISING ─────────────────────────────────────────────────────────
  {
    slug: "quickads",
    name: "Quickads",
    category: "advertising",
    description:
      "AI ad creative generation platform that produces static images, videos, and copy variants for social and search ad campaigns.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "creative",
    priority: "high",
    capabilities: [
      "ai-ad-creatives",
      "image-generation",
      "video-ad-generation",
      "copy-variants",
      "brand-kit",
      "multi-platform-sizing",
    ],
  },
  {
    slug: "ad-alchemy",
    name: "Ad Alchemy",
    category: "advertising",
    description:
      "AI-driven ad optimization platform that analyzes campaign performance and auto-generates copy and creative recommendations.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "workspaceId"],
    leadOsMapping: "creative",
    priority: "medium",
    capabilities: [
      "ai-ad-optimization",
      "copy-generation",
      "creative-recommendations",
      "performance-analysis",
      "audience-insights",
    ],
  },

  // ─── SEO ─────────────────────────────────────────────────────────────────
  {
    slug: "nytro-seo",
    name: "Nytro SEO",
    category: "seo",
    description:
      "On-page SEO optimization tool that analyzes content, suggests improvements, and monitors keyword rankings for local and national search.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "siteId"],
    leadOsMapping: "ingress",
    priority: "medium",
    capabilities: [
      "on-page-seo",
      "keyword-analysis",
      "content-optimization",
      "rank-tracking",
      "technical-seo",
    ],
  },
  {
    slug: "writerzen",
    name: "WriterZen",
    category: "seo",
    description:
      "SEO content planning platform with keyword discovery, topic clustering, and content brief generation to drive organic traffic.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "ingress",
    priority: "medium",
    capabilities: [
      "keyword-discovery",
      "topic-clustering",
      "content-briefs",
      "serp-analysis",
      "keyword-difficulty",
    ],
  },
  {
    slug: "neuronwriter",
    name: "NeuronWriter",
    category: "seo",
    description:
      "AI-powered SEO content editor that uses NLP analysis of top-ranking pages to guide content structure, terms, and word count.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "projectId"],
    leadOsMapping: "ingress",
    priority: "medium",
    capabilities: [
      "seo-content-editor",
      "nlp-optimization",
      "competitor-analysis",
      "content-scoring",
      "ai-writing-assistant",
    ],
  },
  {
    slug: "subscribr",
    name: "Subscribr",
    category: "seo",
    description:
      "YouTube content strategy and SEO optimization platform that analyzes trending topics and suggests scripts for high-ranking videos.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "ingress",
    priority: "low",
    capabilities: [
      "youtube-seo",
      "topic-research",
      "script-generation",
      "trend-analysis",
      "competitor-tracking",
    ],
  },
  {
    slug: "taja",
    name: "Taja",
    category: "seo",
    description:
      "YouTube SEO tool that auto-generates optimized titles, descriptions, tags, and chapters for video content to maximize organic reach.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "ingress",
    priority: "low",
    capabilities: [
      "youtube-optimization",
      "title-generation",
      "description-generation",
      "tag-suggestions",
      "chapter-markers",
    ],
  },

  // ─── AUTOMATION ───────────────────────────────────────────────────────────
  {
    slug: "activepieces",
    name: "Activepieces",
    category: "automation",
    description:
      "Open-source workflow automation platform with 100+ connectors, serving as the primary orchestration layer for Lead OS inter-tool workflows.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "baseUrl"],
    leadOsMapping: "automation",
    priority: "critical",
    capabilities: [
      "workflow-automation",
      "multi-step-flows",
      "webhook-triggers",
      "api-connectors",
      "conditional-logic",
      "data-transformation",
    ],
  },
  {
    slug: "boost-space",
    name: "Boost.space",
    category: "automation",
    description:
      "Centralized data sync and integration hub that keeps records consistent across CRM, marketing, and operational tools in real time.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "spaceId"],
    leadOsMapping: "automation",
    priority: "high",
    capabilities: [
      "data-sync",
      "bi-directional-sync",
      "conflict-resolution",
      "multi-tool-integration",
      "real-time-updates",
    ],
  },
  {
    slug: "konnectzit",
    name: "KonnectzIT",
    category: "automation",
    description:
      "Visual automation builder that connects apps without code, enabling trigger-action workflows similar to Zapier with unlimited task runs.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "automation",
    priority: "high",
    capabilities: [
      "no-code-automation",
      "trigger-action-flows",
      "multi-app-connections",
      "data-mapping",
      "scheduled-tasks",
    ],
  },
  {
    slug: "robomotion-rpa",
    name: "Robomotion RPA",
    category: "automation",
    description:
      "Cloud-based robotic process automation platform for automating repetitive browser and desktop tasks without API access.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "robotId"],
    leadOsMapping: "automation",
    priority: "medium",
    capabilities: [
      "rpa-automation",
      "browser-automation",
      "desktop-automation",
      "scheduled-robots",
      "data-extraction",
    ],
  },
  {
    slug: "electroneek",
    name: "ElectroNeek",
    category: "automation",
    description:
      "Enterprise RPA platform with visual bot builder, orchestrator, and analytics for automating high-volume business processes.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "tenantId"],
    leadOsMapping: "automation",
    priority: "medium",
    capabilities: [
      "enterprise-rpa",
      "bot-orchestration",
      "process-automation",
      "rpa-analytics",
      "attended-unattended-bots",
    ],
  },
  {
    slug: "taskmagic",
    name: "TaskMagic",
    category: "automation",
    description:
      "Browser automation tool that records and replays web interactions, enabling scraping and automation without coding.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "automation",
    priority: "low",
    capabilities: [
      "browser-automation",
      "web-scraping",
      "task-recording",
      "scheduled-tasks",
      "data-extraction",
    ],
  },

  // ─── BILLING ─────────────────────────────────────────────────────────────
  {
    slug: "chargebee",
    name: "Chargebee",
    category: "billing",
    description:
      "Subscription billing and revenue management platform supporting recurring payments, trials, metered billing, and dunning automation.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "siteName"],
    leadOsMapping: "monetization",
    priority: "high",
    capabilities: [
      "subscription-billing",
      "recurring-payments",
      "trial-management",
      "metered-billing",
      "dunning-automation",
      "revenue-recognition",
      "checkout-pages",
    ],
  },

  // ─── CONTENT ─────────────────────────────────────────────────────────────
  {
    slug: "castmagic",
    name: "Castmagic",
    category: "content",
    description:
      "AI content repurposing tool that transforms audio and video recordings into blog posts, social snippets, newsletters, and show notes.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "creative",
    priority: "medium",
    capabilities: [
      "audio-transcription",
      "content-repurposing",
      "blog-generation",
      "social-snippets",
      "show-notes",
      "newsletter-drafts",
    ],
  },
  {
    slug: "invideo-studio",
    name: "InVideo Studio",
    category: "content",
    description:
      "AI video creation platform with 5,000+ templates for producing professional marketing and explainer videos from text prompts.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "creative",
    priority: "high",
    capabilities: [
      "ai-video-creation",
      "template-library",
      "text-to-video",
      "voiceover-generation",
      "brand-kit",
    ],
  },
  {
    slug: "minvo",
    name: "Minvo",
    category: "content",
    description:
      "Short-form video clip generator that automatically extracts viral-worthy moments from long-form video for social media distribution.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "creative",
    priority: "medium",
    capabilities: [
      "clip-extraction",
      "auto-captions",
      "social-formatting",
      "viral-moment-detection",
      "multi-platform-export",
    ],
  },
  {
    slug: "reelcraft",
    name: "ReelCraft",
    category: "content",
    description:
      "AI-powered short video creation tool for producing faceless reels and TikTok-style content from scripts or topics.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "creative",
    priority: "low",
    capabilities: [
      "faceless-videos",
      "script-to-video",
      "ai-voiceover",
      "stock-footage",
      "auto-captions",
    ],
  },
  {
    slug: "zebracat",
    name: "Zebracat",
    category: "content",
    description:
      "AI video generation platform converting blog posts and scripts into engaging short-form videos with AI avatars and voiceovers.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "creative",
    priority: "low",
    capabilities: [
      "text-to-video",
      "ai-avatars",
      "blog-to-video",
      "ai-voiceover",
      "social-publishing",
    ],
  },
  {
    slug: "vadoo-ai",
    name: "Vadoo AI",
    category: "content",
    description:
      "AI video creation and scheduling tool for producing and publishing short-form video content across multiple social platforms.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "creative",
    priority: "low",
    capabilities: [
      "ai-video-creation",
      "video-scheduling",
      "social-publishing",
      "ai-voiceover",
      "template-library",
    ],
  },
  {
    slug: "viloud",
    name: "Viloud",
    category: "content",
    description:
      "Online video streaming and live channel platform for creating branded streaming channels and video-on-demand libraries.",
    integrationMethod: "embed",
    requiredCredentials: ["apiKey", "channelId"],
    leadOsMapping: "creative",
    priority: "low",
    capabilities: [
      "video-streaming",
      "live-channels",
      "vod-library",
      "branded-player",
      "embed-player",
    ],
  },
  {
    slug: "bigvu",
    name: "BIGVU",
    category: "content",
    description:
      "Teleprompter and video production app enabling sales and marketing teams to record professional, script-guided videos on mobile.",
    integrationMethod: "manual",
    requiredCredentials: [],
    leadOsMapping: "creative",
    priority: "low",
    capabilities: [
      "teleprompter",
      "video-recording",
      "auto-captions",
      "video-editing",
      "branded-backgrounds",
    ],
  },
  {
    slug: "creasquare",
    name: "Creasquare",
    category: "content",
    description:
      "Social media content creation and scheduling platform with AI copy generation and a visual content calendar.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "creative",
    priority: "medium",
    capabilities: [
      "social-content-creation",
      "ai-copy-generation",
      "content-calendar",
      "social-scheduling",
      "multi-platform-publishing",
    ],
  },
  {
    slug: "marky",
    name: "Marky",
    category: "content",
    description:
      "AI social media marketing platform that auto-generates on-brand posts, captions, and graphics for consistent social presence.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "creative",
    priority: "medium",
    capabilities: [
      "ai-post-generation",
      "brand-consistency",
      "graphic-creation",
      "caption-generation",
      "auto-scheduling",
    ],
  },
  {
    slug: "vista-social",
    name: "Vista Social",
    category: "content",
    description:
      "Social media management platform with publishing, analytics, engagement, and review management across all major channels.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "profileId"],
    leadOsMapping: "creative",
    priority: "medium",
    capabilities: [
      "social-scheduling",
      "multi-channel-publishing",
      "social-analytics",
      "engagement-management",
      "review-monitoring",
    ],
  },
  {
    slug: "story-chief",
    name: "Story Chief",
    category: "content",
    description:
      "Multi-channel content distribution platform that publishes blog posts, social updates, and email newsletters from a single dashboard.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "creative",
    priority: "medium",
    capabilities: [
      "content-distribution",
      "multi-channel-publishing",
      "seo-optimization",
      "content-calendar",
      "team-collaboration",
    ],
  },
  {
    slug: "late",
    name: "Late",
    category: "content",
    description:
      "Social media scheduling tool with AI caption generation and optimal timing recommendations for maximum engagement.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "creative",
    priority: "low",
    capabilities: [
      "social-scheduling",
      "ai-captions",
      "optimal-timing",
      "content-library",
      "analytics",
    ],
  },
  {
    slug: "missinglettr",
    name: "Missinglettr",
    category: "content",
    description:
      "Social media drip campaign tool that automatically turns blog posts into year-long social media promotion sequences.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "automation",
    priority: "low",
    capabilities: [
      "content-automation",
      "drip-campaigns",
      "blog-to-social",
      "evergreen-scheduling",
      "campaign-analytics",
    ],
  },
  {
    slug: "fliki",
    name: "Fliki",
    category: "content",
    description:
      "AI video and audio generation platform converting text, blog posts, and tweets into engaging video content with realistic AI voices.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "creative",
    priority: "medium",
    capabilities: [
      "text-to-video",
      "ai-voiceover",
      "blog-to-video",
      "podcast-creation",
      "multi-language",
    ],
  },
  {
    slug: "repliq",
    name: "RepliQ",
    category: "content",
    description:
      "Personalized video and image outreach tool that dynamically inserts prospect data into video thumbnails and landing pages for cold outreach.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "psychology",
    priority: "high",
    capabilities: [
      "personalized-video",
      "dynamic-thumbnails",
      "personalized-landing-pages",
      "cold-outreach",
      "video-tracking",
    ],
  },

  // ─── DATA ─────────────────────────────────────────────────────────────────
  {
    slug: "reoon-email-verifier",
    name: "Reoon Email Verifier",
    category: "data",
    description:
      "Bulk and real-time email validation service that checks deliverability, detects disposable addresses, and reduces bounce rates.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "ingress",
    priority: "high",
    capabilities: [
      "email-verification",
      "bulk-validation",
      "real-time-verification",
      "disposable-detection",
      "bounce-prediction",
      "mx-record-check",
    ],
  },
  {
    slug: "google-maps-scraper",
    name: "Google Maps Scraper",
    category: "data",
    description:
      "Local business data extraction tool that pulls GMB listings, reviews, contact info, and ratings for lead list building.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "ingress",
    priority: "high",
    capabilities: [
      "local-business-data",
      "gmb-scraping",
      "contact-extraction",
      "review-data",
      "lead-list-building",
    ],
  },
  {
    slug: "databar",
    name: "Databar",
    category: "data",
    description:
      "Data enrichment platform that appends company firmographics, contact details, and intent signals to raw lead records.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "scoring",
    priority: "high",
    capabilities: [
      "data-enrichment",
      "company-data",
      "contact-enrichment",
      "firmographics",
      "bulk-enrichment",
      "real-time-enrichment",
    ],
  },
  {
    slug: "aitableai",
    name: "AITable.ai",
    category: "data",
    description:
      "AI-powered database and spreadsheet platform combining relational data management with AI automation for lead and project tracking.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "spaceId"],
    leadOsMapping: "analytics",
    priority: "critical",
    capabilities: [
      "database-management",
      "relational-data",
      "ai-automation",
      "form-builder",
      "dashboard-builder",
      "api-access",
    ],
  },

  // ─── BOOKING ─────────────────────────────────────────────────────────────
  {
    slug: "trafft",
    name: "Trafft",
    category: "booking",
    description:
      "Advanced appointment scheduling and booking management platform with staff management, payments, and automated reminders.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "companyId"],
    leadOsMapping: "fulfillment",
    priority: "critical",
    capabilities: [
      "appointment-booking",
      "staff-management",
      "payment-collection",
      "automated-reminders",
      "group-bookings",
      "booking-widget",
    ],
  },

  // ─── REVIEWS ─────────────────────────────────────────────────────────────
  {
    slug: "more-good-reviews",
    name: "More Good Reviews",
    category: "reviews",
    description:
      "Review collection and management platform that automates review request campaigns and monitors online reputation across platforms.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "businessId"],
    leadOsMapping: "psychology",
    priority: "high",
    capabilities: [
      "review-requests",
      "automated-campaigns",
      "reputation-monitoring",
      "review-gating",
      "multi-platform-reviews",
    ],
  },
  {
    slug: "partnero",
    name: "Partnero",
    category: "reviews",
    description:
      "Partnership and referral program management platform for creating affiliate, referral, and influencer programs with tracking and payouts.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "programId"],
    leadOsMapping: "ingress",
    priority: "high",
    capabilities: [
      "referral-programs",
      "affiliate-management",
      "partner-tracking",
      "commission-management",
      "payout-automation",
      "partner-portal",
    ],
  },

  // ─── DIRECTORIES ─────────────────────────────────────────────────────────
  {
    slug: "brilliant-directories",
    name: "Brilliant Directories",
    category: "directories",
    description:
      "White-label directory website platform for building membership-based business directories with lead generation and monetization features.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "directoryId"],
    leadOsMapping: "ingress",
    priority: "high",
    capabilities: [
      "directory-platform",
      "membership-management",
      "lead-generation",
      "listing-management",
      "payment-processing",
      "white-label",
    ],
  },

  // ─── COMMERCE ─────────────────────────────────────────────────────────────
  {
    slug: "dukaan",
    name: "Dukaan",
    category: "commerce",
    description:
      "Quick-launch e-commerce storefront builder enabling businesses to sell products and services online with minimal setup.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "storeId"],
    leadOsMapping: "monetization",
    priority: "medium",
    capabilities: [
      "ecommerce-storefront",
      "product-catalog",
      "payment-processing",
      "order-management",
      "delivery-tracking",
    ],
  },
  {
    slug: "evolup",
    name: "Evolup",
    category: "commerce",
    description:
      "AI-powered affiliate store builder that creates product review sites and monetized content stores with automated SEO optimization.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey"],
    leadOsMapping: "monetization",
    priority: "low",
    capabilities: [
      "affiliate-store",
      "product-reviews",
      "ai-content-generation",
      "seo-optimization",
      "monetization",
    ],
  },

  // ─── BUILDERS ────────────────────────────────────────────────────────────
  {
    slug: "documentero",
    name: "Documentero",
    category: "builders",
    description:
      "Document automation platform that generates proposals, contracts, and reports from templates with dynamic data merge fields.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "templateId"],
    leadOsMapping: "fulfillment",
    priority: "high",
    capabilities: [
      "document-generation",
      "template-merge",
      "proposal-creation",
      "contract-generation",
      "pdf-export",
      "e-signature-ready",
    ],
  },
  {
    slug: "brizy-cloud",
    name: "Brizy Cloud",
    category: "builders",
    description:
      "Drag-and-drop landing page and website builder with a library of conversion-optimized templates and form integration.",
    integrationMethod: "embed",
    requiredCredentials: ["apiKey", "siteId"],
    leadOsMapping: "capture",
    priority: "medium",
    capabilities: [
      "landing-page-builder",
      "drag-and-drop",
      "form-builder",
      "template-library",
      "custom-domain",
      "seo-settings",
    ],
  },
  {
    slug: "teleporthq",
    name: "TeleportHQ",
    category: "builders",
    description:
      "Low-code website and UI builder with component-based design and code export, enabling rapid front-end deployment.",
    integrationMethod: "api",
    requiredCredentials: ["apiKey", "projectId"],
    leadOsMapping: "capture",
    priority: "low",
    capabilities: [
      "website-builder",
      "ui-builder",
      "component-library",
      "code-export",
      "cms-integration",
      "custom-domain",
    ],
  },
];

// ─── Niche-to-tool recommendation maps ────────────────────────────────────────

type NicheKey =
  | "pest-control"
  | "immigration-law"
  | "real-estate"
  | "dental"
  | "ecommerce"
  | "saas"
  | "home-services"
  | "insurance"
  | "mortgage"
  | "fitness"
  | "generic";

const NICHE_RECOMMENDATIONS: Record<NicheKey, string[]> = {
  "pest-control": [
    "trafft",
    "novocall",
    "suitedash",
    "google-maps-scraper",
    "reoon-email-verifier",
    "callscaler",
    "more-good-reviews",
    "claspo",
    "thoughtly",
    "wbiztool",
    "easy-text-marketing",
    "salespanel",
  ],
  "immigration-law": [
    "suitedash",
    "documentero",
    "formaloo",
    "trafft",
    "consolto",
    "clickconnector",
    "reoon-email-verifier",
    "claspo",
    "guidejar",
    "more-good-reviews",
    "activepieces",
  ],
  "real-estate": [
    "suitedash",
    "salespanel",
    "happierleads",
    "callscaler",
    "documentero",
    "trafft",
    "claspo",
    "wbiztool",
    "thoughtly",
    "repliq",
    "more-good-reviews",
    "novocall",
  ],
  dental: [
    "trafft",
    "novocall",
    "thoughtly",
    "more-good-reviews",
    "suitedash",
    "easy-text-marketing",
    "wbiztool",
    "claspo",
    "google-maps-scraper",
    "callscaler",
  ],
  ecommerce: [
    "chargebee",
    "dukaan",
    "claspo",
    "plerdy",
    "salespanel",
    "quickads",
    "markopolo-ai",
    "vista-social",
    "reoon-email-verifier",
    "activepieces",
    "konnectzit",
  ],
  saas: [
    "chargebee",
    "salespanel",
    "happierleads",
    "guidejar",
    "plerdy",
    "formaloo",
    "claspo",
    "clickconnector",
    "repliq",
    "partnero",
    "activepieces",
    "databar",
  ],
  "home-services": [
    "trafft",
    "novocall",
    "callscaler",
    "thoughtly",
    "google-maps-scraper",
    "more-good-reviews",
    "easy-text-marketing",
    "claspo",
    "suitedash",
    "wbiztool",
  ],
  insurance: [
    "suitedash",
    "thoughtly",
    "novocall",
    "callscaler",
    "salespanel",
    "documentero",
    "claspo",
    "reoon-email-verifier",
    "databar",
    "repliq",
    "happierleads",
  ],
  mortgage: [
    "suitedash",
    "documentero",
    "trafft",
    "thoughtly",
    "callscaler",
    "salespanel",
    "happierleads",
    "claspo",
    "repliq",
    "reoon-email-verifier",
    "partnero",
  ],
  fitness: [
    "trafft",
    "chargebee",
    "claspo",
    "vista-social",
    "marky",
    "more-good-reviews",
    "easy-text-marketing",
    "wbiztool",
    "formaloo",
    "fliki",
  ],
  generic: [
    "suitedash",
    "activepieces",
    "emailit",
    "claspo",
    "trafft",
    "salespanel",
    "reoon-email-verifier",
    "documentero",
    "more-good-reviews",
    "wbiztool",
  ],
};

const GOAL_TOOL_MAP: Record<string, string[]> = {
  "increase-leads": ["claspo", "formaloo", "happierleads", "salespanel", "google-maps-scraper", "brilliant-directories"],
  "improve-conversion": ["plerdy", "guidejar", "repliq", "facepop", "novocall", "consolto"],
  "automate-followup": ["activepieces", "thoughtly", "wbiztool", "easy-text-marketing", "vbout", "konnectzit"],
  "manage-reputation": ["more-good-reviews", "vista-social", "screpy"],
  "scale-advertising": ["quickads", "ad-alchemy", "markopolo-ai", "callscaler"],
  "content-marketing": ["castmagic", "neuronwriter", "writerzen", "story-chief", "marky", "fliki"],
  "close-more-deals": ["documentero", "consolto", "suitedash", "trafft", "repliq"],
  "reduce-churn": ["chargebee", "guidejar", "vbout", "sms-it-crm"],
};

// ─── Catalog singleton ────────────────────────────────────────────────────────

let catalogInstance: ToolCatalog | null = null;

function buildCatalog(): ToolCatalog {
  if (catalogInstance) return catalogInstance;
  catalogInstance = {
    version: CATALOG_VERSION,
    updatedAt: CATALOG_UPDATED_AT,
    tools: TOOLS,
  };
  return catalogInstance;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the full tool catalog.
 */
export function getToolCatalog(): ToolCatalog {
  return buildCatalog();
}

/**
 * Returns all tools belonging to the specified category.
 */
export function getToolsByCategory(category: ToolCategory): ToolEntry[] {
  return buildCatalog().tools.filter((t) => t.category === category);
}

/**
 * Returns all tools at the specified priority level.
 */
export function getToolsByPriority(priority: ToolPriority): ToolEntry[] {
  return buildCatalog().tools.filter((t) => t.priority === priority);
}

/**
 * Returns all tools mapped to the specified Lead OS engine.
 */
export function getToolsByMapping(engine: LeadOsEngine): ToolEntry[] {
  return buildCatalog().tools.filter((t) => t.leadOsMapping === engine);
}

/**
 * Cross-references the catalog against the credentials vault to return only
 * tools that have been fully configured for a given tenant.
 *
 * Uses a dynamic import to avoid circular dependencies with the vault module.
 */
export async function getEnabledTools(tenantId: string): Promise<ToolEntry[]> {
  const { getCredentialsForTenant } = await import("./credentials-vault");
  const credentials = await getCredentialsForTenant(tenantId);
  const configuredSlugs = new Set(Object.keys(credentials));

  return buildCatalog().tools.filter((tool) => {
    if (tool.requiredCredentials.length === 0) return true;
    return tool.requiredCredentials.every((cred) =>
      configuredSlugs.has(`${tool.slug}:${cred}`)
    );
  });
}

/**
 * Returns a recommended tool stack for a given niche, optionally boosted by
 * stated goals. Tools matching goals are surfaced first, followed by
 * niche defaults, deduplicated.
 */
export function getRecommendedTools(
  niche: string,
  goals: string[] = []
): ToolEntry[] {
  const catalog = buildCatalog();
  const toolsBySlug = new Map(catalog.tools.map((t) => [t.slug, t]));

  const normalizedNiche = niche.toLowerCase().replace(/\s+/g, "-") as NicheKey;
  const nicheDefaults = NICHE_RECOMMENDATIONS[normalizedNiche] ?? NICHE_RECOMMENDATIONS["generic"];

  const goalSlugs = goals.flatMap(
    (g) => GOAL_TOOL_MAP[g.toLowerCase().replace(/\s+/g, "-")] ?? []
  );

  const orderedSlugs = [...new Set([...goalSlugs, ...nicheDefaults])];

  return orderedSlugs
    .map((slug) => toolsBySlug.get(slug))
    .filter((t): t is ToolEntry => t !== undefined);
}
