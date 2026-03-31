"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Building, Shield } from "lucide-react";
import { niches } from "@/lib/niches";
import { cityConfig } from "@/lib/city-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ClaimResult {
  success: boolean;
  checkoutUrl?: string;
  providerId?: string;
  monthlyFee?: number;
  error?: string;
}

export default function ClaimPage() {
  const [niche, setNiche] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [license, setLicense] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);

  const selectedNiche = niches.find((n) => n.slug === niche);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          providerName: businessName,
          providerEmail: email,
          phone,
          description: description || undefined,
          license: license || undefined,
        }),
      });

      const data: ClaimResult = await res.json();
      setResult(data);

      if (data.success && data.checkoutUrl) {
        // In production, this redirects to Stripe Checkout
        // In dry-run, it shows the success state
        window.location.href = data.checkoutUrl;
      }
    } catch {
      setResult({ success: false, error: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link
        href="/for-business"
        className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to For Business
      </Link>

      <div className="mb-10">
        <Badge variant="secondary" className="mb-4">
          <Shield className="mr-1.5 h-3 w-3" />
          Exclusive territory claim
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Claim Your Territory in {cityConfig.name}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Fill out your business details below. After submission, you will be
          directed to complete payment to activate your exclusive territory.
        </p>
      </div>

      {result?.success ? (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30" role="alert" aria-live="polite">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <CardTitle>Territory Claim Submitted</CardTitle>
                <CardDescription>
                  Redirecting you to complete payment...
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Provider ID: {result.providerId} &middot; Monthly fee: $
              {result.monthlyFee}/mo
            </p>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Niche Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Service Category
              </CardTitle>
              <CardDescription>
                Select the niche you want to claim exclusively in{" "}
                {cityConfig.name}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="niche">Niche *</Label>
                <Select value={niche} onValueChange={setNiche} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your service category" />
                  </SelectTrigger>
                  <SelectContent>
                    {niches.map((n) => (
                      <SelectItem key={n.slug} value={n.slug}>
                        {n.icon} {n.label} &mdash; ${n.monthlyFee}/mo
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedNiche && (
                  <p className="text-xs text-muted-foreground">
                    {selectedNiche.description} &middot; Avg project value:{" "}
                    {selectedNiche.avgProjectValue}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader>
              <CardTitle>Business Details</CardTitle>
              <CardDescription>
                Tell us about your business so customers can find and trust
                you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Johnson Plumbing & Drain"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Business Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="leads@yourbusiness.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(814) 555-0100"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your services, experience, and what sets you apart..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="license">License Number (optional)</Label>
                <Input
                  id="license"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  placeholder="e.g., PA-PLB-039271"
                />
                <p className="text-xs text-muted-foreground">
                  Licensed providers receive a verified badge on their
                  profile.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Summary */}
          {selectedNiche && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {selectedNiche.label} Territory &mdash; {cityConfig.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Exclusive lead access &middot; All{" "}
                      {cityConfig.serviceArea.length} communities
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      ${selectedNiche.monthlyFee}
                    </p>
                    <p className="text-xs text-muted-foreground">per month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {result?.error && (
            <div role="alert">
              <p className="text-sm font-medium text-destructive">{result.error}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            className="w-full text-base"
            disabled={submitting || !niche || !businessName || !email || !phone}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Claim Territory &amp; Continue to Payment
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            By submitting, you agree to our{" "}
            <Link href="/terms" className="underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            . You can cancel your subscription at any time.
          </p>
        </form>
      )}
    </main>
  );
}
