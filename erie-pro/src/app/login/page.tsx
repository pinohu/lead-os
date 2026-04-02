// ── Login Page ────────────────────────────────────────────────────────
// Simple email/password login for providers and admins.

import type { Metadata } from "next";
import { cityConfig } from "@/lib/city-config";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: `Login | ${cityConfig.name} Provider Portal`,
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Provider Login
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to manage your territory, view leads, and track performance.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
