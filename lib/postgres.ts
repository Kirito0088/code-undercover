import postgres from "postgres"

// Same hot-reload-safe singleton pattern as lib/db.ts's Prisma client —
// without it, every `next dev` file change would open a fresh connection
// pool on top of the old one until the DB refuses new connections.
const globalForPostgres = globalThis as unknown as {
  sql: ReturnType<typeof postgres> | undefined
}

const sql = globalForPostgres.sql ?? postgres(process.env.DATABASE_URL!)

if (process.env.NODE_ENV !== "production") globalForPostgres.sql = sql

export default sql
