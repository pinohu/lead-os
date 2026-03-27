import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/scoring", label: "Scoring" },
  { href: "/dashboard/attribution", label: "Attribution" },
  { href: "/dashboard/lead-magnets", label: "Lead Magnets" },
  { href: "/dashboard/experiments", label: "Experiments" },
  { href: "/dashboard/radar", label: "Radar" },
  { href: "/dashboard/marketplace", label: "Marketplace" },
  { href: "/dashboard/tenants", label: "Tenants" },
  { href: "/dashboard/billing", label: "Billing" },
  { href: "/dashboard/providers", label: "Providers" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/documents", label: "Documents" },
  { href: "/dashboard/workflows", label: "Workflows" },
  { href: "/dashboard/feedback", label: "Feedback" },
  { href: "/dashboard/creative", label: "Creative" },
  { href: "/dashboard/distribution", label: "Distribution" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav
        aria-label="Dashboard navigation"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "16px 24px 0",
        }}
      >
        <ul
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            padding: 0,
            margin: 0,
            listStyle: "none",
          }}
        >
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 36,
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(20, 33, 29, 0.1)",
                  background: "rgba(255, 255, 255, 0.55)",
                  color: "var(--text)",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  transition: "background-color 140ms ease, border-color 140ms ease",
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </div>
  );
}
