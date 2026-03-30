import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check Your Email | Lead OS",
  description: "A secure sign-in link has been sent to your email. Check your inbox to continue.",
};

type CheckEmailPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const NEXT_STEPS = [
  "Check your spam or junk folder if you don't see it within a minute.",
  "The link works on any device — phone, tablet, or desktop.",
  "Link expires in 15 minutes. Request a new one if it runs out.",
] as const;

export default async function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const params = (await searchParams) ?? {};
  const email = asString(params.email);

  return (
    <main>
      {/* Confirmation hero */}
      <section className="hero" aria-labelledby="check-email-heading">
        {/* Email illustration */}
        <div
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "72px",
            height: "72px",
            borderRadius: "var(--radius-md)",
            background: "var(--accent-soft)",
            marginBottom: "1.25rem",
            fontSize: "2.2rem",
            lineHeight: 1,
          }}
        >
          ✉
        </div>

        <p className="eyebrow">Check your inbox</p>
        <h1 id="check-email-heading" style={{ fontSize: "clamp(2rem, 4vw, 3.6rem)" }}>
          Magic link sent
        </h1>
        <p className="lede hero-support">
          {email ? (
            <>
              We sent a secure sign-in link to{" "}
              <strong style={{ color: "var(--text)" }}>{email}</strong>.
            </>
          ) : (
            "We sent a secure sign-in link to your operator email."
          )}
        </p>
      </section>

      {/* Tips panel */}
      <section className="panel auth-panel" aria-label="What to do next">
        <h2
          style={{
            fontSize: "1rem",
            fontFamily: "inherit",
            fontWeight: 700,
            marginBottom: "1rem",
            letterSpacing: 0,
          }}
        >
          What to do next
        </h2>

        <ol
          aria-label="Steps to complete sign-in"
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gap: "10px",
          }}
        >
          {NEXT_STEPS.map((step, index) => (
            <li
              key={step}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
                padding: "14px 16px",
                borderRadius: "var(--radius-sm)",
                background: "rgba(34, 95, 84, 0.07)",
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
                  background: "var(--secondary-soft)",
                  color: "var(--secondary)",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  flexShrink: 0,
                  marginTop: "0.1em",
                }}
              >
                {index + 1}
              </span>
              <span className="muted" style={{ fontSize: "0.95rem", paddingTop: "0.15em" }}>
                {step}
              </span>
            </li>
          ))}
        </ol>

        {/* Didn't receive it section */}
        <div
          style={{
            marginTop: "1.75rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--surface-border)",
          }}
        >
          <h2
            style={{
              fontSize: "0.95rem",
              fontFamily: "inherit",
              fontWeight: 700,
              marginBottom: "0.75rem",
              letterSpacing: 0,
            }}
          >
            Didn't receive it?
          </h2>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "0 0 1.25rem",
              display: "grid",
              gap: "8px",
            }}
          >
            <li
              className="muted"
              style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.9rem" }}
            >
              <span aria-hidden="true" style={{ color: "var(--text-soft)", flexShrink: 0 }}>
                •
              </span>
              Make sure you used an approved operator email address.
            </li>
            <li
              className="muted"
              style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.9rem" }}
            >
              <span aria-hidden="true" style={{ color: "var(--text-soft)", flexShrink: 0 }}>
                •
              </span>
              Contact your administrator if you need access provisioned.
            </li>
          </ul>

          <a
            href="/auth/sign-in"
            className="secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <span aria-hidden="true">←</span>
            Try again
          </a>
        </div>
      </section>
    </main>
  );
}
