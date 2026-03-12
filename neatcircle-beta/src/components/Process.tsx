const steps = [
  {
    number: 1,
    title: "Discovery",
    description:
      "Free audit of current systems. Identify quick wins and long-term opportunities.",
  },
  {
    number: 2,
    title: "Design",
    description:
      "Custom architecture. Workflows, pipelines, and integrations mapped to your business.",
  },
  {
    number: 3,
    title: "Deploy",
    description:
      "Full implementation in 2\u20136 weeks. Portal configured, team trained, systems connected.",
  },
  {
    number: 4,
    title: "Optimize",
    description:
      "Quarterly reviews. New automations, performance tracking, continuous improvement.",
  },
];

export default function Process() {
  return (
    <section id="process" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-cyan font-semibold text-sm uppercase tracking-wider">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-navy mt-3 mb-4">
            From Discovery to Optimization
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            A proven four-step methodology that delivers results in weeks, not
            months.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={step.number} className="relative text-center">
              {/* Connector line (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-px bg-slate-200" />
              )}

              {/* Number circle */}
              <div className="w-16 h-16 rounded-full bg-cyan text-white text-xl font-bold flex items-center justify-center mx-auto mb-5 relative z-10">
                {step.number}
              </div>

              <h3 className="text-xl font-semibold text-navy mb-2">
                {step.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
