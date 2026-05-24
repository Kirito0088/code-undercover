import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db, safeDbQuery } from "@/lib/db"
import { ProfileClient } from "./ProfileClient"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Profile Settings — Code Undercover",
  description: "Manage your undercover agent profile and subscription preferences.",
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await safeDbQuery(
    () => db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, auraPoints: true, auraLevel: true }
    }),
    null,
    "ProfilePage.user"
  )

  if (!user) {
    redirect("/login")
  }

  return (
    <ProfileClient 
      user={{
        id: session.user.id,
        name: user.name,
        email: user.email,
        auraPoints: user.auraPoints,
        auraLevel: user.auraLevel,
      }} 
    />
  )
}
