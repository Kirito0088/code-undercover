const { PrismaClient } = require("@prisma/client")
const db = new PrismaClient()

async function main() {
    const rows = await db.$queryRaw`
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
}

main()