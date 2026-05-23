import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/levels/:path*",
    "/intro/:path*",
    "/history/:path*",
    "/mission/:path*",
  ],
}
