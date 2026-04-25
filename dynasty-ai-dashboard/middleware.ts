import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/auth/signin",
  },
})

export const config = {
  matcher: [
    "/",
    "/settings",
    "/knowledge",
    "/api/dashboard/:path*",
    "/api/agents/:path*",
    "/api/costs/:path*",
    "/api/services/:path*",
    "/api/settings/:path*",
    "/api/knowledge-base/:path*",
  ],
}
