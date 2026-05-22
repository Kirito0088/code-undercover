import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db

/**
 * Safely execute a database query with error handling.
 * Returns the result on success, or the fallback value on failure.
 * This prevents DB connection failures from crashing server components.
 */
export async function safeDbQuery<T>(
  queryFn: () => Promise<T>,
  fallback: T,
  context?: string
): Promise<T> {
  try {
    return await queryFn()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(
      `[DB] Query failed${context ? ` in ${context}` : ""}: ${message}`
    )
    return fallback
  }
}
