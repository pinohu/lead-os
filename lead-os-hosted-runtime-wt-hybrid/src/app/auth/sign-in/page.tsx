type SignInPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = (await searchParams) ?? {};
  const error = asString(params.error);
  const nextPath = asString(params.next) ?? "/dashboard";

  return (
    <main>
      <section className="hero">
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in to your Lead OS dashboard</h1>
        <p className="lede">
          Enter your email to receive a secure sign-in link. No password needed — just click the
          link in your inbox.
        </p>
      </section>

      <section className="panel auth-panel">
        {error ? (
          <div className="status-banner error" role="alert">
            {error === "unauthorized" ? "You need an approved operator session to view that page." : "We could not complete sign-in. Request a new link and try again."}
          </div>
        ) : null}

        <form action="/api/auth/request-link" method="post" className="auth-form">
          <input type="hidden" name="next" value={nextPath} />
          <label htmlFor="email">Operator email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder="you@yourdomain.com"
          />
          <p className="muted form-help">
            Enter your email and we will send a secure sign-in link. No password needed.
          </p>
          <button type="submit" className="primary">
            Send magic link
          </button>
        </form>

        <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(148, 163, 184, 0.15)", textAlign: "center" }}>
          <p className="muted" style={{ marginBottom: "0.75rem" }}>
            New to Lead OS?
          </p>
          <a href="/onboard" className="secondary" style={{ display: "inline-block" }}>
            Create your account
          </a>
        </div>
      </section>
    </main>
  );
}
