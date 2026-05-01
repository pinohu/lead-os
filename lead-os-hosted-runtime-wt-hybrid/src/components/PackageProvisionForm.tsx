"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { PackageCredentialField, PackageSlug } from "@/lib/package-catalog";

type Status = "idle" | "loading" | "success" | "error";

interface ProvisionedArtifact {
  id: string;
  title: string;
  status: string;
  surface: string;
  url: string;
  createdArtifact: string;
  guide?: {
    summary: string;
    implementationSteps: string[];
    acceptanceChecklist: string[];
    nextMilestones: string[];
  };
}

interface ProvisionedPackageResult {
  packageTitle: string;
  launchId: string;
  status: string;
  urls: Record<string, string>;
  embed: { script: string; iframe: string };
  artifacts: ProvisionedArtifact[];
  automationRuns: Array<{ step: string; status: string; detail: string }>;
  acceptanceTests: Array<{ test: string; status: string; evidence: string }>;
  credentials: {
    accepted: Array<{ key: string; label: string; mode: string }>;
    managedDefaults: Array<{ key: string; label: string; detail: string }>;
    missingRequired: Array<{ key: string; label: string }>;
    missingOptional: Array<{ key: string; label: string }>;
  };
  automationContract: {
    nicheExamples: string[];
    requiresAdditionalConfiguration: boolean;
  };
  customerGuide?: {
    title: string;
    executiveOverview: string;
    startHere: string[];
    implementationRoadmap: Array<{ phase: string; timing: string; actions: string[] }>;
    ambiguityKillers: string[];
  };
}

interface PackageProvisionFormProps {
  packageSlug: PackageSlug;
  fields: PackageCredentialField[];
}

const topLevelKeys = new Set(["brandName", "operatorEmail", "primaryDomain", "targetMarket", "primaryOffer"]);

export function PackageProvisionForm({ packageSlug, fields }: PackageProvisionFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProvisionedPackageResult | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    setResult(null);

    const form = new FormData(event.currentTarget);
    const credentials: Record<string, string> = {};
    for (const field of fields) {
      if (!topLevelKeys.has(field.key)) {
        credentials[field.key] = String(form.get(field.key) ?? "");
      }
    }

    const response = await fetch("/api/package-provisioning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packageSlug,
        brandName: String(form.get("brandName") ?? ""),
        operatorEmail: String(form.get("operatorEmail") ?? ""),
        primaryDomain: String(form.get("primaryDomain") ?? ""),
        targetMarket: String(form.get("targetMarket") ?? ""),
        primaryOffer: String(form.get("primaryOffer") ?? ""),
        credentials,
      }),
    }).catch(() => null);

    if (!response) {
      setStatus("error");
      setError("Network error while launching the solution.");
      return;
    }

    const payload = await response.json();
    if (!response.ok || payload.error) {
      setStatus("error");
      setResult(payload.data ?? null);
      setError(payload.error?.message ?? "Solution launch failed.");
      return;
    }

    setResult(payload.data);
    setStatus("success");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form className="space-y-4 rounded-lg border border-border bg-background p-5" onSubmit={submit}>
        <div>
          <h2 className="text-xl font-bold">Client intake form</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This is what your client fills out after they pay. It captures the outcome, customer, current problem,
            success measure, constraints, and voice needed to provision the complete solution. Optional account access
            improves live integrations, but delivery is not blocked by missing access.
          </p>
        </div>

        <div className="grid gap-4">
          {fields.map((field) => (
            <label key={field.key} className="grid gap-1.5 text-sm">
              <span className="font-medium">
                {field.label}
                {field.required ? <span className="text-destructive"> *</span> : null}
              </span>
              {field.type === "textarea" ? (
                <textarea
                  name={field.key}
                  required={field.required}
                  className="min-h-24 rounded-md border border-input bg-background px-3 py-2"
                  defaultValue={field.key === "primaryOffer" ? "Book a qualified consultation with a fast response promise." : ""}
                />
              ) : field.type === "select" ? (
                <select name={field.key} required={field.required} className="min-h-11 rounded-md border border-input bg-background px-3">
                  {(field.options ?? []).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  name={field.key}
                  type={field.type}
                  required={field.required}
                  className="min-h-11 rounded-md border border-input bg-background px-3"
                  defaultValue={defaultValue(field.key)}
                  autoComplete={field.sensitive ? "off" : undefined}
                />
              )}
              <span className="text-xs leading-relaxed text-muted-foreground">{field.helper}</span>
            </label>
          ))}
        </div>

        <button className="min-h-11 rounded-md bg-primary px-5 font-semibold text-primary-foreground" disabled={status === "loading"}>
          {status === "loading" ? "Launching..." : "Launch client solution"}
        </button>
        {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      </form>

      <PackageProvisionResult status={status} result={result} />
    </div>
  );
}

function defaultValue(key: string): string {
  switch (key) {
    case "brandName":
      return "Acme Growth Solution";
    case "operatorEmail":
      return "operator@example.com";
    case "primaryDomain":
      return "https://example.com";
    case "targetMarket":
      return "local service buyers in Erie, PA";
    case "idealCustomerProfile":
      return "Homeowners who need fast help after storm damage and want a trustworthy quote without waiting for a callback.";
    case "successMetric":
      return "qualified booked appointments and recovered missed-call revenue";
    case "currentProcess":
      return "The business currently misses calls after hours and follows up manually when someone has time.";
    case "fulfillmentConstraints":
      return "Do not promise insurance approval. Route emergencies and angry callers to a human.";
    case "brandVoice":
      return "Helpful, calm, direct, and locally trustworthy.";
    case "bookingUrl":
      return "https://cal.com/acme/qualified-call";
    case "webhookUrl":
      return "https://example.com/webhooks/lead-os";
    default:
      return "";
  }
}

function PackageProvisionResult({
  status,
  result,
}: {
  status: Status;
  result: ProvisionedPackageResult | null;
}) {
  if (status === "idle") {
    return (
      <section className="rounded-lg border border-border bg-muted/40 p-5">
        <h2 className="text-xl font-bold">What gets created after this form</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The launch output includes customer-ready solution links, lead capture, delivery and reporting surfaces, embed code,
          finished outputs, completed provisioning runs, and acceptance checks.
          Every output also receives a usage guide, implementation steps, workflow directions, failure handling, and next milestones.
        </p>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="rounded-lg border border-border bg-muted/40 p-5">
        <h2 className="text-xl font-bold">Waiting for launch output</h2>
      </section>
    );
  }

  return (
    <section className="space-y-5 rounded-lg border border-primary/25 bg-primary/5 p-5">
      <div>
        <p className="text-sm font-semibold text-primary">Solution launched</p>
        <h2 className="text-2xl font-bold">{result.packageTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Launch ID: {result.launchId}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(result.urls).map(([label, url]) => (
          <a key={label} href={url} className="rounded-md border border-border bg-background p-3 text-sm underline-offset-4 hover:underline">
            <span className="block font-semibold capitalize">{label}</span>
            <span className="break-all text-muted-foreground">{url}</span>
          </a>
        ))}
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Embed code</h3>
        <pre className="overflow-x-auto rounded-md bg-background p-3 text-xs">{result.embed.script}</pre>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Customer-ready outputs</h3>
        <div className="max-h-[420px] overflow-y-auto rounded-md border border-border bg-background">
          {result.artifacts.map((artifact) => (
            <a key={artifact.id} href={artifact.url} className="block border-b border-border p-3 text-sm last:border-b-0">
              <span className="font-semibold">{artifact.title}</span>
              <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">{artifact.status}</span>
              <span className="mt-1 block text-muted-foreground">{artifact.createdArtifact}</span>
            </a>
          ))}
        </div>
      </div>

      {result.customerGuide ? (
        <div className="rounded-md border border-border bg-background p-3 text-sm">
          <h3 className="font-semibold">{result.customerGuide.title}</h3>
          <p className="mt-1 text-muted-foreground">{result.customerGuide.executiveOverview}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <SummaryList title="Start here" items={result.customerGuide.startHere} />
            <SummaryList title="No ambiguity rules" items={result.customerGuide.ambiguityKillers} />
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <SummaryList title="Provisioning completed" items={result.automationRuns.map((run) => `${run.step}: ${run.detail}`)} />
        <SummaryList title="Acceptance tests" items={result.acceptanceTests.map((test) => `${test.test}: ${test.status}`)} />
      </div>

      {result.credentials.managedDefaults.length > 0 ? (
        <div className="rounded-md border border-primary/25 bg-background p-3 text-sm text-muted-foreground">
          Managed handoffs applied: {result.credentials.managedDefaults.map((item) => item.label).join(", ")}.
          The complete solution is provisioned and delivered now; client-owned account access can replace managed handoffs later.
        </div>
      ) : null}

      <div className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
        Multi-niche ready: {result.automationContract.nicheExamples.join(", ")}.
      </div>
    </section>
  );
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li key={item} className="rounded-md border border-border bg-background p-2">{item}</li>
        ))}
      </ul>
    </div>
  );
}
