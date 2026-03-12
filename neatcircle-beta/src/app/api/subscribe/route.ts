import { NextRequest, NextResponse } from "next/server";

const SD_PUB = process.env.SUITEDASH_PUBLIC_ID ?? "";
const SD_KEY = process.env.SUITEDASH_SECRET_KEY ?? "";
const SD_API = "https://app.suitedash.com/secure-api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, firstName } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 },
      );
    }

    const contactPayload: Record<string, unknown> = {
      first_name: firstName || "Subscriber",
      last_name: ".",
      email,
      role: "Lead",
      tags: ["newsletter", "subscriber", "neatcircle"],
      send_welcome_email: false,
    };

    const res = await fetch(`${SD_API}/contact`, {
      method: "POST",
      headers: {
        "X-Public-ID": SD_PUB,
        "X-Secret-Key": SD_KEY,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contactPayload),
    });

    const data = await res.json();

    if (data.success || data.message?.includes("already exists")) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: data.message || "Subscription failed" },
      { status: 422 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
