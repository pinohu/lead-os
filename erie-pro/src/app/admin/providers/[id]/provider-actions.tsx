"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ProviderActionsProps {
  providerId: string;
  currentTier: string;
  businessName: string;
}

export default function ProviderActions({
  providerId,
  currentTier,
  businessName,
}: ProviderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSuspend() {
    if (!confirm(`Are you sure you want to suspend ${businessName}? This will deactivate all their territories.`)) {
      return;
    }
    setLoading("suspend");
    try {
      const res = await fetch(`/api/admin/providers/${providerId}/suspend`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        alert(data.error ?? "Failed to suspend provider");
      }
    } catch {
      alert("Failed to suspend provider");
    } finally {
      setLoading(null);
    }
  }

  async function handleUpgrade(tier: string) {
    setLoading("upgrade");
    try {
      const res = await fetch(`/api/admin/providers/${providerId}/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        alert(data.error ?? "Failed to upgrade provider");
      }
    } catch {
      alert("Failed to upgrade provider");
    } finally {
      setLoading(null);
    }
  }

  const tiers = ["primary", "backup", "overflow"] as const;
  const nextTier = tiers[(tiers.indexOf(currentTier as (typeof tiers)[number]) + 1) % tiers.length];

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={loading !== null}
        onClick={() => handleUpgrade(nextTier)}
      >
        {loading === "upgrade" ? "Updating..." : `Set ${nextTier}`}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={loading !== null}
        onClick={handleSuspend}
      >
        {loading === "suspend" ? "Suspending..." : "Suspend"}
      </Button>
    </div>
  );
}
