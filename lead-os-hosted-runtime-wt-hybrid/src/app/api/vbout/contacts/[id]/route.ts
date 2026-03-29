import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  getContact,
  updateContact,
} from "@/lib/integrations/vbout-adapter";

const UpdateContactSchema = z.object({
  firstName: z.string().max(200).optional(),
  lastName: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  status: z.enum(["active", "unsubscribed", "bounced"]).optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const contact = await getContact(id);

    if (!contact) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Contact not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: contact, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[vbout/contacts/[id] GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch contact" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const raw = await request.json();
    const validation = UpdateContactSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues },
          meta: null,
        },
        { status: 422, headers },
      );
    }

    const updated = await updateContact(id, validation.data);

    if (!updated) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Contact not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: updated, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[vbout/contacts/[id] PATCH]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "UPDATE_FAILED", message: "Failed to update contact" }, meta: null },
      { status: 500, headers },
    );
  }
}
