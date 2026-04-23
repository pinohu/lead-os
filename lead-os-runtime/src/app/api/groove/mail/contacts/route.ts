import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  addContact,
  removeContact,
} from "@/lib/integrations/groove-adapter";

const AddContactSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  tags: z.array(z.string()).optional(),
  listId: z.string().optional(),
});

const RemoveContactSchema = z.object({
  email: z.string().email(),
  listId: z.string().optional(),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");
    const listId = url.searchParams.get("listId") ?? undefined;

    if (email) {
      const contact = await addContact(email, undefined, undefined, undefined, listId);
      return NextResponse.json(
        { data: contact, error: null, meta: null },
        { headers },
      );
    }

    return NextResponse.json(
      { data: [], error: null, meta: { message: "Provide ?email= to look up a contact" } },
      { headers },
    );
  } catch (err) {
    logger.error("groove/mail/contacts GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch contact" }, meta: null },
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
    const validation = AddContactSchema.safeParse(raw);

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

    const { email, firstName, lastName, tags, listId } = validation.data;
    const contact = await addContact(email, firstName, lastName, tags, listId);

    return NextResponse.json(
      { data: contact, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("groove/mail/contacts POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "ADD_FAILED", message: "Failed to add contact" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function DELETE(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = RemoveContactSchema.safeParse(raw);

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

    const { email, listId } = validation.data;
    const removed = await removeContact(email, listId);

    return NextResponse.json(
      { data: { removed }, error: null, meta: null },
      { status: 200, headers },
    );
  } catch (err) {
    logger.error("groove/mail/contacts DELETE failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "REMOVE_FAILED", message: "Failed to remove contact" }, meta: null },
      { status: 500, headers },
    );
  }
}
