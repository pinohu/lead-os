// ── Provider Dashboard — Profile ──────────────────────────────────────
// Edit business profile, license, insurance, and service area details.

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/profile");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user?.providerId) {
    return (
      <div className="mx-auto max-w-2xl text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          No Provider Account
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your account isn&apos;t linked to a provider profile yet.
        </p>
        <Link
          href="/for-business/claim"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500"
        >
          Claim a Territory
        </Link>
      </div>
    );
  }

  const provider = await prisma.provider.findUnique({
    where: { id: user.providerId },
  });

  if (!provider) return null;

  // Serialize for the client component
  const profileData = {
    businessName: provider.businessName,
    email: provider.email,
    phone: provider.phone,
    website: provider.website ?? "",
    description: provider.description,
    yearEstablished: provider.yearEstablished?.toString() ?? "",
    employeeCount: provider.employeeCount ?? "",
    license: provider.license ?? "",
    insurance: provider.insurance,
    serviceAreas: provider.serviceAreas,
    emailVerified: provider.emailVerified,
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Business Profile
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Update your business information visible to potential customers.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      <ProfileForm profile={profileData} />
    </div>
  );
}
