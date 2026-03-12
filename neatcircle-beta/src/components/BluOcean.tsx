import Link from "next/link";

const opportunities = [
  {
    name: "RE Syndication",
    slug: "re-syndication",
    market: "$21T",
    setup: "$8K\u201320K setup",
    monthly: "$1.5K\u20134K/mo",
    description:
      "Investor portals, deal rooms, accreditation, K-1 distribution, capital calls.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
  {
    name: "Immigration Law",
    slug: "immigration-law",
    market: "$9.9B",
    setup: "$5K\u201312K setup",
    monthly: "$800\u20132K/mo",
    description:
      "Multilingual portals, 5 case pipelines, USCIS tracking, document management.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.264.26-2.466.727-3.558" />
      </svg>
    ),
  },
  {
    name: "Compliance Training",
    slug: "compliance-productized",
    market: "$7.6B",
    setup: "$3K\u20138K setup",
    monthly: "$5\u201310/employee",
    description:
      "8 courses, auto-assignment, certificates, reporting. Productized delivery.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    name: "Construction",
    slug: "construction",
    market: "$1.8T",
    setup: "$8K\u201328K setup",
    monthly: "$3K\u20138K/mo",
    description:
      "Project portals, safety compliance, daily reports, change orders, OSHA training.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1-5.1a4.07 4.07 0 010-5.76 4.07 4.07 0 015.76 0l.34.34.34-.34a4.07 4.07 0 015.76 0 4.07 4.07 0 010 5.76l-5.1 5.1a1.5 1.5 0 01-2.12 0z" />
      </svg>
    ),
  },
  {
    name: "Franchise Operations",
    slug: "franchise",
    market: "$827B",
    setup: "$10K\u201330K setup",
    monthly: "$2K\u20136K/mo",
    description:
      "Multi-location management, franchisee portals, brand compliance.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z" />
      </svg>
    ),
  },
  {
    name: "Staffing Agencies",
    slug: "staffing",
    market: "$218B",
    setup: "$6K\u201315K setup",
    monthly: "$1.5K\u20134K/mo",
    description:
      "Candidate/client portals, placement pipelines, timesheet management.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    name: "Church Management",
    slug: "church-management",
    market: "$14B",
    setup: "$4K\u201310K setup",
    monthly: "$500\u20131.5K/mo",
    description:
      "Member portals, volunteer scheduling, donation tracking, event management.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
  {
    name: "Creator Management",
    slug: "creator-management",
    market: "$250B",
    setup: "$5K\u201315K setup",
    monthly: "$1K\u20133K/mo",
    description:
      "Talent portals, contract management, revenue tracking, content calendars.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
  },
];

export default function BluOcean() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-cyan font-semibold text-sm uppercase tracking-wider">
            Blue Ocean Opportunities
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-navy mt-3 mb-4">
            Untapped Markets. First-Mover Advantage.
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            Pre-built solutions for underserved industries.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {opportunities.map((opp) => (
            <Link
              key={opp.slug}
              href={`/services/${opp.slug}`}
              className="group bg-white border border-slate-200 rounded-xl p-6 hover:border-cyan/40 hover:shadow-lg transition-all flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-cyan/10 text-cyan flex items-center justify-center">
                  {opp.icon}
                </div>
                <span className="text-xs font-semibold bg-cyan/10 text-cyan px-2.5 py-1 rounded-full">
                  {opp.market}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-navy mb-2">
                {opp.name}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-1">
                {opp.description}
              </p>
              <div className="border-t border-slate-100 pt-3 mt-auto space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Setup</span>
                  <span className="font-semibold text-navy">{opp.setup}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Monthly</span>
                  <span className="font-semibold text-navy">{opp.monthly}</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-cyan text-sm font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
