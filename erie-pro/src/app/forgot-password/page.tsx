// ── Forgot Password Page ──────────────────────────────────────────────
// Allows providers to request a password reset email.

import type { Metadata } from "next";
import { cityConfig } from "@/lib/city-config";
import ForgotPasswordForm from "./forgot-password-form";

export const metadata: Metadata = {
  title: `Forgot Password | ${cityConfig.name} Provider Portal`,
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Reset Your Password
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
