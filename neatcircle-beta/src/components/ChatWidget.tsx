"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { normalizeNicheSlug } from "@/lib/funnel-blueprints";
import { siteConfig } from "@/lib/site-config";
import { logger } from "@/lib/logger";
import {
  buildTraceIntakePayload,
  ensureVisitorId,
  getStoredProfile,
  trackBrowserEvent,
  updateStoredProfile,
} from "@/lib/trace";

interface Message {
  role: "assistant" | "user";
  content: string;
  timestamp: string;
}

function detectNicheSlug(): string {
  if (typeof window === "undefined") return "general";
  const path = window.location.pathname;
  if (path.includes("syndication")) return "re-syndication";
  if (path.includes("immigration")) return "immigration-law";
  if (path.includes("construction")) return "construction";
  if (path.includes("franchise")) return "franchise";
  if (path.includes("compliance")) return "compliance-training";
  if (path.includes("church")) return "church-management";
  if (path.includes("creator")) return "creator-management";
  if (path.includes("staffing")) return "staffing";
  if (path.includes("pricing")) return "general";
  return "general";
}

function formatNicheLabel(nicheSlug: string): string {
  const normalized = normalizeNicheSlug(nicheSlug);
  if (normalized === "general") return "Business Automation";
  return normalized.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getAssessmentHref() {
  return `/assess/${detectNicheSlug()}`;
}

function isGreeting(lower: string) {
  return /^(hi|hey|hello|yo|good morning|good afternoon|good evening|sup|what's up)\b/.test(lower);
}

function isShortVagueMessage(lower: string) {
  return lower.split(/\s+/).filter(Boolean).length <= 3;
}

function isAffirmation(lower: string) {
  return /^(yes|yeah|yep|sure|ok|okay|please|sounds good|lets do it|let's do it)\b/.test(lower);
}

function isNegation(lower: string) {
  return /^(no|nah|nope|not now)\b/.test(lower);
}

function getQuickOptions(niche: string) {
  return `I can help with 3 fast things for ${niche}:\n\n1. Find the best solution for your business\n2. Estimate ROI and pricing\n3. Recommend the right next step\n\nReply with what you want help with, or jump straight to our [smart assessment](${getAssessmentHref()}).`;
}

function getGreeting(): string {
  const niche = formatNicheLabel(detectNicheSlug());
  const profile = getStoredProfile();
  const pages = ((profile.pagesViewed ?? []) as string[]).length;

  if (profile.email) {
    return `Welcome back! I see you're interested in ${niche}. How can I help you take the next step?`;
  }
  if (pages >= 3) {
    return `I notice you've been exploring our solutions. What questions can I answer about ${niche}?`;
  }
  if (niche === "Pricing") {
    return "Looking at pricing? I can help you find the perfect plan for your needs. What's your team size?";
  }
  return `Hi! I'm ${siteConfig.brandName}'s automation concierge. Ask me anything about how we help ${niche} businesses save time and money.`;
}

function generateResponse(input: string, conversationLength: number): string {
  const lower = input.toLowerCase();
  const nicheSlug = detectNicheSlug();
  const niche = formatNicheLabel(detectNicheSlug());

  if (isGreeting(lower)) {
    return `Hi! Glad you reached out.\n\n${getQuickOptions(niche)}`;
  }
  if (isAffirmation(lower) && conversationLength <= 3) {
    return `Perfect. The fastest way to give you a useful recommendation is our [smart assessment](${getAssessmentHref()}). It takes about 2 minutes and tells you the best-fit path.`;
  }
  if (isNegation(lower) && conversationLength <= 3) {
    return "No problem. Tell me which of these matters most right now: lead capture, follow-up automation, pricing, ROI, or implementation timeline.";
  }
  if (isShortVagueMessage(lower) && !lower.includes("?")) {
    return getQuickOptions(niche);
  }

  if (lower.includes("price") || lower.includes("cost") || lower.includes("how much")) {
    return `Our ${niche} solutions start at $3,500 for Starter tier, $7,500 for Professional, and custom pricing for Enterprise. All include 209+ premium tools with zero recurring software fees.\n\nWant me to recommend the right tier for your business? [Try our ROI Calculator](/calculator) to see your projected savings.`;
  }
  if (lower.includes("how long") || lower.includes("timeline") || lower.includes("time to")) {
    return "Most implementations are complete in 2-4 weeks. We handle everything - setup, migration, training, and ongoing support. The average client is fully operational in under 3 weeks.";
  }
  if (lower.includes("integrat") || lower.includes("connect") || lower.includes("work with")) {
    return "We integrate with 200+ platforms including QuickBooks, Stripe, Google Workspace, Slack, HubSpot, and many more. Our automation stack connects everything without recurring API fees. What tools are you currently using?";
  }
  if (lower.includes("assess") || lower.includes("audit") || lower.includes("ready")) {
    return `The fastest route is our [free ${niche} assessment](${getAssessmentHref()}) - 5 quick questions, under 2 minutes, and you get a personalized readiness score with specific recommendations.`;
  }
  if (lower.includes("roi") || lower.includes("sav") || lower.includes("return")) {
    return "Our average client sees 3-5x ROI within 90 days. [Try our ROI Calculator](/calculator) to get your specific projected savings based on your team size and industry.";
  }
  if (lower.includes("demo") || lower.includes("meet") || lower.includes("call") || lower.includes("consult")) {
    return "I'd love to set that up! A free 30-minute strategy session will give you a clear picture of what's possible. Just share your email and preferred time, and we'll get it scheduled.";
  }
  if (lower.includes("whatsapp") || lower.includes("text") || lower.includes("phone")) {
    return "We also offer WhatsApp support for faster communication. Would you like to connect on WhatsApp for priority responses? Just share your phone number and we'll reach out.";
  }
  if (lower.includes("secur") || lower.includes("complian") || lower.includes("gdpr") || lower.includes("hipaa")) {
    return "Security is built into everything we do. We use enterprise-grade encryption, SOC 2 compliant hosting, and all client data stays within your dedicated portal. For regulated industries, we implement industry-specific compliance controls.";
  }
  if (lower.includes("what do") || lower.includes("what is") || lower.includes("about") || lower.includes("who")) {
    return `${siteConfig.brandName} provides systematic process optimization for ${niche} businesses. We deploy 209+ premium business tools - client portals, CRM, automation, BI dashboards, compliance systems - all included with zero recurring software fees. Our clients typically save 20-30 hours/week.`;
  }
  if (lower.includes("lead") || lower.includes("capture") || lower.includes("follow up") || lower.includes("follow-up")) {
    return `For ${niche}, we usually improve 3 things first: capture quality, response speed, and follow-up consistency.\n\nIf you want, I can point you to the best-fit path now: [assessment](${getAssessmentHref()}) for diagnosis or [ROI calculator](/calculator) for economics.`;
  }
  if (conversationLength >= 4) {
    return `To give you something useful instead of generic advice, the best next step is one of these:\n\n1. [Take the ${niche} assessment](${getAssessmentHref()})\n2. [Calculate your ROI](/calculator)\n3. Book a strategy call\n\nWhich one do you want?`;
  }

  return `I can help with that, but I need a bit more context to avoid giving you generic fluff.\n\nTell me one of these:\n- your business type\n- your main bottleneck\n- whether you care most about leads, follow-up, ROI, or implementation\n\nOr skip that and go straight to the [smart assessment](${getAssessmentHref()}).`;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const profile = getStoredProfile();
    if (profile.chatEngaged) return;

    const timer = setTimeout(() => {
      const pages = ((profile.pagesViewed ?? []) as string[]).length;
      const totalTimeOnSite = (profile.totalTimeOnSite as number | undefined) ?? 0;
      if (pages >= 2 || totalTimeOnSite > 30) setShowBubble(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const openChat = useCallback(() => {
    setOpen(true);
    setShowBubble(false);

    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: getGreeting(),
          timestamp: new Date().toISOString(),
        },
      ]);
    }

    if (!hasInteracted) {
      setHasInteracted(true);
      updateStoredProfile({
        chatEngaged: true,
        nicheInterest: detectNicheSlug(),
        currentService: detectNicheSlug(),
        currentStepId: "chat-open",
      });
      trackBrowserEvent({
        type: "chat_open",
        service: detectNicheSlug(),
        niche: detectNicheSlug(),
        stepId: "chat-open",
      });
    }
  }, [hasInteracted, messages.length]);

  const handleOpen = useCallback(() => {
    openChat();
  }, [openChat]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleChatIntent = () => {
      openChat();
      document.getElementById("chat-widget")?.scrollIntoView({ behavior: "smooth", block: "end" });
    };

    const handleHashOpen = () => {
      if (window.location.hash === "#chat-widget") {
        handleChatIntent();
      }
    };

    window.addEventListener("nc-open-chat", handleChatIntent as EventListener);
    window.addEventListener("hashchange", handleHashOpen);
    handleHashOpen();

    return () => {
      window.removeEventListener("nc-open-chat", handleChatIntent as EventListener);
      window.removeEventListener("hashchange", handleHashOpen);
    };
  }, [openChat]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    trackBrowserEvent({
      type: "chat_message",
      service: detectNicheSlug(),
      niche: detectNicheSlug(),
      stepId: "chat-message",
      data: { messageCount: newMessages.filter((message) => message.role === "user").length },
    });

    const emailMatch = trimmed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      const email = emailMatch[0];
      updateStoredProfile({
        email,
        nicheInterest: detectNicheSlug(),
        currentService: detectNicheSlug(),
      });

      fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildTraceIntakePayload({
            source: "chat",
            visitorId: ensureVisitorId(),
            firstName: email.split("@")[0],
            lastName: ".",
            email,
            service: detectNicheSlug(),
            niche: detectNicheSlug(),
            page: window.location.pathname,
            message: `Chat capture on ${window.location.pathname}`,
            stepId: "chat-capture",
          }),
        ),
      }).catch((err) => { logger.error("ChatWidget intake failed", { error: String(err) }); });
    }

    setTimeout(() => {
      const response = generateResponse(trimmed, newMessages.length);
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: response,
          timestamp: new Date().toISOString(),
        },
      ]);
    }, 600);
  }, [input, messages]);

  function renderContent(content: string) {
    const parts = content.split(/(\[.*?\]\(.*?\))/g);
    return parts.map((part, index) => {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        return (
          <a
            key={index}
            href={match[2]}
            className="font-medium text-cyan underline hover:text-cyan-dark"
          >
            {match[1]}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  }

  return (
    <>
      {showBubble && !open && (
        <div className="fixed bottom-24 right-6 z-[9998] animate-bounce">
          <button
            onClick={handleOpen}
            className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-navy shadow-lg"
          >
            Need help choosing the right solution?
          </button>
        </div>
      )}

      <button
        id="chat-widget"
        onClick={() => (open ? setOpen(false) : handleOpen())}
        className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-cyan text-white shadow-lg transition hover:bg-cyan-dark"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {open && (
        <div ref={chatPanelRef} role="dialog" aria-modal="true" aria-label="Chat with assistant" className="fixed bottom-24 right-6 z-[9999] flex h-[480px] w-[360px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="bg-gradient-to-r from-navy to-navy-light px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan text-sm font-bold text-white">
                {siteConfig.brandName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{siteConfig.brandName} Concierge</p>
                <p className="text-xs text-cyan-light">Typically responds instantly</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] whitespace-pre-line rounded-xl px-3 py-2 text-sm ${
                    message.role === "user" ? "bg-cyan text-white" : "bg-gray-100 text-navy"
                  }`}
                >
                  {message.role === "assistant" ? renderContent(message.content) : message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-100 p-3">
            <div className="flex gap-2">
              <label htmlFor="chat-input" className="sr-only">Type a message</label>
              <input
                id="chat-input"
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan/20"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="rounded-lg bg-cyan px-3 py-2 text-white transition hover:bg-cyan-dark disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
