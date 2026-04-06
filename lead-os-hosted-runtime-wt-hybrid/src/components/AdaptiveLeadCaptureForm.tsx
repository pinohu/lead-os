"use client";

import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { ExperienceProfile } from "@/lib/experience";
import type { IntakeSource } from "@/lib/intake";
import type { FunnelFamily } from "@/lib/runtime-schema";

type IntakeDecision = {
  destination: string;
  ctaLabel: string;
  reason: string;
  family: FunnelFamily;
};

type IntakeResponse = {
  success: boolean;
  leadKey: string;
  decision: IntakeDecision;
  hot: boolean;
  score: number;
};

type AdaptiveLeadCaptureFormProps = {
  source: IntakeSource;
  family: FunnelFamily;
  niche: string;
  service: string;
  pagePath: string;
  returning?: boolean;
  profile: ExperienceProfile;
};

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "");
}

export function AdaptiveLeadCaptureForm(props: AdaptiveLeadCaptureFormProps) {
  const [step, setStep] = useState(1);
  const [selectedGoalId, setSelectedGoalId] = useState(props.profile.discoveryOptions[0]?.id ?? "");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<IntakeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const statusId = useId();

  const selectedGoal = props.profile.discoveryOptions.find((option) => option.id === selectedGoalId) ?? props.profile.discoveryOptions[0];
  const requiresPhone = props.profile.mode === "booking-first";

  function goToNextStep() {
    if (step === 1 && !selectedGoalId) {
      setError("Choose the outcome you want first so we can tailor the path.");
      return;
    }

    if (step === 2) {
      if (!firstName.trim()) {
        setError("Add your first name so we can personalize the next step.");
        return;
      }
      if (!email.trim()) {
        setError("Add your email so we can send your tailored next step.");
        return;
      }
      if (requiresPhone && !normalizePhone(phone)) {
        setError("Add your best phone number so we can keep the fast path available.");
        return;
      }
    }

    setError(null);
    setStep((current) => Math.min(current + 1, 3));
  }

  function goBack() {
    setError(null);
    setStep((current) => Math.max(current - 1, 1));
  }

  async function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/intake", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source: props.source,
            firstName,
            email,
            phone: phone ? normalizePhone(phone) : undefined,
            company: company || undefined,
            service: props.service,
            niche: props.niche,
            page: props.pagePath,
            message: notes || undefined,
            metadata: {
              goalId: selectedGoal?.id,
              goalLabel: selectedGoal?.label,
              interactionMode: props.profile.mode,
              experimentId: props.profile.experimentId,
              variantId: props.profile.variantId,
              pagePath: props.pagePath,
              trustPromise: props.profile.trustPromise,
            },
            experimentId: props.profile.experimentId,
            variantId: props.profile.variantId,
            returning: props.returning,
            contentEngaged: selectedGoal?.signals.contentEngaged ?? props.profile.mode === "webinar-first",
            wantsBooking: selectedGoal?.signals.wantsBooking ?? props.profile.mode === "booking-first",
            wantsCheckout: selectedGoal?.signals.wantsCheckout ?? props.family === "checkout",
            prefersChat: selectedGoal?.signals.prefersChat ?? props.profile.mode === "chat-first",
            preferredFamily: props.family,
          }),
        });

        const payload = await response.json();
        if (!response.ok || !payload.success) {
          setError(payload.error ?? "We could not save your progress. Please try again.");
          return;
        }

        setResult(payload);
      } catch {
        setError("We could not connect to the runtime just now. Please try again.");
      }
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6" id="capture-form" aria-labelledby="capture-form-title">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Adaptive capture path</p>
          <h2 id="capture-form-title" className="text-foreground">Get the right next step without starting from scratch</h2>
          <p className="text-muted-foreground">
            We use one light commitment first, then tailor the milestone-two follow-up and the
            milestone-three offer around your actual intent.
          </p>
        </div>
        <ol className="flex gap-4" aria-label="Form progress">
          {[1, 2, 3].map((item) => (
            <li key={item} className={cn("flex flex-col items-center gap-1 text-sm", item === step ? "text-primary font-bold" : item < step ? "text-muted-foreground" : "text-muted-foreground/50")}>
              <span className={cn("inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold", item === step ? "bg-primary text-primary-foreground" : item < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>{item}</span>
              <strong>{item === 1 ? "Goal" : item === 2 ? "Contact" : "Confirm"}</strong>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex justify-between items-center py-2 px-3 rounded-md bg-muted text-sm text-foreground" aria-live="polite">
        <span>Step {step} of 3</span>
        <span>{selectedGoal?.label ?? "Choose your goal"}</span>
      </div>

      {result ? (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-4 space-y-2" role="status">
          <h3 className="text-foreground">You are all set</h3>
          <p className="text-foreground">{result.decision.reason}</p>
          <p className="text-muted-foreground">
            {result.hot ? "We have prioritized your request and will be in touch shortly." : "We will follow up with your next step soon."}
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Button asChild><Link href={result.decision.destination}>
              {result.decision.ctaLabel}
            </Link></Button>
            <Button asChild variant="outline"><a href={props.profile.secondaryActionHref}>
              {props.profile.secondaryActionLabel}
            </a></Button>
          </div>
        </div>
      ) : (
        <>
          {step === 1 ? (
            <fieldset className="space-y-4">
              <legend>{props.profile.discoveryPrompt}</legend>
              <div className="grid gap-3 md:grid-cols-2">
                {props.profile.discoveryOptions.map((option) => (
                  <label key={option.id} className={cn("rounded-lg border-2 p-4 cursor-pointer transition-colors flex flex-col gap-1", selectedGoalId === option.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}>
                    <input
                      type="radio"
                      name="goal"
                      value={option.id}
                      checked={selectedGoalId === option.id}
                      onChange={() => setSelectedGoalId(option.id)}
                    />
                    <span className="font-semibold text-foreground">{option.label}</span>
                    <span className="text-muted-foreground text-sm">{option.description}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <h3 className="text-foreground">How can we reach you?</h3>
              <p className="text-muted-foreground">
                We only ask for what we need to follow up on your request.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                  First name
                  <input className="rounded-md border border-border bg-background px-3 py-2 text-foreground" value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                  Email
                  <input
                    className="rounded-md border border-border bg-background px-3 py-2 text-foreground"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    inputMode="email"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                  Company
                  <input className="rounded-md border border-border bg-background px-3 py-2 text-foreground" value={company} onChange={(event) => setCompany(event.target.value)} autoComplete="organization" />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                  Phone {requiresPhone ? "(recommended for this path)" : "(optional)"}
                  <input
                    className="rounded-md border border-border bg-background px-3 py-2 text-foreground"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-foreground md:col-span-2">
                  Anything we should know (optional)
                  <textarea className="rounded-md border border-border bg-background px-3 py-2 text-foreground" value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} />
                </label>
              </div>
              <p className="text-muted-foreground mt-3 text-[0.78rem] leading-relaxed">
                By submitting, you agree to our{" "}
                <Link href="/privacy" className="text-inherit underline">
                  Privacy Policy
                </Link>
                . We will use your information to respond to your inquiry and may send relevant follow-up communications. You can unsubscribe at any time.
              </p>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <h3 className="text-foreground">Review and submit</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <article className="rounded-lg border border-border bg-card p-4 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Chosen outcome</p>
                  <h4 className="text-foreground">{selectedGoal?.label}</h4>
                  <p className="text-muted-foreground text-sm">{selectedGoal?.description}</p>
                </article>
                <article className="rounded-lg border border-border bg-card p-4 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">What happens next</p>
                  <h4 className="text-foreground">{props.profile.primaryActionLabel}</h4>
                  <p className="text-muted-foreground text-sm">{props.profile.progressSteps[1]?.detail}</p>
                </article>
              </div>
              <p className="text-muted-foreground">
                {props.profile.returnOffer}
              </p>
            </div>
          ) : null}

          {error ? (
            <div id={statusId} className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 p-4 text-red-700 dark:text-red-300" role="alert">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 mt-4">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={goBack}>
                Back
              </Button>
            ) : null}
            {step < 3 ? (
              <Button type="button" onClick={goToNextStep}>
                Continue
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={isPending}>
                {isPending ? "Submitting..." : "Submit"}
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
