import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  createContact,
  listContacts,
} from "@/lib/integrations/salesnexus-adapter";

const CreateContactSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(["lead", "prospect", "customer", "inactive"]).optional(),
  score: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  tenantId: z.string().optional(),
});

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
    console.error("[salesnexus/contacts POST]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create contact" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;
    const status = url.searchParams.get("status") as "lead" | "prospect" | "customer" | "inactive" | undefined;
    const tag = url.searchParams.get("tag") ?? undefined;

    const contacts = await listContacts({ tenantId, status: status || undefined, tag });

    return NextResponse.json(
      { data: contacts, error: null, meta: { total: contacts.length } },
      { headers },
    );
  } catch (err) {
    console.error("[salesnexus/contacts GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch contacts" }, meta: null },
      { status: 500, headers },
    );
  }
}
