"use client";

import { useState, useMemo } from "react";
import {
  buildTraceIntakePayload,
  ensureVisitorId,
  trackBrowserEvent,
  updateStoredProfile,
} from "@/lib/trace";

const INDUSTRY_MULTIPLIERS: Record<string, { label: string; savingsMultiplier: number }> = {
  "professional-services": { label: "Professional Services", savingsMultiplier: 1.2 },
  "real-estate": { label: "Real Estate / Syndication", savingsMultiplier: 1.3 },
  legal: { label: "Legal / Immigration", savingsMultiplier: 1.4 },
  construction: { label: "Construction / Contracting", savingsMultiplier: 1.1 },
  healthcare: { label: "Healthcare / Compliance", savingsMultiplier: 1.3 },
  franchise: { label: "Franchise / Multi-Location", savingsMultiplier: 1.5 },
  other: { label: "Other", savingsMultiplier: 1.0 },
};

export default function ROICalculator() {
  const [employees, setEmployees] = useState(10);
  const [avgSalary, setAvgSalary] = useState(60000);
  const [manualHours, setManualHours] = useState(15);
  const [tools, setTools] = useState(6);
  const [industry, setIndustry] = useState("professional-services");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calculated, setCalculated] = useState(false);

  const results = useMemo(() => {
    const hourlyRate = avgSalary / 2080;
    const weeklyManualCost = employees * manualHours * hourlyRate;
    const annualManualCost = weeklyManualCost * 52;
    const multiplier = INDUSTRY_MULTIPLIERS[industry]?.savingsMultiplier ?? 1;
    const automationSavingsPercent = 0.65;
    const annualSavings = annualManualCost * automationSavingsPercent * multiplier;
    const toolConsolidationSavings = tools * 1200;
    const totalAnnualSavings = annualSavings + toolConsolidationSavings;
    const implementationCost = 7500;
    const roi = ((totalAnnualSavings - implementationCost) / implementationCost) * 100;
    const paybackMonths = Math.ceil((implementationCost / totalAnnualSavings) * 12);
    const hoursRecovered = employees * manualHours * automationSavingsPercent * 52;

    return {
      annualManualCost: Math.round(annualManualCost),
      annualSavings: Math.round(totalAnnualSavings),
      roi: Math.round(roi),
      paybackMonths,
      hoursRecovered: Math.round(hoursRecovered),
      toolsSaved: Math.round(toolConsolidationSavings),
    };
  }, [avgSalary, employees, industry, manualHours, tools]);

  const handleCalculate = () => {
    setCalculated(true);
    updateStoredProfile({
      roiCalculatorUsed: true,
      nicheInterest: industry,
      currentService: INDUSTRY_MULTIPLIERS[industry]?.label ?? "general",
      currentStepId: "roi-results",
    });

    trackBrowserEvent({
      type: "roi_calculator",
      service: INDUSTRY_MULTIPLIERS[industry]?.label ?? "general",
      niche: industry,
      stepId: "roi-results",
      data: {
        employees,
        avgSalary,
        manualHours,
        tools,
        industry,
        annualSavings: results.annualSavings,
        roi: results.roi,
      },
    });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    updateStoredProfile({
      email,
      nicheInterest: industry,
      currentService: INDUSTRY_MULTIPLIERS[industry]?.label ?? "general",
    });

    await fetch("/api/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        buildTraceIntakePayload({
          source: "roi_calculator",
          visitorId: ensureVisitorId(),
          firstName: email.split("@")[0],
          lastName: ".",
          email,
          service: INDUSTRY_MULTIPLIERS[industry]?.label ?? "general",
          niche: industry,
          page: window.location.pathname,
          score: results.roi,
          message: `ROI Calculator: ${employees} employees, $${results.annualSavings.toLocaleString()} projected savings, ${results.roi}% ROI`,
          stepId: "roi-capture",
        }),
      ),
    }).catch(() => {});

    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-cyan">
            Free Tool
          </div>
          <h2 className="mb-2 text-3xl font-bold text-navy">Automation ROI Calculator</h2>
          <p className="text-gray-600">
            See exactly how much time and money automation can save your business
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-5">
            <div>
              <label htmlFor="roi-industry" className="mb-1 block text-sm font-medium text-navy">Industry</label>
              <select
                id="roi-industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
              >
                {Object.entries(INDUSTRY_MULTIPLIERS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="num-employees" className="mb-1 block text-sm font-medium text-navy">Number of Employees</label>
              <input
                id="num-employees"
                type="range"
                min={1}
                max={100}
                value={employees}
                onChange={(e) => setEmployees(Number(e.target.value))}
                className="w-full accent-cyan"
              />
              <div className="text-right text-sm font-semibold text-cyan">{employees}</div>
            </div>

            <div>
              <label htmlFor="avg-salary" className="mb-1 block text-sm font-medium text-navy">
                Average Annual Salary ($)
              </label>
              <input
                id="avg-salary"
                type="number"
                value={avgSalary}
                onChange={(e) => setAvgSalary(Number(e.target.value))}
                step={5000}
                min={20000}
                max={250000}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
              />
            </div>

            <div>
              <label htmlFor="manual-hours" className="mb-1 block text-sm font-medium text-navy">
                Hours/Week on Manual Tasks (per person)
              </label>
              <input
                id="manual-hours"
                type="range"
                min={1}
                max={40}
                value={manualHours}
                onChange={(e) => setManualHours(Number(e.target.value))}
                className="w-full accent-cyan"
              />
              <div className="text-right text-sm font-semibold text-cyan">{manualHours}h</div>
            </div>

            <div>
              <label htmlFor="software-tools" className="mb-1 block text-sm font-medium text-navy">Software Tools in Use</label>
              <input
                id="software-tools"
                type="range"
                min={1}
                max={20}
                value={tools}
                onChange={(e) => setTools(Number(e.target.value))}
                className="w-full accent-cyan"
              />
              <div className="text-right text-sm font-semibold text-cyan">{tools} tools</div>
            </div>

            {!calculated && (
              <button
                onClick={handleCalculate}
                className="w-full rounded-lg bg-cyan px-6 py-3 font-semibold text-white transition hover:bg-cyan-dark"
              >
                Calculate My ROI
              </button>
            )}
          </div>

          <div className={`space-y-4 transition-opacity duration-500 ${calculated ? "opacity-100" : "opacity-30"}`}>
            <div className="rounded-xl bg-gradient-to-br from-navy to-navy-light p-6 text-white">
              <p className="text-xs uppercase tracking-wider text-cyan-light">Projected Annual Savings</p>
              <p className="text-4xl font-bold">${results.annualSavings.toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-4 text-center">
                <p className="text-3xl font-bold text-cyan">{results.roi}%</p>
                <p className="text-xs text-gray-500">ROI (Year 1)</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 text-center">
                <p className="text-3xl font-bold text-cyan">{results.paybackMonths}</p>
                <p className="text-xs text-gray-500">Months to Payback</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 text-center">
                <p className="text-3xl font-bold text-cyan">{results.hoursRecovered.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Hours Recovered/Year</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 text-center">
                <p className="text-3xl font-bold text-cyan">${results.toolsSaved.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Tool Consolidation Savings</p>
              </div>
            </div>

            {calculated && !submitted && (
              <form onSubmit={handleEmailSubmit} className="space-y-2">
                <p className="text-sm font-medium text-navy">Get your full personalized ROI report:</p>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  aria-label="Email address"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-cyan px-6 py-3 font-semibold text-white transition hover:bg-cyan-dark disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Send My Full Report"}
                </button>
              </form>
            )}

            {submitted && (
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <p className="font-semibold text-green-700">Report sent! Check your inbox.</p>
                <a
                  href="/services"
                  className="mt-2 inline-block text-sm font-medium text-cyan hover:text-cyan-dark"
                >
                  Explore Our Solutions &rarr;
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
