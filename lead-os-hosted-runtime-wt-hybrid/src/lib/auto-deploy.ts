// ---------------------------------------------------------------------------
// Auto-Deploy Engine
// Creates GitHub repos, pushes generated assets, deploys static sites.
// Supports Vercel, Cloudflare Pages, and GitHub Pages.
// Works in dry-run mode when the relevant platform token is not set.
// ---------------------------------------------------------------------------

export interface DeploymentTarget {
  type: "github-pages" | "vercel" | "cloudflare-pages" | "static-export";
  config: Record<string, string>;
}

export interface DeployedAsset {
  type: "landing-page" | "seo-page" | "form" | "widget" | "sitemap" | "robots";
  path: string;
  title: string;
}

export type DeploymentPlatform = "vercel" | "cloudflare" | "github-pages";

export interface DeploymentJob {
  id: string;
  tenantId: string;
  nicheSlug: string;
  status: "pending" | "creating-repo" | "pushing-assets" | "deploying" | "live" | "failed";
  platform: DeploymentPlatform;
  repoUrl?: string;
  liveUrl?: string;
  deploymentUrl?: string;
  assets: DeployedAsset[];
  target: DeploymentTarget;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface PageDefinition {
  slug: string;
  title: string;
  description: string;
  type: "landing-page" | "seo-page" | "form" | "widget";
  headline: string;
  subheadline?: string;
  ctaText?: string;
  ctaUrl?: string;
  formFields?: FormFieldDef[];
  testimonials?: TestimonialDef[];
  faqItems?: FaqItemDef[];
  primaryColor?: string;
  ogImage?: string;
  keywords?: string[];
  schemaType?: string;
}

interface FormFieldDef {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
}

interface TestimonialDef {
  quote: string;
  name: string;
  role?: string;
}

interface FaqItemDef {
  question: string;
  answer: string;
}

export interface StaticFile {
  path: string;
  content: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const deploymentStore = new Map<string, DeploymentJob>();

function generateId(): string {
  return `deploy-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getGitHubToken(): string | undefined {
  return process.env.GITHUB_TOKEN;
}

function getVercelToken(): string | undefined {
  return process.env.VERCEL_TOKEN;
}

function getCloudflareApiToken(): string | undefined {
  return process.env.CLOUDFLARE_API_TOKEN;
}

function getCloudflareAccountId(): string | undefined {
  return process.env.CLOUDFLARE_ACCOUNT_ID;
}

function getLeadOsApiUrl(): string {
  return process.env.LEAD_OS_API_URL || "https://app.leados.com/api/intake";
}

function isDryRunForPlatform(platform: DeploymentPlatform): boolean {
  if (platform === "vercel") return !getVercelToken();
  if (platform === "cloudflare") return !getCloudflareApiToken() || !getCloudflareAccountId();
  return !getGitHubToken();
}

// ---------------------------------------------------------------------------
// HTML Generation
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function generatePageHtml(page: PageDefinition, tenantId: string, nicheSlug: string): string {
  const apiUrl = getLeadOsApiUrl();
  const primary = page.primaryColor || "#0f766e";
  const actionColor = "#0f766e";
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const headline = escapeHtml(page.headline);
  const subheadline = page.subheadline ? escapeHtml(page.subheadline) : "";
  const ctaText = escapeHtml(page.ctaText || "Get Started Now");
  const ctaUrl = escapeHtml(page.ctaUrl || "#lead-form");
  const keywords = page.keywords?.map(escapeHtml).join(", ") || "";
  const schemaType = page.schemaType || "LocalBusiness";

  const formFieldsHtml = (page.formFields || [
    { name: "firstName", label: "First Name", type: "text", required: true, placeholder: "Your name" },
    { name: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" },
    { name: "phone", label: "Phone", type: "tel", required: false, placeholder: "(555) 123-4567" },
    { name: "message", label: "How can we help?", type: "textarea", required: false, placeholder: "Tell us about your needs..." },
  ]).map((f) => {
    const req = f.required ? " required" : "";
    const ph = f.placeholder ? ` placeholder="${escapeHtml(f.placeholder)}"` : "";
    if (f.type === "textarea") {
      return `<div class="form-group">
  <label for="${escapeHtml(f.name)}">${escapeHtml(f.label)}${f.required ? '<span class="required"> *</span>' : ""}</label>
  <textarea id="${escapeHtml(f.name)}" name="${escapeHtml(f.name)}"${ph}${req} rows="4"></textarea>
</div>`;
    }
    return `<div class="form-group">
  <label for="${escapeHtml(f.name)}">${escapeHtml(f.label)}${f.required ? '<span class="required"> *</span>' : ""}</label>
  <input type="${escapeHtml(f.type)}" id="${escapeHtml(f.name)}" name="${escapeHtml(f.name)}"${ph}${req} />
</div>`;
  }).join("\n");

  const testimonialsHtml = (page.testimonials || []).map((t) =>
    `<div class="testimonial">
  <blockquote>&ldquo;${escapeHtml(t.quote)}&rdquo;</blockquote>
  <p class="testimonial-author">${escapeHtml(t.name)}${t.role ? `, <span>${escapeHtml(t.role)}</span>` : ""}</p>
</div>`,
  ).join("\n");

  const faqHtml = (page.faqItems || []).map((f) =>
    `<div class="faq-item">
  <h3>${escapeHtml(f.question)}</h3>
  <p>${escapeHtml(f.answer)}</p>
</div>`,
  ).join("\n");

  const ogImage = page.ogImage ? `<meta property="og:image" content="${escapeHtml(page.ogImage)}" />` : "";

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": schemaType,
    name: page.title,
    description: page.description,
    url: ctaUrl,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<meta name="description" content="${description}" />
${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}" />` : ""}
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:type" content="website" />
${ogImage}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<script type="application/ld+json">${jsonLd}</script>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;background:#ffffff;color:#1a1a2e;-webkit-font-smoothing:antialiased;}
.hero{padding:80px 24px 60px;text-align:center;background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;border-bottom:6px solid ${primary};}
.hero h1{font-size:48px;font-weight:800;line-height:1.15;margin:0 auto 16px;max-width:700px;letter-spacing:0;}
.hero p{font-size:20px;line-height:1.5;max-width:560px;margin:0 auto 32px;color:#e2e8f0;}
.cta-btn{display:inline-block;padding:16px 40px;background:#fff;color:#0f172a;font-size:18px;font-weight:700;border-radius:8px;text-decoration:none;transition:transform 120ms ease,box-shadow 120ms ease;}
.cta-btn:hover{transform:translateY(-2px);box-shadow:0 4px 20px rgba(0,0,0,0.15);}
.urgency-bar{background:#9a3412;color:#fff;text-align:center;padding:12px 16px;font-size:14px;font-weight:600;letter-spacing:0.5px;}
.countdown{font-size:24px;font-weight:800;letter-spacing:2px;margin-top:4px;}
.social-proof{padding:32px 24px;text-align:center;background:#f8f9fa;border-bottom:1px solid #e9ecef;}
.social-proof p{font-size:15px;color:#6c757d;}
.social-proof strong{color:${actionColor};font-size:20px;}
section.form-section{padding:60px 24px;background:#f8f9fa;}
.form-container{max-width:480px;margin:0 auto;background:#fff;padding:32px;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.08);}
.form-container h2{font-size:24px;font-weight:700;margin:0 0 8px;color:#1a1a2e;}
.form-container .form-subtitle{font-size:14px;color:#6c757d;margin:0 0 24px;}
.form-group{margin:0 0 16px;}
.form-group label{display:block;font-size:14px;font-weight:500;color:#1a1a2e;margin:0 0 4px;}
.form-group .required{color:#b91c1c;}
.form-group input,.form-group textarea,.form-group select{width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;transition:border-color 120ms ease;}
.form-group input:focus,.form-group textarea:focus{outline:none;border-color:${actionColor};box-shadow:0 0 0 3px rgba(15,118,110,0.22);}
.submit-btn{width:100%;padding:14px;background:${actionColor};color:#fff;font-size:16px;font-weight:700;border:none;border-radius:8px;cursor:pointer;transition:background 120ms ease;}
.submit-btn:hover{filter:brightness(1.1);}
.submit-btn:focus-visible{outline:3px solid ${actionColor};outline-offset:2px;}
.success-msg{display:none;text-align:center;padding:24px;color:#047857;font-size:18px;font-weight:600;}
.testimonials{padding:60px 24px;max-width:700px;margin:0 auto;}
.testimonials h2{text-align:center;font-size:28px;font-weight:700;margin:0 0 32px;}
.testimonial{background:#f8f9fa;padding:24px;border-radius:8px;margin:0 0 16px;border-left:4px solid ${primary};}
.testimonial blockquote{font-size:16px;line-height:1.6;color:#374151;font-style:italic;margin:0 0 8px;}
.testimonial-author{font-size:14px;font-weight:600;color:#1a1a2e;}
.testimonial-author span{font-weight:400;color:#6c757d;}
.faq{padding:60px 24px;max-width:700px;margin:0 auto;}
.faq h2{text-align:center;font-size:28px;font-weight:700;margin:0 0 32px;}
.faq-item{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 12px;}
.faq-item h3{font-size:16px;font-weight:600;color:#1a1a2e;margin:0 0 8px;}
.faq-item p{font-size:14px;line-height:1.6;color:#6c757d;}
footer{text-align:center;padding:32px 24px;font-size:13px;color:#4b5563;border-top:1px solid #e5e7eb;}
@media(prefers-reduced-motion:reduce){*{animation-duration:0.01ms!important;transition-duration:0.01ms!important;}}
@media(max-width:600px){.hero{padding:48px 16px 40px;}.hero h1{font-size:34px;}.hero p{font-size:16px;}.form-container{padding:20px;margin:0 12px;}}
</style>
</head>
<body>
<!-- Urgency bar with countdown -->
<div class="urgency-bar" role="alert" aria-live="polite">
Limited Availability &mdash; Only <strong>3 spots</strong> remaining this month
<div class="countdown" data-countdown="true" aria-label="Countdown timer">
<span id="cd-hours">00</span>:<span id="cd-mins">00</span>:<span id="cd-secs">00</span>
</div>
</div>

<header class="hero">
<h1>${headline}</h1>
${subheadline ? `<p>${subheadline}</p>` : ""}
<a href="${ctaUrl}" class="cta-btn">${ctaText}</a>
</header>

<!-- Social proof -->
<div class="social-proof">
<p><strong>500+</strong> businesses trust us &bull; <strong>4.9</strong>/5 average rating &bull; <strong>98%</strong> client satisfaction</p>
</div>

${testimonialsHtml ? `<section class="testimonials"><h2>What Our Clients Say</h2>\n${testimonialsHtml}</section>` : ""}

<!-- Lead capture form -->
<section class="form-section" id="lead-form">
<div class="form-container">
<h2>Get Your Free Consultation</h2>
<p class="form-subtitle">No obligation. We typically respond within 2 hours.</p>
<form action="${escapeHtml(apiUrl)}" method="POST" id="capture-form">
<input type="hidden" name="source" value="${escapeHtml(nicheSlug)}" />
<input type="hidden" name="niche" value="${escapeHtml(nicheSlug)}" />
<input type="hidden" name="tenantId" value="${escapeHtml(tenantId)}" />
${formFieldsHtml}
<button type="submit" class="submit-btn">Get My Free Consultation</button>
</form>
<div class="success-msg" id="form-success" role="status">Thank you! We will be in touch shortly.</div>
</div>
</section>

${faqHtml ? `<section class="faq"><h2>Frequently Asked Questions</h2>\n${faqHtml}</section>` : ""}

<footer>
<p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
</footer>

<!-- Tracking pixel -->
<img src="${escapeHtml(apiUrl)}?track=open&tenant=${escapeHtml(tenantId)}&niche=${escapeHtml(nicheSlug)}&page=${escapeHtml(page.slug)}" width="1" height="1" alt="" style="position:absolute;opacity:0;" aria-hidden="true" />

<script>
(function(){
  // Countdown timer - 24 hours from first visit
  var stored=localStorage.getItem('lo_cd_end');
  var end=stored?parseInt(stored,10):Date.now()+86400000;
  if(!stored)localStorage.setItem('lo_cd_end',String(end));
  function tick(){
    var diff=Math.max(0,end-Date.now());
    var h=Math.floor(diff/3600000);
    var m=Math.floor((diff%3600000)/60000);
    var s=Math.floor((diff%60000)/1000);
    var he=document.getElementById('cd-hours');
    var me=document.getElementById('cd-mins');
    var se=document.getElementById('cd-secs');
    if(he)he.textContent=String(h).padStart(2,'0');
    if(me)me.textContent=String(m).padStart(2,'0');
    if(se)se.textContent=String(s).padStart(2,'0');
    if(diff>0)requestAnimationFrame(tick);
  }
  tick();

  // Form submission
  var form=document.getElementById('capture-form');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var data=new FormData(form);
      var obj={};
      data.forEach(function(v,k){obj[k]=v;});
      fetch(form.action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(obj)})
      .then(function(){
        form.style.display='none';
        var msg=document.getElementById('form-success');
        if(msg)msg.style.display='block';
      })
      .catch(function(){alert('Something went wrong. Please try again.');});
    });
  }
})();
</script>
</body>
</html>`;
}

function generateIndexHtml(pages: PageDefinition[], tenantId: string, nicheSlug: string): string {
  const title = escapeHtml(`${nicheSlug} - Site Index`);
  const links = pages.map((p) =>
    `<li><a href="/${escapeHtml(p.slug)}.html">${escapeHtml(p.title)}</a> &mdash; ${escapeHtml(p.description)}</li>`,
  ).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:system-ui,-apple-system,sans-serif;max-width:700px;margin:0 auto;padding:40px 24px;color:#1a1a2e;}
h1{font-size:28px;font-weight:700;margin:0 0 8px;}
p{color:#6c757d;margin:0 0 32px;font-size:16px;}
ul{list-style:none;}
li{margin:0 0 16px;padding:16px;background:#f8f9fa;border-radius:8px;border:1px solid #e5e7eb;}
a{color:#14b8a6;font-weight:600;text-decoration:none;font-size:16px;}
a:hover{text-decoration:underline;}
a:focus-visible{outline:3px solid #14b8a6;outline-offset:2px;}
</style>
</head>
<body>
<main>
<h1>${title}</h1>
<p>Tenant: ${escapeHtml(tenantId)} &bull; ${pages.length} pages deployed</p>
<ul>
${links}
</ul>
</main>
</body>
</html>`;
}

function generateSitemapXml(pages: PageDefinition[], baseUrl: string): string {
  const urls = [
    { loc: baseUrl, priority: "1.0" },
    ...pages.map((p) => ({ loc: `${baseUrl}/${p.slug}.html`, priority: "0.8" })),
  ];

  const entries = urls.map((u) =>
    `  <url>\n    <loc>${escapeHtml(u.loc)}</loc>\n    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>`,
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}

function generateRobotsTxt(baseUrl: string): string {
  return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;
}

// ---------------------------------------------------------------------------
// Static site generation (no GitHub needed)
// ---------------------------------------------------------------------------

export function generateStaticSite(
  tenantId: string,
  nicheSlug: string,
  pages: PageDefinition[],
  baseUrl?: string,
): StaticFile[] {
  const resolvedBaseUrl = baseUrl ?? `https://${tenantId}.github.io/${nicheSlug}-site`;
  const files: StaticFile[] = [];

  for (const page of pages) {
    files.push({
      path: `${page.slug}.html`,
      content: generatePageHtml(page, tenantId, nicheSlug),
    });
  }

  files.push({
    path: "index.html",
    content: generateIndexHtml(pages, tenantId, nicheSlug),
  });

  files.push({
    path: "sitemap.xml",
    content: generateSitemapXml(pages, resolvedBaseUrl),
  });

  files.push({
    path: "robots.txt",
    content: generateRobotsTxt(resolvedBaseUrl),
  });

  return files;
}

// ---------------------------------------------------------------------------
// Vercel deployment
// ---------------------------------------------------------------------------

interface VercelFile {
  file: string;
  data: string;
  encoding: "utf-8" | "base64";
}

interface VercelDeploymentResponse {
  url: string;
  id: string;
}

export async function deployToVercel(
  files: StaticFile[],
  projectName: string,
): Promise<string> {
  const token = getVercelToken();

  if (!token) {
    return `https://${projectName}.vercel.app (dry-run)`;
  }

  const vercelFiles: VercelFile[] = files.map((f) => ({
    file: f.path,
    data: f.content,
    encoding: "utf-8",
  }));

  const resp = await fetch("https://api.vercel.com/v13/deployments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: projectName,
      files: vercelFiles,
      projectSettings: {
        framework: null,
        outputDirectory: ".",
      },
      target: "production",
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Vercel deployment failed: ${resp.status} ${text}`);
  }

  const data = await resp.json() as VercelDeploymentResponse;
  return `https://${data.url}`;
}

// ---------------------------------------------------------------------------
// Cloudflare Pages deployment
// ---------------------------------------------------------------------------

interface CloudflareUploadResponse {
  result: {
    url: string;
    id: string;
  };
  success: boolean;
  errors: Array<{ message: string }>;
}

export async function deployToCloudflare(
  files: StaticFile[],
  projectName: string,
): Promise<string> {
  const token = getCloudflareApiToken();
  const accountId = getCloudflareAccountId();

  if (!token || !accountId) {
    return `https://${projectName}.pages.dev (dry-run)`;
  }

  // Cloudflare Pages Direct Upload: create a deployment with multipart form data
  const formData = new FormData();

  const manifest: Record<string, string> = {};
  for (const file of files) {
    const encoded = typeof btoa === "function"
      ? btoa(unescape(encodeURIComponent(file.content)))
      : Buffer.from(file.content, "utf-8").toString("base64");
    const hash = encoded.slice(0, 32);
    manifest[`/${file.path}`] = hash;
    formData.append(hash, new Blob([file.content], { type: "text/plain" }), file.path);
  }
  formData.append("manifest", JSON.stringify(manifest));

  const resp = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  );

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Cloudflare Pages deployment failed: ${resp.status} ${text}`);
  }

  const data = await resp.json() as CloudflareUploadResponse;

  if (!data.success) {
    const messages = data.errors.map((e) => e.message).join(", ");
    throw new Error(`Cloudflare Pages deployment error: ${messages}`);
  }

  return `https://${projectName}.pages.dev`;
}

// ---------------------------------------------------------------------------
// GitHub API helpers
// ---------------------------------------------------------------------------

async function githubFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getGitHubToken();
  if (!token) throw new Error("GITHUB_TOKEN not set");

  const baseUrl = "https://api.github.com";
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

async function getGitHubUser(): Promise<string> {
  const resp = await githubFetch("/user");
  if (!resp.ok) throw new Error(`GitHub auth failed: ${resp.status}`);
  const data = await resp.json() as { login: string };
  return data.login;
}

async function createRepo(repoName: string): Promise<{ url: string; fullName: string }> {
  const resp = await githubFetch("/user/repos", {
    method: "POST",
    body: JSON.stringify({
      name: repoName,
      description: `Auto-deployed by Lead OS`,
      auto_init: true,
      private: false,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    if (resp.status === 422 && body.includes("already exists")) {
      const owner = await getGitHubUser();
      return { url: `https://github.com/${owner}/${repoName}`, fullName: `${owner}/${repoName}` };
    }
    throw new Error(`Failed to create repo: ${resp.status} ${body}`);
  }

  const data = await resp.json() as { html_url: string; full_name: string };
  return { url: data.html_url, fullName: data.full_name };
}

async function pushFile(repoFullName: string, path: string, content: string, message: string): Promise<void> {
  const encoded = typeof btoa === "function"
    ? btoa(unescape(encodeURIComponent(content)))
    : Buffer.from(content, "utf-8").toString("base64");

  const existingResp = await githubFetch(`/repos/${repoFullName}/contents/${path}`);
  let sha: string | undefined;
  if (existingResp.ok) {
    const existing = await existingResp.json() as { sha: string };
    sha = existing.sha;
  }

  const body: Record<string, string> = { message, content: encoded };
  if (sha) body.sha = sha;

  const resp = await githubFetch(`/repos/${repoFullName}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Failed to push ${path}: ${resp.status} ${text}`);
  }
}

async function enableGitHubPages(repoFullName: string): Promise<string> {
  const resp = await githubFetch(`/repos/${repoFullName}/pages`, {
    method: "POST",
    body: JSON.stringify({
      source: { branch: "main", path: "/" },
    }),
  });

  if (!resp.ok && resp.status !== 409) {
    const text = await resp.text();
    throw new Error(`Failed to enable GitHub Pages: ${resp.status} ${text}`);
  }

  const [owner, repo] = repoFullName.split("/");
  return `https://${owner}.github.io/${repo}`;
}

// ---------------------------------------------------------------------------
// Deployment orchestration
// ---------------------------------------------------------------------------

function updateJob(job: DeploymentJob, patch: Partial<DeploymentJob>): DeploymentJob {
  Object.assign(job, patch, { updatedAt: new Date().toISOString() });
  return job;
}

export async function createDeployment(
  tenantId: string,
  nicheSlug: string,
  pages: PageDefinition[],
  target: DeploymentTarget,
  platform: DeploymentPlatform = "vercel",
): Promise<DeploymentJob> {
  const now = new Date().toISOString();
  const job: DeploymentJob = {
    id: generateId(),
    tenantId,
    nicheSlug,
    status: "pending",
    platform,
    assets: [],
    target,
    createdAt: now,
    updatedAt: now,
  };
  deploymentStore.set(job.id, job);

  const projectName = `${nicheSlug}-site`;
  const files = generateStaticSite(tenantId, nicheSlug, pages);

  const assets: DeployedAsset[] = files.map((f) => {
    if (f.path === "sitemap.xml") return { type: "sitemap" as const, path: f.path, title: "Sitemap" };
    if (f.path === "robots.txt") return { type: "robots" as const, path: f.path, title: "Robots" };
    if (f.path === "index.html") return { type: "landing-page" as const, path: f.path, title: "Site Index" };
    const pageDef = pages.find((p) => `${p.slug}.html` === f.path);
    return {
      type: (pageDef?.type || "landing-page") as DeployedAsset["type"],
      path: f.path,
      title: pageDef?.title || f.path,
    };
  });
  updateJob(job, { assets });

  if (isDryRunForPlatform(platform)) {
    const dryRunUrl = buildDryRunUrl(platform, tenantId, projectName);
    updateJob(job, {
      status: "live",
      repoUrl: platform === "github-pages"
        ? `https://github.com/${tenantId}/${projectName} (dry-run)`
        : undefined,
      liveUrl: dryRunUrl,
      deploymentUrl: dryRunUrl,
    });
    return job;
  }

  try {
    if (platform === "vercel") {
      updateJob(job, { status: "deploying" });
      const deploymentUrl = await deployToVercel(files, projectName);
      updateJob(job, { status: "live", liveUrl: deploymentUrl, deploymentUrl });
      return job;
    }

    if (platform === "cloudflare") {
      updateJob(job, { status: "deploying" });
      const deploymentUrl = await deployToCloudflare(files, projectName);
      updateJob(job, { status: "live", liveUrl: deploymentUrl, deploymentUrl });
      return job;
    }

    // github-pages: create repo, push files, enable Pages
    updateJob(job, { status: "creating-repo" });
    const { url: repoUrl, fullName } = await createRepo(projectName);
    updateJob(job, { repoUrl });

    updateJob(job, { status: "pushing-assets" });
    for (const file of files) {
      await pushFile(fullName, file.path, file.content, `Deploy ${file.path}`);
    }

    updateJob(job, { status: "deploying" });
    const liveUrl = await enableGitHubPages(fullName);
    updateJob(job, { status: "live", liveUrl, deploymentUrl: liveUrl });
    return job;
  } catch (err) {
    updateJob(job, {
      status: "failed",
      error: err instanceof Error ? err.message : "Deployment failed",
    });
    return job;
  }
}

function buildDryRunUrl(platform: DeploymentPlatform, tenantId: string, projectName: string): string {
  if (platform === "vercel") return `https://${projectName}.vercel.app (dry-run)`;
  if (platform === "cloudflare") return `https://${projectName}.pages.dev (dry-run)`;
  return `https://${tenantId}.github.io/${projectName} (dry-run)`;
}

export function getDeployment(jobId: string): DeploymentJob | undefined {
  return deploymentStore.get(jobId);
}

export function listDeployments(tenantId: string): DeploymentJob[] {
  return [...deploymentStore.values()]
    .filter((j) => j.tenantId === tenantId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function redeployAssets(
  jobId: string,
  updatedPages: PageDefinition[],
): Promise<DeploymentJob | undefined> {
  const job = deploymentStore.get(jobId);
  if (!job) return undefined;

  const files = generateStaticSite(job.tenantId, job.nicheSlug, updatedPages);

  const assets: DeployedAsset[] = files.map((f) => {
    if (f.path === "sitemap.xml") return { type: "sitemap" as const, path: f.path, title: "Sitemap" };
    if (f.path === "robots.txt") return { type: "robots" as const, path: f.path, title: "Robots" };
    if (f.path === "index.html") return { type: "landing-page" as const, path: f.path, title: "Site Index" };
    const pageDef = updatedPages.find((p) => `${p.slug}.html` === f.path);
    return {
      type: (pageDef?.type || "landing-page") as DeployedAsset["type"],
      path: f.path,
      title: pageDef?.title || f.path,
    };
  });

  updateJob(job, { assets });

  if (isDryRunForPlatform(job.platform)) {
    updateJob(job, { status: "live" });
    return job;
  }

  try {
    updateJob(job, { status: "pushing-assets" });

    if (job.platform === "github-pages" && job.repoUrl) {
      const owner = await getGitHubUser();
      const repoName = `${job.nicheSlug}-site`;
      const fullName = `${owner}/${repoName}`;

      for (const file of files) {
        await pushFile(fullName, file.path, file.content, `Redeploy ${file.path}`);
      }
    }

    if (job.platform === "vercel") {
      const deploymentUrl = await deployToVercel(files, `${job.nicheSlug}-site`);
      updateJob(job, { liveUrl: deploymentUrl, deploymentUrl });
    }

    if (job.platform === "cloudflare") {
      const deploymentUrl = await deployToCloudflare(files, `${job.nicheSlug}-site`);
      updateJob(job, { liveUrl: deploymentUrl, deploymentUrl });
    }

    updateJob(job, { status: "live" });
    return job;
  } catch (err) {
    updateJob(job, {
      status: "failed",
      error: err instanceof Error ? err.message : "Redeployment failed",
    });
    return job;
  }
}

// ---------------------------------------------------------------------------
// Testing helpers
// ---------------------------------------------------------------------------

export function _getDeploymentStoreForTesting(): Map<string, DeploymentJob> {
  return deploymentStore;
}
