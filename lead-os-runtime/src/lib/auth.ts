// src/lib/auth.ts
import { NextRequest } from "next/server";

export function requireAuth(req: NextRequest): void {
  const secret = process.env.LEAD_OS_AUTH_SECRET;
  if (!secret) {
    throw new AuthError(500, "LEAD_OS_AUTH_SECRET is not configured");
  }

  const provided = req.headers.get("x-auth-secret");
  if (!provided || provided !== secret) {
    throw new AuthError(401, "Unauthorized");
  }
}

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
