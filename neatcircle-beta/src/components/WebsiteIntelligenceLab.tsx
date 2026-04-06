"use client";

import { useState } from "react";

type AnalyzeResponse = {
  success: boolean;
  error?: string;
  analysis?: {
    confidence: number;
    business: {
      brandName: string;
      presetId: string;
      primaryGoal: string;
      serviceSlugs: string[];
      personaLabels: string[];
      subjectMatter: string[];
      trustProfile: string;
    };
    design: {
      visualStyle: string;
      tone: string[];
      primaryColor?: string;
      accentColor?: string;
    };
    funnel: {
      recommendedBlueprints: string[];
      recommendedIntakeBias: string[];
      recommendedHeroStrategy: string;
      reasoning: string[];
    };
    architecture: {
      sectionsDetected: string[];
      hasPricing: boolean;
      hasBookingPath: boolean;
      hasAssessmentPath: boolean;
      hasLeadMagnetPath: boolean;
      hasWebinarPath: boolean;
    };
  };
  manifest?: {
    presetId: string;
    brandName: string;
    activeServiceSlugs: string[];
    recommendedBlueprints: string[];
    recommendedIntakeBias: string[];
    marketingHeadline: string;
    marketingDescription: string;
    launchChecklist: string[];
  };
};

export default function WebsiteIntelligenceLab() {
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/intelligence/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, notes, html }),
      });
      const payload = (await response.json()) as AnalyzeResponse;
      setResult(payload);
    } catch {
      setResult({ success: false, error: "Analysis request failed." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan/20 bg-cyan/5 p-4">
        <div className="font-semibold text-white">Autonomous site matching</div>
        <p className="mt-2 text-sm text-slate-300">
          Paste a live URL or raw HTML and Lead OS will infer the website&apos;s niche, persona, funnel goal,
          design profile, and recommended operating preset.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label htmlFor="wil-url" className="space-y-2">
          <div className="text-sm font-medium text-white">Website URL</div>
          <input
            id="wil-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
          />
        </label>

        <label htmlFor="wil-notes" className="space-y-2">
          <div className="text-sm font-medium text-white">Operator Notes</div>
          <input
            id="wil-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional hints about the offer, market, or buyer"
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
          />
        </label>
      </div>

      <label htmlFor="wil-html" className="space-y-2">
        <div className="text-sm font-medium text-white">Raw HTML Snapshot (optional fallback)</div>
        <textarea
          id="wil-html"
          value={html}
          onChange={(event) => setHtml(event.target.value)}
          placeholder="<html>...</html>"
          className="min-h-40 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white outline-none"
        />
      </label>

      <button
        onClick={handleAnalyze}
        disabled={loading || (!url.trim() && !html.trim())}
        className="rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-navy transition hover:bg-cyan/90 disabled:opacity-50"
      >
        {loading ? "Analyzing Website..." : "Analyze and Generate Lead OS Config"}
      </button>

      {result?.error && (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
          {result.error}
        </div>
      )}

      {result?.success && result.analysis && result.manifest && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Confidence" value={`${Math.round(result.analysis.confidence * 100)}%`} />
            <MetricCard label="Preset" value={result.analysis.business.presetId} />
            <MetricCard label="Goal" value={result.analysis.business.primaryGoal} />
            <MetricCard label="Hero Strategy" value={result.analysis.funnel.recommendedHeroStrategy} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ResultPanel title="Business Inference">
              <Line label="Brand" value={result.analysis.business.brandName} />
              <Line label="Trust Profile" value={result.analysis.business.trustProfile} />
              <Line label="Services" value={result.analysis.business.serviceSlugs.join(", ")} />
              <Line label="Personas" value={result.analysis.business.personaLabels.join(", ")} />
              <Line label="Subject Matter" value={result.analysis.business.subjectMatter.join(", ")} />
            </ResultPanel>

            <ResultPanel title="Design Inference">
              <Line label="Style" value={result.analysis.design.visualStyle} />
              <Line label="Tone" value={result.analysis.design.tone.join(", ")} />
              <Line label="Primary Color" value={result.analysis.design.primaryColor ?? "not detected"} />
              <Line label="Accent Color" value={result.analysis.design.accentColor ?? "not detected"} />
            </ResultPanel>

            <ResultPanel title="Funnel Recommendations">
              <Line label="Blueprints" value={result.analysis.funnel.recommendedBlueprints.join(", ")} />
              <Line label="Intake Bias" value={result.analysis.funnel.recommendedIntakeBias.join(", ")} />
              <ul className="mt-3 space-y-1 text-slate-300">
                {result.analysis.funnel.reasoning.map((reason) => (
                  <li key={reason}>- {reason}</li>
                ))}
              </ul>
            </ResultPanel>

            <ResultPanel title="Generated Manifest">
              <Line label="Brand" value={result.manifest.brandName} />
              <Line label="Preset" value={result.manifest.presetId} />
              <Line label="Active Services" value={result.manifest.activeServiceSlugs.join(", ")} />
              <Line label="Recommended Blueprints" value={result.manifest.recommendedBlueprints.join(", ")} />
              <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-slate-200">
                <div className="font-semibold text-white">{result.manifest.marketingHeadline}</div>
                <div className="mt-2">{result.manifest.marketingDescription}</div>
              </div>
            </ResultPanel>
          </div>

          <ResultPanel title="Architecture Detection">
            <Line label="Sections" value={result.analysis.architecture.sectionsDetected.join(", ")} />
            <Line label="Pricing" value={String(result.analysis.architecture.hasPricing)} />
            <Line label="Booking Path" value={String(result.analysis.architecture.hasBookingPath)} />
            <Line label="Assessment Path" value={String(result.analysis.architecture.hasAssessmentPath)} />
            <Line label="Lead Magnet Path" value={String(result.analysis.architecture.hasLeadMagnetPath)} />
            <Line label="Webinar Path" value={String(result.analysis.architecture.hasWebinarPath)} />
          </ResultPanel>

          <ResultPanel title="Launch Checklist">
            <ul className="space-y-1 text-slate-300">
              {result.manifest.launchChecklist.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </ResultPanel>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-cyan">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function ResultPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-lg font-semibold text-white">{title}</div>
      <div className="mt-4 text-sm">{children}</div>
    </section>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2">
      <span className="font-semibold text-white">{label}:</span>{" "}
      <span className="text-slate-300">{value || "n/a"}</span>
    </div>
  );
}
