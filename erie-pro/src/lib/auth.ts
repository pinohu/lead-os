// NextAuth v5 configuration for provider dashboard access.

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

type LoginAttemptRow = {
  attempt_count: number;
  first_attempt_at: Date | string;
};

function hashRateLimitValue(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function getRequestIp(request?: Request) {
  const forwardedFor = request?.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return request?.headers.get("x-real-ip")?.trim() || "unknown";
}

function loginAttemptKey(email: string, request?: Request) {
  const ip = getRequestIp(request);
  return {
    keyHash: hashRateLimitValue(`${email}:${ip}`),
    emailHash: hashRateLimitValue(email),
    ipHash: hashRateLimitValue(ip),
  };
}

async function isLoginRateLimited(email: string, request?: Request): Promise<boolean> {
  const { keyHash } = loginAttemptKey(email, request);
  const attempts = await prisma.$queryRaw<LoginAttemptRow[]>`
    SELECT attempt_count, first_attempt_at
    FROM login_attempts
    WHERE key_hash = ${keyHash}
    LIMIT 1
  `;
  const attempt = attempts[0];
  if (!attempt) return false;

  if (Date.now() - new Date(attempt.first_attempt_at).getTime() > LOGIN_WINDOW_MS) {
    await prisma.$executeRaw`DELETE FROM login_attempts WHERE key_hash = ${keyHash}`;
    return false;
  }

  return Number(attempt.attempt_count) >= LOGIN_MAX_ATTEMPTS;
}

async function recordFailedLogin(email: string, request?: Request): Promise<void> {
  const { keyHash, emailHash, ipHash } = loginAttemptKey(email, request);
  const windowStart = new Date(Date.now() - LOGIN_WINDOW_MS);

  await prisma.$executeRaw`
    INSERT INTO login_attempts (
      key_hash,
      email_hash,
      ip_hash,
      attempt_count,
      first_attempt_at,
      last_attempt_at
    )
    VALUES (${keyHash}, ${emailHash}, ${ipHash}, 1, NOW(), NOW())
    ON CONFLICT (key_hash) DO UPDATE SET
      attempt_count = CASE
        WHEN login_attempts.first_attempt_at < ${windowStart} THEN 1
        ELSE login_attempts.attempt_count + 1
      END,
      first_attempt_at = CASE
        WHEN login_attempts.first_attempt_at < ${windowStart} THEN NOW()
        ELSE login_attempts.first_attempt_at
      END,
      last_attempt_at = NOW()
  `;
}

async function clearLoginAttempts(email: string, request?: Request): Promise<void> {
  const { keyHash } = loginAttemptKey(email, request);
  await prisma.$executeRaw`DELETE FROM login_attempts WHERE key_hash = ${keyHash}`;
}

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
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        if (await isLoginRateLimited(email, request)) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          await recordFailedLogin(email, request);
          return null;
        }

        if (user.providerId) {
          const provider = await prisma.provider.findUnique({
            where: { id: user.providerId },
          });
          if (!provider?.passwordHash) {
            await recordFailedLogin(email, request);
            return null;
          }

          const valid = await bcrypt.compare(password, provider.passwordHash);
          if (!valid) {
            await recordFailedLogin(email, request);
            return null;
          }
        } else {
          await recordFailedLogin(email, request);
          return null;
        }

        await clearLoginAttempts(email, request);

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

      if (pathname.startsWith("/admin")) {
        return session?.user && (session.user as { role?: string }).role === "admin";
      }

      if (pathname.startsWith("/dashboard")) {
        return !!session?.user;
      }

      return true;
    },
  },
});
