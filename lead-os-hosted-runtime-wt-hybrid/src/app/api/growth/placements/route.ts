import { NextResponse } from "next/server";
import { getAllowedOffers } from "@/lib/growth/rules-engine";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const pageType = searchParams.get("pageType") || "directory";

  const offers = getAllowedOffers(pageType);

  return NextResponse.json({ pageType, offers });
}
