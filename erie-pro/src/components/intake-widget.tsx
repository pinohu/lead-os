"use client";

// ── Intake Widget ─────────────────────────────────────────────────────
// Conversational lead-capture component. Replaces the legacy LeadForm
// for visitors in the "intake" A/B variant. Falls back to the legacy
// form on any unrecoverable error.
//
// Conversation flow:
//   problem  → location → urgency → budget → contact → complete
//
// LLM calls happen server-side via /api/intake/{start,message,complete}.
// This component is presentation + state management only.

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Phone, Send, Loader2, ArrowRight } from "lucide-react";
import { cityConfig } from "@/lib/city-config";
import type {
  IntakeStep,
  IntakeUrgency,
  IntakeBudget,
  IntakeContactPreference,
} from "@/lib/intake/types";
import { getIntakeTemplate } from "@/lib/intake/templates";

// TCPA text (mirrors the server-side TCPA_TEXT_V2)
const TCPA_TEXT = `By submitting this form, I consent to be contacted by phone, text message, or email by a service provider regarding my service request. I understand that message and data rates may apply for text messages. I can opt out at any time by replying STOP to any text message or contacting us at hello@${cityConfig.domain}.`;

// Message shown in the bubble feed
interface UIMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  isThinking?: boolean;
}

interface IntakeWidgetProps {
  nicheSlug: string;
  nicheLabel: string;
  /** Called when the conversation completes successfully (after success state shown) */
  onComplete?: (leadId: string) => void;
  /** Called when an unrecoverable error occurs; parent should swap in the legacy form */
  onFatalError?: (reason: string) => void;
}

export default function IntakeWidget({
  nicheSlug,
  nicheLabel,
  onComplete,
  onFatalError,
}: IntakeWidgetProps) {
  const template = getIntakeTemplate(nicheSlug);

  // ── State ───────────────────────────────────────────────────────
  const [step, setStep] = useState<IntakeStep>("problem");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step-specific inputs
  const [problemText, setProblemText] = useState("");
  const [zip, setZip] = useState("");
  const [urgency, setUrgency] = useState<IntakeUrgency | null>(null);
  const [budget, setBudget] = useState<IntakeBudget | null>(null);

  // Contact step
  const [firstName, setFirstName] = useState("");
  const [phone, setPhoneDisplay] = useState("");
  const [email, setEmail] = useState("");
  const [contactPref, setContactPref] = useState<IntakeContactPreference>("phone");
  const [tcpa, setTcpa] = useState(false);
  const [contactErrors, setContactErrors] = useState<{
    email?: string;
    phone?: string;
    tcpa?: string;
  }>({});

  // Completion state
  const [completion, setCompletion] = useState<{
    leadId: string;
    closing: string;
    routing: {
      routeType: "claimed" | "concierge" | "queue";
      providerName?: string;
      expectedResponseTime: string;
      nextActionLabel: string;
      nextActionHref?: string;
    };
  } | null>(null);

  const feedRef = useRef<HTMLDivElement>(null);

  // ── Helpers ─────────────────────────────────────────────────────
  const appendMessage = (m: Omit<UIMessage, "id">) => {
    setMessages((prev) => [
      ...prev,
      { ...m, id: `${prev.length}-${Date.now()}` },
    ]);
  };

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      feedRef.current?.scrollTo({
        top: feedRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, scrollToBottom]);

  // ── Start the conversation on mount ──────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      try {
        const res = await fetch("/api/intake/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startedFromNicheSlug: nicheSlug }),
        });
        if (!res.ok) {
          throw new Error(`start-failed-${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;
        if (!data.success || !data.conversationId) {
          throw new Error("start-no-id");
        }
        setConversationId(data.conversationId);
        appendMessage({ role: "assistant", content: data.greeting });
      } catch (err) {
        if (cancelled) return;
        const reason = err instanceof Error ? err.message : String(err);
        onFatalError?.(reason);
      }
    };
    start();
    return () => {
      cancelled = true;
    };
  }, [nicheSlug, onFatalError]);

  // ── Step submission helpers ──────────────────────────────────────
  type Payload =
    | { kind: "problem"; text: string }
    | { kind: "location"; zip?: string }
    | { kind: "urgency"; urgency: IntakeUrgency }
    | { kind: "budget"; budget: IntakeBudget }
    | {
        kind: "contact";
        firstName?: string;
        phone?: string;
        email: string;
        preference: IntakeContactPreference;
        tcpaConsent: boolean;
      };

  const sendStep = async (
    forStep: Exclude<IntakeStep, "complete">,
    payload: Payload,
    userBubble: string
  ) => {
    if (!conversationId) return;
    setErrorMessage(null);
    appendMessage({ role: "user", content: userBubble });
    setIsThinking(true);

    try {
      const res = await fetch("/api/intake/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          forStep,
          payload,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setIsThinking(false);
        setErrorMessage(
          data.error === "problem-too-short"
            ? "Please add a bit more detail so I can route this correctly."
            : "Sorry — something went wrong. Try again, or use the form below."
        );
        return;
      }
      setIsThinking(false);
      appendMessage({ role: "assistant", content: data.assistantReply });
      setStep(data.nextStep);
    } catch (err) {
      setIsThinking(false);
      setErrorMessage("Network hiccup. Try again or use the form below.");
    }
  };

  // ── Complete the conversation → create Lead ─────────────────────
  const completeConversation = async () => {
    if (!conversationId) return;
    setIsThinking(true);
    try {
      const res = await fetch("/api/intake/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
      const data = await res.json();
      setIsThinking(false);
      if (!res.ok || !data.success) {
        setErrorMessage(
          "Sorry — something went wrong submitting your request. Please use the form below or call (814) 200-0328."
        );
        return;
      }
      setCompletion({
        leadId: data.leadId,
        closing: data.closing,
        routing: data.routing,
      });
      appendMessage({ role: "assistant", content: data.closing });
      setStep("complete");
      onComplete?.(data.leadId);
    } catch {
      setIsThinking(false);
      setErrorMessage(
        "Network hiccup. Please use the form below or call (814) 200-0328."
      );
    }
  };

  // ── Step renderers ───────────────────────────────────────────────
  const renderInputArea = () => {
    if (step === "complete" && completion) {
      return (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <div className="text-sm text-green-900">
              <p className="font-medium">{completion.routing.nextActionLabel}</p>
              <p className="text-green-800 mt-1">{completion.closing}</p>
            </div>
          </div>
          {completion.routing.nextActionHref && (
            <a
              href={completion.routing.nextActionHref}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-green-900 underline"
            >
              <Phone className="w-4 h-4" />
              {completion.routing.nextActionLabel}
            </a>
          )}
        </div>
      );
    }

    if (step === "problem") {
      return (
        <div className="space-y-3">
          {template.problemSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {template.problemSuggestions.slice(0, 4).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setProblemText(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition"
                  disabled={isThinking}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
              placeholder={template.problemPlaceholder}
              disabled={isThinking}
              maxLength={2000}
              aria-label="Describe your problem"
            />
            <Button
              onClick={() =>
                sendStep(
                  "problem",
                  { kind: "problem", text: problemText },
                  problemText
                )
              }
              disabled={isThinking || problemText.trim().length < 3}
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      );
    }

    if (step === "location") {
      return (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={zip}
              onChange={(e) =>
                setZip(e.target.value.replace(/\D/g, "").slice(0, 5))
              }
              placeholder="ZIP code"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={5}
              disabled={isThinking}
              aria-label="ZIP code"
            />
            <Button
              onClick={() =>
                sendStep(
                  "location",
                  { kind: "location", zip: zip || undefined },
                  zip || `(${cityConfig.name} area)`
                )
              }
              disabled={isThinking}
            >
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <button
            type="button"
            onClick={() =>
              sendStep(
                "location",
                { kind: "location" },
                `(${cityConfig.name} area)`
              )
            }
            className="text-xs text-gray-500 hover:text-gray-700 underline"
            disabled={isThinking}
          >
            Skip — I'm in the {cityConfig.name} area
          </button>
        </div>
      );
    }

    if (step === "urgency") {
      const opts: IntakeUrgency[] = ["emergency", "this-week", "researching"];
      return (
        <div className="space-y-2">
          {opts.map((u) => {
            const e = template.urgencyExpectations[u];
            return (
              <button
                key={u}
                type="button"
                onClick={() =>
                  sendStep(
                    "urgency",
                    { kind: "urgency", urgency: u },
                    e.buttonLabel
                  )
                }
                disabled={isThinking}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50 transition disabled:opacity-50"
              >
                <div className="font-medium text-sm">{e.buttonLabel}</div>
              </button>
            );
          })}
        </div>
      );
    }

    if (step === "budget") {
      const opts: Array<{ key: IntakeBudget; label: string }> = [
        { key: "under-500", label: "Under $500" },
        { key: "500-2k", label: "$500 – $2,000" },
        { key: "over-2k", label: "Over $2,000" },
        { key: "not-sure", label: "Not sure yet" },
      ];
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {opts.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() =>
                  sendStep(
                    "budget",
                    { kind: "budget", budget: o.key },
                    o.label
                  )
                }
                disabled={isThinking}
                className="px-3 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition text-sm disabled:opacity-50"
              >
                {o.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              sendStep(
                "budget",
                { kind: "budget", budget: "skipped" },
                "Skip"
              )
            }
            className="text-xs text-gray-500 hover:text-gray-700 underline"
            disabled={isThinking}
          >
            Skip — I'd rather not say
          </button>
        </div>
      );
    }

    if (step === "contact") {
      const submit = () => {
        const errs: typeof contactErrors = {};
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errs.email = "Please enter a valid email address";
        }
        if (phone && phone.replace(/\D/g, "").length < 10) {
          errs.phone = "Please enter a 10-digit phone number, or leave it blank";
        }
        if (!tcpa) {
          errs.tcpa = "Please agree to the contact terms to continue";
        }
        setContactErrors(errs);
        if (Object.keys(errs).length > 0) return;

        const normalizedPhone = phone.replace(/\D/g, "");
        sendStep(
          "contact",
          {
            kind: "contact",
            firstName: firstName || undefined,
            phone: normalizedPhone || undefined,
            email,
            preference: contactPref,
            tcpaConsent: true,
          },
          `${firstName || "(no name)"} — ${email}`
        ).then(() => {
          // After step transition, fire the complete request
          setTimeout(() => completeConversation(), 100);
        });
      };

      const formatPhone = (v: string) => {
        const d = v.replace(/\D/g, "").slice(0, 10);
        if (d.length <= 3) return d;
        if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
        return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
      };

      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <Label htmlFor="iw-firstName" className="text-xs">First name (optional)</Label>
              <Input
                id="iw-firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isThinking}
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="iw-phone" className="text-xs">Phone</Label>
              <Input
                id="iw-phone"
                value={phone}
                onChange={(e) => setPhoneDisplay(formatPhone(e.target.value))}
                disabled={isThinking}
                inputMode="tel"
                placeholder="(814) 555-0100"
                aria-invalid={Boolean(contactErrors.phone)}
                aria-describedby={contactErrors.phone ? "iw-phone-err" : undefined}
              />
              {contactErrors.phone && (
                <p id="iw-phone-err" role="alert" className="text-xs text-red-600 mt-1">
                  {contactErrors.phone}
                </p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="iw-email" className="text-xs">Email *</Label>
            <Input
              id="iw-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isThinking}
              required
              aria-invalid={Boolean(contactErrors.email)}
              aria-describedby={contactErrors.email ? "iw-email-err" : undefined}
            />
            {contactErrors.email && (
              <p id="iw-email-err" role="alert" className="text-xs text-red-600 mt-1">
                {contactErrors.email}
              </p>
            )}
          </div>
          <div>
            <Label className="text-xs">Preferred contact method</Label>
            <div className="flex gap-2 mt-1">
              {(["phone", "sms", "email"] as IntakeContactPreference[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setContactPref(p)}
                  disabled={isThinking}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm capitalize transition ${
                    contactPref === p
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 bg-white hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-start gap-2 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={tcpa}
              onChange={(e) => setTcpa(e.target.checked)}
              disabled={isThinking}
              className="mt-0.5"
              aria-invalid={Boolean(contactErrors.tcpa)}
              aria-describedby={contactErrors.tcpa ? "iw-tcpa-err" : undefined}
            />
            <span>{TCPA_TEXT}</span>
          </label>
          {contactErrors.tcpa && (
            <p id="iw-tcpa-err" role="alert" className="text-xs text-red-600">
              {contactErrors.tcpa}
            </p>
          )}
          <Button onClick={submit} disabled={isThinking} className="w-full">
            {isThinking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Submit request"
            )}
          </Button>
        </div>
      );
    }

    return null;
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200">
        <h3 className="font-semibold text-sm text-gray-900">
          Quick intake — {nicheLabel}
        </h3>
        <p className="text-xs text-gray-600 mt-0.5">
          90 seconds. We route you to the right local pro.
        </p>
      </div>
      <div
        ref={feedRef}
        className="max-h-72 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50"
        aria-live="polite"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-sm ${
                m.role === "user"
                  ? "bg-gray-900 text-white rounded-br-sm"
                  : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="px-3.5 py-2 rounded-2xl bg-white border border-gray-200 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-200 bg-white">
        {errorMessage && (
          <div
            role="alert"
            className="mb-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900"
          >
            {errorMessage}
          </div>
        )}
        {renderInputArea()}
      </div>
    </div>
  );
}
