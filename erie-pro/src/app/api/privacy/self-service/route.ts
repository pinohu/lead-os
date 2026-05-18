// erie-pro/src/app/api/privacy/self-service/route.ts
import { NextResponse } from "next/server"
import {
  exportConsumerData,
  normalizePrivacyEmail,
  requestConsumerDeletion,
  validatePrivacyToken,
} from "@/lib/privacy-self-service"
import { audit } from "@/lib/audit-log"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const emailRaw = url.searchParams.get("email")
  const token = url.searchParams.get("token")
  const action = url.searchParams.get("action") ?? "export"

  if (!emailRaw || !token) {
    return NextResponse.json(
      { success: false, error: "email and token are required" },
      { status: 400 }
    )
  }

  let email: string
  try {
    email = normalizePrivacyEmail(emailRaw)
  } catch {
    return NextResponse.json({ success: false, error: "Invalid email" }, { status: 400 })
  }

  if (!validatePrivacyToken(email, token)) {
    return NextResponse.json(
      { success: false, error: "Invalid or expired link" },
      { status: 403 }
    )
  }

  try {
    if (action === "delete") {
      const result = await requestConsumerDeletion(email)
      await audit({
        action: "admin.action",
        entityType: "setting",
        entityId: result.requestId,
        metadata: {
          kind: "privacy.deletion_requested",
          email,
          duplicate: result.duplicate,
        },
      })
      return NextResponse.json({
        success: true,
        data: {
          message:
            "Your deletion request was received. We process requests within 48 hours per our Privacy Policy.",
          ...result,
        },
      })
    }

    const data = await exportConsumerData(email)
    await audit({
      action: "admin.action",
      entityType: "setting",
      metadata: { kind: "privacy.export", email, leadCount: data.leads.length },
    })
    return NextResponse.json({ success: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
