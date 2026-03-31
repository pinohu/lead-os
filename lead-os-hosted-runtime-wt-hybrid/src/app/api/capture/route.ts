import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      const formData = await req.formData().catch(() => null);
      if (formData) {
        const email = formData.get("email") as string;
        const source = (formData.get("source") as string) || "website";
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return NextResponse.json({ success: false, error: "Valid email is required" }, { status: 400 });
        }
        console.log(`[capture] New lead: ${email} (source: ${source})`);
        return NextResponse.json({ success: true, message: "Thanks! Check your inbox for next steps.", email, source });
      }
      return NextResponse.json({ success: false, error: "No data provided" }, { status: 400 });
    }

    const { email, source = "website" } = body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "Valid email is required" }, { status: 400 });
    }
    console.log(`[capture] New lead: ${email} (source: ${source})`);
    return NextResponse.json({ success: true, message: "Thanks! Check your inbox for next steps.", email, source });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
