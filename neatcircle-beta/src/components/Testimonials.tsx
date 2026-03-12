const testimonials = [
  {
    quote:
      "Our clients used to call for every update. Now they just log into the portal.",
    name: "Marcus Thompson",
    company: "Apex Plumbing",
    stat: "60% Admin Time Saved",
  },
  {
    quote:
      "One system for clients, projects, and invoicing. The automation alone saved us 20 hours a week.",
    name: "Maria Chen",
    company: "Swift Books Accounting",
    stat: "$180K Revenue Increase",
  },
  {
    quote:
      "The compliance training platform and client portal transformed our practice.",
    name: "David Park",
    company: "Greenfield Tax",
    stat: "100% Compliance Rate",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-cyan font-semibold text-sm uppercase tracking-wider">
            Client Results
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-navy mt-3 mb-4">
            Real Businesses. Real Impact.
          </h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="border border-slate-200 rounded-xl p-7 flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-amber-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-slate-600 leading-relaxed mb-6 flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="border-t border-slate-100 pt-4">
                <div className="font-semibold text-navy text-sm">
                  {t.name}
                </div>
                <div className="text-slate-400 text-xs">{t.company}</div>
              </div>

              {/* Stat badge */}
              <div className="mt-4 bg-cyan/10 text-cyan text-sm font-semibold text-center py-2 rounded-lg">
                {t.stat}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
