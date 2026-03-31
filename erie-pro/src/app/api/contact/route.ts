import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    const { name, email, phone, message, niche } = body as {
      name?: string;
      email?: string;
      phone?: string;
      message?: string;
      niche?: string;
    };

    // Email is required
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Dry-run mode — log but don't send
    console.log("[contact] Lead received:", { name, email, phone, message, niche });

    return NextResponse.json({
      success: true,
      message:
        "Thank you for contacting us. We'll be in touch within 24 hours.",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
