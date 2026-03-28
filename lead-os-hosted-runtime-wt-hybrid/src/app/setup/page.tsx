import Link from "next/link";

interface SetupChecks {
  database: boolean;
  tenant: boolean;
  brand: boolean;
}

interface SetupStatusResponse {
  configured: boolean;
  checks: SetupChecks;
}

async function fetchSetupStatus(): Promise<SetupStatusResponse> {
  try {
    const { getPool } = await import("@/lib/db");
    const { tenantConfig } = await import("@/lib/tenant");

    const pool = getPool();
    let database = false;
    if (pool) {
      try {
        const client = await pool.connect();
        await client.query("SELECT 1");
        client.release();
        database = true;
      } catch {
        database = false;
      }
    }

    const tenant =
      Boolean(tenantConfig.tenantId) &&
      tenantConfig.tenantId !== "default-tenant";

    const brandName = process.env.NEXT_PUBLIC_BRAND_NAME;
    const brand =
      Boolean(brandName) &&
      brandName !== "My Brand" &&
      brandName !== "Lead OS Hosted";

    const configured = database && tenant && brand;
    return { configured, checks: { database, tenant, brand } };
  } catch {
    return {
      configured: false,
      checks: { database: false, tenant: false, brand: false },
    };
  }
}

interface CheckCardProps {
  label: string;
  description: string;
  passed: boolean;
}

function CheckCard({ label, description, passed }: CheckCardProps) {
  return (
    <div
      className="panel"
      style={{ display: "grid", gap: "10px" }}
      aria-label={`${label}: ${passed ? "configured" : "not configured"}`}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "1.05rem",
            fontFamily:
              '"Trebuchet MS", "Gill Sans", "Helvetica Neue", sans-serif',
            fontWeight: 700,
            letterSpacing: 0,
          }}
        >
          {label}
        </h3>
        <span
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            borderRadius: "999px",
            flexShrink: 0,
            fontSize: "0.85rem",
            fontWeight: 800,
            background: passed ? "var(--success-soft)" : "var(--danger-soft)",
            color: passed ? "var(--success)" : "var(--danger)",
          }}
        >
          {passed ? "✓" : "✗"}
        </span>
      </div>
      <p
        className="muted"
        style={{ fontSize: "0.9rem", lineHeight: 1.5, margin: 0 }}
      >
        {description}
      </p>
      <span
        style={{
          display: "inline-block",
          padding: "4px 10px",
          borderRadius: "999px",
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          background: passed ? "var(--success-soft)" : "var(--danger-soft)",
          color: passed ? "var(--success)" : "var(--danger)",
          width: "fit-content",
        }}
      >
        {passed ? "Ready" : "Action needed"}
      </span>
    </div>
  );
}

export default async function SetupPage() {
  const { configured, checks } = await fetchSetupStatus();

  return (
    <main>
      <div
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          display: "grid",
          gap: "var(--space-6)",
        }}
      >
        <header style={{ display: "grid", gap: "var(--space-3)" }}>
          <span className="eyebrow">First-run setup</span>
          <h1
            style={{
              fontSize: "clamp(2rem, 4vw, 3.2rem)",
              margin: 0,
            }}
          >
            Welcome to Lead OS
          </h1>
          <p className="lede muted">
            Before you start capturing leads, confirm the three core systems
            below are configured. You can always change these settings later.
          </p>
        </header>

        {configured && (
          <div
            className="status-banner success"
            role="status"
            aria-live="polite"
          >
            All systems are configured. Your Lead OS instance is ready.
          </div>
        )}

        {!configured && (
          <div
            className="status-banner"
            style={{
              background: "var(--accent-soft)",
              borderColor: "rgba(196,99,45,0.22)",
              color: "var(--accent-strong)",
            }}
            role="status"
            aria-live="polite"
          >
            Complete the steps below to finish setting up your instance.
          </div>
        )}

        <section aria-label="Configuration status checks">
          <div
            style={{ display: "grid", gap: "var(--space-3)" }}
            role="list"
          >
            <div role="listitem">
              <CheckCard
                label="Database"
                description="A PostgreSQL connection is required to store leads, sessions, and automation state. Set LEAD_OS_DATABASE_URL in your environment."
                passed={checks.database}
              />
            </div>
            <div role="listitem">
              <CheckCard
                label="Tenant Identity"
                description="Set LEAD_OS_TENANT_ID to a unique identifier for your installation. The default value is a placeholder and must be replaced."
                passed={checks.tenant}
              />
            </div>
            <div role="listitem">
              <CheckCard
                label="Branding"
                description="Set NEXT_PUBLIC_BRAND_NAME to your company or product name. This appears throughout the platform and in all lead-facing pages."
                passed={checks.brand}
              />
            </div>
          </div>
        </section>

        <nav aria-label="Setup actions">
          <div className="cta-row">
            <Link
              href="/onboard"
              className="primary"
              aria-label="Open the guided setup wizard"
            >
              Complete Setup
            </Link>
            <Link
              href="/"
              className="secondary"
              aria-label="Skip setup and continue in demo mode"
            >
              Quick Start (Demo Mode)
            </Link>
          </div>
        </nav>

        <p
          className="muted"
          style={{ fontSize: "0.85rem", marginTop: "var(--space-2)" }}
        >
          Running in demo mode uses default values and stores data in memory
          only. No data is persisted without a database connection.
        </p>
      </div>
    </main>
  );
}
