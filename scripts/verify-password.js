// Script to verify password comparison works
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🔄 Testing password comparison...');

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: 'test.user.v2@example.com' }
        });

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log(`✅ User found: ${user.email}`);
        console.log(`   Password hash: ${user.password.substring(0, 20)}...`);

        // Test password
        const testPassword = 'Password123!';
        const passwordsMatch = await bcrypt.compare(testPassword, user.password);

        if (passwordsMatch) {
            console.log(`\n✅ Password comparison SUCCESSFUL!`);
            console.log(`   Password 'Password123!' matches the stored hash.`);
        } else {
            console.log(`\n❌ Password comparison FAILED!`);
            console.log(`   Password 'Password123!' does NOT match the stored hash.`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
