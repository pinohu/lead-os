"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield } from "lucide-react"

export default function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/",
    })

    setIsLoading(false)

    if (result?.ok) {
      router.push("/")
    } else {
      setError("Invalid email or password. Contact your administrator.")
    }
  }

  const errorId = error ? "signin-error" : undefined

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-dynasty-blue to-dynasty-purple">
      <main className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dynasty AI Stack
          </h1>
          <p className="text-gray-600">Mission Control Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              aria-describedby={errorId}
              aria-invalid={!!error}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
              placeholder="your-email@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              aria-describedby={errorId}
              aria-invalid={!!error}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <p id="signin-error" className="text-sm text-red-600 bg-red-50 p-3 rounded-lg" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-dynasty-blue text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
          <Shield className="w-4 h-4 mr-1" aria-hidden="true" />
          <span>Restricted access — authorized users only</span>
        </div>
      </main>
    </div>
  )
}
