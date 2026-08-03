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
  if (!session?.user?.email && !session?.user?.id) {
    redirect("/login")
  }

  const user = await safeDbQuery(
    () => db.user.findFirst({
      where: {
        OR: [
          ...(session?.user?.id ? [{ id: session.user.id }] : []),
          ...(session?.user?.email ? [{ email: session.user.email }] : [])
        ]
      },
      select: { id: true, name: true, email: true, username: true, image: true, auraPoints: true, auraLevel: true }
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
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        image: user.image,
        auraPoints: user.auraPoints,
        auraLevel: user.auraLevel,
      }}
    />
  )
}
