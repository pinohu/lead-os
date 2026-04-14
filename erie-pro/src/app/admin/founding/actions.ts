"use server";

// ── Admin server actions for /admin/founding ──────────────────────
// All actions:
//  - require admin session
//  - write to the Setting table via setSetting
//  - revalidate /pros so the homepage + landing page pick up changes

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getFoundingOffer } from "@/lib/founding-offer";
import { setSetting, SETTING_KEYS } from "@/lib/settings";

async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/founding");
  if ((session.user as { role?: string }).role !== "admin") {
    redirect("/dashboard");
  }
  return session.user.email ?? "unknown";
}

function parseInt0(raw: FormDataEntryValue | null, fallback: number): number {
  if (typeof raw !== "string") return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

function refreshPublic() {
  revalidatePath("/pros");
  revalidatePath("/");
}

export async function incrementFoundingClaimed(formData: FormData) {
  const admin = await requireAdmin();
  const current = await getFoundingOffer();
  const next = Math.min(current.claimedSlots + 1, current.totalSlots);

  await setSetting(SETTING_KEYS.foundingClaimed, next, admin);
  await prisma.auditLog.create({
    data: {
      action: "founding.increment_claimed",
      entityType: "setting",
      entityId: SETTING_KEYS.foundingClaimed,
      metadata: {
        from: current.claimedSlots,
        to: next,
        total: current.totalSlots,
        by: admin,
      },
    },
  });

  refreshPublic();
  // Keep the admin on the page with fresh state.
  redirect("/admin/founding");
  // Silence unused warning for formData; we may reference it later.
  void formData;
}

export async function saveFoundingOffer(formData: FormData) {
  const admin = await requireAdmin();
  const current = await getFoundingOffer();

  const claimedSlots = parseInt0(formData.get("claimedSlots"), current.claimedSlots);
  const totalSlots = parseInt0(formData.get("totalSlots"), current.totalSlots);
  const price = parseInt0(formData.get("price"), current.price);
  const normalPrice = parseInt0(formData.get("normalPrice"), current.normalPrice);
  const lockMonths = parseInt0(formData.get("lockMonths"), current.lockMonths);

  // Enforce sane bounds
  const safeTotal = Math.max(1, totalSlots);
  const safeClaimed = Math.max(0, Math.min(claimedSlots, safeTotal));
  const safePrice = Math.max(0, price);
  const safeNormal = Math.max(0, normalPrice);
  const safeLock = Math.max(1, Math.min(lockMonths, 60));

  await Promise.all([
    setSetting(SETTING_KEYS.foundingClaimed, safeClaimed, admin),
    setSetting(SETTING_KEYS.foundingTotal, safeTotal, admin),
    setSetting(SETTING_KEYS.foundingPrice, safePrice, admin),
    setSetting(SETTING_KEYS.foundingNormalPrice, safeNormal, admin),
    setSetting(SETTING_KEYS.foundingLockMonths, safeLock, admin),
  ]);

  await prisma.auditLog.create({
    data: {
      action: "founding.save",
      entityType: "setting",
      entityId: "founding.*",
      metadata: {
        claimedSlots: safeClaimed,
        totalSlots: safeTotal,
        price: safePrice,
        normalPrice: safeNormal,
        lockMonths: safeLock,
        by: admin,
      },
    },
  });

  refreshPublic();
  redirect("/admin/founding");
}

export async function resetFoundingOfferToEnv(formData: FormData) {
  const admin = await requireAdmin();

  await prisma.setting.deleteMany({
    where: {
      key: {
        in: [
          SETTING_KEYS.foundingClaimed,
          SETTING_KEYS.foundingTotal,
          SETTING_KEYS.foundingPrice,
          SETTING_KEYS.foundingNormalPrice,
          SETTING_KEYS.foundingLockMonths,
        ],
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "founding.reset_to_env",
      entityType: "setting",
      entityId: "founding.*",
      metadata: { by: admin },
    },
  });

  refreshPublic();
  redirect("/admin/founding");
  void formData;
}
