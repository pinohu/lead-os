// ── Site URL Resolution ──────────────────────────────────────────────
// Single source of truth for resolving the site's public base URL.
// Checks multiple env vars in priority order, with localhost fallback
// restricted to development builds only.

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return process.env.NODE_ENV === "production"
    ? "https://leadgen-os.com"
    : "http://localhost:3000";
}
