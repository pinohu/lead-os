// ── NextAuth v5 Configuration ─────────────────────────────────────────
// Credentials provider (email/password) for provider dashboard access.
// Magic link (email) provider can be added once Emailit is integrated (Phase 3).

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// ── Login Rate Limiter ──────────────────────────────────────────────
// In-memory rate limiter: max 5 failed attempts per email per 15 minutes.
// Provides brute-force protection within a single serverless instance.
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface LoginAttempt {
  count: number;
  firstAttemptAt: number;
}

const loginAttempts = new Map<string, LoginAttempt>();

function isLoginRateLimited(email: string): boolean {
  const now = Date.now();
  const attempt = loginAttempts.get(email);
  if (!attempt) return false;

  // Window expired — clear and allow
  if (now - attempt.firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttempts.delete(email);
    return false;
  }

  return attempt.count >= LOGIN_MAX_ATTEMPTS;
}

function recordFailedLogin(email: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(email);

  if (!attempt || now - attempt.firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(email, { count: 1, firstAttemptAt: now });
  } else {
    attempt.count += 1;
  }
}

function clearLoginAttempts(email: string): void {
  loginAttempts.delete(email);
}

// Dummy bcrypt hash used to equalize response time between "user exists,
// wrong password" and "user doesn't exist at all". Without this, the
// missing-user path skipped bcrypt entirely and returned in ~1ms, while
// the wrong-password path took ~100ms — a trivial timing oracle an
// attacker could use to enumerate which emails have accounts.
//
// Generated once at module load via bcrypt.hashSync("invalid-placeholder", 12)
// so every missing-user request still pays a real bcrypt.compare round.
const DUMMY_BCRYPT_HASH = bcrypt.hashSync(
  "dummy-password-never-matches-anything",
  12
);

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
        if (isLoginRateLimited(email)) {
          return null;
        }

        // Look up user by email
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          // Run bcrypt on a dummy hash to equalize timing with the
          // "wrong password" branch — see DUMMY_BCRYPT_HASH comment.
          await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
          recordFailedLogin(email);
          return null;
        }

        // Admin users: check password hash stored directly on the linked provider
        // Provider users: check via their provider profile
        if (user.providerId) {
          const provider = await prisma.provider.findUnique({
            where: { id: user.providerId },
          });
          if (!provider?.passwordHash) {
            // Burn the bcrypt round here too so "user exists but no
            // password set" looks identical to a successful-lookup
            // wrong-password attempt.
            await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
            recordFailedLogin(email);
            return null;
          }

          const valid = await bcrypt.compare(password, provider.passwordHash);
          if (!valid) {
            recordFailedLogin(email);
            return null;
          }
        } else {
          // No linked provider — reject login (no password to verify).
          // Equalize with the wrong-password path.
          await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
          recordFailedLogin(email);
          return null;
        }

        // Successful login — clear any failed attempt counter
        clearLoginAttempts(email);

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
