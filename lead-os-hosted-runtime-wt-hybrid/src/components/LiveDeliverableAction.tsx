"use client";

import { useState } from "react";
import type { DeliverableSlug } from "@/lib/live-deliverables";

type Status = "idle" | "loading" | "success" | "error";

interface LiveDeliverableActionProps {
  slug: DeliverableSlug;
}

function resultTitle(slug: DeliverableSlug): string {
  switch (slug) {
    case "lead-capture-workspace":
    case "embed-capture-script":
      return "Lead captured";
    case "lead-scoring-routing":
      return "Score and route generated";
    case "support-lane":
      return "Support ticket created";
    default:
      return "Live output generated";
  }
}

export function LiveDeliverableAction({ slug }: LiveDeliverableActionProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(body: Record<string, unknown>) {
    setStatus("loading");
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/live-deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        setError(payload.error?.message ?? "Could not generate deliverable.");
        setStatus("error");
        return;
      }
      setResult(payload.data);
      setStatus("success");
    } catch {
      setError("Network error while generating the live deliverable.");
      setStatus("error");
    }
  }

  if (slug === "lead-capture-workspace" || slug === "embed-capture-script") {
    return (
      <form
        className="space-y-4 rounded-lg border border-border bg-background p-5"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          submit({
            action: "lead-capture",
            firstName: String(data.get("firstName") ?? ""),
            lastName: String(data.get("lastName") ?? ""),
            email: String(data.get("email") ?? ""),
            phone: String(data.get("phone") ?? ""),
            service: String(data.get("service") ?? ""),
          });
        }}
      >
        <div>
          <h3 className="font-semibold">Try the delivered lead capture flow</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            This submits to the same runtime path used for intake. Provider-backed actions wait for credentials.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="min-h-11 rounded-md border border-input bg-background px-3" name="firstName" placeholder="First name" required defaultValue="Jordan" />
          <input className="min-h-11 rounded-md border border-input bg-background px-3" name="lastName" placeholder="Last name" defaultValue="Rivera" />
          <input className="min-h-11 rounded-md border border-input bg-background px-3" name="email" type="email" placeholder="Email" required defaultValue={`lead-${Date.now()}@example.com`} />
          <input className="min-h-11 rounded-md border border-input bg-background px-3" name="phone" placeholder="Phone" defaultValue="555-012-0199" />
          <input className="min-h-11 rounded-md border border-input bg-background px-3 sm:col-span-2" name="service" placeholder="Service needed" defaultValue="Emergency roofing quote" />
        </div>
        <button className="min-h-11 rounded-md bg-primary px-5 font-semibold text-primary-foreground" disabled={status === "loading"}>
          {status === "loading" ? "Generating..." : "Generate lead output"}
        </button>
        <ResultBlock slug={slug} status={status} result={result} error={error} />
      </form>
    );
  }

  if (slug === "lead-scoring-routing") {
    return (
      <form
        className="space-y-4 rounded-lg border border-border bg-background p-5"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          submit({
            action: "score-route",
            source: String(data.get("source") ?? "assessment"),
            hasPhone: data.get("hasPhone") === "on",
            askingForQuote: data.get("askingForQuote") === "on",
            wantsBooking: data.get("wantsBooking") === "on",
            returning: data.get("returning") === "on",
            contentEngaged: data.get("contentEngaged") === "on",
            companySize: String(data.get("companySize") ?? "small"),
            budget: String(data.get("budget") ?? "$5,000/month"),
          });
        }}
      >
        <div>
          <h3 className="font-semibold">Score and route a lead</h3>
          <p className="mt-1 text-sm text-muted-foreground">Change the signals and generate the operator recommendation.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <select className="min-h-11 rounded-md border border-input bg-background px-3" name="source" defaultValue="assessment">
            <option value="assessment">Assessment</option>
            <option value="webinar">Webinar</option>
            <option value="direct">Direct</option>
          </select>
          <select className="min-h-11 rounded-md border border-input bg-background px-3" name="companySize" defaultValue="small">
            <option value="solo">Solo</option>
            <option value="small">Small business</option>
            <option value="mid-market">Mid-market</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <input className="min-h-11 rounded-md border border-input bg-background px-3" name="budget" defaultValue="$5,000/month" />
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          {[
            ["hasPhone", "Has phone"],
            ["askingForQuote", "Asking for quote"],
            ["wantsBooking", "Wants booking"],
            ["returning", "Returning visitor"],
            ["contentEngaged", "Engaged with content"],
          ].map(([name, label]) => (
            <label key={name} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
              <input name={name} type="checkbox" defaultChecked={name !== "returning"} />
              {label}
            </label>
          ))}
        </div>
        <button className="min-h-11 rounded-md bg-primary px-5 font-semibold text-primary-foreground" disabled={status === "loading"}>
          {status === "loading" ? "Scoring..." : "Generate score and route"}
        </button>
        <ResultBlock slug={slug} status={status} result={result} error={error} />
      </form>
    );
  }

  if (slug === "support-lane") {
    return (
      <form
        className="space-y-4 rounded-lg border border-border bg-background p-5"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          submit({
            action: "support-ticket",
            email: String(data.get("email") ?? ""),
            severity: String(data.get("severity") ?? "urgent"),
            summary: String(data.get("summary") ?? ""),
          });
        }}
      >
        <div>
          <h3 className="font-semibold">Create a priority support output</h3>
          <p className="mt-1 text-sm text-muted-foreground">This generates the ticket reference the customer receives immediately.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="min-h-11 rounded-md border border-input bg-background px-3" name="email" type="email" required defaultValue="operator@example.com" />
          <select className="min-h-11 rounded-md border border-input bg-background px-3" name="severity" defaultValue="launch-blocker">
            <option value="standard">Standard</option>
            <option value="urgent">Urgent</option>
            <option value="launch-blocker">Launch blocker</option>
          </select>
          <input className="min-h-11 rounded-md border border-input bg-background px-3 sm:col-span-2" name="summary" required defaultValue="Need help connecting Stripe before launch." />
        </div>
        <button className="min-h-11 rounded-md bg-primary px-5 font-semibold text-primary-foreground" disabled={status === "loading"}>
          {status === "loading" ? "Creating..." : "Create ticket output"}
        </button>
        <ResultBlock slug={slug} status={status} result={result} error={error} />
      </form>
    );
  }

  return null;
}

function ResultBlock({
  slug,
  status,
  result,
  error,
}: {
  slug: DeliverableSlug;
  status: Status;
  result: Record<string, unknown> | null;
  error: string | null;
}) {
  if (status === "error") {
    return <p className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>;
  }
  if (status !== "success" || !result) return null;

  const summary =
    slug === "lead-scoring-routing"
      ? {
          composite: (result.scores as any)?.composite?.score,
          temperature: result.temperature,
          route: (result.decision as any)?.family,
          destination: (result.decision as any)?.destination,
        }
      : slug === "support-lane"
        ? result
        : {
            leadKey: result.leadKey,
            score: result.score,
            stage: result.stage,
            route: (result.decision as any)?.family,
            dryRun: result.dryRun,
          };

  return (
    <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
      <p className="mb-2 text-sm font-semibold">{resultTitle(slug)}</p>
      <pre className="overflow-x-auto rounded bg-background p-3 text-xs">{JSON.stringify(summary, null, 2)}</pre>
    </div>
  );
}
