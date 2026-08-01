export async function register() {
  // The edge runtime (middleware.ts) also calls register(); env validation
  // only needs to run once, for the Node.js server process.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("./lib/env-validation")
    validateEnv()
  }
}
