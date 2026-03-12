import { NextRequest, NextResponse } from "next/server";

const SD_PUB = process.env.SUITEDASH_PUBLIC_ID ?? "";
const SD_KEY = process.env.SUITEDASH_SECRET_KEY ?? "";
const SD_API = "https://app.suitedash.com/secure-api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, company, phone, service, message } =
      body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "First name, last name, and email are required." },
        { status: 400 },
      );
    }

    const tags = ["website-lead", "neatcircle"];
    if (service) tags.push(`interest-${service.toLowerCase().replace(/\s+/g, "-")}`);

    const contactPayload: Record<string, unknown> = {
      first_name: firstName,
      last_name: lastName,
      email,
      role: "Lead",
      tags,
      send_welcome_email: false,
    };
    if (company) contactPayload.company_name = company;
    if (phone) contactPayload.phone = phone;
    if (message || service) {
      contactPayload.notes = [
        service ? `Service interest: ${service}` : "",
        message ? `Message: ${message}` : "",
      ].filter(Boolean);
    }

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

    if (!res.ok) {
      const text = await res.text();
      console.error("SuiteDash API error:", res.status, text);
      return NextResponse.json(
        { error: "Failed to create contact" },
        { status: 502 },
      );
    }

    const data = await res.json();

    if (data.success) {
      return NextResponse.json({ success: true, uid: data.data?.uid });
    }

    if (data.message?.includes("already exists")) {
      return NextResponse.json({ success: true, existing: true });
    }

    console.error("SuiteDash rejected:", JSON.stringify(data));
    return NextResponse.json(
      { error: data.message || "Failed to create contact" },
      { status: 422 },
    );
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
