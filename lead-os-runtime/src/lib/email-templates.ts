export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: "nurture" | "transactional" | "notification" | "marketing" | "system";
  htmlTemplate: string;
  textTemplate: string;
  variables: string[];
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
}

export interface EmailContext {
  firstName?: string;
  lastName?: string;
  email?: string;
  brandName: string;
  siteUrl: string;
  supportEmail: string;
  nicheName?: string;
  unsubscribeUrl: string;
  preferencesUrl?: string;
  manageDataUrl?: string;
  trackingPixelUrl?: string;
  currentYear: string;
  [key: string]: unknown;
}

const templateStore = new Map<string, EmailTemplate>();

function replaceVariables(text: string, context: EmailContext): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = context[key];
    if (value === undefined || value === null) return "";
    return String(value);
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderEmailLayout(bodyHtml: string, context: EmailContext): string {
  const brandColor = "#14b8a6";
  const year = context.currentYear || new Date().getFullYear().toString();
  const brandName = escapeHtml(context.brandName || "CX React");
  const siteUrl = escapeHtml(context.siteUrl || "#");
  const supportEmail = escapeHtml(context.supportEmail || "");
  const unsubscribeUrl = escapeHtml(context.unsubscribeUrl || "#");
  const trackingPixel = context.trackingPixelUrl
    ? `<img src="${escapeHtml(String(context.trackingPixelUrl))}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`
    : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="x-apple-disable-message-reformatting" />
<title>${brandName}</title>
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:AllowPNG/>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
<style>
html,body{margin:0;padding:0;width:100%;height:100%;}
*{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;}
table,td{mso-table-lspace:0;mso-table-rspace:0;}
table{border-spacing:0;border-collapse:collapse;}
img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}
a{text-decoration:none;}
@media only screen and (max-width:620px){
.email-container{width:100% !important;max-width:100% !important;}
.fluid{max-width:100% !important;height:auto !important;}
.stack-column{display:block !important;width:100% !important;max-width:100% !important;}
.center-on-narrow{text-align:center !important;display:block !important;margin-left:auto !important;margin-right:auto !important;}
.padding-mobile{padding-left:20px !important;padding-right:20px !important;}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
</div>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f4f4f7;">
<tr>
<td style="padding:20px 0;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin:0 auto;" class="email-container">
<!-- Header -->
<tr>
<td style="padding:20px 40px;text-align:center;background-color:${brandColor};border-radius:8px 8px 0 0;" class="padding-mobile">
<a href="${siteUrl}" style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">${brandName}</a>
</td>
</tr>
<!-- Body -->
<tr>
<td style="padding:40px;background-color:#ffffff;" class="padding-mobile">
${bodyHtml}
</td>
</tr>
<!-- Footer -->
<tr>
<td style="padding:30px 40px;background-color:#f9fafb;border-radius:0 0 8px 8px;border-top:1px solid #e5e7eb;" class="padding-mobile">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
<tr>
<td style="font-size:12px;line-height:18px;color:#6b7280;text-align:center;">
<p style="margin:0 0 8px;">&copy; ${year} ${brandName}. All rights reserved.</p>
<p style="margin:0 0 8px;">
<a href="${siteUrl}" style="color:${brandColor};">Website</a> &bull;
<a href="mailto:${supportEmail}" style="color:${brandColor};">Contact Support</a>
</p>
<p style="margin:0 0 8px;">
<a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a> &bull;
<a href="${escapeHtml(String(context.preferencesUrl ?? "#"))}" style="color:#9ca3af;text-decoration:underline;">Manage Preferences</a> &bull;
<a href="${escapeHtml(String(context.manageDataUrl ?? "#"))}" style="color:#9ca3af;text-decoration:underline;">Manage My Data</a>
</p>
<p style="margin:0;color:#9ca3af;font-size:11px;">
This email was sent to you because you opted in at ${brandName}.
If you believe you received this email in error, please contact ${supportEmail}.
</p>
</td>
</tr>
</table>
${trackingPixel}
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

export function renderEmail(template: EmailTemplate, context: EmailContext): RenderedEmail {
  const subject = replaceVariables(template.subject, context);
  const bodyHtml = replaceVariables(template.htmlTemplate, context);
  const text = replaceVariables(template.textTemplate, context);
  const html = renderEmailLayout(bodyHtml, context);

  return {
    subject,
    html,
    text,
    headers: {
      "X-Template-Id": template.id,
      "X-Template-Category": template.category,
      "List-Unsubscribe": `<${context.unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

export function createTemplate(input: Omit<EmailTemplate, "createdAt" | "updatedAt">): EmailTemplate {
  const now = new Date().toISOString();
  const template: EmailTemplate = { ...input, createdAt: now, updatedAt: now };
  templateStore.set(template.id, template);
  return template;
}

export function getTemplate(id: string): EmailTemplate | undefined {
  return templateStore.get(id);
}

export function listTemplates(tenantId?: string, category?: EmailTemplate["category"]): EmailTemplate[] {
  let results = [...templateStore.values()];
  if (tenantId) {
    results = results.filter((t) => t.tenantId === tenantId || !t.tenantId);
  }
  if (category) {
    results = results.filter((t) => t.category === category);
  }
  return results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function updateTemplate(
  id: string,
  patch: Partial<Omit<EmailTemplate, "id" | "createdAt">>,
): EmailTemplate | undefined {
  const existing = templateStore.get(id);
  if (!existing) return undefined;
  const updated: EmailTemplate = { ...existing, ...patch, id: existing.id, createdAt: existing.createdAt, updatedAt: new Date().toISOString() };
  templateStore.set(id, updated);
  return updated;
}

export function deleteTemplate(id: string): boolean {
  return templateStore.delete(id);
}

function ctaButton(text: string, url: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px auto;">
<tr>
<td style="border-radius:6px;background-color:#14b8a6;">
<a href="${url}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">
${text}
</a>
</td>
</tr>
</table>`;
}

export function getDefaultTemplates(): EmailTemplate[] {
  const now = new Date().toISOString();

  const defaults: EmailTemplate[] = [
    {
      id: "welcome",
      name: "Welcome Email",
      subject: "Welcome to {{brandName}}, {{firstName}}!",
      category: "transactional",
      variables: ["firstName", "lastName", "brandName", "siteUrl", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Welcome aboard, {{firstName}}!</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">We are thrilled to have you join {{brandName}}. You have taken the first step toward transforming how your business captures and converts leads.</p>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">Here is what you can expect:</p>
<ul style="margin:0 0 16px;padding-left:20px;font-size:16px;line-height:28px;color:#374151;">
<li>A personalized growth diagnostic within 24 hours</li>
<li>Access to proven lead capture frameworks</li>
<li>Dedicated support from our team</li>
</ul>
${ctaButton("Explore Your Dashboard", "{{siteUrl}}/dashboard")}
<p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">If you have any questions, reply to this email or reach out to <a href="mailto:{{supportEmail}}" style="color:#14b8a6;">{{supportEmail}}</a>.</p>`,
      textTemplate: `Welcome aboard, {{firstName}}!

We are thrilled to have you join {{brandName}}. You have taken the first step toward transforming how your business captures and converts leads.

Here is what you can expect:
- A personalized growth diagnostic within 24 hours
- Access to proven lead capture frameworks
- Dedicated support from our team

Explore your dashboard: {{siteUrl}}/dashboard

Questions? Reply to this email or reach out to {{supportEmail}}.`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "magic-link",
      name: "Magic Link Login",
      subject: "Your login link for {{brandName}}",
      category: "system",
      variables: ["firstName", "brandName", "siteUrl", "magicLinkUrl", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Sign in to {{brandName}}</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">Hi{{firstName}}, click the button below to sign in to your account. This link expires in 15 minutes.</p>
${ctaButton("Sign In", "{{magicLinkUrl}}")}
<p style="margin:0 0 8px;font-size:14px;line-height:22px;color:#6b7280;">If you did not request this link, you can safely ignore this email.</p>
<p style="margin:0;font-size:12px;line-height:18px;color:#9ca3af;">If the button does not work, copy and paste this URL into your browser: {{magicLinkUrl}}</p>`,
      textTemplate: `Sign in to {{brandName}}

Hi {{firstName}}, use the link below to sign in. This link expires in 15 minutes.

{{magicLinkUrl}}

If you did not request this link, you can safely ignore this email.`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "nurture-day-0",
      name: "Nurture: Day 0 - Confirmation",
      subject: "{{firstName}}, we received your request",
      category: "nurture",
      variables: ["firstName", "brandName", "siteUrl", "nicheName", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Thanks for reaching out, {{firstName}}</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">We have received your inquiry and a {{nicheName}} specialist from {{brandName}} will be in touch shortly.</p>
<div style="margin:0 0 24px;padding:20px;background-color:#f0fdfa;border-left:4px solid #14b8a6;border-radius:4px;">
<p style="margin:0;font-size:16px;line-height:24px;color:#111827;font-weight:600;">What happens next</p>
<p style="margin:8px 0 0;font-size:14px;line-height:22px;color:#374151;">A member of our team will review your request and reach out within 1 business day. In the meantime, here are a few things you can do to prepare.</p>
</div>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">While you wait, take a look at our resources to help you make the best decision:</p>
${ctaButton("Browse Our Resources", "{{siteUrl}}")}
<p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">Questions? Reply to this email or contact us at {{supportEmail}}.</p>`,
      textTemplate: `Thanks for reaching out, {{firstName}}

We have received your inquiry and a {{nicheName}} specialist from {{brandName}} will be in touch shortly.

What happens next: A member of our team will review your request and reach out within 1 business day.

Browse our resources: {{siteUrl}}

Questions? Reply to this email or contact us at {{supportEmail}}.`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "nurture-day-3",
      name: "Nurture: Day 3 - Helpful Tips",
      subject: "{{firstName}}, 3 things to know before choosing a {{nicheName}} provider",
      category: "nurture",
      variables: ["firstName", "brandName", "siteUrl", "nicheName", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Making the right choice, {{firstName}}</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">Choosing the right {{nicheName}} provider can feel overwhelming. Here are three things we recommend every customer consider:</p>
<div style="margin:0 0 16px;padding:16px;background-color:#f9fafb;border-radius:8px;">
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#111827;">1. Check credentials and reviews</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">Look for licensed, insured providers with verified customer reviews. Ask for references from recent projects similar to yours.</p>
</div>
<div style="margin:0 0 16px;padding:16px;background-color:#f9fafb;border-radius:8px;">
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#111827;">2. Get multiple quotes</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">Compare at least 2-3 providers. The lowest price is not always the best value. Look at scope, timeline, and warranty terms.</p>
</div>
<div style="margin:0 0 24px;padding:16px;background-color:#f9fafb;border-radius:8px;">
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#111827;">3. Ask about the process</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">A good provider will walk you through their process, timeline, and what to expect. Clear communication from the start is a strong signal.</p>
</div>
${ctaButton("Learn More About Our Process", "{{siteUrl}}")}`,
      textTemplate: `Making the right choice, {{firstName}}

Choosing the right {{nicheName}} provider can feel overwhelming. Here are three things to consider:

1. Check credentials and reviews - Look for licensed, insured providers with verified reviews.

2. Get multiple quotes - Compare 2-3 providers on scope, timeline, and warranty terms.

3. Ask about the process - Clear communication from the start is a strong signal.

Learn more: {{siteUrl}}`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "nurture-day-7",
      name: "Nurture: Day 7 - Social Proof",
      subject: "See what other {{nicheName}} customers are saying",
      category: "nurture",
      variables: ["firstName", "brandName", "siteUrl", "nicheName", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">What our customers say</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#374151;">{{firstName}}, here is what people in your area are saying about working with {{brandName}}:</p>
<div style="margin:0 0 16px;padding:24px;background-color:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
<p style="margin:0 0 12px;font-size:16px;line-height:24px;color:#374151;font-style:italic;">"They were responsive, professional, and completed the work on time. I would recommend them to anyone looking for quality {{nicheName}} services."</p>
<p style="margin:0;font-size:14px;font-weight:600;color:#111827;">- Verified Customer</p>
</div>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
<tr>
<td style="padding:16px;text-align:center;background-color:#f0fdfa;border-radius:8px;width:33%;">
<p style="margin:0 0 4px;font-size:28px;font-weight:700;color:#14b8a6;">4.8/5</p>
<p style="margin:0;font-size:12px;color:#6b7280;">Customer rating</p>
</td>
<td style="width:8px;"></td>
<td style="padding:16px;text-align:center;background-color:#f0fdfa;border-radius:8px;width:33%;">
<p style="margin:0 0 4px;font-size:28px;font-weight:700;color:#14b8a6;">24hr</p>
<p style="margin:0;font-size:12px;color:#6b7280;">Average response time</p>
</td>
<td style="width:8px;"></td>
<td style="padding:16px;text-align:center;background-color:#f0fdfa;border-radius:8px;width:33%;">
<p style="margin:0 0 4px;font-size:28px;font-weight:700;color:#14b8a6;">98%</p>
<p style="margin:0;font-size:12px;color:#6b7280;">Would recommend</p>
</td>
</tr>
</table>
${ctaButton("See More Reviews", "{{siteUrl}}")}`,
      textTemplate: `What our customers say

{{firstName}}, here is what people are saying about {{brandName}}:

"They were responsive, professional, and completed the work on time. I would recommend them to anyone looking for quality {{nicheName}} services." - Verified Customer

- 4.8/5 customer rating
- 24hr average response time
- 98% would recommend

See more reviews: {{siteUrl}}`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "nurture-day-10",
      name: "Nurture: Day 10 - Common Questions",
      subject: "{{firstName}}, answers to common {{nicheName}} questions",
      category: "nurture",
      variables: ["firstName", "brandName", "siteUrl", "nicheName", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Common questions we get, {{firstName}}</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#374151;">We know that hiring a {{nicheName}} provider comes with questions. Here are the ones we hear most often:</p>
<div style="margin:0 0 16px;padding:16px;background-color:#f9fafb;border-radius:8px;">
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#111827;">"How much does it typically cost?"</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">Costs vary based on your specific needs. We provide free, no-obligation quotes so you know exactly what to expect before committing.</p>
</div>
<div style="margin:0 0 16px;padding:16px;background-color:#f9fafb;border-radius:8px;">
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#111827;">"How long will it take?"</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">We provide a clear timeline upfront. Most projects have well-defined milestones so you always know where things stand.</p>
</div>
<div style="margin:0 0 24px;padding:16px;background-color:#f9fafb;border-radius:8px;">
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#111827;">"What if I am not satisfied?"</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">Your satisfaction matters. We stand behind our work and will make it right. Ask us about our satisfaction guarantee.</p>
</div>
${ctaButton("Get a Free Quote", "{{siteUrl}}")}`,
      textTemplate: `Common questions we get, {{firstName}}

"How much does it typically cost?"
We provide free, no-obligation quotes so you know what to expect.

"How long will it take?"
We provide a clear timeline upfront with well-defined milestones.

"What if I am not satisfied?"
We stand behind our work and will make it right.

Get a free quote: {{siteUrl}}`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "nurture-day-14",
      name: "Nurture: Day 14 - Value Reminder",
      subject: "Still thinking about your {{nicheName}} project, {{firstName}}?",
      category: "nurture",
      variables: ["firstName", "brandName", "siteUrl", "nicheName", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">We are still here for you, {{firstName}}</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">We understand that choosing the right {{nicheName}} provider is an important decision, and we want you to feel confident.</p>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">Here is why clients choose {{brandName}}:</p>
<div style="margin:0 0 12px;padding:16px;border:1px solid #e5e7eb;border-radius:8px;">
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#14b8a6;">Transparent pricing</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#374151;">No hidden fees. We provide detailed quotes so you understand exactly what you are paying for.</p>
</div>
<div style="margin:0 0 12px;padding:16px;border:1px solid #e5e7eb;border-radius:8px;">
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#14b8a6;">Proven track record</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#374151;">Hundreds of satisfied customers in the {{nicheName}} space trust us with their projects.</p>
</div>
<div style="margin:0 0 24px;padding:16px;border:1px solid #e5e7eb;border-radius:8px;">
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#14b8a6;">Dedicated support</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#374151;">A real person is always available to answer your questions and guide you through the process.</p>
</div>
${ctaButton("Schedule a Free Consultation", "{{siteUrl}}")}`,
      textTemplate: `We are still here for you, {{firstName}}

Choosing the right {{nicheName}} provider is important. Here is why clients choose {{brandName}}:

- Transparent pricing: No hidden fees.
- Proven track record: Hundreds of satisfied customers.
- Dedicated support: A real person always available.

Schedule a free consultation: {{siteUrl}}`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "nurture-day-21",
      name: "Nurture: Day 21 - Special Offer",
      subject: "A special offer for you, {{firstName}}",
      category: "nurture",
      variables: ["firstName", "brandName", "siteUrl", "nicheName", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Something special for you, {{firstName}}</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">Since you inquired about {{nicheName}} services a few weeks ago, we wanted to offer you something to make your decision easier.</p>
<div style="margin:0 0 24px;padding:24px;background-color:#f0fdfa;border-radius:8px;border:2px solid #14b8a6;text-align:center;">
<p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#14b8a6;text-transform:uppercase;letter-spacing:1px;">Limited Time Offer</p>
<p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Free consultation + priority scheduling</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#374151;">Book this week and we will prioritize your project in our schedule.</p>
</div>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">There is no obligation. We will assess your needs, answer your questions, and give you a clear recommendation — whether you choose to work with us or not.</p>
${ctaButton("Claim Your Free Consultation", "{{siteUrl}}")}`,
      textTemplate: `Something special for you, {{firstName}}

Since you inquired about {{nicheName}} services, we wanted to make your decision easier.

Limited Time Offer: Free consultation + priority scheduling. Book this week and we will prioritize your project.

No obligation. We will assess your needs and give you a clear recommendation.

Claim your free consultation: {{siteUrl}}`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "nurture-day-30",
      name: "Nurture: Day 30 - Final Follow-up",
      subject: "{{firstName}}, just checking in",
      category: "nurture",
      variables: ["firstName", "brandName", "siteUrl", "nicheName", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Checking in, {{firstName}}</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">A while back you reached out about {{nicheName}} services. We wanted to see if you still need help or if there is anything else we can do for you.</p>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">If your situation has changed or you found another provider, no worries at all. We just want to make sure we did not leave you hanging.</p>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">If you are still looking, we would love to help. Just reply to this email or give us a call — we are happy to pick up where we left off.</p>
${ctaButton("Get in Touch", "{{siteUrl}}")}
<p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">This is the last follow-up we will send about your inquiry. You can always reach us at {{supportEmail}} if you need anything in the future.</p>`,
      textTemplate: `Checking in, {{firstName}}

A while back you reached out about {{nicheName}} services. We wanted to see if you still need help.

If your situation has changed, no worries. If you are still looking, just reply to this email or contact us at {{supportEmail}}.

Get in touch: {{siteUrl}}

This is the last follow-up about your inquiry. We are here whenever you need us.`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "hot-lead-alert",
      name: "Hot Lead Alert",
      subject: "[HOT LEAD] {{firstName}} {{lastName}} is ready to buy",
      category: "notification",
      variables: ["firstName", "lastName", "email", "brandName", "siteUrl", "nicheName", "score", "source", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<div style="margin:0 0 24px;padding:16px;background-color:#fef2f2;border:2px solid #ef4444;border-radius:8px;text-align:center;">
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#ef4444;text-transform:uppercase;letter-spacing:1px;">Hot Lead Alert</p>
<p style="margin:0;font-size:12px;color:#6b7280;">Action required within 5 minutes</p>
</div>
<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">{{firstName}} {{lastName}} is showing strong buying signals</h1>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
<tr>
<td style="padding:12px 16px;background-color:#f9fafb;border-radius:8px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Name</td><td style="padding:4px 0;font-size:14px;font-weight:600;color:#111827;text-align:right;">{{firstName}} {{lastName}}</td></tr>
<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Email</td><td style="padding:4px 0;font-size:14px;font-weight:600;color:#111827;text-align:right;">{{email}}</td></tr>
<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Lead Score</td><td style="padding:4px 0;font-size:14px;font-weight:600;color:#ef4444;text-align:right;">{{score}}/100</td></tr>
<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Source</td><td style="padding:4px 0;font-size:14px;font-weight:600;color:#111827;text-align:right;">{{source}}</td></tr>
<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Niche</td><td style="padding:4px 0;font-size:14px;font-weight:600;color:#111827;text-align:right;">{{nicheName}}</td></tr>
</table>
</td>
</tr>
</table>
${ctaButton("View Lead Details", "{{siteUrl}}/dashboard")}
<p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">Speed matters. Leads contacted within 5 minutes are 21x more likely to convert.</p>`,
      textTemplate: `HOT LEAD ALERT - Action required within 5 minutes

{{firstName}} {{lastName}} is showing strong buying signals.

Name: {{firstName}} {{lastName}}
Email: {{email}}
Lead Score: {{score}}/100
Source: {{source}}
Niche: {{nicheName}}

View lead details: {{siteUrl}}/dashboard

Speed matters. Leads contacted within 5 minutes are 21x more likely to convert.`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "booking-confirmation",
      name: "Booking Confirmation",
      subject: "Your session with {{brandName}} is confirmed",
      category: "transactional",
      variables: ["firstName", "brandName", "siteUrl", "bookingDate", "bookingTime", "bookingUrl", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">You are all set, {{firstName}}!</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#374151;">Your strategy session with {{brandName}} has been confirmed. Here are the details:</p>
<div style="margin:0 0 24px;padding:20px;background-color:#f0fdfa;border:1px solid #14b8a6;border-radius:8px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
<tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Date</td><td style="padding:8px 0;font-size:16px;font-weight:600;color:#111827;text-align:right;">{{bookingDate}}</td></tr>
<tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Time</td><td style="padding:8px 0;font-size:16px;font-weight:600;color:#111827;text-align:right;">{{bookingTime}}</td></tr>
</table>
</div>
${ctaButton("Add to Calendar", "{{bookingUrl}}")}
<p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">Before your session:</p>
<ul style="margin:0 0 16px;padding-left:20px;font-size:14px;line-height:24px;color:#374151;">
<li>Think about your top 3 growth challenges</li>
<li>Have your current lead numbers handy</li>
<li>Be ready to share your goals for the next 90 days</li>
</ul>
<p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">Need to reschedule? Reply to this email or contact <a href="mailto:{{supportEmail}}" style="color:#14b8a6;">{{supportEmail}}</a>.</p>`,
      textTemplate: `You are all set, {{firstName}}!

Your strategy session with {{brandName}} has been confirmed.

Date: {{bookingDate}}
Time: {{bookingTime}}

Add to calendar: {{bookingUrl}}

Before your session:
- Think about your top 3 growth challenges
- Have your current lead numbers handy
- Be ready to share your goals for the next 90 days

Need to reschedule? Contact {{supportEmail}}.`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "lead-magnet-delivery",
      name: "Lead Magnet Delivery",
      subject: "Your {{resourceName}} is ready, {{firstName}}",
      category: "transactional",
      variables: ["firstName", "brandName", "siteUrl", "resourceName", "downloadUrl", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Here is your {{resourceName}}, {{firstName}}</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">Thanks for your interest. Click the button below to download your resource right away.</p>
${ctaButton("Download Now", "{{downloadUrl}}")}
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">Here is what to do next:</p>
<ol style="margin:0 0 24px;padding-left:20px;font-size:14px;line-height:28px;color:#374151;">
<li>Download and read through the resource</li>
<li>Identify the 2-3 insights most relevant to your business</li>
<li>Take action on at least one recommendation this week</li>
</ol>
<div style="margin:0 0 24px;padding:20px;background-color:#f9fafb;border-radius:8px;">
<p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">Want personalized guidance?</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#374151;">Book a free strategy session and we will help you apply these insights to your specific situation.</p>
</div>
${ctaButton("Book a Strategy Session", "{{siteUrl}}/assess")}
<p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">If you have trouble downloading, reply to this email and we will send it directly.</p>`,
      textTemplate: `Here is your {{resourceName}}, {{firstName}}

Thanks for your interest. Download your resource here:
{{downloadUrl}}

What to do next:
1. Download and read through the resource
2. Identify the 2-3 insights most relevant to your business
3. Take action on at least one recommendation this week

Want personalized guidance? Book a free strategy session:
{{siteUrl}}/assess

If you have trouble downloading, reply to this email.`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "subscription-confirmed",
      name: "Subscription Confirmed",
      subject: "Your {{planName}} subscription is active",
      category: "transactional",
      variables: ["firstName", "brandName", "siteUrl", "planName", "planPrice", "leadsLimit", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Welcome to {{planName}}, {{firstName}}!</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#374151;">Your {{brandName}} subscription is now active. Here is what you get:</p>
<div style="margin:0 0 24px;padding:20px;background-color:#f0fdfa;border:1px solid #14b8a6;border-radius:8px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
<tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Plan</td><td style="padding:8px 0;font-size:16px;font-weight:600;color:#111827;text-align:right;">{{planName}}</td></tr>
<tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Price</td><td style="padding:8px 0;font-size:16px;font-weight:600;color:#111827;text-align:right;">{{planPrice}}</td></tr>
<tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Leads/month</td><td style="padding:8px 0;font-size:16px;font-weight:600;color:#111827;text-align:right;">{{leadsLimit}}</td></tr>
</table>
</div>
${ctaButton("Go to Dashboard", "{{siteUrl}}/dashboard")}
<p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">Questions? Contact us at <a href="mailto:{{supportEmail}}" style="color:#14b8a6;">{{supportEmail}}</a>.</p>`,
      textTemplate: `Welcome to {{planName}}, {{firstName}}!

Your {{brandName}} subscription is now active.

Plan: {{planName}}
Price: {{planPrice}}
Leads/month: {{leadsLimit}}

Go to your dashboard: {{siteUrl}}/dashboard

Questions? Contact {{supportEmail}}.`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "plan-changed",
      name: "Plan Changed",
      subject: "Your plan has been updated to {{newPlanName}}",
      category: "transactional",
      variables: ["firstName", "brandName", "siteUrl", "oldPlanName", "newPlanName", "newPlanPrice", "effectiveDate", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Plan Updated</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#374151;">Hi {{firstName}}, your {{brandName}} plan has been changed.</p>
<div style="margin:0 0 24px;padding:20px;background-color:#f9fafb;border-radius:8px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
<tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Previous plan</td><td style="padding:8px 0;font-size:14px;color:#111827;text-align:right;">{{oldPlanName}}</td></tr>
<tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">New plan</td><td style="padding:8px 0;font-size:16px;font-weight:600;color:#14b8a6;text-align:right;">{{newPlanName}}</td></tr>
<tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">New price</td><td style="padding:8px 0;font-size:14px;color:#111827;text-align:right;">{{newPlanPrice}}</td></tr>
<tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Effective</td><td style="padding:8px 0;font-size:14px;color:#111827;text-align:right;">{{effectiveDate}}</td></tr>
</table>
</div>
${ctaButton("View Billing", "{{siteUrl}}/dashboard/billing")}`,
      textTemplate: `Hi {{firstName}}, your {{brandName}} plan has been changed.

Previous plan: {{oldPlanName}}
New plan: {{newPlanName}}
New price: {{newPlanPrice}}
Effective: {{effectiveDate}}

View billing: {{siteUrl}}/dashboard/billing`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "provisioning-complete",
      name: "Provisioning Complete",
      subject: "Your {{brandName}} instance is ready!",
      category: "transactional",
      variables: ["firstName", "brandName", "siteUrl", "dashboardUrl", "embedCode", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Your instance is live!</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#374151;">Hi {{firstName}}, your {{brandName}} instance has been provisioned and is ready to capture leads.</p>
<h2 style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">Next steps:</h2>
<ol style="margin:0 0 24px;padding-left:20px;font-size:14px;line-height:28px;color:#374151;">
<li>Add the embed code to your website</li>
<li>Configure your integrations in the dashboard</li>
<li>Customize your funnel and scoring weights</li>
<li>Send your first test lead</li>
</ol>
${ctaButton("Open Dashboard", "{{dashboardUrl}}")}
<p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">Need help getting started? Contact <a href="mailto:{{supportEmail}}" style="color:#14b8a6;">{{supportEmail}}</a>.</p>`,
      textTemplate: `Your instance is live!

Hi {{firstName}}, your {{brandName}} instance has been provisioned.

Next steps:
1. Add the embed code to your website
2. Configure your integrations in the dashboard
3. Customize your funnel and scoring weights
4. Send your first test lead

Open dashboard: {{dashboardUrl}}

Need help? Contact {{supportEmail}}.`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "trial-expiring",
      name: "Trial Expiring",
      subject: "Your {{brandName}} trial expires in {{daysLeft}} days",
      category: "transactional",
      variables: ["firstName", "brandName", "siteUrl", "daysLeft", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Your trial is ending soon</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#374151;">Hi {{firstName}}, your {{brandName}} trial expires in <strong>{{daysLeft}} days</strong>. Upgrade now to keep your leads, funnels, and configurations.</p>
<div style="margin:0 0 24px;padding:20px;background-color:#fffbeb;border:1px solid #f59e0b;border-radius:8px;">
<p style="margin:0;font-size:14px;font-weight:600;color:#92400e;">What happens when your trial ends:</p>
<ul style="margin:8px 0 0;padding-left:20px;font-size:14px;line-height:24px;color:#78350f;">
<li>New lead capture will be paused</li>
<li>Your data will be preserved for 30 days</li>
<li>Integrations will stop processing</li>
</ul>
</div>
${ctaButton("Upgrade Now", "{{siteUrl}}/dashboard/billing")}
<p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">Plans start at $99/month. <a href="{{siteUrl}}/pricing" style="color:#14b8a6;">View all plans</a>.</p>`,
      textTemplate: `Your trial is ending soon

Hi {{firstName}}, your {{brandName}} trial expires in {{daysLeft}} days.

What happens when your trial ends:
- New lead capture will be paused
- Your data will be preserved for 30 days
- Integrations will stop processing

Upgrade now: {{siteUrl}}/dashboard/billing

Plans start at $99/month. View all plans: {{siteUrl}}/pricing`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "usage-warning",
      name: "Usage Warning",
      subject: "You have used {{usagePercent}}% of your monthly lead quota",
      category: "notification",
      variables: ["firstName", "brandName", "siteUrl", "usagePercent", "usedLeads", "totalLeads", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Usage Alert</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#374151;">Hi {{firstName}}, you have used <strong>{{usagePercent}}%</strong> of your monthly lead quota ({{usedLeads}} of {{totalLeads}} leads).</p>
<div style="margin:0 0 8px;height:8px;background-color:#e5e7eb;border-radius:4px;overflow:hidden;">
<div style="height:100%;width:{{usagePercent}}%;background-color:#f59e0b;border-radius:4px;"></div>
</div>
<p style="margin:0 0 24px;font-size:12px;color:#6b7280;text-align:right;">{{usedLeads}} / {{totalLeads}} leads</p>
<p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#374151;">To avoid lead capture being paused, consider upgrading your plan.</p>
${ctaButton("Upgrade Plan", "{{siteUrl}}/dashboard/billing")}`,
      textTemplate: `Usage Alert

Hi {{firstName}}, you have used {{usagePercent}}% of your monthly lead quota ({{usedLeads}} of {{totalLeads}} leads).

To avoid lead capture being paused, consider upgrading your plan.

Upgrade: {{siteUrl}}/dashboard/billing`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "payment-failed",
      name: "Payment Failed",
      subject: "Action required: Payment failed for {{brandName}}",
      category: "transactional",
      variables: ["firstName", "brandName", "siteUrl", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Payment Failed</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#374151;">Hi {{firstName}}, we were unable to process your latest payment for {{brandName}}. Please update your billing information to avoid service interruption.</p>
<div style="margin:0 0 24px;padding:20px;background-color:#fef2f2;border:1px solid #ef4444;border-radius:8px;">
<p style="margin:0;font-size:14px;color:#991b1b;">Your account will be suspended if payment is not updated within 7 days.</p>
</div>
${ctaButton("Update Billing", "{{siteUrl}}/dashboard/billing")}
<p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">If you believe this is an error, contact us at <a href="mailto:{{supportEmail}}" style="color:#14b8a6;">{{supportEmail}}</a>.</p>`,
      textTemplate: `Payment Failed

Hi {{firstName}}, we were unable to process your latest payment for {{brandName}}.

Your account will be suspended if payment is not updated within 7 days.

Update billing: {{siteUrl}}/dashboard/billing

If you believe this is an error, contact {{supportEmail}}.`,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const template of defaults) {
    if (!templateStore.has(template.id)) {
      templateStore.set(template.id, template);
    }
  }

  return defaults;
}
