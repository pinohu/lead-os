"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ArrowRight,
  Shield,
  Loader2,
  Mail,
  Phone,
  Clock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cityConfig } from "@/lib/city-config";

interface SessionData {
  niche: string;
  nicheLabel: string;
  providerEmail: string;
  tier: string;
  monthlyFee: number;
  bankedLeadsDelivered?: number;
}

export default function ClaimSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      setError("No session found. If you completed payment, check your email for confirmation.");
      return;
    }

    // Validate session against our API
    fetch(`/api/checkout/validate?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.session) {
          setSession(data.session);
        } else {
          // Fallback to search params if API not available yet
          const niche = searchParams.get("niche") ?? "your-service";
          const nicheLabel = searchParams.get("label") ?? niche.replace(/-/g, " ");
          const email = searchParams.get("email") ?? "";
          const tier = searchParams.get("tier") ?? "standard";
          const fee = searchParams.get("fee") ?? "0";
          setSession({
            niche,
            nicheLabel,
            providerEmail: email,
            tier,
            monthlyFee: parseInt(fee, 10),
          });
        }
      })
      .catch(() => {
        // Fallback to search params on network error
        const niche = searchParams.get("niche") ?? "your-service";
        const nicheLabel = searchParams.get("label") ?? niche.replace(/-/g, " ");
        setSession({
          niche,
          nicheLabel,
          providerEmail: searchParams.get("email") ?? "",
          tier: searchParams.get("tier") ?? "standard",
          monthlyFee: parseInt(searchParams.get("fee") ?? "0", 10),
        });
      })
      .finally(() => setLoading(false));
  }, [sessionId, searchParams]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-16">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Confirming your territory claim...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardHeader>
            <CardTitle>Session Not Found</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/for-business">
                Return to For Business
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      {/* Success Header */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/50">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <Badge variant="secondary" className="mb-4">
          <Shield className="mr-1.5 h-3 w-3" />
          Territory Secured
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome to {cityConfig.name}&apos;s{" "}
          <span className="capitalize">{session?.nicheLabel}</span> Territory!
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Your exclusive territory is now active. You&apos;re the only{" "}
          <span className="lowercase">{session?.nicheLabel}</span> provider
          receiving leads from {cityConfig.name}.
        </p>
      </div>

      {/* Claim Summary */}
      <Card className="mb-6 border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Territory
              </p>
              <p className="text-lg font-semibold capitalize">
                {session?.nicheLabel} &mdash; {cityConfig.name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Provider Tier
              </p>
              <p className="text-lg font-semibold capitalize">
                {session?.tier}
              </p>
            </div>
            {session?.monthlyFee ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Monthly Investment
                </p>
                <p className="text-lg font-semibold">
                  ${session.monthlyFee}/mo
                </p>
              </div>
            ) : null}
            {session?.providerEmail ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Confirmation Sent To
                </p>
                <p className="text-lg font-semibold">
                  {session.providerEmail}
                </p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Banked Leads Delivered */}
      {session?.bankedLeadsDelivered && session.bankedLeadsDelivered > 0 && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">
                {session.bankedLeadsDelivered} Banked{" "}
                {session.bankedLeadsDelivered === 1 ? "Lead" : "Leads"}{" "}
                Delivered!
              </p>
              <p className="text-sm text-muted-foreground">
                These leads were waiting for a provider. Check your email for
                their details.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* What Happens Next */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What Happens Next</CardTitle>
          <CardDescription>
            Your territory is live. Here&apos;s what to expect:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                1
              </div>
              <div>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Confirmation Email
                </p>
                <p className="text-sm text-muted-foreground">
                  You&apos;ll receive a confirmation email with your account
                  details and next steps.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                2
              </div>
              <div>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Lead Notifications
                </p>
                <p className="text-sm text-muted-foreground">
                  When someone in {cityConfig.name} searches for{" "}
                  <span className="lowercase">{session?.nicheLabel}</span>{" "}
                  services and submits a request, you&apos;ll be notified
                  instantly via email and SMS.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                3
              </div>
              <div>
                <p className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Respond Quickly
                </p>
                <p className="text-sm text-muted-foreground">
                  Respond to leads within 90 seconds for the best conversion
                  rates. Your dashboard will track response times and outcomes.
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="flex-1">
          <Link href="/dashboard">
            Go to Provider Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="flex-1">
          <Link href={`/${session?.niche ?? ""}/directory`}>
            View Your Directory Listing
          </Link>
        </Button>
      </div>

      <div className="mt-6 text-center space-y-2">
        <p className="text-xs text-muted-foreground">
          Need help? Contact us at{" "}
          <a
            href={`mailto:hello@${cityConfig.domain}`}
            className="underline hover:text-foreground"
          >
            hello@{cityConfig.domain}
          </a>
        </p>
        <p className="text-xs text-muted-foreground">
          <Link href="/contact" className="underline hover:text-foreground">
            Contact Support
          </Link>
        </p>
      </div>
    </main>
  );
}
