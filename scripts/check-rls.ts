import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()

const rows = await db.$queryRaw<{ tablename: string }[]>`
  SELECT tablename FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename <> '_prisma_migrations'
    AND rowsecurity = false`

await db.$disconnect()

if (rows.length) {
  console.error("RLS disabled:", rows.map(r => r.tablename).join(", "))
  process.exit(1)
}
console.log("RLS ok")