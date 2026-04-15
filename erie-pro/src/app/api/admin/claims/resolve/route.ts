// -- Admin Claim Resolution API -----------------------------------------------
// POST /api/admin/claims/resolve -- Approve or reject a provider's ownership claim.
// Protected by session-based admin role check.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit-log";
import { requireAdminSession } from "@/lib/require-admin";
import { logger } from "@/lib/logger";
import { sendEmail, escapeHtml } from "@/lib/email";

const ResolveSchema = z.object({
  providerId: z.string().min(1, "Provider ID is required"),
  status: z.enum(["admin_approved", "rejected"], {
    error: "Status must be 'admin_approved' or 'rejected'",
  }),
});

export async function POST(req: NextRequest) {
  // Admin auth guard
  const authResult = await requireAdminSession();
  if (!authResult.ok) return authResult.response;
  const { session } = authResult;

  try {
    // Support both JSON and form-encoded bodies (form submissions from admin page)
    let data: Record<string, unknown>;
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      data = await req.json().catch(() => ({}));
    } else {
      const formData = await req.formData().catch(() => null);
      if (!formData) {
        return NextResponse.json(
          { success: false, error: "Invalid request body" },
          { status: 400 }
        );
      }
      data = Object.fromEntries(formData.entries());
    }

    const parsed = ResolveSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((e) => e.message).join("; ") },
        { status: 400 }
      );
    }

    const { providerId, status } = parsed.data;

    // Atomic claim on the resolvable states ("unverified" / "pending").
    // The previous pattern was findUnique → check → update, a TOCTOU
    // window where two admins clicking approve/reject at the same
    // moment both read `pending`, both passed the eligibility gate,
    // and both wrote — the second write silently clobbered the first,
    // BOTH audit rows fired, and the decided state depended on who
    // won the DB race. Collapsing the check into updateMany's WHERE
    // gives the DB the sole decision authority: exactly one caller
    // sees count === 1 and proceeds to emit audit + email.
    const claim = await prisma.provider.updateMany({
      where: {
        id: providerId,
        verificationStatus: { in: ["unverified", "pending"] },
      },
      data: {
        verificationStatus: status,
        verificationCode: null,
        verificationCodeExp: null,
      },
    });

    if (claim.count === 0) {
      // Disambiguate: provider doesn't exist vs already resolved.
      const existing = await prisma.provider.findUnique({
        where: { id: providerId },
        select: { verificationStatus: true },
      });
      if (!existing) {
        return NextResponse.json(
          { success: false, error: "Provider not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: `Claim already resolved as '${existing.verificationStatus}'` },
        { status: 409 }
      );
    }

    // Load the fresh provider row for the audit/email payload. Reads
    // the row AFTER our own update, so `previousStatus` is sourced
    // from the audit metadata we can't recover — pass the post-state
    // name/email instead and tag the action with the new status.
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        businessName: true,
        email: true,
        niche: true,
        verificationStatus: true,
      },
    });

    if (!provider) {
      // Extraordinarily unlikely — we just updated this row. Treat as
      // internal error so the admin retries rather than assuming success.
      return NextResponse.json(
        { success: false, error: "Provider disappeared mid-update" },
        { status: 500 }
      );
    }

    await audit({
      action: status === "admin_approved" ? "provider.admin_approved" : "provider.claim_rejected",
      entityType: "provider",
      entityId: providerId,
      providerId,
      metadata: {
        newStatus: status,
        resolvedBy: session.user.email ?? session.user.id,
      },
    });

    // Notify the provider.
    //
    // businessName is claimant-supplied at signup, so it's untrusted
    // even though the email lands in the claimant's own inbox — any
    // re-display surface (admin mailbox viewing bounced mails,
    // forwarding to an investigator, archival in a ticketing system)
    // inherits whatever HTML/<script> the attacker embedded. Escape
    // at render time per the policy established in Round AR.
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://erie.pro";
    const safeBusiness = escapeHtml(provider.businessName);
    if (status === "admin_approved") {
      sendEmail({
        to: provider.email,
        subject: "Your business ownership has been verified!",
        html: `
          <p>Hi ${safeBusiness},</p>
          <p>Great news! Your ownership claim has been approved by our team. Leads for your territory are now being routed to you.</p>
          <p><a href="${siteUrl}/dashboard">Go to Dashboard</a></p>
        `,
      }).catch((err) => logger.error("admin/claims/resolve", "Email failed", err));
    } else {
      sendEmail({
        to: provider.email,
        subject: "Ownership verification update",
        html: `
          <p>Hi ${safeBusiness},</p>
          <p>We were unable to verify your ownership of the business listing you claimed. Leads will not be routed until ownership is verified.</p>
          <p>If you believe this is an error, please reply to this email or <a href="${siteUrl}/contact">contact our support team</a> with proof of ownership (business license, utility bill, etc.).</p>
        `,
      }).catch((err) => logger.error("admin/claims/resolve", "Email failed", err));
    }

    logger.info("admin/claims/resolve", `Provider ${providerId} ${status} by admin`);

    // For form submissions, redirect back to the claims page
    if (!contentType.includes("application/json")) {
      return NextResponse.redirect(new URL("/admin/claims", siteUrl), 303);
    }

    return NextResponse.json({ success: true, providerId, status });
  } catch (err) {
    logger.error("admin/claims/resolve", "Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
