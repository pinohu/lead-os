import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

function getAllowedEmails(): string[] {
  const raw = process.env.ALLOWED_EMAILS ?? ""
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

function isRateLimited(email: string): boolean {
  const record = loginAttempts.get(email)
  if (!record) return false
  if (Date.now() - record.lastAttempt > LOCKOUT_MS) {
    loginAttempts.delete(email)
    return false
  }
  return record.count >= MAX_ATTEMPTS
}

function recordFailedAttempt(email: string): void {
  const record = loginAttempts.get(email)
  if (record && Date.now() - record.lastAttempt < LOCKOUT_MS) {
    record.count += 1
    record.lastAttempt = Date.now()
  } else {
    loginAttempts.set(email, { count: 1, lastAttempt: Date.now() })
  }
}

function clearAttempts(email: string): void {
  loginAttempts.delete(email)
}

function validateSecret(): void {
  if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === "production") {
    console.error("FATAL: NEXTAUTH_SECRET is required in production. Set it in your environment.")
    process.exit(1)
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        validateSecret()
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email.toLowerCase().trim()

        if (isRateLimited(email)) return null

        const allowed = getAllowedEmails()
        if (!allowed.includes(email)) {
          recordFailedAttempt(email)
          return null
        }

        const storedHash = process.env.ADMIN_PASSWORD_HASH
        if (!storedHash) return null

        const isValid = await bcrypt.compare(credentials.password, storedHash)
        if (!isValid) {
          recordFailedAttempt(email)
          return null
        }

        clearAttempts(email)

        return {
          id: email,
          email,
          name: email.split("@")[0],
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
