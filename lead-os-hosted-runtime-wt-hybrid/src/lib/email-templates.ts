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
  const brandName = escapeHtml(context.brandName || "Lead OS");
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
<a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a> from these emails.
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
      name: "Nurture: Day 0 - Quick Win",
      subject: "{{firstName}}, here is your first quick win",
      category: "nurture",
      variables: ["firstName", "brandName", "siteUrl", "nicheName", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Your first quick win, {{firstName}}</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">Thanks for signing up with {{brandName}}. Most {{nicheName}} businesses leave 30-40% of their leads on the table simply because they do not follow up fast enough.</p>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">Here is something you can do right now that takes less than 5 minutes:</p>
<div style="margin:0 0 24px;padding:20px;background-color:#f0fdfa;border-left:4px solid #14b8a6;border-radius:4px;">
<p style="margin:0;font-size:16px;line-height:24px;color:#111827;font-weight:600;">Set up an auto-response for new inquiries.</p>
<p style="margin:8px 0 0;font-size:14px;line-height:22px;color:#374151;">Responding within 5 minutes increases conversion by 8x compared to waiting an hour.</p>
</div>
${ctaButton("Set Up Auto-Response", "{{siteUrl}}/dashboard")}
<p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">Tomorrow, we will share the second biggest leak in most lead pipelines.</p>`,
      textTemplate: `Your first quick win, {{firstName}}

Thanks for signing up with {{brandName}}. Most {{nicheName}} businesses leave 30-40% of their leads on the table simply because they do not follow up fast enough.

Here is something you can do right now:

Set up an auto-response for new inquiries. Responding within 5 minutes increases conversion by 8x compared to waiting an hour.

Set it up: {{siteUrl}}/dashboard

Tomorrow, we will share the second biggest leak in most lead pipelines.`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "nurture-day-3",
      name: "Nurture: Day 3 - Pain Agitation",
      subject: "The hidden cost of manual follow-up",
      category: "nurture",
      variables: ["firstName", "brandName", "siteUrl", "nicheName", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">{{firstName}}, let us talk about what manual follow-up really costs</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">Most {{nicheName}} businesses spend 6-10 hours per week chasing leads manually. That is 300+ hours per year.</p>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">But the real cost is not the time. It is the leads you miss while you are busy with the ones you have.</p>
<div style="margin:0 0 24px;padding:20px;background-color:#fefce8;border-left:4px solid #eab308;border-radius:4px;">
<p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">78%</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#374151;">of customers buy from the first business that responds to their inquiry.</p>
</div>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">Your competitors who automate this are responding in seconds. You do not need to hire more people. You need a better system.</p>
${ctaButton("See How Automation Works", "{{siteUrl}}/dashboard")}`,
      textTemplate: `{{firstName}}, let us talk about what manual follow-up really costs

Most {{nicheName}} businesses spend 6-10 hours per week chasing leads manually. That is 300+ hours per year.

But the real cost is not the time. It is the leads you miss while you are busy with the ones you have.

78% of customers buy from the first business that responds to their inquiry.

Your competitors who automate this are responding in seconds.

See how automation works: {{siteUrl}}/dashboard`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "nurture-day-7",
      name: "Nurture: Day 7 - Social Proof",
      subject: "How {{nicheName}} businesses are growing 3x faster",
      category: "nurture",
      variables: ["firstName", "brandName", "siteUrl", "nicheName", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Real results from businesses like yours</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#374151;">{{firstName}}, here is what {{nicheName}} businesses are achieving with automated lead capture:</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
<tr>
<td style="padding:16px;text-align:center;background-color:#f0fdfa;border-radius:8px;width:33%;">
<p style="margin:0 0 4px;font-size:28px;font-weight:700;color:#14b8a6;">47%</p>
<p style="margin:0;font-size:12px;color:#6b7280;">More qualified leads</p>
</td>
<td style="width:8px;"></td>
<td style="padding:16px;text-align:center;background-color:#f0fdfa;border-radius:8px;width:33%;">
<p style="margin:0 0 4px;font-size:28px;font-weight:700;color:#14b8a6;">3.2x</p>
<p style="margin:0;font-size:12px;color:#6b7280;">Faster response time</p>
</td>
<td style="width:8px;"></td>
<td style="padding:16px;text-align:center;background-color:#f0fdfa;border-radius:8px;width:33%;">
<p style="margin:0 0 4px;font-size:28px;font-weight:700;color:#14b8a6;">12hrs</p>
<p style="margin:0;font-size:12px;color:#6b7280;">Saved per week</p>
</td>
</tr>
</table>
${ctaButton("Start Your Growth Plan", "{{siteUrl}}/dashboard")}
<p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">Results vary by business. These are averages from our client base over 90 days.</p>`,
      textTemplate: `Real results from businesses like yours

{{firstName}}, here is what {{nicheName}} businesses are achieving with automated lead capture:

- 47% more qualified leads
- 3.2x faster response time
- 12 hours saved per week

Start your growth plan: {{siteUrl}}/dashboard

Results vary by business. These are averages from our client base over 90 days.`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "nurture-day-10",
      name: "Nurture: Day 10 - Objection Handling",
      subject: "{{firstName}}, is this what is holding you back?",
      category: "nurture",
      variables: ["firstName", "brandName", "siteUrl", "nicheName", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">We hear this a lot, {{firstName}}</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#374151;">Most {{nicheName}} business owners hesitate for one of these reasons. Let us address them head-on:</p>
<div style="margin:0 0 16px;padding:16px;background-color:#f9fafb;border-radius:8px;">
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#111827;">"I do not have time to set up another tool."</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">Setup takes under 30 minutes. We handle the heavy lifting. You will save that time back in the first day.</p>
</div>
<div style="margin:0 0 16px;padding:16px;background-color:#f9fafb;border-radius:8px;">
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#111827;">"My business is different."</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">Our system adapts to your specific niche. We have templates built for {{nicheName}} businesses specifically.</p>
</div>
<div style="margin:0 0 24px;padding:16px;background-color:#f9fafb;border-radius:8px;">
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#111827;">"I am not sure it will work for me."</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">That is why we offer a free diagnostic. No commitment, just a clear picture of what is possible.</p>
</div>
${ctaButton("Get Your Free Diagnostic", "{{siteUrl}}/assess")}`,
      textTemplate: `We hear this a lot, {{firstName}}

Most {{nicheName}} business owners hesitate for one of these reasons:

"I do not have time to set up another tool."
Setup takes under 30 minutes. We handle the heavy lifting.

"My business is different."
Our system adapts to your niche. We have templates for {{nicheName}} businesses.

"I am not sure it will work for me."
That is why we offer a free diagnostic. No commitment.

Get your free diagnostic: {{siteUrl}}/assess`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "nurture-day-14",
      name: "Nurture: Day 14 - Authority",
      subject: "The 3-visit framework that converts cold leads",
      category: "nurture",
      variables: ["firstName", "brandName", "siteUrl", "nicheName", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">The framework behind our best results</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">{{firstName}}, after working with hundreds of {{nicheName}} businesses, we have identified a pattern that consistently converts cold visitors into paying customers.</p>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">We call it the <strong>3-Visit Framework</strong>:</p>
<div style="margin:0 0 12px;padding:16px;border:1px solid #e5e7eb;border-radius:8px;">
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#14b8a6;">Visit 1: Capture</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#374151;">Offer a valuable lead magnet that addresses their primary pain point. Capture their information.</p>
</div>
<div style="margin:0 0 12px;padding:16px;border:1px solid #e5e7eb;border-radius:8px;">
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#14b8a6;">Visit 2: Qualify</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#374151;">Use an interactive assessment to understand their needs and score their readiness to buy.</p>
</div>
<div style="margin:0 0 24px;padding:16px;border:1px solid #e5e7eb;border-radius:8px;">
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#14b8a6;">Visit 3: Convert</p>
<p style="margin:0;font-size:14px;line-height:22px;color:#374151;">Present a tailored offer with social proof and urgency. Book a call or close the deal.</p>
</div>
${ctaButton("See the Framework in Action", "{{siteUrl}}/dashboard")}`,
      textTemplate: `The framework behind our best results

{{firstName}}, after working with hundreds of {{nicheName}} businesses, we identified a pattern that converts cold visitors into paying customers.

The 3-Visit Framework:

Visit 1: Capture - Offer a valuable lead magnet. Capture their information.
Visit 2: Qualify - Use an assessment to score their readiness.
Visit 3: Convert - Present a tailored offer with social proof.

See the framework in action: {{siteUrl}}/dashboard`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "nurture-day-21",
      name: "Nurture: Day 21 - Case Study",
      subject: "From 5 leads/month to 47: a {{nicheName}} success story",
      category: "nurture",
      variables: ["firstName", "brandName", "siteUrl", "nicheName", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">From struggling to thriving in 60 days</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">{{firstName}}, meet Sarah. She runs a {{nicheName}} business and was spending 15 hours a week on manual lead follow-up.</p>
<div style="margin:0 0 24px;padding:24px;background-color:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
<p style="margin:0 0 12px;font-size:16px;line-height:24px;color:#374151;font-style:italic;">"I was drowning in sticky notes and spreadsheets. I knew I was losing leads but could not keep up. Within two weeks of setting up automated follow-up, my booking rate tripled."</p>
<p style="margin:0;font-size:14px;font-weight:600;color:#111827;">- Sarah K., {{nicheName}} Business Owner</p>
</div>
<p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">Her results after 60 days:</p>
<ul style="margin:0 0 24px;padding-left:20px;font-size:16px;line-height:28px;color:#374151;">
<li>Lead volume: 5/month to 47/month</li>
<li>Response time: 4 hours to under 2 minutes</li>
<li>Weekly hours on follow-up: 15 to 2</li>
<li>Revenue increase: 340%</li>
</ul>
${ctaButton("Get Results Like Sarah", "{{siteUrl}}/assess")}`,
      textTemplate: `From struggling to thriving in 60 days

{{firstName}}, meet Sarah. She runs a {{nicheName}} business and was spending 15 hours a week on manual lead follow-up.

"I was drowning in sticky notes and spreadsheets. Within two weeks of setting up automated follow-up, my booking rate tripled." - Sarah K.

Her results after 60 days:
- Lead volume: 5/month to 47/month
- Response time: 4 hours to under 2 minutes
- Weekly hours on follow-up: 15 to 2
- Revenue increase: 340%

Get results like Sarah: {{siteUrl}}/assess`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "nurture-day-30",
      name: "Nurture: Day 30 - Final CTA",
      subject: "{{firstName}}, your growth window is closing",
      category: "nurture",
      variables: ["firstName", "brandName", "siteUrl", "nicheName", "supportEmail", "unsubscribeUrl"],
      htmlTemplate: `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">One last thing, {{firstName}}</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">Over the past month, we have shared how {{nicheName}} businesses are using automated lead capture to grow faster with less effort.</p>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">You have seen the data, the framework, and the results. The question is: are you ready to stop leaving money on the table?</p>
<div style="margin:0 0 24px;padding:20px;background-color:#fef2f2;border-left:4px solid #ef4444;border-radius:4px;">
<p style="margin:0;font-size:16px;line-height:24px;color:#111827;font-weight:600;">Every week you wait, you lose an average of 12 qualified leads to competitors who respond faster.</p>
</div>
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#374151;">Book a 15-minute strategy session. No pitch, just a clear action plan for your business.</p>
${ctaButton("Book Your Strategy Session", "{{siteUrl}}/assess")}
<p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">This is the last email in this series. If the timing is not right, no worries. We are here when you are ready.</p>`,
      textTemplate: `One last thing, {{firstName}}

Over the past month, we shared how {{nicheName}} businesses use automated lead capture to grow faster.

You have seen the data, the framework, and the results. Are you ready to stop leaving money on the table?

Every week you wait, you lose an average of 12 qualified leads to competitors who respond faster.

Book a 15-minute strategy session: {{siteUrl}}/assess

This is the last email in this series. We are here when you are ready.`,
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
  ];

  for (const template of defaults) {
    if (!templateStore.has(template.id)) {
      templateStore.set(template.id, template);
    }
  }

  return defaults;
}
