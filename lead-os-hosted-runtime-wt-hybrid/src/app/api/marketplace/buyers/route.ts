import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { createBuyer, getBuyerByEmail, listBuyers } from "@/lib/marketplace-store";
import type { BuyerAccount } from "@/lib/marketplace-store";

function generateBuyerId(): string {
  return `buyer_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function GET(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const buyers = await listBuyers();

    return NextResponse.json({
      data: buyers,
      error: null,
      meta: { total: buyers.length },
    });
  } catch (error) {
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Failed to list buyers" }, meta: null },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.email || typeof body.email !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "email is required" }, meta: null },
        { status: 400 },
      );
    }
    if (!body.company || typeof body.company !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "company is required" }, meta: null },
        { status: 400 },
      );
    }
    if (typeof body.monthlyBudget !== "number" || body.monthlyBudget <= 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "monthlyBudget must be a positive number (in cents)" }, meta: null },
        { status: 400 },
      );
    }

    const existing = await getBuyerByEmail(body.email);
    if (existing) {
      return NextResponse.json(
        { data: null, error: { code: "CONFLICT", message: "A buyer with this email already exists" }, meta: null },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const buyer: BuyerAccount = {
      id: generateBuyerId(),
      email: body.email,
      company: body.company,
      nicheSubscriptions: Array.isArray(body.nicheSubscriptions) ? body.nicheSubscriptions : [],
      monthlyBudget: body.monthlyBudget,
      totalSpent: 0,
      leadsPurchased: 0,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    const created = await createBuyer(buyer);

    return NextResponse.json({ data: created, error: null, meta: null }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Failed to create buyer" }, meta: null },
      { status: 500 },
    );
  }
}
