# LeadOS System Diagrams

Visual documentation of every major system in LeadOS. Each diagram is interactive — click the edit link to modify it in the Mermaid Live Editor.

---

## 1. System Architecture — 4-Layer Model

Shows how the Edge Layer, Kernel Runtime, Intelligence Layer, and Data Infrastructure connect.

```mermaid
flowchart TB
    subgraph EDGE["Edge Layer (neatcircle-beta)"]
        direction LR
        E1["Marketing Site\n152 pages"]
        E2["Service Pages\n16 services"]
        E3["Location Pages\n5 GMB profiles"]
        E4["Industry Pages\n16 verticals"]
    end

    subgraph KERNEL["Kernel Runtime (hybrid)"]
        direction LR
        K1["539 SSG Pages"]
        K2["315+ API Endpoints"]
        K3["28 Dashboard Pages"]
        K4["Personalization Engine"]
    end

    subgraph INTELLIGENCE["Intelligence Layer"]
        direction LR
        I1["Customer Intelligence\n13 pre-built profiles"]
        I2["Dynamic Generator\nAny niche on the fly"]
        I3["84 Personas\n14 niches x 6 types"]
        I4["Nurture Engine\n91 email templates"]
    end

    subgraph DATA["Data + Infrastructure"]
        direction LR
        D1[("PostgreSQL\n4 migrations")]
        D2[("Redis\nBullMQ queues")]
        D3["32 Integration\nAdapters"]
        D4["LRU Caches\n+ PersistentStore"]
    end

    EDGE -->|"API calls"| KERNEL
    KERNEL -->|"reads"| INTELLIGENCE
    KERNEL -->|"persists"| DATA
    INTELLIGENCE -->|"generates"| KERNEL
```

[Edit this diagram](https://l.mermaid.ai/Uojo3m)

---

## 2. Lead Pipeline Flow — Capture to Conversion

The complete journey from visitor landing to deal closed, showing 4D scoring, temperature routing, and the nurture feedback loop.

```mermaid
flowchart LR
    subgraph CAPTURE["1. Capture"]
        V["Visitor Lands"] --> LP["Landing Page\n(personalized by niche)"]
        LP --> FORM["Lead Capture Form\n(3-step progressive)"]
        LP --> ASSESS["Assessment\n(7 scored questions)"]
        LP --> CALC["ROI Calculator\n(niche-specific inputs)"]
        LP --> CHAT["Chat Widget"]
    end

    subgraph PROCESS["2. Process"]
        FORM --> INTAKE["/api/intake\n(normalize + dedupe)"]
        ASSESS --> INTAKE
        CALC --> INTAKE
        CHAT --> INTAKE
        INTAKE --> SCORE["4D Scoring\nIntent + Fit +\nEngagement + Urgency"]
        SCORE --> TEMP{"Temperature?"}
    end

    subgraph ROUTE["3. Route"]
        TEMP -->|"Cold 0-34"| NURTURE["7-Stage Nurture\n(intelligence-driven)"]
        TEMP -->|"Warm 35-59"| AUTHORITY["Authority Content\n+ Case Studies"]
        TEMP -->|"Hot 60-79"| BOOK["Book Consultation\n+ Proposal"]
        TEMP -->|"Burning 80+"| OFFER["Direct Offer\n+ Checkout"]
    end

    subgraph CONVERT["4. Convert"]
        NURTURE --> RESCORE["Auto-Rescore\n(on engagement)"]
        RESCORE --> TEMP
        AUTHORITY --> BOOK
        BOOK --> CLOSE["Deal Closed"]
        OFFER --> CLOSE
        CLOSE --> JOY["Joy Dashboard\nTime Saved + Milestones"]
    end
```

[Edit this diagram](https://l.mermaid.ai/Qs0zC8)

---

## 3. Customer Intelligence Engine — Research to Every Surface

How deep buyer research (buying triggers, objections, trust signals, conversion psychology, competitor awareness) flows into every customer-facing component.

```mermaid
flowchart TB
    CI["Customer Intelligence\n13 Industry Profiles"]

    subgraph RESEARCH["Buyer Research Data"]
        ICP["Ideal Customer Profile\nRole, Size, Revenue, Tech Stack"]
        TRIGGERS["Buying Triggers\n5-6 events per niche\nwith emotional state"]
        JOURNEY["Decision Journey\nStages, Timeline,\nTouchpoints, Drop-offs"]
        OBJECTIONS["Objection Map\nObjection + Fear +\nEvidence Response"]
        TRUST["Trust Signals\nPrimary, Secondary,\nDealbreakers"]
        PSYCH["Conversion Psychology\nMotivation, Risk,\nDecision Style, CTA"]
        COMP["Competitor Awareness\nAlternatives,\nDifferentiators"]
    end

    CI --> RESEARCH

    subgraph SURFACES["What Intelligence Drives"]
        S1["Experience Engine\nHero copy, trust promise,\nanxiety reducer"]
        S2["Industry Pages\nTriggers, objections,\njourney timeline"]
        S3["Offer Pages\nEvidence responses,\nguarantee type"]
        S4["Nurture Emails\n7 stages mapped to\nbuyer psychology"]
        S5["Directory Pages\nCompetitor comparison"]
        S6["Assessment Questions\nScored by niche weights"]
        S7["Calculator\nNiche-specific inputs\nand ROI framing"]
    end

    ICP --> S6
    TRIGGERS --> S1
    TRIGGERS --> S4
    JOURNEY --> S2
    JOURNEY --> S4
    OBJECTIONS --> S2
    OBJECTIONS --> S3
    OBJECTIONS --> S4
    TRUST --> S1
    TRUST --> S2
    PSYCH --> S1
    PSYCH --> S3
    PSYCH --> S4
    PSYCH --> S7
    COMP --> S5
```

[Edit this diagram](https://l.mermaid.ai/3U4PBM)

---

## 4. Dynamic Niche Generation — Any Keyword to Complete System

How typing any niche keyword (like "mobile dog grooming") generates a full intelligence profile, nurture sequence, and web presence.

```mermaid
flowchart TB
    INPUT["User types:\nmobile dog grooming"]

    INPUT --> DETECT{"Keyword\nDetection"}
    DETECT -->|"pet detected"| BASE["Base Category:\nservice"]
    DETECT -->|"no match"| GENERAL["Fallback:\ngeneral"]

    BASE --> GEN["Dynamic Intelligence\nGenerator"]
    GENERAL --> GEN

    subgraph GENERATED["Generated Profile"]
        direction TB
        G1["ICP: Owner managing\nmobile dog grooming operations"]
        G2["Buying Triggers\nadapted from service triggers"]
        G3["Objections\nniche-specific language"]
        G4["Trust Signals\nadapted for grooming businesses"]
        G5["Decision Journey\n3 days, 4 touchpoints"]
        G6["Conversion Psychology\nfear-of-loss, impulsive, book-call"]
    end

    GEN --> GENERATED

    GENERATED --> AI{"AI API Key\navailable?"}
    AI -->|"Yes"| ENRICH["AI Enrichment\nGPT-4o-mini generates:\n- Real competitors\n- Specific triggers\n- Actual objections"]
    AI -->|"No"| CACHE["Use template\nprofile as-is"]
    ENRICH --> CACHE

    CACHE --> LRU["LRU Cache\n500 entries, 24hr TTL"]

    LRU --> OUT1["Industry Page\nwith grooming-specific copy"]
    LRU --> OUT2["7 Nurture Emails\nmapped to grooming triggers"]
    LRU --> OUT3["Assessment\ngrooming-specific questions"]
    LRU --> OUT4["Calculator\ngrooming economics"]
```

[Edit this diagram](https://l.mermaid.ai/H7OCiG)

---

## 5. Joy Layer — Autonomous Systems That Work While You Sleep

The Joy Engine, Autonomous Recovery, Smart Alerts, and the Joy Dashboard that gives users their time back.

```mermaid
flowchart TB
    subgraph AUTONOMOUS["Autonomous Systems (run 24/7)"]
        AR["Autonomous Recovery"]
        AR --> CP["Churn Prevention\nDetect disengagement\nAuto re-engage"]
        AR --> LR["Lead Re-engagement\nWarm leads going cold\nAuto nurture step"]
        AR --> PF["Pipeline Fill\nThin pipeline detected\nActivate prospecting"]
        AR --> LOC["Location Recovery\nVolume drop at location\nGenerate recovery plan"]
        AR --> SG["Scope Guardian\nOverrun detected\nChange order draft"]
    end

    subgraph JOY["Joy Engine"]
        MILE["Milestone Detection\n1st lead, 100 leads,\n$5K MRR, 7-day streak"]
        TIME["Time Saved Calculator\n6 categories x $150/hr\nPersonal message"]
        BRIEF["Morning Briefing\nGreeting + Wins +\nAttention Items +\nOne Recommendation"]
    end

    subgraph ALERTS["Smart Alerts (3:1 positive ratio)"]
        POS["Positive Alerts\nConversion improved 12%\nRevenue beating last month\n7-day lead streak"]
        ACT["Action Alerts\n2 hot leads waiting\nWarm leads cooling\nPipeline thin"]
    end

    subgraph DASHBOARD["Joy Dashboard (/dashboard/joy)"]
        DG["Greeting\nGood morning! While you\nslept, 3 leads came in"]
        DT["Time Saved Hero\n23.4 hours = $3,510"]
        DW["Your Wins Grid"]
        DM["Milestones Celebrated"]
        DA["Attention Items\n(or: Nothing needs you.\nGo enjoy your coffee.)"]
        DR["One Thing for Today"]
    end

    AUTONOMOUS --> BRIEF
    JOY --> DASHBOARD
    ALERTS --> DASHBOARD
```

[Edit this diagram](https://l.mermaid.ai/n3wKo2)

---

## 6. Enterprise Security Architecture

The complete auth chain, SOC 2 controls, and observability stack.

```mermaid
flowchart TB
    REQ["Incoming Request"] --> MW["Middleware Layer"]

    subgraph MW["Middleware"]
        RID["x-request-id\ngenerated"]
        TRACE["Request Tracing\nstartTrace()"]
        RATE["Rate Limiting\nPer-IP + Per-Tenant\n+ Per-Endpoint"]
        PUB{"Public\nRoute?"}
        AUTH["Auth Chain\n1. API Key (los_*)\n2. Session (sess_*)\n3. X-API-Key header\n4. Session cookie\n5. Operator JWT"]
        SIG["Middleware Signature\nx-middleware-signature\n(anti-spoofing)"]
        VER["x-api-version\n2026-03-30"]
        CSP["Security Headers\nCSP + HSTS +\nX-Frame-Options"]
    end

    RID --> TRACE --> RATE --> PUB
    PUB -->|"Yes"| CSP
    PUB -->|"No"| AUTH --> SIG --> CSP

    CSP --> ROUTE["API Route Handler"]

    subgraph AUTHSYS["Auth System"]
        RBAC["5 Roles\nowner, admin, operator,\nviewer, billing-admin"]
        TOTP["2FA/TOTP\nNode.js crypto\nBackup codes"]
        IPWL["IP Allowlisting\nIPv4 + CIDR"]
        KEYS["API Key Management\nSHA-256 hashed\nScoped permissions"]
        SESS["Session Management\n24hr expiry\nMax 5 concurrent"]
    end

    subgraph COMPLIANCE["SOC 2 Controls"]
        AUDIT["Persistent Audit Trail\nPostgreSQL write-through"]
        ACCESS["Access Review Reports"]
        ENCRYPT["Encryption Verification\nAES-256-GCM vault"]
        RETAIN["Data Retention Policy"]
        INCIDENT["Incident Response\nP1-P4 runbook"]
    end

    subgraph MONITOR["Observability"]
        HEALTH["Deep Health Checks\nDB + Redis + Memory"]
        STATUS["Status Page\n30d/90d uptime"]
        SENTRY["Sentry Integration\nEnvelope API"]
        TRACES["Request Traces\np95 + error rate"]
        OPENAPI["OpenAPI 3.1 Spec\n/api/docs/openapi.json"]
    end

    ROUTE --> AUTHSYS
    ROUTE --> COMPLIANCE
    ROUTE --> MONITOR
```

[Edit this diagram](https://l.mermaid.ai/pxzbkC)
