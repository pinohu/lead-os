"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ArrowRight,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
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

interface PurchaseData {
  leadId: string;
  niche: string;
  nicheLabel: string;
  temperature: string;
  price: number;
  buyerEmail: string;
}

export default function LeadPurchaseSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [purchase, setPurchase] = useState<PurchaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      setError(
        "No session found. If you completed payment, check your email for the lead details."
      );
      return;
    }

    // Use search params as fallback for session data
    const niche = searchParams.get("niche") ?? "";
    const nicheLabel = searchParams.get("label") ?? niche.replace(/-/g, " ");
    const temperature = searchParams.get("temperature") ?? "warm";
    const price = searchParams.get("price") ?? "0";
    const email = searchParams.get("email") ?? "";
    const leadId = searchParams.get("lead_id") ?? "";

    setPurchase({
      leadId,
      niche,
      nicheLabel,
      temperature,
      price: parseFloat(price),
      buyerEmail: email,
    });
    setLoading(false);
  }, [sessionId, searchParams]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-16">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Confirming your purchase...</span>
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

  const temperatureColors: Record<string, string> = {
    cold: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    warm: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    hot: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
    burning: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      {/* Success Header */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/50">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <Badge variant="secondary" className="mb-4">
          <Sparkles className="mr-1.5 h-3 w-3" />
          Lead Purchased
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Your Lead is On Its Way!
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          We&apos;re preparing the lead details now. You&apos;ll receive them
          via email within minutes.
        </p>
      </div>

      {/* Purchase Summary */}
      <Card className="mb-6 border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Service Category
              </p>
              <p className="text-lg font-semibold capitalize">
                {purchase?.nicheLabel}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Lead Temperature
              </p>
              <div className="mt-1">
                <Badge
                  className={
                    temperatureColors[purchase?.temperature ?? "warm"] ?? ""
                  }
                >
                  {purchase?.temperature ?? "warm"}
                </Badge>
              </div>
            </div>
            {purchase?.price ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Amount Paid
                </p>
                <p className="text-lg font-semibold">
                  ${purchase.price.toFixed(2)}
                </p>
              </div>
            ) : null}
            {purchase?.buyerEmail ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Details Sent To
                </p>
                <p className="text-lg font-semibold">{purchase.buyerEmail}</p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* What To Expect */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What To Expect</CardTitle>
          <CardDescription>
            Here&apos;s how the lead delivery works:
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
                  Check Your Email
                </p>
                <p className="text-sm text-muted-foreground">
                  The lead&apos;s contact information and inquiry details will
                  be emailed to{" "}
                  <strong>{purchase?.buyerEmail ?? "your email"}</strong> within
                  minutes.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                2
              </div>
              <div>
                <p className="font-medium flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  Reach Out Promptly
                </p>
                <p className="text-sm text-muted-foreground">
                  Contact the lead as soon as possible. Studies show that
                  responding within 5 minutes increases conversion by 400%.
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Upgrade CTA */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-center gap-4 pt-6 text-center sm:flex-row sm:text-left">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">
              Want Every Lead in This Category?
            </p>
            <p className="text-sm text-muted-foreground">
              Claim the exclusive{" "}
              <span className="capitalize">{purchase?.nicheLabel}</span>{" "}
              territory in {cityConfig.name} and get all leads automatically
              &mdash; no more one-at-a-time purchasing.
            </p>
          </div>
          <Button asChild>
            <Link
              href={`/for-business/claim?niche=${purchase?.niche ?? ""}`}
            >
              Claim Territory
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="outline" size="lg" className="flex-1">
          <Link href={`/for-business?niche=${purchase?.niche ?? ""}`}>
            Buy Another Lead
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="flex-1">
          <Link href="/for-business">Back to For Business</Link>
        </Button>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Need help? Contact us at{" "}
        <a
          href={`mailto:hello@${cityConfig.domain}`}
          className="underline hover:text-foreground"
        >
          hello@{cityConfig.domain}
        </a>
      </p>
    </main>
  );
}
