"use client";

// src/app/dashboard/gtm/GtmOperatorBoard.tsx
// Client controls for GTM rollout status + operator notes (PATCH /api/operator/gtm).

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { GtmUseCaseWithStatus } from "@/lib/gtm/merge";
import { GTM_OPERATOR_STATUSES, type GtmOperatorStatus } from "@/lib/gtm/status";

const REPO_DOC_ERIE =
  "https://github.com/pinohu/lead-os/blob/HEAD/lead-os-hosted-runtime-wt-hybrid/docs/ERIE-PRO.md";

interface GtmOperatorBoardProps {
  initialCases: GtmUseCaseWithStatus[];
}

export function GtmOperatorBoard({ initialCases }: GtmOperatorBoardProps) {
  const [cases, setCases] = useState(initialCases);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusBySlug = useMemo(() => {
    const m = new Map<string, GtmOperatorStatus>();
    for (const c of cases) m.set(c.slug, c.status);
    return m;
  }, [cases]);

  const notesBySlug = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of cases) m.set(c.slug, c.notes);
    return m;
  }, [cases]);

  async function persist(slug: string, patch: { status?: GtmOperatorStatus; notes?: string }) {
    setBusySlug(slug);
    setError(null);
    try {
      const res = await fetch("/api/operator/gtm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slug, ...patch }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; data?: { status: GtmOperatorStatus; notes: string } };
      if (!res.ok || !json.ok || !json.data) {
        setError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      setCases((prev) =>
        prev.map((c) =>
          c.slug === slug
            ? {
                ...c,
                status: json.data!.status,
                notes: json.data!.notes,
                updatedAt: new Date().toISOString(),
              }
            : c,
        ),
      );
    } catch {
      setError("network_error");
    } finally {
      setBusySlug(null);
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Erie-first validation</CardTitle>
          <CardDescription>
            Run build/tests, worker, intake smoke test, then controlled pilot before scaling GTM #2+.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
          <Button asChild variant="outline" size="sm">
            <Link href={REPO_DOC_ERIE} target="_blank" rel="noreferrer">
              ERIE-PRO.md (repo)
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/api/intake" target="_blank" rel="noreferrer">
              /api/intake
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/control-plane">Control plane</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-1">
        {cases.map((c) => (
          <Card key={c.slug} className={c.id === 1 ? "ring-2 ring-primary/40" : ""}>
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">{c.title}</CardTitle>
                {c.id === 1 ? (
                  <Badge variant="default">Recommended first use case</Badge>
                ) : null}
                <Badge variant="outline">#{c.id}</Badge>
                <Badge variant="secondary">{c.slug}</Badge>
              </div>
              {c.summary ? <CardDescription>{c.summary}</CardDescription> : null}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`status-${c.slug}`}>Rollout status</Label>
                  <Select
                    value={statusBySlug.get(c.slug) ?? "not_started"}
                    onValueChange={(v) => {
                      void persist(c.slug, { status: v as GtmOperatorStatus });
                    }}
                    disabled={busySlug === c.slug}
                  >
                    <SelectTrigger id={`status-${c.slug}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GTM_OPERATOR_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`notes-${c.slug}`}>Operator notes</Label>
                  <Textarea
                    id={`notes-${c.slug}`}
                    rows={3}
                    defaultValue={notesBySlug.get(c.slug) ?? ""}
                    key={`${c.slug}-${c.notes}`}
                    onBlur={(e) => {
                      const next = e.target.value;
                      if (next === (notesBySlug.get(c.slug) ?? "")) return;
                      void persist(c.slug, { notes: next });
                    }}
                    disabled={busySlug === c.slug}
                  />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Launch checklist (week one)</p>
                <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
                  {c.weekOneActions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ol>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Execution surfaces</p>
                <ul className="space-y-1 text-sm">
                  {c.executionSurfaces.map((link) => (
                    <li key={`${c.slug}-${link.label}`}>
                      {!link.href ? (
                        <span className="text-muted-foreground">[note] {link.label}</span>
                      ) : link.href.startsWith("http") ? (
                        <a
                          href={link.href}
                          className="text-primary underline-offset-4 hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          [{link.kind}] {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-primary underline-offset-4 hover:underline"
                          {...(link.kind === "api" ? { target: "_blank", rel: "noreferrer" } : {})}
                        >
                          [{link.kind}] {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Required env keys</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-0.5">
                  {c.envKeys.map((k) => (
                    <li key={k}>
                      <code className="text-xs">{k}</code>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
