"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { PackageCredentialField, PackageSlug } from "@/lib/package-catalog";

type Status = "idle" | "loading" | "success" | "error";

interface PortalPackageOption {
  slug: PackageSlug;
  title: string;
  customerOutcome: string;
}

interface ProvisionResult {
  bundleId?: string;
  launchId?: string;
  packageTitle?: string;
  packageTitles?: string[];
  totalArtifacts?: number;
  urls?: {
    workspace?: string;
    workspaces?: string[];
  };
  acceptanceTests?: Array<{ test: string; status: string; evidence: string }>;
  customerGuide?: {
    title: string;
    executiveOverview: string;
    startHere: string[];
    operatingWorkflow: string[];
  };
}

interface OperatorPortalProvisionFormProps {
  operatorSlug: string;
  operatorBrandName: string;
  packages: PortalPackageOption[];
  fields: PackageCredentialField[];
  defaultSelectedSlugs: PackageSlug[];
}

const topLevelKeys = new Set(["brandName", "operatorEmail", "primaryDomain", "targetMarket", "primaryOffer"]);
const coreCredentialKeys = new Set([
  "idealCustomerProfile",
  "successMetric",
  "currentProcess",
  "fulfillmentConstraints",
  "brandVoice",
  "avatarVoiceConsent",
]);

export function OperatorPortalProvisionForm({
  operatorSlug,
  operatorBrandName,
  packages,
  fields,
  defaultSelectedSlugs,
}: OperatorPortalProvisionFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProvisionResult | null>(null);
  const defaultSelected = useMemo(() => new Set(defaultSelectedSlugs.length ? defaultSelectedSlugs : packages.slice(0, 2).map((pkg) => pkg.slug)), [defaultSelectedSlugs, packages]);
  const supplementalFields = useMemo(
    () => fields.filter((field) => !topLevelKeys.has(field.key) && !coreCredentialKeys.has(field.key)),
    [fields],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    setResult(null);

    const form = new FormData(event.currentTarget);
    const packageSlugs = form.getAll("packageSlugs").map(String) as PackageSlug[];
    if (packageSlugs.length === 0) {
      setStatus("error");
      setError("Choose at least one service to launch.");
      return;
    }

    const credentials: Record<string, string> = {};
    for (const field of fields) {
      if (!topLevelKeys.has(field.key)) {
        credentials[field.key] = String(form.get(field.key) ?? "");
      }
    }

    const response = await fetch(`/api/operator-portals/${operatorSlug}/provision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packageSlugs,
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
      setError("Network error while launching the client service.");
      return;
    }

    const payload = await response.json();
    if (!response.ok || payload.error) {
      setStatus("error");
      setResult(payload.data ?? null);
      setError(payload.error?.message ?? "Service launch failed.");
      return;
    }

    setResult(payload.data);
    setStatus("success");
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Private service launch</p>
        <h2 className="mt-2 text-2xl font-bold text-foreground">Launch client services from one intake</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Select one service or a bundle. The same onboarding answers are used for every selected service, and the client receives finished delivery hubs, guides, outputs, and acceptance checks under {operatorBrandName}.
        </p>
      </div>

      <form className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]" onSubmit={submit}>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="brandName" label="Client business name" defaultValue="Acme Client Growth" />
            <Input name="operatorEmail" label="Delivery contact email" type="email" defaultValue="delivery@example.com" />
            <Input name="primaryDomain" label="Client website or domain" type="url" defaultValue="https://example.com" />
            <Input name="targetMarket" label="Client's target audience" defaultValue="appointment-based local businesses" />
          </div>
          <TextArea
            name="primaryOffer"
            label="Outcome the client is buying"
            defaultValue="A finished demand system that captures opportunities, routes follow-up, gives the client clear directions, and reports progress."
          />
          <TextArea
            name="idealCustomerProfile"
            label="Who the finished service must serve"
            defaultValue="Busy owners and teams that want appointments, leads, content, reports, or operating relief without learning new software."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="successMetric" label="How success will be measured" defaultValue="booked calls, recovered leads, hours saved, and launched outputs" />
            <Input name="brandVoice" label="Customer experience style" defaultValue="clear, premium, helpful, and direct" />
          </div>
          <TextArea
            name="currentProcess"
            label="How the client handles this today"
            defaultValue="Manual follow-up, scattered content, inconsistent reporting, and no single delivery hub for the client to operate from."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextArea
              name="fulfillmentConstraints"
              label="Rules, limits, and approvals"
              defaultValue="Avoid unsupported guarantees. Route regulated claims, payments, sensitive customer issues, and account-access changes to human approval."
            />
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Avatar or voice consent</span>
              <select name="avatarVoiceConsent" className="min-h-11 rounded-md border border-input bg-background px-3" defaultValue="not-applicable">
                <option value="not-applicable">not-applicable</option>
                <option value="approved">approved</option>
              </select>
              <span className="text-xs leading-relaxed text-muted-foreground">Required only when a service creates likeness, voice, or avatar media.</span>
            </label>
          </div>
          {supplementalFields.length ? (
            <details className="rounded-md border border-border bg-muted/25 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">Optional service context and account handoffs</summary>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Add source files, account references, routing destinations, or approval notes once. If these are left blank, the launched service includes a managed handoff instead of blocking delivery.
              </p>
              <div className="mt-3 grid gap-3">
                {supplementalFields.map((field) => (
                  <FieldControl key={field.key} field={field} />
                ))}
              </div>
            </details>
          ) : null}
          <button className="min-h-11 rounded-md bg-primary px-5 font-semibold text-primary-foreground" disabled={status === "loading"}>
            {status === "loading" ? "Launching client service..." : "Launch selected client services"}
          </button>
          {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
        </div>

        <div className="space-y-3">
          <div className="grid max-h-[540px] gap-2 overflow-y-auto rounded-md border border-border bg-background p-3">
            {packages.map((pkg) => (
              <label key={pkg.slug} className="flex gap-3 rounded-md border border-border p-3 text-sm">
                <input name="packageSlugs" type="checkbox" value={pkg.slug} defaultChecked={defaultSelected.has(pkg.slug)} className="mt-1" />
                <span>
                  <span className="block font-semibold">{pkg.title}</span>
                  <span className="mt-1 block leading-relaxed text-muted-foreground">{pkg.customerOutcome}</span>
                </span>
              </label>
            ))}
          </div>
          <PortalResult status={status} result={result} operatorBrandName={operatorBrandName} />
        </div>
      </form>
    </section>
  );
}

function getDefaultValue(name: string): string {
  switch (name) {
    case "bookingUrl":
      return "https://cal.com/client/qualified-call";
    case "webhookUrl":
      return "https://example.com/webhooks/client-service";
    case "brandAssetsUrl":
      return "https://example.com/brand-assets";
    case "sourceAssetUrl":
      return "https://example.com/source-material";
    case "crmExportUrl":
      return "https://example.com/crm-export.csv";
    case "complianceRules":
      return "Use human approval for regulated claims, platform-sensitive claims, and testimonials.";
    default:
      return "";
  }
}

function FieldControl({ field }: { field: PackageCredentialField }) {
  const label = (
    <span className="font-medium">
      {field.label}
      {field.required ? <span className="text-destructive"> *</span> : null}
      {field.sensitive ? <span className="text-muted-foreground"> (secure reference)</span> : null}
    </span>
  );
  const commonClass = "min-h-11 rounded-md border border-input bg-background px-3";

  if (field.type === "textarea" || field.type === "password") {
    return (
      <label className="grid gap-1.5 text-sm">
        {label}
        <textarea name={field.key} required={field.required} className="min-h-20 rounded-md border border-input bg-background px-3 py-2" defaultValue={getDefaultValue(field.key)} />
        <span className="text-xs leading-relaxed text-muted-foreground">{field.helper}</span>
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="grid gap-1.5 text-sm">
        {label}
        <select name={field.key} required={field.required} className={commonClass} defaultValue={field.options?.[0] ?? ""}>
          {field.options?.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <span className="text-xs leading-relaxed text-muted-foreground">{field.helper}</span>
      </label>
    );
  }

  return (
    <label className="grid gap-1.5 text-sm">
      {label}
      <input name={field.key} type={field.type} required={field.required} className={commonClass} defaultValue={getDefaultValue(field.key)} />
      <span className="text-xs leading-relaxed text-muted-foreground">{field.helper}</span>
    </label>
  );
}

function Input({ name, label, type = "text", defaultValue }: { name: string; label: string; type?: string; defaultValue: string }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <input name={name} type={type} required className="min-h-11 rounded-md border border-input bg-background px-3" defaultValue={defaultValue} />
    </label>
  );
}

function TextArea({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <textarea name={name} required className="min-h-20 rounded-md border border-input bg-background px-3 py-2" defaultValue={defaultValue} />
    </label>
  );
}

function PortalResult({ status, result, operatorBrandName }: { status: Status; result: ProvisionResult | null; operatorBrandName: string }) {
  if (status === "idle" || !result) {
    return (
      <div className="rounded-md border border-border bg-muted/35 p-3 text-sm text-muted-foreground">
        Launched client links, service guides, acceptance checks, and implementation directions will appear here.
      </div>
    );
  }

  const workspaceLinks = result.urls?.workspaces ?? (result.urls?.workspace ? [result.urls.workspace] : []);
  const packageCount = result.packageTitles?.length ?? (result.packageTitle ? 1 : 0);

  return (
    <div className="rounded-md border border-primary/25 bg-primary/5 p-3 text-sm">
      <p className="font-semibold text-primary">{operatorBrandName} client service launched</p>
      <p className="mt-1 text-muted-foreground">
        {packageCount} service{packageCount === 1 ? "" : "s"} launched with {result.totalArtifacts ?? "guided"} outputs and customer-ready instructions.
      </p>
      {result.customerGuide ? (
        <div className="mt-3 rounded-md border border-primary/20 bg-background p-3">
          <p className="font-semibold text-foreground">{result.customerGuide.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{result.customerGuide.executiveOverview}</p>
          <ul className="mt-3 grid gap-1 text-xs text-muted-foreground">
            {result.customerGuide.startHere.slice(0, 4).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-3 max-h-40 overflow-y-auto rounded border border-border bg-background">
        {workspaceLinks.map((url) => (
          <a key={url} href={url} className="block border-b border-border p-2 last:border-b-0">
            {url}
          </a>
        ))}
      </div>
      <ul className="mt-3 grid gap-1 text-xs text-muted-foreground">
        {(result.acceptanceTests ?? []).slice(0, 8).map((test) => (
          <li key={test.test}>{test.test}: {test.status}</li>
        ))}
      </ul>
    </div>
  );
}
