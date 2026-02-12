import 'dotenv/config'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        // 1. Create Organization table
        console.log('Creating Organization table...')
        await client.query(`
            CREATE TABLE IF NOT EXISTS "Organization" (
                "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
                "name" TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
            )
        `)

        // 2. Create a default organization
        console.log('Creating default organization...')
        const orgResult = await client.query(`
            INSERT INTO "Organization" ("id", "name", "updatedAt")
            VALUES (gen_random_uuid()::TEXT, 'GRUPO SCALE UP', CURRENT_TIMESTAMP)
            RETURNING id
        `)
        const orgId = orgResult.rows[0].id
        console.log(`Default organization created with ID: ${orgId}`)

        // 3. Add organizationId column to all tables that need it
        const tables = [
            'User', 'BankAccount', 'Transaction', 'ClasificadorCOG', 'ClasificadorCRI',
            'IngresoContable', 'EgresoContable', 'Fuente', 'Departamento',
            'Firmante', 'SystemConfig', 'SystemLog'
        ]

        for (const table of tables) {
            // Check if column already exists
            const colCheck = await client.query(
                `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = 'organizationId'`,
                [table]
            )
            if (colCheck.rows.length === 0) {
                console.log(`Adding organizationId to "${table}"...`)
                // Add column as nullable first
                await client.query(`ALTER TABLE "${table}" ADD COLUMN "organizationId" TEXT`)
                // Update existing rows with default org
                await client.query(`UPDATE "${table}" SET "organizationId" = $1 WHERE "organizationId" IS NULL`, [orgId])
                // Make it NOT NULL
                await client.query(`ALTER TABLE "${table}" ALTER COLUMN "organizationId" SET NOT NULL`)
                // Add foreign key
                await client.query(`ALTER TABLE "${table}" ADD CONSTRAINT "${table}_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE`)
                // Add index
                await client.query(`CREATE INDEX IF NOT EXISTS "${table}_organizationId_idx" ON "${table}"("organizationId")`)
            } else {
                console.log(`"${table}" already has organizationId`)
            }
        }

        // 4. Add unique compound indexes that Prisma schema expects
        console.log('Adding compound unique constraints...')

        // BankAccount: @@unique([organizationId, numeroCuenta]) and @@unique([organizationId, clabe])
        await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "BankAccount_organizationId_numeroCuenta_key" ON "BankAccount"("organizationId", "numeroCuenta")`).catch(() => { })
        await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "BankAccount_organizationId_clabe_key" ON "BankAccount"("organizationId", "clabe")`).catch(() => { })

        // ClasificadorCOG: @@unique([organizationId, codigo])
        await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "ClasificadorCOG_organizationId_codigo_key" ON "ClasificadorCOG"("organizationId", "codigo")`).catch(() => { })

        // ClasificadorCRI: @@unique([organizationId, codigo])
        await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "ClasificadorCRI_organizationId_codigo_key" ON "ClasificadorCRI"("organizationId", "codigo")`).catch(() => { })

        // Fuente: @@unique([organizationId, acronimo])
        await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "Fuente_organizationId_acronimo_key" ON "Fuente"("organizationId", "acronimo")`).catch(() => { })

        // SystemConfig: @@unique([organizationId, key])
        await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "SystemConfig_organizationId_key_key" ON "SystemConfig"("organizationId", "key")`).catch(() => { })

        await client.query('COMMIT')
        console.log('\n✅ Migration complete! All tables now have organizationId.')
        console.log(`Default Organization ID: ${orgId}`)
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Migration failed:', error)
        throw error
    } finally {
        client.release()
        await pool.end()
    }
}

main().catch((e) => { console.error(e); process.exit(1) })
