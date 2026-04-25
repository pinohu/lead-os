// ── Email Verification Page ────────────────────────────────────────────
// GET /verify-email?token=xxx
// Server component that verifies the provider's email from a token link.
// Redirects to dashboard on success, shows error message on failure.
//
// Tokens are stored as SHA-256 hashes at rest (see src/lib/verification-token.ts
// and the Stripe webhook that seeds them). We hash the URL-supplied token the
// same way before looking it up so a DB-read attacker can't replay raw tokens.

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit-log";
import { hashVerificationToken } from "@/lib/verification-token";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token || token.length > 256) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg border p-8 text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">Invalid Link</h1>
          <p className="text-gray-600">This verification link is invalid or has expired. Please request a new verification email from your dashboard.</p>
        </div>
      </main>
    );
  }

  // Look up provider by verification token (hashed at rest)
  const hashedToken = hashVerificationToken(token);
  const provider = await prisma.provider.findFirst({
    where: { emailVerifyToken: hashedToken },
    select: { id: true, email: true, emailVerified: true },
  });

  if (!provider) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg border p-8 text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">Invalid Token</h1>
          <p className="text-gray-600">This verification token was not found. It may have already been used or expired.</p>
        </div>
      </main>
    );
  }

  // Already verified — just redirect
  if (provider.emailVerified) {
    redirect("/dashboard?verified=already");
  }

  // Mark as verified and clear token
  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      emailVerified: true,
      emailVerifyToken: null,
    },
  });

  await audit({
    action: "provider.email_verified",
    entityType: "provider",
    entityId: provider.id,
    providerId: provider.id,
  });

  redirect("/dashboard?verified=success");
}
