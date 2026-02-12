// -----------------------------------------------------------------------------
// SCRIPT: TEST SOFT DELETE
// -----------------------------------------------------------------------------
// Run with: npx tsx scripts/test-soft-delete.ts
// -----------------------------------------------------------------------------

import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function main() {
    console.log('🧪 Testing Soft Delete Implementation...')

    // 1. Create Test Organization
    const org = await prisma.organization.create({
        data: {
            name: 'Test Setup Org',
        },
    })
    console.log(`✅ Organization created: ${org.id}`)

    // 2. Create Test User
    const user = await prisma.user.create({
        data: {
            organizationId: org.id,
            email: `test-${Date.now()}@example.com`,
            name: 'Test Delete User',
            password: 'hashed-password',
        },
    })
    console.log(`✅ User created: ${user.id}`)

    // 3. Perform Soft Delete (intercepted)
    const deletedUser = await prisma.user.delete({
        where: { id: user.id },
    })
    console.log(`✅ User 'deleted': ${deletedUser.id}`)

    // 4. Verify it's gone from standard queries
    const foundUser = await prisma.user.findUnique({
        where: { id: user.id },
    })

    if (foundUser === null) {
        console.log('✅ User NOT found by findUnique (Correct)')
    } else {
        console.error('❌ User FOUND by findUnique (Failed - Soft Delete Filter missing)')
    }

    // 5. Verify it still exists in DB (using raw query to bypass extension)
    // Note: We use raw query to bypass the extension's query middleware
    const rawUser = await prisma.$queryRaw`SELECT * FROM "User" WHERE id = ${user.id} AND "deletedAt" IS NOT NULL`

    if (Array.isArray(rawUser) && rawUser.length > 0) {
        console.log('✅ User EXISTS in DB with deletedAt set (Correct)')
    } else {
        console.error('❌ User NOT found in DB or deletedAt is null (Failed - Soft Delete Update missing)')
    }

    // CLEANUP (Hard Delete via raw query)
    await prisma.$executeRaw`DELETE FROM "User" WHERE id = ${user.id}`
    await prisma.$executeRaw`DELETE FROM "Organization" WHERE id = ${org.id}`
    console.log('🧹 Cleanup complete')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
