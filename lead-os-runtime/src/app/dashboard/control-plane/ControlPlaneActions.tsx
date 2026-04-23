"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { OperatorControlPlaneSnapshot } from "@/lib/operator-control-plane";

interface ControlPlaneActionsProps {
  deadLetters: OperatorControlPlaneSnapshot["deadLetter"]["recent"];
  nodes: OperatorControlPlaneSnapshot["nodes"];
  recommendations: OperatorControlPlaneSnapshot["recommendations"]["recent"];
}

export function ControlPlaneActions({ deadLetters, nodes, recommendations }: ControlPlaneActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function postAction(body: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/operator/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setMessage(json.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage("Done.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function confirmPost(promptText: string, body: Record<string, unknown>) {
    if (!window.confirm(promptText)) return;
    void postAction(body);
  }

  const pendingRecos = recommendations.filter((r) => r.status === "pending");

  return (
    <div className="space-y-6 rounded-lg border border-border/80 p-4">
      <div>
        <h2 className="text-lg font-semibold">Operator actions</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Mutations require an operator session. Destructive steps use the browser confirm dialog.
        </p>
        {message ? <p className="text-sm mt-2 font-mono text-foreground">{message}</p> : null}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Pricing cycle</h3>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() =>
            confirmPost(
              "Run a full pricing tick now for this tenant? (Respects billing + live pricing gates.)",
              { type: "pricing_force_tick" },
            )
          }
        >
          Force pricing tick
        </Button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Dead-letter jobs</h3>
        {deadLetters.length === 0 ? (
          <p className="text-xs text-muted-foreground">None.</p>
        ) : (
          <ul className="space-y-2">
            {deadLetters.map((j) => (
              <li key={j.id} className="flex flex-wrap items-center gap-2 text-xs border border-border/60 rounded px-2 py-1">
                <span className="font-mono">#{j.id}</span>
                <span>{j.jobName}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    confirmPost(`Replay dead-letter job #${j.id} to BullMQ?`, {
                      type: "dlq_replay",
                      deadLetterId: j.id,
                    })
                  }
                >
                  Replay
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={busy}
                  onClick={() =>
                    confirmPost(`Permanently delete dead-letter row #${j.id}?`, {
                      type: "dlq_delete",
                      deadLetterId: j.id,
                    })
                  }
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Nodes</h3>
        {nodes.length === 0 ? (
          <p className="text-xs text-muted-foreground">No nodes.</p>
        ) : (
          <ul className="space-y-2">
            {nodes.map((n) => (
              <li key={n.nodeKey} className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono">{n.nodeKey}</span>
                <span className="text-muted-foreground">{n.status}</span>
                {n.status === "active" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      confirmPost(`Pause node ${n.nodeKey}?`, { type: "node_pause", nodeKey: n.nodeKey })
                    }
                  >
                    Pause
                  </Button>
                ) : null}
                {n.status === "paused" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      confirmPost(`Resume node ${n.nodeKey}?`, { type: "node_resume", nodeKey: n.nodeKey })
                    }
                  >
                    Resume
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Pending recommendations</h3>
        {pendingRecos.length === 0 ? (
          <p className="text-xs text-muted-foreground">None.</p>
        ) : (
          <ul className="space-y-3">
            {pendingRecos.map((r) => (
              <li key={r.id} className="rounded border border-border/60 p-2 text-xs space-y-2">
                <div className="font-mono">
                  #{r.id} · {r.skuKey} · {r.recommendedPriceCents}c
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      confirmPost(`Reject recommendation #${r.id}?`, {
                        type: "pricing_override",
                        recommendationId: r.id,
                        decision: "reject",
                      })
                    }
                  >
                    Reject
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      confirmPost(`Expire recommendation #${r.id}?`, {
                        type: "pricing_override",
                        recommendationId: r.id,
                        decision: "expire",
                      })
                    }
                  >
                    Expire
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    disabled={busy}
                    onClick={() =>
                      confirmPost(
                        `Force-apply recommendation #${r.id}? Requires ENABLE_LIVE_PRICING and passing live safety gates.`,
                        {
                          type: "pricing_override",
                          recommendationId: r.id,
                          decision: "force_apply",
                        },
                      )
                    }
                  >
                    Force apply (live)
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
