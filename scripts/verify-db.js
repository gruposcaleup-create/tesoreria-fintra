// Script to verify database connection and check if user exists
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🔄 Connecting to database...');

        // Test connection
        await prisma.$connect();
        console.log('✅ Database connection successful!');

        // Check for users
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        });

        console.log(`\n📊 Found ${users.length} user(s) in database:`);
        users.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email} (${user.name}) - Role: ${user.role}`);
        });

        // Check specifically for test.user.v2
        const testUser = await prisma.user.findUnique({
            where: { email: 'test.user.v2@example.com' }
        });

        if (testUser) {
            console.log('\n✅ User test.user.v2@example.com EXISTS in the database');
            console.log(`   Name: ${testUser.name}`);
            console.log(`   Role: ${testUser.role}`);
            console.log(`   Password hash length: ${testUser.password?.length || 0} chars`);
        } else {
            console.log('\n❌ User test.user.v2@example.com NOT FOUND in the database');
        }

    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
