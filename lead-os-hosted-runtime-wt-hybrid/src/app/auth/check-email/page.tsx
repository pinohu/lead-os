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
      <section className="max-w-5xl mx-auto px-4 py-16 md:py-24" aria-labelledby="check-email-heading">
        {/* Email illustration */}
        <div
          aria-hidden="true"
          className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-xl bg-accent/10 mb-5 text-4xl leading-none"
        >
          ✉
        </div>

        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Check your inbox</p>
        <h1 id="check-email-heading" className="text-foreground text-[clamp(2rem,4vw,3.6rem)]">
          Magic link sent
        </h1>
        <p className="text-lg text-muted-foreground">
          {email ? (
            <>
              We sent a secure sign-in link to{" "}
              <strong className="text-foreground">{email}</strong>.
            </>
          ) : (
            "We sent a secure sign-in link to your operator email."
          )}
        </p>
      </section>

      {/* Tips panel */}
      <section className="rounded-xl border border-border bg-card p-6" aria-label="What to do next">
        <h2 className="text-foreground text-base font-bold mb-4">
          What to do next
        </h2>

        <ol
          aria-label="Steps to complete sign-in"
          className="list-none p-0 m-0 grid gap-2.5"
        >
          {NEXT_STEPS.map((step, index) => (
            <li
              key={step}
              className="flex items-start gap-3.5 px-4 py-3.5 rounded-md bg-primary/[0.07]"
            >
              <span
                aria-hidden="true"
                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-secondary/10 text-secondary font-extrabold text-xs shrink-0 mt-0.5"
              >
                {index + 1}
              </span>
              <span className="text-muted-foreground text-[0.95rem] pt-0.5">
                {step}
              </span>
            </li>
          ))}
        </ol>

        {/* Didn't receive it section */}
        <div className="mt-7 pt-6 border-t border-border">
          <h2 className="text-foreground text-[0.95rem] font-bold mb-3">
            Didn&apos;t receive it?
          </h2>
          <ul className="list-none p-0 mb-5 grid gap-2">
            <li className="text-muted-foreground flex items-start gap-2 text-sm">
              <span aria-hidden="true" className="text-muted-foreground shrink-0">
                •
              </span>
              Make sure you used an approved operator email address.
            </li>
            <li className="text-muted-foreground flex items-start gap-2 text-sm">
              <span aria-hidden="true" className="text-muted-foreground shrink-0">
                •
              </span>
              Contact your administrator if you need access provisioned.
            </li>
          </ul>

          <a
            href="/auth/sign-in"
            className="secondary inline-flex items-center gap-1.5"
          >
            <span aria-hidden="true">&larr;</span>
            Try again
          </a>
        </div>
      </section>
    </main>
  );
}
