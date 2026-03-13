"use client";

import { useState, useCallback } from "react";
import type { AssessmentQuestion } from "@/lib/funnel-engine";
import {
  buildTraceIntakePayload,
  ensureVisitorId,
  trackBrowserEvent,
  updateStoredProfile,
} from "@/lib/trace";

interface AssessmentQuizProps {
  niche: string;
  title: string;
  subtitle: string;
  questions: AssessmentQuestion[];
  resultTiers: { min: number; max: number; label: string; message: string; cta: string }[];
}

export default function AssessmentQuiz({
  niche,
  title,
  subtitle,
  questions,
  resultTiers,
}: AssessmentQuizProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { score: number; insight: string }>>({});
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showCapture, setShowCapture] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const totalScore = Object.values(answers).reduce((sum, answer) => sum + answer.score, 0);
  const maxPossibleScore = questions.length * 10;
  const progressPercent = Math.round((step / questions.length) * 100);

  const tier =
    resultTiers.find((item) => totalScore >= item.min && totalScore <= item.max) ??
    resultTiers[resultTiers.length - 1];

  const handleAnswer = useCallback(
    (questionId: string, score: number, insight: string) => {
      const newAnswers = { ...answers, [questionId]: { score, insight } };
      setAnswers(newAnswers);

      if (step === 0) {
        trackBrowserEvent({
          type: "assessment_start",
          service: niche,
          niche,
          stepId: questionId,
          data: { questionId, step: step + 1, total: questions.length },
        });
      }

      if (step + 1 < questions.length) {
        setStep(step + 1);
        return;
      }

      setShowCapture(true);
      const finalScore = Object.values(newAnswers).reduce((sum, answer) => sum + answer.score, 0);
      updateStoredProfile({
        assessmentCompleted: true,
        assessmentScore: finalScore,
        nicheInterest: niche,
        currentService: niche,
        currentStepId: "assessment-results",
      });

      trackBrowserEvent({
        type: "assessment_complete",
        service: niche,
        niche,
        stepId: "assessment-results",
        data: { score: finalScore, maxScore: maxPossibleScore },
      });
    },
    [answers, maxPossibleScore, niche, questions.length, step],
  );

  const handleCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    updateStoredProfile({
      email,
      phone: phone || undefined,
      nicheInterest: niche,
      currentService: niche,
    });

    await fetch("/api/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        buildTraceIntakePayload({
          source: "assessment",
          visitorId: ensureVisitorId(),
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
          stepId: "assessment-capture",
        }),
      ),
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

  if (showCapture && !showResults) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-2 text-center text-sm font-semibold uppercase tracking-wider text-cyan">
            Assessment Complete
          </div>
          <h3 className="mb-2 text-center text-2xl font-bold text-navy">Your results are ready!</h3>
          <p className="mb-6 text-center text-gray-600">
            Enter your email to get your personalized {niche.replace(/-/g, " ")} report with
            specific recommendations.
          </p>

          <form onSubmit={handleCapture} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
            />
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company name (optional)"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number (optional - for priority support)"
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
            Skip - show results without email
          </button>
        </div>
      </div>
    );
  }

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
                  background:
                    totalScore / maxPossibleScore > 0.6
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
            <h4 className="text-sm font-semibold uppercase tracking-wider text-navy">Key Insights</h4>
            {Object.entries(answers).map(([questionId, answer]) => {
              const question = questions.find((item) => item.id === questionId);
              return (
                <div key={questionId} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500">{question?.question}</p>
                  <p className="text-sm text-navy">{answer.insight}</p>
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
                Get a detailed report - enter your email above
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[step];

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
            <span>
              Question {step + 1} of {questions.length}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-cyan transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <h3 className="mb-6 text-xl font-bold text-navy">{currentQuestion.question}</h3>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(currentQuestion.id, option.score, option.insight)}
              className="w-full rounded-lg border-2 border-gray-100 px-4 py-4 text-left text-sm font-medium text-navy transition hover:border-cyan hover:bg-cyan/5"
            >
              {option.label}
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
