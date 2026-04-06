// ── API Documentation ────────────────────────────────────────────────
// Static page documenting the inbound webhook API, embed widget, and
// outbound webhooks for integrators.

import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cityConfig } from "@/lib/city-config";

export const metadata: Metadata = {
  title: `API Documentation | ${cityConfig.domain}`,
  description: "Developer documentation for the Erie Pro lead intake API, embed widget, and outbound webhooks.",
};

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="rounded-lg border bg-gray-950 text-gray-100 overflow-x-auto">
      {title && (
        <div className="border-b border-gray-800 px-4 py-2 text-xs font-medium text-gray-600">
          {title}
        </div>
      )}
      <pre className="p-4 text-sm leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export default function ApiDocsPage() {
  const baseUrl = `https://${cityConfig.domain}`;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-10">
      {/* ── Header ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            API Documentation
          </h1>
          <Badge variant="secondary">v1</Badge>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Integrate with {cityConfig.domain} to submit leads programmatically,
          receive real-time webhook notifications, and embed our lead capture
          widget on your site.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/dashboard/integrations"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Manage API Keys &rarr;
          </Link>
          <Link
            href="/dashboard/webhooks"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Configure Webhooks &rarr;
          </Link>
        </div>
      </div>

      {/* ── 1. Authentication ────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">1. Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            All API requests require an API key sent via the{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">X-API-Key</code>{" "}
            header. Generate your API key from the{" "}
            <Link href="/dashboard/integrations" className="text-blue-600 hover:underline">
              Integrations dashboard
            </Link>.
          </p>
          <CodeBlock title="Header">{`X-API-Key: your_api_key_here`}</CodeBlock>
          <p className="text-sm text-muted-foreground">
            API keys are hashed before storage. If you lose your key, generate a
            new one. Rate limit: 60 requests per minute per key.
          </p>
        </CardContent>
      </Card>

      {/* ── 2. Inbound Lead Endpoint ─────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">2. Submit a Lead</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              POST
            </Badge>
            <code className="text-sm font-mono text-gray-900 dark:text-gray-100">
              {baseUrl}/api/leads/inbound
            </code>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
              Request Body
            </h3>
            <CodeBlock title="JSON Schema">{`{
  "name": "string (required) — Full name of the lead",
  "email": "string (required) — Email address",
  "phone": "string (optional) — Phone number",
  "service": "string (optional) — Service niche slug (e.g., 'plumbing')",
  "message": "string (optional) — Additional details",
  "source": "string (optional) — Lead source identifier (default: 'api')"
}`}</CodeBlock>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
              Response Format
            </h3>
            <CodeBlock title="Success (200)">{`{
  "success": true,
  "data": {
    "leadId": "clxyz123abc",
    "niche": "plumbing",
    "routeType": "primary",
    "statusToken": "uuid-for-tracking"
  }
}`}</CodeBlock>
            <div className="mt-2">
              <CodeBlock title="Error (400/401/429)">{`{
  "success": false,
  "error": "Description of the error"
}`}</CodeBlock>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Code Examples ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">3. Code Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
              cURL
            </h3>
            <CodeBlock title="Shell">{`curl -X POST ${baseUrl}/api/leads/inbound \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your_api_key_here" \\
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "814-555-0123",
    "service": "plumbing",
    "message": "Leaky faucet in kitchen"
  }'`}</CodeBlock>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
              JavaScript (fetch)
            </h3>
            <CodeBlock title="JavaScript">{`const response = await fetch("${baseUrl}/api/leads/inbound", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "your_api_key_here",
  },
  body: JSON.stringify({
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "814-555-0123",
    service: "plumbing",
    message: "Leaky faucet in kitchen",
  }),
});

const data = await response.json();
console.log(data);`}</CodeBlock>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
              Python (requests)
            </h3>
            <CodeBlock title="Python">{`import requests

response = requests.post(
    "${baseUrl}/api/leads/inbound",
    headers={
        "Content-Type": "application/json",
        "X-API-Key": "your_api_key_here",
    },
    json={
        "name": "Jane Smith",
        "email": "jane@example.com",
        "phone": "814-555-0123",
        "service": "plumbing",
        "message": "Leaky faucet in kitchen",
    },
)

print(response.json())`}</CodeBlock>
          </div>
        </CardContent>
      </Card>

      {/* ── 4. Embed Widget ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">4. Embed Widget</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add the Erie Pro lead capture widget to any website with a single
            script tag. The widget renders a contact form that submits leads
            directly to your account.
          </p>
          <CodeBlock title="HTML">{`<!-- Add before </body> -->
<script
  src="${baseUrl}/embed/widget.js"
  data-api-key="your_api_key_here"
  data-niche="plumbing"
  data-theme="light"
  async
></script>`}</CodeBlock>
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
              Widget Options
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Attribute</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Required</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/40">
                    <td className="px-3 py-2 font-mono text-xs">data-api-key</td>
                    <td className="px-3 py-2">Yes</td>
                    <td className="px-3 py-2">Your API key</td>
                  </tr>
                  <tr className="border-b border-border/40">
                    <td className="px-3 py-2 font-mono text-xs">data-niche</td>
                    <td className="px-3 py-2">No</td>
                    <td className="px-3 py-2">Pre-select a service niche</td>
                  </tr>
                  <tr className="border-b border-border/40">
                    <td className="px-3 py-2 font-mono text-xs">data-theme</td>
                    <td className="px-3 py-2">No</td>
                    <td className="px-3 py-2">&quot;light&quot; or &quot;dark&quot; (default: light)</td>
                  </tr>
                  <tr className="border-b border-border/40">
                    <td className="px-3 py-2 font-mono text-xs">data-position</td>
                    <td className="px-3 py-2">No</td>
                    <td className="px-3 py-2">&quot;bottom-right&quot; or &quot;bottom-left&quot;</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 5. Outbound Webhooks ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">5. Outbound Webhooks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure webhook endpoints in your{" "}
            <Link href="/dashboard/webhooks" className="text-blue-600 hover:underline">
              Webhooks dashboard
            </Link>{" "}
            to receive real-time notifications when events occur.
          </p>

          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
              Available Events
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Event</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/40">
                    <td className="px-3 py-2 font-mono text-xs">lead.created</td>
                    <td className="px-3 py-2">A new lead has been captured</td>
                  </tr>
                  <tr className="border-b border-border/40">
                    <td className="px-3 py-2 font-mono text-xs">lead.routed</td>
                    <td className="px-3 py-2">A lead has been routed to a provider</td>
                  </tr>
                  <tr className="border-b border-border/40">
                    <td className="px-3 py-2 font-mono text-xs">lead.outcome</td>
                    <td className="px-3 py-2">Lead outcome recorded (responded, converted, etc.)</td>
                  </tr>
                  <tr className="border-b border-border/40">
                    <td className="px-3 py-2 font-mono text-xs">provider.sla_warning</td>
                    <td className="px-3 py-2">Provider approaching SLA deadline</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
              Payload Format
            </h3>
            <CodeBlock title="Webhook Payload">{`{
  "event": "lead.created",
  "timestamp": "2026-04-03T14:30:00Z",
  "data": {
    "leadId": "clxyz123abc",
    "niche": "plumbing",
    "city": "erie",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "814-555-0123",
    "source": "api",
    "routeType": "primary"
  }
}`}</CodeBlock>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
              HMAC Verification
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Each webhook request includes an{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">X-Webhook-Signature</code>{" "}
              header containing an HMAC-SHA256 signature. Verify it against your
              webhook secret to ensure the request is authentic.
            </p>
            <CodeBlock title="Node.js Verification">{`import crypto from "crypto";

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// In your webhook handler:
const isValid = verifyWebhook(
  JSON.stringify(req.body),
  req.headers["x-webhook-signature"],
  process.env.WEBHOOK_SECRET
);

if (!isValid) {
  return res.status(401).json({ error: "Invalid signature" });
}`}</CodeBlock>
          </div>
        </CardContent>
      </Card>

      {/* ── Footer ───────────────────────────────────────────── */}
      <div className="border-t pt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Need help integrating? Contact{" "}
          <Link href="/contact" className="text-blue-600 hover:underline">
            our team
          </Link>{" "}
          or visit the{" "}
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            provider dashboard
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
