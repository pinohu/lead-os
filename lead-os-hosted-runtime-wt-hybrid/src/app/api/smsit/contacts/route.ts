import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { createContact, listContacts } from "@/lib/integrations/smsit-adapter";

const CreateContactSchema = z.object({
  phone: z.string().min(1),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  lists: z.array(z.string()).optional().default([]),
  tenantId: z.string().optional(),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const contacts = await listContacts(tenantId);

    return NextResponse.json(
      { data: contacts, error: null, meta: { count: contacts.length } },
      { headers },
    );
  } catch (err) {
    console.error("[smsit/contacts GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list contacts" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = CreateContactSchema.safeParse(raw);

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

    const contact = await createContact(validation.data);

    return NextResponse.json(
      { data: contact, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[smsit/contacts POST]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create contact" }, meta: null },
      { status: 500, headers },
    );
  }
}
