// ── NextAuth v5 Configuration ─────────────────────────────────────────
// Credentials provider (email/password) for provider dashboard access.
// Magic link (email) provider can be added once Emailit is integrated (Phase 3).

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// ── Login Rate Limiter ──────────────────────────────────────────────
// Pre-launch audit (#6 from AUDIT-PASS-2): previously this was a pure
// in-memory Map, which means rate limits applied per serverless
// instance. On Vercel, an attacker can churn attempts by rotating
// cold-started instances and effectively bypass the cap.
//
// We now use the existing `rate_limit_entries` Postgres table (already
// used by API rate limiting) with a "login:" key prefix. The in-memory
// Map is kept only as a fail-open fallback if the DB is unreachable —
// rate limiting is a defense-in-depth check, not the primary auth
// barrier (bcrypt-verified password is), so it follows the rest of
// the rate-limit subsystem's fail-open posture.
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_WINDOW_SEC = Math.floor(LOGIN_WINDOW_MS / 1000);
const LOGIN_KEY_PREFIX = "login:";

interface LoginAttempt {
  count: number;
  firstAttemptAt: number;
}

// In-memory fallback for when the DB is unreachable. NOT the primary
// store — only used when prisma calls throw.
const loginAttemptsMemoryFallback = new Map<string, LoginAttempt>();

function memoryKey(email: string): string {
  return email.toLowerCase().trim();
}

async function isLoginRateLimited(email: string): Promise<boolean> {
  const now = Date.now();
  const key = `${LOGIN_KEY_PREFIX}${memoryKey(email)}`;
  const windowStart = new Date(now - LOGIN_WINDOW_MS);

  try {
    const count = await prisma.rateLimitEntry.count({
      where: { key, createdAt: { gt: windowStart } },
    });
    return count >= LOGIN_MAX_ATTEMPTS;
  } catch {
    // DB unavailable — fall back to in-memory check. Fail-open is the
    // standard rate-limiter posture; password verification is the real
    // authentication barrier.
    const attempt = loginAttemptsMemoryFallback.get(memoryKey(email));
    if (!attempt) return false;
    if (now - attempt.firstAttemptAt > LOGIN_WINDOW_MS) {
      loginAttemptsMemoryFallback.delete(memoryKey(email));
      return false;
    }
    return attempt.count >= LOGIN_MAX_ATTEMPTS;
  }
}

async function recordFailedLogin(email: string): Promise<void> {
  const key = `${LOGIN_KEY_PREFIX}${memoryKey(email)}`;
  try {
    await prisma.rateLimitEntry.create({ data: { key } });
    // Best-effort: prune old entries past the window. Failure here is
    // OK — they'll just sit until the periodic cleanup task fires.
    await prisma.rateLimitEntry
      .deleteMany({
        where: {
          key,
          createdAt: { lt: new Date(Date.now() - LOGIN_WINDOW_MS) },
        },
      })
      .catch(() => null);
  } catch {
    // DB unavailable — record in-memory fallback
    const now = Date.now();
    const attempt = loginAttemptsMemoryFallback.get(memoryKey(email));
    if (!attempt || now - attempt.firstAttemptAt > LOGIN_WINDOW_MS) {
      loginAttemptsMemoryFallback.set(memoryKey(email), {
        count: 1,
        firstAttemptAt: now,
      });
    } else {
      attempt.count += 1;
    }
  }
}

async function clearLoginAttempts(email: string): Promise<void> {
  const key = `${LOGIN_KEY_PREFIX}${memoryKey(email)}`;
  try {
    await prisma.rateLimitEntry.deleteMany({ where: { key } });
  } catch {
    // ignore
  }
  loginAttemptsMemoryFallback.delete(memoryKey(email));
}

// Exported so callers (e.g. signup, password-reset) can reference the
// constants without re-implementing the math.
export const LOGIN_RATE_LIMIT = {
  maxAttempts: LOGIN_MAX_ATTEMPTS,
  windowSeconds: LOGIN_WINDOW_SEC,
} as const;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        // Rate limit check — block after too many failed attempts
        if (await isLoginRateLimited(email)) {
          return null;
        }

        // Look up user by email
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          await recordFailedLogin(email);
          return null;
        }

        // Admin users: check password hash stored directly on the linked provider
        // Provider users: check via their provider profile
        if (user.providerId) {
          const provider = await prisma.provider.findUnique({
            where: { id: user.providerId },
          });
          if (!provider?.passwordHash) {
            await recordFailedLogin(email);
            return null;
          }

          const valid = await bcrypt.compare(password, provider.passwordHash);
          if (!valid) {
            await recordFailedLogin(email);
            return null;
          }
        } else {
          // No linked provider — reject login (no password to verify)
          await recordFailedLogin(email);
          return null;
        }

        // Successful login — clear any failed attempt counter
        await clearLoginAttempts(email);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "provider";
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
    async authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl;

      // Admin routes require admin role
      if (pathname.startsWith("/admin")) {
        return session?.user && (session.user as { role?: string }).role === "admin";
      }

      // Dashboard routes require any authenticated user
      if (pathname.startsWith("/dashboard")) {
        return !!session?.user;
      }

      // Everything else is public
      return true;
    },
  },
});
