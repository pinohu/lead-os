import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  serverExternalPackages: ["@prisma/client"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // TODO: Replace 'unsafe-inline' with nonce-based CSP once Next.js nonce infrastructure is configured
              "script-src 'self' 'unsafe-inline' https://js.stripe.com https://*.posthog.com https://*.sentry.io",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://*.stripe.com",
              "connect-src 'self' https://api.stripe.com https://*.posthog.com https://*.sentry.io https://*.ingest.sentry.io",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              "font-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      // Static assets: aggressive caching
      {
        source: "/:path(.+\\.(?:ico|svg|png|jpg|jpeg|webp|avif|woff|woff2|ttf)$)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // SSG pages: cache with revalidation
      {
        source: "/:path*",
        has: [{ type: "header", key: "x-nextjs-data" }],
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600" },
        ],
      },
    ];
  },
};

export default config;
