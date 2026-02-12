
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'tesoreria@municipio.gob.mx'
    const password = 'password123'
    const orgName = 'Municipio de Ejemplo'

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    })

    if (existingUser) {
        console.log(`User ${email} already exists. Skipping seed.`)
        return
    }

    // 2. Create Organization
    console.log(`Creating organization: ${orgName}...`)
    const org = await prisma.organization.create({
        data: {
            name: orgName
        }
    })
    console.log(`Organization created with ID: ${org.id}`)

    // 3. Create User linked to Organization
    console.log(`Creating user: ${email}...`)
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
        data: {
            email,
            name: 'Tesorero Admin',
            password: hashedPassword,
            role: 'tesorero',
            organizationId: org.id
        }
    })
    console.log(`User created with ID: ${user.id}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
