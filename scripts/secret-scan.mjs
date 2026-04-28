import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const ignoredDirs = new Set([
  ".git",
  ".next",
  ".open-next",
  ".vercel",
  ".wrangler",
  "coverage",
  "node_modules",
  "_n8n_sources",
]);

const ignoredFiles = new Set([
  "package-lock.json",
  "LeadOS-Master-Config.xlsx",
]);

const binaryExtensions = new Set([
  ".avif",
  ".docx",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".pdf",
  ".png",
  ".pptx",
  ".webp",
  ".xls",
  ".xlsx",
]);

const findings = [];

const patterns = [
  {
    name: "private key block",
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
  },
  {
    name: "AWS access key",
    regex: /AKIA[0-9A-Z]{16}/g,
  },
  {
    name: "Stripe secret key",
    regex: /sk_(?:live|test)_[A-Za-z0-9]{20,}/g,
  },
  {
    name: "Stripe webhook secret",
    regex: /whsec_[A-Za-z0-9]{20,}/g,
  },
  {
    name: "Slack token",
    regex: /xox[baprs]-[A-Za-z0-9-]{20,}/g,
  },
  {
    name: "Discord webhook URL",
    regex: /https:\/\/(?:canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9._-]+/g,
  },
  {
    name: "Make webhook URL",
    regex: /https:\/\/hook\.us\d+\.make\.com\/[A-Za-z0-9_-]+/g,
  },
  {
    name: "hardcoded provider env fallback",
    regex: /\b(?:MAKE|DISCORD|EMAILIT|AITABLE|WBIZTOOL|TELEGRAM|OPENAI|STRIPE|SLACK|GITHUB|SUPABASE|SENDGRID|RESEND|MAILGUN|TWILIO)[A-Z0-9_]*(?:TOKEN|SECRET|API_KEY|WEBHOOK)[A-Z0-9_]*\b\s*(?:\|\||=)\s*["'][^"'\s]{20,}["']/g,
  },
  {
    name: "Emailit API key",
    regex: /secret_[A-Za-z0-9]{20,}/g,
  },
  {
    name: "AITable API token",
    regex: /\busk[A-Za-z0-9]{20,}\b/g,
  },
  {
    name: "Telegram bot token",
    regex: /\b\d{8,10}:AA[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    name: "hardcoded provider token",
    regex: /\b(?:apiKey|apiToken|accessToken|authToken|botToken)\b\s*[:=]\s*["'][^"'\s]{20,}["']/gi,
  },
  {
    name: "hardcoded UUID token assignment",
    regex: /\b(?:API_TOKEN|MAKE_API_TOKEN|apiToken|authToken|accessToken|token)\b\s*[:=]\s*["'][0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}["']/gi,
  },
  {
    name: "Postgres URL with password",
    regex: /postgres(?:ql)?:\/\/[^\s:'"]+:[^\s@'"]+@[^\s'"]+/g,
  },
];

function shouldIgnoreFile(path) {
  const lower = path.toLowerCase();
  if (ignoredFiles.has(path)) return true;
  for (const ext of binaryExtensions) {
    if (lower.endsWith(ext)) return true;
  }
  return false;
}

function isKnownPlaceholder(line) {
  return (
    /dummy|example|sample|placeholder|changeme|not-used-at-runtime|for_build_only/i.test(line) ||
    /replace[_-]?me|your[_-]|__set_|<[^>]+>/i.test(line) ||
    /localhost|127\.0\.0\.1|postgres:postgres|user:pass|user:password|username:password|password@/i.test(line) ||
    /POSTGRES_PASSWORD|lead_os_dev_password/i.test(line)
  );
}

function scanFile(path) {
  const text = readFileSync(path, "utf8");
  const lines = text.split(/\r?\n/);

  for (const { name, regex } of patterns) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(text))) {
      const lineNumber = text.slice(0, match.index).split(/\r?\n/).length;
      const line = lines[lineNumber - 1] ?? "";
      if (isKnownPlaceholder(line)) continue;

      findings.push({
        name,
        path: relative(repoRoot, path).replaceAll("\\", "/"),
        line: lineNumber,
      });
    }
  }
}

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name)) continue;
      walk(join(dir, entry.name));
      continue;
    }

    if (!entry.isFile()) continue;

    const path = join(dir, entry.name);
    const relativePath = relative(repoRoot, path).replaceAll("\\", "/");
    if (shouldIgnoreFile(relativePath)) continue;

    const { size } = statSync(path);
    if (size > 2_000_000) continue;

    try {
      scanFile(path);
    } catch (error) {
      findings.push({
        name: `unreadable file: ${error.message}`,
        path: relativePath,
        line: 0,
      });
    }
  }
}

walk(repoRoot);

if (findings.length > 0) {
  console.error("Potential secret material found:");
  for (const finding of findings) {
    console.error(`- ${finding.path}:${finding.line} ${finding.name}`);
  }
  process.exit(1);
}

console.log("Secret scan passed.");
