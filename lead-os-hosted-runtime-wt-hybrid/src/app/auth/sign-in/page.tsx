import type { Metadata } from "next";
import { tenantConfig } from "@/lib/tenant";

export const metadata: Metadata = {
  title: "Sign In | Lead OS",
  description: "Sign in to your Lead OS operator dashboard with a secure magic link.",
};

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
      <section className="max-w-5xl mx-auto px-4 py-8 md:py-12" aria-labelledby="auth-heading">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Operator access</p>
        <h1 id="auth-heading" className="text-foreground text-[clamp(2rem,4vw,3.6rem)]">
          {brandName}
        </h1>
        <p className="text-lg text-muted-foreground">
          Your lead generation command center. Enter your email to receive a
          secure sign-in link.
        </p>
      </section>

      {/* Two-column layout on wide screens: form left, feature panel right */}
      <div className="auth-sign-in-layout grid gap-[18px] items-start grid-cols-1">
        {/* Auth form panel */}
        <section
          className="rounded-xl border border-border bg-card p-6 w-full"
          aria-label="Sign-in form"
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

            <p id="email-help" className="text-muted-foreground text-sm mt-1">
              Enter your email and we will send a secure sign-in link. No
              password needed.
            </p>

            <button type="submit" className="primary w-full">
              Send magic link
            </button>
          </form>

          {/* Trust indicators */}
          <ul
            aria-label="Security guarantees"
            className="list-none p-0 mt-7 grid gap-2.5 pt-6 border-t border-border"
          >
            {TRUST_ITEMS.map((item) => (
              <li
                key={item}
                className="text-muted-foreground flex items-start gap-2.5 text-sm"
              >
                <span
                  aria-hidden="true"
                  className="text-emerald-600 font-extrabold shrink-0 mt-0.5"
                >
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>

          {/* New-account link */}
          <div className="mt-7 pt-6 border-t border-border text-center">
            <p className="text-muted-foreground mb-3 text-[0.95rem]">
              New to {brandName}?
            </p>
            <a href="/onboard" className="secondary inline-block">
              Create your account
            </a>
          </div>
        </section>

        {/* Feature panel — rendered below form on mobile, inline on wide screens via CSS */}
        <aside
          className="rounded-xl border border-border bg-card p-6"
          aria-label="Platform features"
          style={{
            background:
              "linear-gradient(160deg, var(--surface-dark) 0%, rgba(10, 22, 18, 0.97) 100%)",
            color: "var(--surface-dark-foreground)",
            borderColor: "var(--surface-dark-border)",
          }}
        >
          <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.16em] text-[color:var(--surface-dark-accent)]">
            What you get access to
          </p>
          <ul className="list-none p-0 m-0 grid gap-2.5">
            {FEATURE_LIST.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-3 rounded-md bg-white/[0.1] px-3.5 py-3 text-[0.95rem] font-semibold text-[color:var(--surface-dark-foreground)]"
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.14] text-xs font-extrabold text-[color:var(--surface-dark-accent)]"
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
