// ── NextAuth v5 Route Handler ──────────────────────────────────────────
// Handles all /api/auth/* routes (sign in, sign out, callbacks, etc.)

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
