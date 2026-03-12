const points = [
  "Engineering approach to business problems",
  "$2.1M software portfolio included in every engagement",
  "209+ premium tools \u2014 zero licensing fees for you",
  "Industry-specific templates deploy in days, not months",
  "97% client satisfaction rate",
  "30-day money-back guarantee on setup fees",
];

export default function About() {
  return (
    <section id="about" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left */}
          <div>
            <span className="text-cyan font-semibold text-sm uppercase tracking-wider">
              About Us
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy mt-3 mb-8">
              Why NeatCircle
            </h2>

            <ul className="space-y-4">
              {points.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-cyan mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-slate-600">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right */}
          <div>
            <h3 className="text-2xl font-bold text-navy mb-4">
              Our Philosophy
            </h3>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                We believe in systematic optimization &mdash; measuring before
                changing, automating deliberately, and building systems that
                scale with your business. Every engagement starts with
                understanding your current processes, identifying bottlenecks,
                and designing solutions that deliver measurable ROI.
              </p>
              <p>
                Our approach combines enterprise-grade technology with
                small-business agility. You get the tools and automations that
                Fortune 500 companies use, configured specifically for your
                industry and workflow &mdash; without the Fortune 500 price
                tag.
              </p>
              <p>
                We don&rsquo;t just implement software. We engineer operational
                efficiency. From client portals to compliance training, every
                solution is designed to reduce manual work, improve client
                experience, and drive growth.
              </p>
            </div>

            {/* Credentials */}
            <div className="mt-8 bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-navy/10 text-navy flex items-center justify-center">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-navy text-sm">
                    NeatCircle LLC
                  </div>
                  <div className="text-slate-400 text-xs">
                    Pennsylvania, USA &middot; Remote-capable nationwide
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
