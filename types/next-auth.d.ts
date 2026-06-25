import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            name?: string | null
            username?: string | null
            email?: string | null
            image?: string | null
            hasSeenIntro?: boolean
        }
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string
        username?: string | null
        hasSeenIntro?: boolean
    }
}
