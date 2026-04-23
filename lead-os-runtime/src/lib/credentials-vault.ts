import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CredentialEntry {
  id: string;
  tenantId: string;
  provider: string;
  credentialType: "api-key" | "oauth-token" | "webhook-url" | "login";
  encryptedCredentials: string;
  iv: string;
  authTag: string;
  status: "active" | "expired" | "revoked";
  lastVerified?: string;
  capabilities: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CredentialPublic {
  id: string;
  tenantId: string;
  provider: string;
  credentialType: "api-key" | "oauth-token" | "webhook-url" | "login";
  status: "active" | "expired" | "revoked";
  lastVerified?: string;
  capabilities: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProviderDefinition {
  provider: string;
  category: string;
  fields: string[];
  enables: string[];
}

// ---------------------------------------------------------------------------
// Provider Catalog
// ---------------------------------------------------------------------------

export const PROVIDER_CATALOG: ProviderDefinition[] = [
  { provider: "github", category: "deployment", fields: ["token"], enables: ["auto-deploy", "repo-creation"] },
  { provider: "emailit", category: "communication", fields: ["api_key"], enables: ["email-sending", "email-tracking"] },
  { provider: "stripe", category: "billing", fields: ["secret_key", "webhook_secret"], enables: ["billing", "checkout"] },
  { provider: "openai", category: "ai", fields: ["api_key"], enables: ["ai-scoring", "ai-chat", "ai-copy"] },
  { provider: "anthropic", category: "ai", fields: ["api_key"], enables: ["ai-scoring", "ai-chat", "ai-copy"] },
  { provider: "suitedash", category: "crm", fields: ["api_key", "base_url"], enables: ["crm-sync", "client-portal"] },
  { provider: "wbiztool", category: "communication", fields: ["api_key", "phone_number_id"], enables: ["whatsapp-messaging"] },
  { provider: "easy_text_marketing", category: "sms", fields: ["api_key"], enables: ["sms-sending"] },
  { provider: "insighto", category: "ai", fields: ["api_key", "bot_id"], enables: ["ai-chatbot"] },
  { provider: "thoughtly", category: "ai-voice", fields: ["api_key"], enables: ["voice-agents"] },
  { provider: "trafft", category: "scheduling", fields: ["api_key"], enables: ["booking"] },
  { provider: "lunacal", category: "scheduling", fields: ["api_key"], enables: ["scheduling"] },
  { provider: "documentero", category: "documents", fields: ["api_key"], enables: ["document-generation"] },
  { provider: "crove", category: "documents", fields: ["api_key"], enables: ["document-generation"] },
  { provider: "partnero", category: "growth", fields: ["api_key"], enables: ["referral-program"] },
  { provider: "discord", category: "alerts", fields: ["webhook_url"], enables: ["alerts"] },
  { provider: "telegram", category: "alerts", fields: ["bot_token", "chat_id"], enables: ["alerts"] },
  { provider: "aitable", category: "data", fields: ["api_key", "base_id"], enables: ["data-persistence"] },
  { provider: "agenticflow", category: "automation", fields: ["api_key"], enables: ["ai-workflows"] },
  { provider: "activepieces", category: "automation", fields: ["api_key", "base_url"], enables: ["automation"] },
  { provider: "electroneek", category: "automation", fields: ["api_key"], enables: ["rpa-automation"] },
  { provider: "boost_space", category: "data", fields: ["api_key"], enables: ["data-sync"] },
  { provider: "konnectzit", category: "automation", fields: ["api_key"], enables: ["integrations"] },
  { provider: "n8n", category: "automation", fields: ["api_key", "base_url"], enables: ["workflow-automation"] },
  { provider: "vercel", category: "deployment", fields: ["token"], enables: ["deployment"] },
  { provider: "cloudflare", category: "deployment", fields: ["api_token", "account_id"], enables: ["deployment", "dns"] },
  { provider: "google_analytics", category: "analytics", fields: ["measurement_id", "api_secret"], enables: ["analytics"] },
  { provider: "writerzen", category: "content", fields: ["api_key"], enables: ["seo-content"] },
  { provider: "fliki", category: "content", fields: ["api_key"], enables: ["video-generation"] },
  { provider: "vadoo", category: "content", fields: ["api_key"], enables: ["video-generation"] },
  { provider: "brilliant_directories", category: "content", fields: ["api_key", "site_url"], enables: ["directory"] },
  { provider: "brizy", category: "page-builder", fields: ["api_key"], enables: ["page-builder"] },
  { provider: "claspo", category: "conversion-optimization", fields: ["api_key"], enables: ["popups-widgets"] },
  { provider: "plerdy", category: "analytics", fields: ["api_key"], enables: ["heatmaps-analytics"] },
  { provider: "salespanel", category: "analytics", fields: ["api_key"], enables: ["visitor-tracking"] },
  { provider: "happierleads", category: "analytics", fields: ["api_key"], enables: ["b2b-leads"] },
  { provider: "chargebee", category: "billing", fields: ["api_key", "site"], enables: ["subscription-billing"] },
  { provider: "callscaler", category: "communication", fields: ["api_key"], enables: ["call-tracking"] },
  { provider: "ad_alchemy", category: "marketing", fields: ["api_key"], enables: ["ai-ads"] },
  { provider: "quickads", category: "marketing", fields: ["api_key"], enables: ["ai-ads"] },
  { provider: "more_good_reviews", category: "marketing", fields: ["api_key"], enables: ["review-management"] },
  { provider: "castmagic", category: "content", fields: ["api_key"], enables: ["content-repurposing"] },
  { provider: "databar", category: "data", fields: ["api_key"], enables: ["data-enrichment"] },
  { provider: "hexomatic", category: "data", fields: ["api_key"], enables: ["web-scraping"] },
  { provider: "nytro_seo", category: "marketing", fields: ["api_key"], enables: ["seo-automation"] },
  { provider: "pickaxe", category: "ai-chatbot", fields: ["api_key"], enables: ["ai-chatbot", "lead-qualification"] },
  { provider: "meiro", category: "ai-video", fields: ["api_key"], enables: ["ai-avatar-video", "text-to-speech"] },
  { provider: "salesnexus", category: "crm", fields: ["api_key", "base_url"], enables: ["crm-sync", "pipeline-tracking", "email-automation"] },
  { provider: "sinosend", category: "email", fields: ["api_key"], enables: ["email-campaigns", "email-sequences"] },
  { provider: "zebracat", category: "ai-video", fields: ["api_key"], enables: ["ai-video-creation"] },
  { provider: "gumlet", category: "video-hosting", fields: ["api_key"], enables: ["video-hosting", "video-analytics"] },
  { provider: "firecrawl", category: "web-scraping", fields: ["api_key"], enables: ["web-scraping", "lead-enrichment"] },
  { provider: "grapesjs", category: "page-builder", fields: ["api_key"], enables: ["page-builder", "landing-pages"] },
  { provider: "formbricks", category: "forms", fields: ["api_key"], enables: ["surveys", "lead-qualification"] },
  { provider: "umami", category: "analytics", fields: ["api_key"], enables: ["privacy-analytics", "lead-tracking"] },
  { provider: "langchain", category: "ai-content", fields: ["api_key"], enables: ["ai-email-generation", "ai-content-generation", "ai-chat", "lead-qualification"] },
  { provider: "skyvern", category: "browser-automation", fields: ["api_key"], enables: ["browser-automation", "linkedin-scraping", "form-filling", "directory-scraping"] },
  { provider: "hosted_runtime", category: "hosting", fields: ["api_key", "base_url"], enables: ["subdomain-hosting", "site-deployment", "cdn"] },
  { provider: "embed_widgets", category: "widgets", fields: ["api_key"], enables: ["chat-widget", "form-widget", "popup-widget", "wordpress-plugin"] },
  { provider: "flow_forge", category: "workflow", fields: ["api_key", "base_url"], enables: ["lead-workflows", "lead-routing", "lead-nurture"] },
  { provider: "n8n_enhanced", category: "automation", fields: ["api_key", "base_url"], enables: ["enhanced-n8n", "workflow-automation", "workflow-import"] },
  { provider: "authority_blueprint", category: "content", fields: ["api_key"], enables: ["authority-sites", "seo-pages", "niche-templates"] },
  { provider: "firecrawl-mcp", category: "mcp-tools", fields: ["api_key"], enables: ["mcp-scrape", "mcp-crawl", "mcp-search", "mcp-map", "mcp-interact", "mcp-agent", "prospect-discovery", "deep-enrichment"] },
  { provider: "paperclip", category: "agent-orchestration", fields: ["api_key"], enables: ["agent-management", "task-execution", "budget-control", "org-chart"] },
];

// ---------------------------------------------------------------------------
// Encryption helpers
// ---------------------------------------------------------------------------

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

function deriveKey(passphrase: string): Buffer {
  return scryptSync(passphrase, "lead-os-vault-salt", KEY_LENGTH);
}

function getEncryptionKey(): Buffer {
  const envKey = process.env.CREDENTIALS_ENCRYPTION_KEY;

  if (envKey) {
    return deriveKey(envKey);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY environment variable is required in production. " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }

  // Development only: derive a key from a hash so no static secret sits in source
  const devKey = createHash("sha256")
    .update("lead-os-dev-only-credential-vault-derivation-input")
    .digest("hex");
  return deriveKey(devKey);
}

export function encryptValue(plaintext: string): { encrypted: string; iv: string; authTag: string } {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return { encrypted, iv: iv.toString("hex"), authTag };
}

export function decryptValue(encrypted: string, ivHex: string, authTagHex: string): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const credentialStore = new Map<string, CredentialEntry>();

function generateId(): string {
  return `cred-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function storeKey(tenantId: string, provider: string): string {
  return `${tenantId}::${provider}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function storeCredential(
  tenantId: string,
  provider: string,
  credentialType: CredentialEntry["credentialType"],
  credentials: Record<string, string>,
): CredentialPublic {
  const catalogEntry = PROVIDER_CATALOG.find((p) => p.provider === provider);
  if (!catalogEntry) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  const missingFields = catalogEntry.fields.filter((f) => !credentials[f]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields for ${provider}: ${missingFields.join(", ")}`);
  }

  const plaintext = JSON.stringify(credentials);
  const { encrypted, iv, authTag } = encryptValue(plaintext);
  const now = new Date().toISOString();

  const existing = credentialStore.get(storeKey(tenantId, provider));

  const entry: CredentialEntry = {
    id: existing?.id ?? generateId(),
    tenantId,
    provider,
    credentialType,
    encryptedCredentials: encrypted,
    iv,
    authTag,
    status: "active",
    capabilities: catalogEntry.enables,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  credentialStore.set(storeKey(tenantId, provider), entry);
  return toPublic(entry);
}

export function getCredential(tenantId: string, provider: string): Record<string, string> | undefined {
  const entry = credentialStore.get(storeKey(tenantId, provider));
  if (!entry || entry.status === "revoked") return undefined;

  const decrypted = decryptValue(entry.encryptedCredentials, entry.iv, entry.authTag);
  return JSON.parse(decrypted) as Record<string, string>;
}

export function getCredentialPublic(tenantId: string, provider: string): CredentialPublic | undefined {
  const entry = credentialStore.get(storeKey(tenantId, provider));
  if (!entry) return undefined;
  return toPublic(entry);
}

export function listCredentials(tenantId: string): CredentialPublic[] {
  return [...credentialStore.values()]
    .filter((e) => e.tenantId === tenantId)
    .map(toPublic)
    .sort((a, b) => a.provider.localeCompare(b.provider));
}

export function deleteCredential(tenantId: string, provider: string): boolean {
  return credentialStore.delete(storeKey(tenantId, provider));
}

export async function verifyCredential(tenantId: string, provider: string): Promise<{ valid: boolean; message: string }> {
  const creds = getCredential(tenantId, provider);
  if (!creds) {
    return { valid: false, message: "Credential not found or revoked" };
  }

  const entry = credentialStore.get(storeKey(tenantId, provider));

  try {
    const result = await runProviderHealthCheck(provider, creds);
    if (entry) {
      entry.lastVerified = new Date().toISOString();
      entry.status = result.valid ? "active" : "expired";
    }
    return result;
  } catch (err) {
    if (entry) {
      entry.lastVerified = new Date().toISOString();
    }
    return { valid: false, message: err instanceof Error ? err.message : "Verification failed" };
  }
}

export function getAvailableProviders(): ProviderDefinition[] {
  return PROVIDER_CATALOG;
}

export function getEnabledCapabilities(tenantId: string): string[] {
  const capabilities = new Set<string>();
  for (const entry of credentialStore.values()) {
    if (entry.tenantId === tenantId && entry.status === "active") {
      for (const cap of entry.capabilities) {
        capabilities.add(cap);
      }
    }
  }
  return [...capabilities].sort();
}

// ---------------------------------------------------------------------------
// Provider health checks
// ---------------------------------------------------------------------------

async function runProviderHealthCheck(provider: string, creds: Record<string, string>): Promise<{ valid: boolean; message: string }> {
  switch (provider) {
    case "github": {
      const resp = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${creds.token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      return resp.ok
        ? { valid: true, message: "GitHub token is valid" }
        : { valid: false, message: `GitHub returned ${resp.status}` };
    }
    case "openai": {
      const resp = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${creds.api_key}` },
      });
      return resp.ok
        ? { valid: true, message: "OpenAI key is valid" }
        : { valid: false, message: `OpenAI returned ${resp.status}` };
    }
    case "anthropic": {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": creds.api_key,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1, messages: [{ role: "user", content: "hi" }] }),
      });
      return resp.ok || resp.status === 400
        ? { valid: true, message: "Anthropic key is valid" }
        : { valid: false, message: `Anthropic returned ${resp.status}` };
    }
    case "vercel": {
      const resp = await fetch("https://api.vercel.com/v2/user", {
        headers: { Authorization: `Bearer ${creds.token}` },
      });
      return resp.ok
        ? { valid: true, message: "Vercel token is valid" }
        : { valid: false, message: `Vercel returned ${resp.status}` };
    }
    case "stripe": {
      const resp = await fetch("https://api.stripe.com/v1/balance", {
        headers: { Authorization: `Bearer ${creds.secret_key}` },
      });
      return resp.ok
        ? { valid: true, message: "Stripe key is valid" }
        : { valid: false, message: `Stripe returned ${resp.status}` };
    }
    default:
      return { valid: true, message: `No health check implemented for ${provider}; credential stored successfully` };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toPublic(entry: CredentialEntry): CredentialPublic {
  return {
    id: entry.id,
    tenantId: entry.tenantId,
    provider: entry.provider,
    credentialType: entry.credentialType,
    status: entry.status,
    lastVerified: entry.lastVerified,
    capabilities: entry.capabilities,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Testing helpers
// ---------------------------------------------------------------------------

export function _getCredentialStoreForTesting(): Map<string, CredentialEntry> {
  return credentialStore;
}
