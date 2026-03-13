"use client";

import { useState, useCallback } from "react";
import type { AssessmentQuestion } from "@/lib/funnel-engine";

interface AssessmentQuizProps {
  niche: string;
  title: string;
  subtitle: string;
  questions: AssessmentQuestion[];
  resultTiers: { min: number; max: number; label: string; message: string; cta: string }[];
}

function getProfile() {
  try {
    return JSON.parse(localStorage.getItem("nc_profile") ?? "{}");
  } catch {
    return {};
  }
}

function updateProfile(updates: Record<string, unknown>) {
  const current = getProfile();
  localStorage.setItem("nc_profile", JSON.stringify({ ...current, ...updates }));
  window.dispatchEvent(new Event("nc-profile-updated"));
}

export default function AssessmentQuiz({ niche, title, subtitle, questions, resultTiers }: AssessmentQuizProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { score: number; insight: string }>>({});
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showCapture, setShowCapture] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const totalScore = Object.values(answers).reduce((sum, a) => sum + a.score, 0);
  const maxPossibleScore = questions.length * 10;
  const progressPercent = Math.round((step / questions.length) * 100);

  const tier = resultTiers.find(t => totalScore >= t.min && totalScore <= t.max)
    ?? resultTiers[resultTiers.length - 1];

  const handleAnswer = useCallback((questionId: string, score: number, insight: string) => {
    const newAnswers = { ...answers, [questionId]: { score, insight } };
    setAnswers(newAnswers);

    if (step === 0) {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId: localStorage.getItem("nc_visitor_id") ?? "",
          type: "assessment_start",
          page: window.location.pathname,
          data: { niche, questionId, step: step + 1, total: questions.length },
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    }

    if (step + 1 < questions.length) {
      setStep(step + 1);
    } else {
      // Assessment complete — show email capture before results
      setShowCapture(true);
      updateProfile({ assessmentCompleted: true, nicheInterest: niche });

      const finalScore = Object.values(newAnswers).reduce((sum, a) => sum + a.score, 0);
      updateProfile({ assessmentScore: finalScore });

      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId: localStorage.getItem("nc_visitor_id") ?? "",
          type: "assessment_complete",
          page: window.location.pathname,
          data: { niche, score: finalScore, maxScore: maxPossibleScore },
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    }
  }, [answers, step, questions.length, niche, maxPossibleScore]);

  const handleCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    updateProfile({ email, phone: phone || undefined });

    await fetch("/api/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "assessment",
        visitorId: localStorage.getItem("nc_visitor_id") ?? "",
        firstName: email.split("@")[0],
        lastName: ".",
        email,
        company: company || undefined,
        phone: phone || undefined,
        service: niche,
        niche,
        page: window.location.pathname,
        score: totalScore,
        tier: tier.label,
        message: `Assessment completed: ${title}. Score: ${totalScore}/${maxPossibleScore}. Tier: ${tier.label}`,
      }),
    }).catch(() => {});

    setSubmitted(true);
    setLoading(false);
    setShowResults(true);
    setShowCapture(false);
  };

  const skipCapture = () => {
    setShowResults(true);
    setShowCapture(false);
  };

  // Email capture gate
  if (showCapture && !showResults) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-2 text-center text-sm font-semibold uppercase tracking-wider text-cyan">
            Assessment Complete
          </div>
          <h3 className="mb-2 text-center text-2xl font-bold text-navy">
            Your results are ready!
          </h3>
          <p className="mb-6 text-center text-gray-600">
            Enter your email to get your personalized {niche.replace(/-/g, " ")} report
            with specific recommendations.
          </p>

          <form onSubmit={handleCapture} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email address"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
            />
            <input
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Company name (optional)"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
            />
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Phone number (optional — for priority support)"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-cyan px-6 py-3 font-semibold text-white transition hover:bg-cyan-dark disabled:opacity-50"
            >
              {loading ? "Processing..." : "Get My Results"}
            </button>
          </form>

          <button
            onClick={skipCapture}
            className="mt-3 w-full text-center text-xs text-gray-400 hover:text-gray-600"
          >
            Skip — show results without email
          </button>
        </div>
      </div>
    );
  }

  // Results view
  if (showResults) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-6 text-center">
            <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-cyan">
              Your Results
            </div>
            <h3 className="mb-1 text-3xl font-bold text-navy">{tier.label}</h3>
            <div className="mx-auto mb-4 h-3 w-full max-w-xs overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.round((totalScore / maxPossibleScore) * 100)}%`,
                  background: totalScore / maxPossibleScore > 0.6
                    ? "linear-gradient(90deg, #ef4444, #f97316)"
                    : totalScore / maxPossibleScore > 0.3
                    ? "linear-gradient(90deg, #f97316, #eab308)"
                    : "linear-gradient(90deg, #22c55e, #06b6d4)",
                }}
              />
            </div>
            <p className="text-lg text-gray-700">{tier.message}</p>
          </div>

          <div className="mb-6 space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-navy">
              Key Insights
            </h4>
            {Object.entries(answers).map(([qId, ans]) => {
              const q = questions.find(q => q.id === qId);
              return (
                <div key={qId} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500">{q?.question}</p>
                  <p className="text-sm text-navy">{ans.insight}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <a
              href={submitted ? "/services" : "#contact"}
              className="inline-block rounded-lg bg-cyan px-8 py-3 font-semibold text-white transition hover:bg-cyan-dark"
            >
              {tier.cta}
            </a>
            {!submitted && (
              <p className="mt-2 text-xs text-gray-400">
                Get a detailed report — enter your email above
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Quiz step view
  const currentQ = questions[step];

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-2xl bg-white p-8 shadow-xl">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
            <span>Question {step + 1} of {questions.length}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-cyan transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <h3 className="mb-6 text-xl font-bold text-navy">{currentQ.question}</h3>

        <div className="space-y-3">
          {currentQ.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(currentQ.id, opt.score, opt.insight)}
              className="w-full rounded-lg border-2 border-gray-100 px-4 py-4 text-left text-sm font-medium text-navy transition hover:border-cyan hover:bg-cyan/5"
            >
              {opt.label}
            </button>
          ))}
        </div>

        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="mt-4 text-sm text-gray-400 hover:text-gray-600"
          >
            &larr; Back
          </button>
        )}
      </div>
    </div>
  );
}
