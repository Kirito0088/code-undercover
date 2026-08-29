const REQUIRED_VARS = [
  "DATABASE_URL",
  "NEXTAUTH_URL",
] as const

export function validateEnv(): void {
  const missing: string[] = []

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  // lib/auth.ts accepts either name for the NextAuth signing secret.
  if (!process.env.NEXTAUTH_SECRET && !process.env.AUTH_SECRET) {
    missing.push("NEXTAUTH_SECRET (or AUTH_SECRET)")
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join("\n  ")}\n\n` +
        "See .env.example for the full list of required variables."
    )
  }
}
