import { NextResponse } from "next/server";
import { processUnsubscribe } from "@/lib/email-sender";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");
  const tenant = url.searchParams.get("tenant");
  const token = url.searchParams.get("token");

  if (!email || !tenant) {
    return new NextResponse(renderPage("Invalid Request", "Missing required parameters. Please use the unsubscribe link from your email."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const expectedToken = simpleHash(email + tenant);
  if (token !== expectedToken) {
    return new NextResponse(renderPage("Invalid Request", "The unsubscribe link is invalid or has expired. Please use the link from your most recent email."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    await processUnsubscribe(email, tenant);

    return new NextResponse(renderPage("Unsubscribed Successfully", `<strong>${escapeHtml(email)}</strong> has been removed from our mailing list. You will no longer receive emails from us. If this was a mistake, please contact support.`), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch {
    return new NextResponse(renderPage("Something Went Wrong", "We could not process your unsubscribe request. Please try again or contact support."), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<style>
body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f4f4f7;display:flex;justify-content:center;align-items:center;min-height:100vh;}
.card{max-width:480px;padding:48px;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);text-align:center;margin:24px;}
h1{margin:0 0 16px;font-size:24px;color:#111827;}
p{margin:0;font-size:16px;line-height:1.6;color:#6b7280;}
@media(prefers-reduced-motion:reduce){*{animation-duration:0.01ms !important;transition-duration:0.01ms !important;}}
</style>
</head>
<body>
<main class="card" role="main">
<h1>${escapeHtml(title)}</h1>
<p>${message}</p>
</main>
</body>
</html>`;
}
