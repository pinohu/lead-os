"use client";

// ── RequesterUpgradeButton ───────────────────────────────────────
// Collects email inline, POSTs to /api/checkout/requester, then
// redirects to the Stripe Checkout URL (or the dry-run success page).
// Lives beside the free match form — free matching stays default.

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  plan: "concierge" | "annual";
  label: string;
  variant?: "default" | "outline";
  className?: string;
}

export function RequesterUpgradeButton({
  plan,
  label,
  variant = "default",
  className = "",
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/requester", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          email,
          context: plan === "concierge" ? context || undefined : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Checkout failed");
      }
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  if (!showForm) {
    return (
      <Button
        type="button"
        variant={variant}
        className={className}
        onClick={() => setShowForm(true)}
      >
        {label}
        <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-left">
      <div>
        <Label htmlFor={`email-${plan}`} className="text-xs">
          Email
        </Label>
        <Input
          id={`email-${plan}`}
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={loading}
        />
      </div>
      {plan === "concierge" && (
        <div>
          <Label htmlFor="context" className="text-xs">
            What do you need done? (optional)
          </Label>
          <Input
            id="context"
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. plumbing emergency, roof estimate"
            disabled={loading}
          />
        </div>
      )}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" variant={variant} disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redirecting…
            </>
          ) : (
            <>Continue to checkout</>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowForm(false)}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
