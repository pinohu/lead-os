import { tenantConfig } from "@/lib/tenant";

type SignInPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const FEATURE_LIST = [
  "27 dashboard pages",
  "Real-time lead scoring",
  "Multi-channel nurture automation",
  "A/B experiment engine",
  "Competitive intelligence",
] as const;

const TRUST_ITEMS = [
  "Passwordless login — no passwords to remember or leak",
  "Encrypted magic link expires in 15 minutes",
  "Your data is protected with AES-256 encryption",
] as const;

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = (await searchParams) ?? {};
  const error = asString(params.error);
  const nextPath = asString(params.next) ?? "/dashboard";
  const { brandName } = tenantConfig;

  return (
    <main>
      {/* Brand header */}
      <section className="hero" aria-labelledby="auth-heading">
        <p className="eyebrow">Operator access</p>
        <h1 id="auth-heading" style={{ fontSize: "clamp(2rem, 4vw, 3.6rem)" }}>
          {brandName}
        </h1>
        <p className="lede hero-support">
          Your lead generation command center. Enter your email to receive a
          secure sign-in link.
        </p>
      </section>

      {/* Two-column layout on wide screens: form left, feature panel right */}
      <div
        className="auth-sign-in-layout"
        style={{
          display: "grid",
          gap: "18px",
          alignItems: "start",
          gridTemplateColumns: "1fr",
        }}
      >
        {/* Auth form panel */}
        <section
          className="panel auth-panel"
          aria-label="Sign-in form"
          style={{ width: "100%" }}
        >
          {error ? (
            <div className="status-banner error" role="alert" aria-live="assertive">
              {error === "unauthorized"
                ? "You need an approved operator session to view that page."
                : "We could not complete sign-in. Request a new link and try again."}
            </div>
          ) : null}

          <form
            action="/api/auth/request-link"
            method="post"
            className="auth-form"
            noValidate
          >
            <input type="hidden" name="next" value={nextPath} />

            <label htmlFor="email">
              Operator email
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                placeholder="you@yourdomain.com"
                aria-describedby="email-help"
              />
            </label>

            <p id="email-help" className="muted form-help">
              Enter your email and we will send a secure sign-in link. No
              password needed.
            </p>

            <button type="submit" className="primary" style={{ width: "100%" }}>
              Send magic link
            </button>
          </form>

          {/* Trust indicators */}
          <ul
            aria-label="Security guarantees"
            style={{
              listStyle: "none",
              padding: 0,
              margin: "1.75rem 0 0",
              display: "grid",
              gap: "10px",
              paddingTop: "1.5rem",
              borderTop: "1px solid var(--surface-border)",
            }}
          >
            {TRUST_ITEMS.map((item) => (
              <li
                key={item}
                className="muted"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  fontSize: "0.87rem",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    color: "var(--success)",
                    fontWeight: 800,
                    flexShrink: 0,
                    marginTop: "0.05em",
                  }}
                >
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>

          {/* New-account link */}
          <div
            style={{
              marginTop: "1.75rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid var(--surface-border)",
              textAlign: "center",
            }}
          >
            <p className="muted" style={{ marginBottom: "0.75rem", fontSize: "0.95rem" }}>
              New to {brandName}?
            </p>
            <a href="/onboard" className="secondary" style={{ display: "inline-block" }}>
              Create your account
            </a>
          </div>
        </section>

        {/* Feature panel — rendered below form on mobile, inline on wide screens via CSS */}
        <aside
          className="panel"
          aria-label="Platform features"
          style={{
            background:
              "linear-gradient(160deg, var(--surface-dark) 0%, rgba(10, 22, 18, 0.97) 100%)",
            color: "var(--text-inverse)",
            borderColor: "rgba(200, 220, 210, 0.1)",
          }}
        >
          <p
            style={{
              fontSize: "0.76rem",
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: "1rem",
            }}
          >
            What you get access to
          </p>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gap: "10px",
            }}
          >
            {FEATURE_LIST.map((feature) => (
              <li
                key={feature}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(255, 255, 255, 0.06)",
                  fontSize: "0.95rem",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "28px",
                    height: "28px",
                    borderRadius: "999px",
                    background: "var(--accent-soft)",
                    color: "var(--accent)",
                    fontSize: "0.82rem",
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {/* Responsive two-column layout injection — no JS required */}
      <style>{`
        @media (min-width: 760px) {
          .auth-sign-in-layout {
            grid-template-columns: 1.1fr 0.9fr;
          }
        }
      `}</style>
    </main>
  );
}
