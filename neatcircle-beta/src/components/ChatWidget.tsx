"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { siteConfig } from "@/lib/site-config";

interface Message {
  role: "assistant" | "user";
  content: string;
  timestamp: string;
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

// Niche detection from URL
function detectNiche(): string {
  if (typeof window === "undefined") return "general";
  const path = window.location.pathname;
  if (path.includes("syndication")) return "Real Estate Syndication";
  if (path.includes("immigration")) return "Immigration Law";
  if (path.includes("construction")) return "Construction";
  if (path.includes("franchise")) return "Franchise Operations";
  if (path.includes("compliance")) return "Compliance Training";
  if (path.includes("church")) return "Church Management";
  if (path.includes("creator")) return "Creator Management";
  if (path.includes("staffing")) return "Staffing";
  if (path.includes("pricing")) return "Pricing";
  return "Business Automation";
}

// Context-aware greeting
function getGreeting(): string {
  const niche = detectNiche();
  const profile = getProfile();
  const pages = profile.pagesViewed?.length ?? 0;

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

// Rule-based response engine
function generateResponse(input: string, conversationLength: number): string {
  const lower = input.toLowerCase();
  const niche = detectNiche();

  // Pricing questions
  if (lower.includes("price") || lower.includes("cost") || lower.includes("how much")) {
    return `Our ${niche} solutions start at $3,500 for Starter tier, $7,500 for Professional, and custom pricing for Enterprise. All include 209+ premium tools with zero recurring software fees.\n\nWant me to recommend the right tier for your business? [Try our ROI Calculator](/calculator) to see your projected savings.`;
  }

  // Timeline questions
  if (lower.includes("how long") || lower.includes("timeline") || lower.includes("time to")) {
    return "Most implementations are complete in 2-4 weeks. We handle everything — setup, migration, training, and ongoing support. The average client is fully operational in under 3 weeks.";
  }

  // Integration questions
  if (lower.includes("integrat") || lower.includes("connect") || lower.includes("work with")) {
    return "We integrate with 200+ platforms including QuickBooks, Stripe, Google Workspace, Slack, HubSpot, and many more. Our automation stack connects everything without recurring API fees. What tools are you currently using?";
  }

  // Assessment / audit
  if (lower.includes("assess") || lower.includes("audit") || lower.includes("ready")) {
    return `Great question! Take our [free ${niche} assessment](/assess/general) — it's 5 quick questions and gives you a personalized readiness score with specific recommendations. Takes under 2 minutes.`;
  }

  // ROI / savings
  if (lower.includes("roi") || lower.includes("sav") || lower.includes("return")) {
    return "Our average client sees 3-5x ROI within 90 days. [Try our ROI Calculator](/calculator) to get your specific projected savings based on your team size and industry.";
  }

  // Demo / meeting
  if (lower.includes("demo") || lower.includes("meet") || lower.includes("call") || lower.includes("consult")) {
    return "I'd love to set that up! A free 30-minute strategy session will give you a clear picture of what's possible. Just share your email and preferred time, and we'll get it scheduled.";
  }

  // WhatsApp
  if (lower.includes("whatsapp") || lower.includes("text") || lower.includes("phone")) {
    return "We also offer WhatsApp support for faster communication. Would you like to connect on WhatsApp for priority responses? Just share your phone number and we'll reach out.";
  }

  // Security / compliance
  if (lower.includes("secur") || lower.includes("complian") || lower.includes("gdpr") || lower.includes("hipaa")) {
    return "Security is built into everything we do. We use enterprise-grade encryption, SOC 2 compliant hosting, and all client data stays within your dedicated portal. For regulated industries, we implement industry-specific compliance controls.";
  }

  // What do you do / general
  if (lower.includes("what do") || lower.includes("what is") || lower.includes("about") || lower.includes("who")) {
    return `${siteConfig.brandName} provides systematic process optimization for ${niche} businesses. We deploy 209+ premium business tools — client portals, CRM, automation, BI dashboards, compliance systems — all included with zero recurring software fees. Our clients typically save 20-30 hours/week.`;
  }

  // After a few messages, encourage next step
  if (conversationLength >= 4) {
    return `That's a great question. For the most detailed answer tailored to your specific situation, I'd recommend:\n\n1. [Take our free assessment](/assess/general) (2 min)\n2. [Calculate your ROI](/calculator)\n3. Book a free strategy call — just share your email\n\nWhich would be most helpful?`;
  }

  // Default conversational response
  return `Good question! For ${niche} specifically, we see that as a common challenge. Our approach combines automation + a dedicated client portal to address exactly that.\n\nWant me to go deeper? Or would you prefer to [take our free assessment](/assess/general) for personalized recommendations?`;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-show bubble after 10 seconds for engaged visitors
  useEffect(() => {
    if (typeof window === "undefined") return;
    const profile = getProfile();
    if (profile.chatEngaged) return;

    const timer = setTimeout(() => {
      const pages = profile.pagesViewed?.length ?? 0;
      if (pages >= 2 || profile.totalTimeOnSite > 30) {
        setShowBubble(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setShowBubble(false);

    if (messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: getGreeting(),
        timestamp: new Date().toISOString(),
      }]);
    }

    if (!hasInteracted) {
      setHasInteracted(true);
      updateProfile({ chatEngaged: true });

      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId: localStorage.getItem("nc_visitor_id") ?? "",
          type: "chat_open",
          page: window.location.pathname,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    }
  }, [messages.length, hasInteracted]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");

    // Track message
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId: localStorage.getItem("nc_visitor_id") ?? "",
        type: "chat_message",
        page: window.location.pathname,
        data: { messageCount: newMessages.filter(m => m.role === "user").length },
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});

    // Email detection
    const emailMatch = trimmed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      updateProfile({ email: emailMatch[0] });
      fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "chat",
          visitorId: localStorage.getItem("nc_visitor_id") ?? "",
          firstName: emailMatch[0].split("@")[0],
          lastName: ".",
          email: emailMatch[0],
          service: detectNiche(),
          niche: detectNiche(),
          page: window.location.pathname,
          message: `Chat capture on ${window.location.pathname}`,
        }),
      }).catch(() => {});
    }

    // Generate response after a brief delay
    setTimeout(() => {
      const response = generateResponse(trimmed, newMessages.length);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      }]);
    }, 600);
  }, [input, messages]);

  // Render link markdown: [text](url)
  function renderContent(content: string) {
    const parts = content.split(/(\[.*?\]\(.*?\))/g);
    return parts.map((part, i) => {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        return (
          <a key={i} href={match[2]} className="font-medium text-cyan underline hover:text-cyan-dark">
            {match[1]}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <>
      {/* Chat bubble prompt */}
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

      {/* Chat toggle button */}
      <button
        onClick={() => open ? setOpen(false) : handleOpen()}
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

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[9999] flex h-[480px] w-[360px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-navy to-navy-light px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan text-sm font-bold text-white">
                NC
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{siteConfig.brandName} Concierge</p>
                <p className="text-xs text-cyan-light">Typically responds instantly</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-cyan text-white"
                      : "bg-gray-100 text-navy"
                  }`}
                >
                  {msg.role === "assistant" ? renderContent(msg.content) : msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
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
