import { buildCorsHeaders, isAllowedCorsPostOrigin } from "./cors.ts";
import { persistLead } from "./intake.ts";

type IntakeRequest = Pick<Request, "headers" | "json">;
type IntakePersistence = (payload: unknown) => Promise<unknown>;

export async function handleIntakePost(
  request: IntakeRequest,
  persist: IntakePersistence = persistLead as IntakePersistence,
) {
  const origin = request.headers.get("origin");
  const headers = buildCorsHeaders(origin);

  if (!isAllowedCorsPostOrigin(origin)) {
    return Response.json(
      { success: false, error: "Origin is not allowed for lead intake." },
      { status: 403, headers },
    );
  }

  try {
    const payload = await request.json();
    const result = await persist(payload);
    return Response.json(result, { headers });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Intake failed" },
      { status: 400, headers },
    );
  }
}
