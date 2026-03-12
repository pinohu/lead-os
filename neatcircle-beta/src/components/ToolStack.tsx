const categories = [
  {
    title: "Core Platform",
    tools: [
      {
        name: "SuiteDash",
        description: "CRM, Portal, PM, Invoicing, LMS, Scheduling",
      },
    ],
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    title: "Automation",
    tools: [
      { name: "Make.com", description: "Visual workflow automation" },
      { name: "Pabbly Connect", description: "Affordable integrations" },
      { name: "KonnectzIT", description: "App-to-app connectors" },
      { name: "Boost.space", description: "Data synchronization" },
      { name: "AgenticFlow", description: "AI-powered automation" },
    ],
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
      </svg>
    ),
  },
  {
    title: "Communication",
    tools: [
      { name: "Emailit", description: "Transactional email" },
      { name: "Acumbamail", description: "Marketing email & SMS" },
      { name: "Formspree", description: "Form endpoints" },
    ],
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
  },
];

export default function ToolStack() {
  return (
    <section className="py-20 bg-navy">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-cyan font-semibold text-sm uppercase tracking-wider">
            Your Technology Arsenal
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 mb-4">
            $2.1M Software Portfolio
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-lg">
            Included with every engagement. All lifetime-licensed. Zero
            recurring software costs passed to you.
          </p>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.title}
              className="bg-white/5 border border-white/10 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-cyan/20 text-cyan flex items-center justify-center">
                  {cat.icon}
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {cat.title}
                </h3>
              </div>
              <ul className="space-y-3">
                {cat.tools.map((tool) => (
                  <li key={tool.name} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-cyan mt-0.5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    <div>
                      <span className="text-white font-medium text-sm">
                        {tool.name}
                      </span>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {tool.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
