// ── Email Verification Page ────────────────────────────────────────────
// GET /verify-email?token=xxx
// Server component that verifies the provider's email from a token link.
// Redirects to dashboard on success, shows error message on failure.

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit-log";

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

  // Look up provider by verification token
  const provider = await prisma.provider.findFirst({
    where: { emailVerifyToken: token },
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
