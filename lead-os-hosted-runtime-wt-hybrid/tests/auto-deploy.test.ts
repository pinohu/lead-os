import test from "node:test";
import assert from "node:assert/strict";
import {
  generateStaticSite,
  createDeployment,
  deployToVercel,
  deployToCloudflare,
  getDeployment,
  listDeployments,
  redeployAssets,
  _getDeploymentStoreForTesting,
  type PageDefinition,
  type DeploymentPlatform,
  type DeploymentTarget,
} from "../src/lib/auto-deploy.ts";

function makePage(overrides: Partial<PageDefinition> = {}): PageDefinition {
  return {
    slug: "test-page",
    title: "Test Page",
    description: "A test landing page",
    type: "landing-page",
    headline: "Welcome to Our Service",
    subheadline: "We help you grow your business",
    ctaText: "Get Started",
    ctaUrl: "#lead-form",
    ...overrides,
  };
}

function makeTarget(): DeploymentTarget {
  return { type: "github-pages", config: {} };
}

// ---------------------------------------------------------------------------
// Static site generation
// ---------------------------------------------------------------------------

test("generateStaticSite produces correct number of files", () => {
  const pages = [makePage(), makePage({ slug: "about", title: "About Us", headline: "About" })];
  const files = generateStaticSite("tenant1", "plumbing", pages);

  // 2 pages + index.html + sitemap.xml + robots.txt = 5
  assert.equal(files.length, 5);
  assert.ok(files.some((f) => f.path === "test-page.html"));
  assert.ok(files.some((f) => f.path === "about.html"));
  assert.ok(files.some((f) => f.path === "index.html"));
  assert.ok(files.some((f) => f.path === "sitemap.xml"));
  assert.ok(files.some((f) => f.path === "robots.txt"));
});

test("generateStaticSite produces valid HTML with DOCTYPE", () => {
  const files = generateStaticSite("tenant1", "roofing", [makePage()]);
  const pageFile = files.find((f) => f.path === "test-page.html");
  assert.ok(pageFile);
  assert.ok(pageFile.content.includes("<!DOCTYPE html>"));
  assert.ok(pageFile.content.includes("</html>"));
});

test("generated HTML contains lead capture form", () => {
  const files = generateStaticSite("tenant1", "roofing", [makePage()]);
  const html = files.find((f) => f.path === "test-page.html")!.content;
  assert.ok(html.includes("<form"));
  assert.ok(html.includes("capture-form"));
  assert.ok(html.includes('name="email"'));
  assert.ok(html.includes('type="submit"') || html.includes("submit"));
});

test("generated HTML contains SEO meta tags", () => {
  const files = generateStaticSite("tenant1", "roofing", [makePage()]);
  const html = files.find((f) => f.path === "test-page.html")!.content;
  assert.ok(html.includes('name="description"'));
  assert.ok(html.includes('property="og:title"'));
  assert.ok(html.includes('property="og:description"'));
  assert.ok(html.includes('name="twitter:card"'));
});

test("generated HTML contains Schema.org JSON-LD", () => {
  const files = generateStaticSite("tenant1", "roofing", [makePage()]);
  const html = files.find((f) => f.path === "test-page.html")!.content;
  assert.ok(html.includes("application/ld+json"));
  assert.ok(html.includes("schema.org"));
  assert.ok(html.includes("LocalBusiness"));
});

test("generated HTML contains countdown timer (psychology trigger)", () => {
  const files = generateStaticSite("tenant1", "roofing", [makePage()]);
  const html = files.find((f) => f.path === "test-page.html")!.content;
  assert.ok(html.includes("countdown"));
  assert.ok(html.includes("cd-hours"));
  assert.ok(html.includes("cd-mins"));
  assert.ok(html.includes("cd-secs"));
});

test("generated HTML contains social proof (psychology trigger)", () => {
  const files = generateStaticSite("tenant1", "roofing", [makePage()]);
  const html = files.find((f) => f.path === "test-page.html")!.content;
  assert.ok(html.includes("social-proof"));
  assert.ok(html.includes("500+"));
  assert.ok(html.includes("client satisfaction"));
});

test("generated HTML contains urgency bar (psychology trigger)", () => {
  const files = generateStaticSite("tenant1", "roofing", [makePage()]);
  const html = files.find((f) => f.path === "test-page.html")!.content;
  assert.ok(html.includes("urgency-bar"));
  assert.ok(html.includes("Limited Availability"));
  assert.ok(html.includes("spots"));
});

test("generated HTML contains tracking pixel", () => {
  const files = generateStaticSite("tenant1", "roofing", [makePage()]);
  const html = files.find((f) => f.path === "test-page.html")!.content;
  assert.ok(html.includes("track=open"));
  assert.ok(html.includes("tenant=tenant1"));
});

test("generated HTML is mobile responsive", () => {
  const files = generateStaticSite("tenant1", "roofing", [makePage()]);
  const html = files.find((f) => f.path === "test-page.html")!.content;
  assert.ok(html.includes("viewport"));
  assert.ok(html.includes("width=device-width"));
  assert.ok(html.includes("@media"));
  assert.ok(html.includes("clamp("));
});

test("generated HTML has inline CSS only (no external deps)", () => {
  const files = generateStaticSite("tenant1", "roofing", [makePage()]);
  const html = files.find((f) => f.path === "test-page.html")!.content;
  assert.ok(html.includes("<style>"));
  assert.ok(!html.includes('rel="stylesheet"'));
  assert.ok(!html.includes("cdn."));
});

test("generated HTML includes prefers-reduced-motion", () => {
  const files = generateStaticSite("tenant1", "roofing", [makePage()]);
  const html = files.find((f) => f.path === "test-page.html")!.content;
  assert.ok(html.includes("prefers-reduced-motion"));
});

test("generated HTML form posts to configurable API URL", () => {
  const files = generateStaticSite("tenant1", "roofing", [makePage()]);
  const html = files.find((f) => f.path === "test-page.html")!.content;
  // Default API URL when env var not set
  assert.ok(html.includes("leados.com/api/intake") || html.includes("action="));
});

test("sitemap contains all page URLs", () => {
  const pages = [makePage(), makePage({ slug: "services", title: "Services", headline: "Our Services" })];
  const files = generateStaticSite("tenant1", "plumbing", pages);
  const sitemap = files.find((f) => f.path === "sitemap.xml")!.content;
  assert.ok(sitemap.includes("<?xml"));
  assert.ok(sitemap.includes("urlset"));
  assert.ok(sitemap.includes("test-page.html"));
  assert.ok(sitemap.includes("services.html"));
  assert.ok(sitemap.includes("<priority>"));
});

test("robots.txt references sitemap", () => {
  const files = generateStaticSite("tenant1", "plumbing", [makePage()]);
  const robots = files.find((f) => f.path === "robots.txt")!.content;
  assert.ok(robots.includes("User-agent: *"));
  assert.ok(robots.includes("Sitemap:"));
  assert.ok(robots.includes("sitemap.xml"));
});

test("index.html contains links to all pages", () => {
  const pages = [makePage(), makePage({ slug: "contact", title: "Contact", headline: "Contact Us" })];
  const files = generateStaticSite("tenant1", "plumbing", pages);
  const index = files.find((f) => f.path === "index.html")!.content;
  assert.ok(index.includes("test-page.html"));
  assert.ok(index.includes("contact.html"));
  assert.ok(index.includes("Test Page"));
  assert.ok(index.includes("Contact"));
});

test("generated HTML includes custom testimonials", () => {
  const page = makePage({
    testimonials: [
      { quote: "Amazing service!", name: "John Doe", role: "CEO" },
    ],
  });
  const files = generateStaticSite("tenant1", "hvac", [page]);
  const html = files.find((f) => f.path === "test-page.html")!.content;
  assert.ok(html.includes("Amazing service!"));
  assert.ok(html.includes("John Doe"));
  assert.ok(html.includes("CEO"));
});

test("generated HTML includes custom FAQ items", () => {
  const page = makePage({
    faqItems: [
      { question: "How much does it cost?", answer: "It depends on your needs." },
    ],
  });
  const files = generateStaticSite("tenant1", "hvac", [page]);
  const html = files.find((f) => f.path === "test-page.html")!.content;
  assert.ok(html.includes("How much does it cost?"));
  assert.ok(html.includes("It depends on your needs."));
});

test("generated HTML includes custom form fields", () => {
  const page = makePage({
    formFields: [
      { name: "company", label: "Company Name", type: "text", required: true, placeholder: "Acme Inc" },
      { name: "budget", label: "Budget", type: "number", required: false },
    ],
  });
  const files = generateStaticSite("tenant1", "consulting", [page]);
  const html = files.find((f) => f.path === "test-page.html")!.content;
  assert.ok(html.includes('name="company"'));
  assert.ok(html.includes("Company Name"));
  assert.ok(html.includes('name="budget"'));
});

test("generated HTML uses custom primary color", () => {
  const page = makePage({ primaryColor: "#ff6600" });
  const files = generateStaticSite("tenant1", "solar", [page]);
  const html = files.find((f) => f.path === "test-page.html")!.content;
  assert.ok(html.includes("#ff6600"));
});

test("generated HTML includes custom schema type", () => {
  const page = makePage({ schemaType: "MedicalBusiness" });
  const files = generateStaticSite("tenant1", "dental", [page]);
  const html = files.find((f) => f.path === "test-page.html")!.content;
  assert.ok(html.includes("MedicalBusiness"));
});

// ---------------------------------------------------------------------------
// Deployment job management (dry-run mode — force by unsetting tokens)
// ---------------------------------------------------------------------------

function withoutGithubToken<T>(fn: () => T): T {
  const saved = process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_TOKEN;
  try {
    return fn();
  } finally {
    if (saved !== undefined) process.env.GITHUB_TOKEN = saved;
    else delete process.env.GITHUB_TOKEN;
  }
}

async function withoutGithubTokenAsync<T>(fn: () => Promise<T>): Promise<T> {
  const saved = process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_TOKEN;
  try {
    return await fn();
  } finally {
    if (saved !== undefined) process.env.GITHUB_TOKEN = saved;
    else delete process.env.GITHUB_TOKEN;
  }
}

async function withoutVercelTokenAsync<T>(fn: () => Promise<T>): Promise<T> {
  const saved = process.env.VERCEL_TOKEN;
  delete process.env.VERCEL_TOKEN;
  try {
    return await fn();
  } finally {
    if (saved !== undefined) process.env.VERCEL_TOKEN = saved;
    else delete process.env.VERCEL_TOKEN;
  }
}

async function withoutCloudflareTokenAsync<T>(fn: () => Promise<T>): Promise<T> {
  const savedToken = process.env.CLOUDFLARE_API_TOKEN;
  const savedAccount = process.env.CLOUDFLARE_ACCOUNT_ID;
  delete process.env.CLOUDFLARE_API_TOKEN;
  delete process.env.CLOUDFLARE_ACCOUNT_ID;
  try {
    return await fn();
  } finally {
    if (savedToken !== undefined) process.env.CLOUDFLARE_API_TOKEN = savedToken;
    else delete process.env.CLOUDFLARE_API_TOKEN;
    if (savedAccount !== undefined) process.env.CLOUDFLARE_ACCOUNT_ID = savedAccount;
    else delete process.env.CLOUDFLARE_ACCOUNT_ID;
  }
}

test("createDeployment creates a job in dry-run mode", async () => {
  const store = _getDeploymentStoreForTesting();
  store.clear();

  const saved = process.env.VERCEL_TOKEN;
  delete process.env.VERCEL_TOKEN;
  try {
    const job = await createDeployment("tenant1", "plumbing", [makePage()], makeTarget());
    assert.ok(job.id.startsWith("deploy-"));
    assert.equal(job.tenantId, "tenant1");
    assert.equal(job.nicheSlug, "plumbing");
    assert.equal(job.status, "live");
    assert.ok(job.liveUrl?.includes("dry-run"));
    assert.ok(job.assets.length > 0);
  } finally {
    if (saved) process.env.VERCEL_TOKEN = saved;
  }
});

test("getDeployment retrieves existing job", async () => {
  const store = _getDeploymentStoreForTesting();
  store.clear();

  const job = await withoutGithubTokenAsync(() =>
    createDeployment("tenant1", "hvac", [makePage()], makeTarget()),
  );
  const retrieved = getDeployment(job.id);
  assert.ok(retrieved);
  assert.equal(retrieved.id, job.id);
  assert.equal(retrieved.nicheSlug, "hvac");
});

test("getDeployment returns undefined for missing job", () => {
  assert.equal(getDeployment("nonexistent-id"), undefined);
});

test("listDeployments filters by tenant", async () => {
  const store = _getDeploymentStoreForTesting();
  store.clear();

  await withoutGithubTokenAsync(async () => {
    await createDeployment("t1", "niche-a", [makePage()], makeTarget());
    await createDeployment("t1", "niche-b", [makePage()], makeTarget());
    await createDeployment("t2", "niche-c", [makePage()], makeTarget());
  });

  const t1Jobs = listDeployments("t1");
  assert.equal(t1Jobs.length, 2);
  assert.ok(t1Jobs.every((j) => j.tenantId === "t1"));

  const t2Jobs = listDeployments("t2");
  assert.equal(t2Jobs.length, 1);
});

test("redeployAssets updates existing deployment", async () => {
  const store = _getDeploymentStoreForTesting();
  store.clear();

  const job = await withoutGithubTokenAsync(() =>
    createDeployment("tenant1", "plumbing", [makePage()], makeTarget()),
  );
  const updated = await withoutGithubTokenAsync(() =>
    redeployAssets(job.id, [
      makePage({ slug: "new-page", title: "New Page", headline: "New" }),
    ]),
  );

  assert.ok(updated);
  assert.equal(updated.status, "live");
  assert.ok(updated.assets.some((a) => a.path === "new-page.html"));
});

test("redeployAssets returns undefined for missing job", async () => {
  const result = await redeployAssets("nonexistent", [makePage()]);
  assert.equal(result, undefined);
});

test("deployment assets include correct types", async () => {
  const store = _getDeploymentStoreForTesting();
  store.clear();

  const job = await withoutGithubTokenAsync(() =>
    createDeployment("tenant1", "legal", [makePage()], makeTarget()),
  );
  assert.ok(job.assets.some((a) => a.type === "sitemap"));
  assert.ok(job.assets.some((a) => a.type === "robots"));
  assert.ok(job.assets.some((a) => a.type === "landing-page"));
});

test("generated HTML escapes HTML entities in user input", () => {
  const page = makePage({
    headline: '<script>alert("xss")</script>',
    title: 'Test & "Quotes"',
  });
  const files = generateStaticSite("tenant1", "test", [page]);
  const html = files.find((f) => f.path === "test-page.html")!.content;
  assert.ok(!html.includes("<script>alert"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("&amp;"));
});

// ---------------------------------------------------------------------------
// Platform selection
// ---------------------------------------------------------------------------

test("createDeployment defaults to vercel platform", async () => {
  const store = _getDeploymentStoreForTesting();
  store.clear();

  const job = await withoutVercelTokenAsync(() =>
    createDeployment("tenant1", "plumbing", [makePage()], makeTarget()),
  );
  assert.equal(job.platform, "vercel");
});

test("createDeployment accepts github-pages platform", async () => {
  const store = _getDeploymentStoreForTesting();
  store.clear();

  const job = await withoutGithubTokenAsync(() =>
    createDeployment("tenant1", "plumbing", [makePage()], makeTarget(), "github-pages"),
  );
  assert.equal(job.platform, "github-pages");
});

test("createDeployment accepts cloudflare platform", async () => {
  const store = _getDeploymentStoreForTesting();
  store.clear();

  const job = await withoutCloudflareTokenAsync(() =>
    createDeployment("tenant1", "plumbing", [makePage()], makeTarget(), "cloudflare"),
  );
  assert.equal(job.platform, "cloudflare");
});

// ---------------------------------------------------------------------------
// Vercel dry-run
// ---------------------------------------------------------------------------

test("deployToVercel returns dry-run URL when VERCEL_TOKEN is not set", async () => {
  const url = await withoutVercelTokenAsync(() =>
    deployToVercel(
      [{ path: "index.html", content: "<html></html>" }],
      "test-project",
    ),
  );
  assert.ok(url.includes("vercel.app"));
  assert.ok(url.includes("dry-run"));
});

test("createDeployment with vercel platform produces vercel.app dry-run URL", async () => {
  const store = _getDeploymentStoreForTesting();
  store.clear();

  const job = await withoutVercelTokenAsync(() =>
    createDeployment("tenant1", "solar", [makePage()], makeTarget(), "vercel"),
  );
  assert.equal(job.status, "live");
  assert.ok(job.liveUrl?.includes("vercel.app"));
  assert.ok(job.liveUrl?.includes("dry-run"));
  assert.ok(job.deploymentUrl?.includes("vercel.app"));
});

// ---------------------------------------------------------------------------
// Cloudflare dry-run
// ---------------------------------------------------------------------------

test("deployToCloudflare returns dry-run URL when CLOUDFLARE_API_TOKEN is not set", async () => {
  const url = await withoutCloudflareTokenAsync(() =>
    deployToCloudflare(
      [{ path: "index.html", content: "<html></html>" }],
      "test-project",
    ),
  );
  assert.ok(url.includes("pages.dev"));
  assert.ok(url.includes("dry-run"));
});

test("createDeployment with cloudflare platform produces pages.dev dry-run URL", async () => {
  const store = _getDeploymentStoreForTesting();
  store.clear();

  const job = await withoutCloudflareTokenAsync(() =>
    createDeployment("tenant1", "roofing", [makePage()], makeTarget(), "cloudflare"),
  );
  assert.equal(job.status, "live");
  assert.ok(job.liveUrl?.includes("pages.dev"));
  assert.ok(job.liveUrl?.includes("dry-run"));
  assert.ok(job.deploymentUrl?.includes("pages.dev"));
});

test("createDeployment with github-pages platform produces github.io dry-run URL", async () => {
  const store = _getDeploymentStoreForTesting();
  store.clear();

  const job = await withoutGithubTokenAsync(() =>
    createDeployment("tenant1", "hvac", [makePage()], makeTarget(), "github-pages"),
  );
  assert.equal(job.status, "live");
  assert.ok(job.liveUrl?.includes("github.io"));
  assert.ok(job.liveUrl?.includes("dry-run"));
});

test("platform is stored on DeploymentJob and survives getDeployment lookup", async () => {
  const store = _getDeploymentStoreForTesting();
  store.clear();

  const platforms: DeploymentPlatform[] = ["vercel", "cloudflare", "github-pages"];
  for (const platform of platforms) {
    const job = await (platform === "vercel"
      ? withoutVercelTokenAsync(() => createDeployment("t-lookup", platform, [makePage()], makeTarget(), platform))
      : platform === "cloudflare"
        ? withoutCloudflareTokenAsync(() => createDeployment("t-lookup", platform, [makePage()], makeTarget(), platform))
        : withoutGithubTokenAsync(() => createDeployment("t-lookup", platform, [makePage()], makeTarget(), platform)));

    const retrieved = getDeployment(job.id);
    assert.ok(retrieved, `should find job for platform ${platform}`);
    assert.equal(retrieved.platform, platform);
  }
});
