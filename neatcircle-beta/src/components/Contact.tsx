"use client";

import { useState } from "react";
import { siteConfig } from "@/lib/site-config";
import { buildTraceIntakePayload } from "@/lib/trace";

const serviceOptions = [
  "Client Portal Automation",
  "Process Automation",
  "Systems Integration",
  "Training Platform Creation",
  "Business Intelligence",
  "Digital Transformation",
  "Compliance Training",
  "Managed Services",
  "Not Sure",
];

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildTraceIntakePayload({
            ...data,
            source: "contact_form",
            page: window.location.pathname,
            stepId: "contact-form",
          }),
        ),
      });
      if (res.ok) {
        setStatus("sent");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <span className="text-cyan font-semibold text-sm uppercase tracking-wider">
              Get In Touch
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy mt-3 mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-slate-500 leading-relaxed mb-8">
              Book a free discovery call. We&rsquo;ll audit your current
              systems, identify automation opportunities, and show you exactly
              how our $2.1M software portfolio can work for your business.
            </p>

            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-cyan/10 text-cyan flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Email</div>
                  <a href={`mailto:${siteConfig.supportEmail}`} className="text-navy font-medium hover:text-cyan transition-colors">
                    {siteConfig.supportEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-cyan/10 text-cyan flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Response Time</div>
                  <span className="text-navy font-medium">Within 24 hours</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-cyan/10 text-cyan flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Location</div>
                  <span className="text-navy font-medium">Pennsylvania, USA</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-7 border border-slate-200">
            {status === "sent" ? (
              <div className="flex flex-col items-center justify-center text-center py-12">
                <div className="rounded-full bg-green-100 p-4">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-navy">Message Received!</h3>
                <p className="mt-2 text-sm text-slate-500">We&rsquo;ll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-navy mb-1.5">First Name</label>
                    <input id="firstName" name="firstName" type="text" required className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan/40 focus:border-cyan" />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-navy mb-1.5">Last Name</label>
                    <input id="lastName" name="lastName" type="text" required className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan/40 focus:border-cyan" />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-navy mb-1.5">Email</label>
                  <input id="email" name="email" type="email" required className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan/40 focus:border-cyan" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-navy mb-1.5">Company</label>
                    <input id="company" name="company" type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan/40 focus:border-cyan" />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-navy mb-1.5">Phone</label>
                    <input id="phone" name="phone" type="tel" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan/40 focus:border-cyan" />
                  </div>
                </div>

                <div>
                  <label htmlFor="service" className="block text-sm font-medium text-navy mb-1.5">Service Interested In</label>
                  <select id="service" name="service" required className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan/40 focus:border-cyan bg-white">
                    <option value="">Select a service...</option>
                    {serviceOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-navy mb-1.5">Message</label>
                  <textarea id="message" name="message" rows={4} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan/40 focus:border-cyan resize-none" placeholder="Tell us about your business challenges..." />
                </div>

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full bg-cyan hover:bg-cyan-dark text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60"
                >
                  {status === "sending" ? "Sending..." : "Send Message"}
                </button>

                {status === "error" && (
                  <p className="text-sm text-red-600 text-center">
                    Something went wrong. Please email us at {siteConfig.supportEmail}.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
