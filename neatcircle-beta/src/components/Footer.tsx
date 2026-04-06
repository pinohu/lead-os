import { siteConfig } from "@/lib/site-config";

const serviceLinks = [
  "Client Portal Automation",
  "Process Automation",
  "Systems Integration",
  "Training Platforms",
  "Business Intelligence",
  "Digital Transformation",
  "Compliance Training",
  "Managed Services",
];

const industryLinks = [
  "Tax Preparation",
  "Home Services",
  "Bookkeeping",
  "Business Coaching",
  "RE Syndication",
  "Construction",
  "Franchise Operations",
  "Staffing Agencies",
];

const companyLinks = [
  { label: "About", href: "/#about" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Process", href: "/#process" },
  { label: "Contact", href: "/#contact" },
  { label: "Client Portal", href: siteConfig.portalUrl, external: true },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand */}
          <div>
            <a
              href="/"
              className="inline-flex items-center gap-0 text-xl font-bold tracking-tight mb-4"
            >
              <span className="text-white">{siteConfig.brandPrimary}</span>
              <span className="text-cyan">{siteConfig.brandAccent}</span>
            </a>
            <p className="text-slate-600 text-sm leading-relaxed mb-3">
              Systematic Business Optimization
            </p>
            <p className="text-slate-500 text-xs">
              Enterprise-grade automation and client portals powered by a $2.1M
              software portfolio.
            </p>
          </div>

          {/* Col 2: Services */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Services</h4>
            <ul className="space-y-2.5">
              {serviceLinks.map((link) => (
                <li key={link}>
                  <a
                    href="/services"
                    className="text-slate-600 hover:text-white text-sm transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Industries */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">
              Industries
            </h4>
            <ul className="space-y-2.5">
              {industryLinks.map((link) => (
                <li key={link}>
                  <a
                    href="/#industries"
                    className="text-slate-600 hover:text-white text-sm transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Company */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    {...(link.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="text-slate-600 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                    {link.external && (
                      <svg
                        className="w-3.5 h-3.5 inline ml-1 -mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                        />
                      </svg>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 pt-6 text-center">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} {siteConfig.legalName}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
