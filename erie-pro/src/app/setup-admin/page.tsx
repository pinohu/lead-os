// ── Admin Bootstrap Setup Page ───────────────────────────────────────
// One-time setup page to create the first admin user.
// Accessible only when NO admin users exist in the database.
// Once an admin is created, this page redirects to /admin.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import SetupForm from "./setup-form";

export const metadata: Metadata = {
  title: "Admin Setup | First-Time Configuration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminSetupPage() {
  // Check if any admin users already exist
  const adminCount = await prisma.user.count({
    where: { role: "admin" },
  });

  // If admins exist, setup is complete — redirect
  if (adminCount > 0) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Warning Banner */}
        <div
          role="alert"
          className="rounded-md border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 p-4"
        >
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                One-Time Setup
              </h3>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                No admin account exists yet. Create the first administrator
                below. This page will be inaccessible once an admin is created.
              </p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Admin Setup
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-600">
            Create the platform administrator account to get started.
          </p>
        </div>

        {/* Form */}
        <SetupForm />
      </div>
    </main>
  );
}
