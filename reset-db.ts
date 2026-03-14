/* eslint-disable @typescript-eslint/no-require-imports */
export { }
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function resetDatabase() {
    console.log('Connecting to database to reset Users...')
    try {
        // Delete dependent records first to maintain referential integrity (if applicable)
        console.log('Deleting all User Missions...')
        await prisma.userMission.deleteMany({})

        console.log('Deleting all Accounts...')
        await prisma.account.deleteMany({})

        console.log('Deleting all Sessions...')
        await prisma.session.deleteMany({})

        // Delete users last
        console.log('Deleting all Users...')
        const deletedUsers = await prisma.user.deleteMany({})

        console.log(`Database Reset Complete! Deleted ${deletedUsers.count} users.`)
    } catch (error) {
        console.error('Error resetting database:', error)
    } finally {
        await prisma.$disconnect()
    }
}

resetDatabase()
export {}
