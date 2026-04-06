// ── Reset Password Page ───────────────────────────────────────────────
// Allows providers to set a new password using a reset token.

import type { Metadata } from "next";
import { cityConfig } from "@/lib/city-config";
import ResetPasswordForm from "./reset-password-form";

export const metadata: Metadata = {
  title: `Reset Password | ${cityConfig.name} Provider Portal`,
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Set New Password
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-600">
            Enter your new password below.
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
