export default function Hero() {
  return (
    <section className="relative bg-gradient-to-b from-navy-dark via-navy to-navy-light pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden">
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2 mb-8">
          <svg className="w-4 h-4 text-cyan" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-sm text-white/90 font-medium">
            209+ Premium Tools Included &mdash; Zero Software Licensing Fees
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
          Stop Paying for Software.
          <br />
          <span className="text-cyan">Start Growing Your Business.</span>
        </h1>

        {/* Subhead */}
        <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
          Access our $2.1M software portfolio. Get enterprise-grade automation,
          client portals, CRM, and 209+ premium tools &mdash; all included in
          your engagement. No licensing fees. Ever.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href="#contact"
            className="bg-cyan hover:bg-cyan-dark text-white font-semibold px-8 py-3.5 rounded-lg transition-colors text-lg w-full sm:w-auto"
          >
            Book a Discovery Call
          </a>
          <a
            href="#process"
            className="border border-white/30 hover:border-white/60 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors text-lg w-full sm:w-auto"
          >
            See How It Works
          </a>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[
            { value: "40-60%", label: "Cost Savings" },
            { value: "$0", label: "Software Fees" },
            { value: "30 Days", label: "Or Your Setup Fee Back" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/10 border border-white/15 rounded-xl px-6 py-5 backdrop-blur-sm"
            >
              <div className="text-2xl font-bold text-cyan mb-1">{stat.value}</div>
              <div className="text-sm text-slate-300">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
