import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Direct PrismaClient (no soft-delete extension)
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const MASTER_ORG_ID = '00000000-0000-0000-0000-000000000001'
const TEST_ORG_ID = 'test-clone-org-' + Date.now()

async function main() {
    console.log('🧪 Testing catalog cloning logic...\n')

    // 1. Create a test organization
    const testOrg = await prisma.organization.create({
        data: { id: TEST_ORG_ID, name: 'Test Clone Org' },
    })
    console.log(`✅ Created test org: ${testOrg.id}`)

    // 2. Get master counts
    const masterCOGCount = await prisma.clasificadorCOG.count({ where: { organizationId: MASTER_ORG_ID } })
    const masterCRICount = await prisma.clasificadorCRI.count({ where: { organizationId: MASTER_ORG_ID } })
    const masterFuenteCount = await prisma.fuente.count({ where: { organizationId: MASTER_ORG_ID } })
    console.log(`📊 Master data: COG=${masterCOGCount}, CRI=${masterCRICount}, Fuentes=${masterFuenteCount}`)

    // 3. Clone COG hierarchically
    const masterCOG = await prisma.clasificadorCOG.findMany({
        where: { organizationId: MASTER_ORG_ID },
        orderBy: { codigo: 'asc' },
    })

    const childrenMapCOG = new Map<string | null, any[]>()
    for (const row of masterCOG) {
        const key = row.parentId ?? null
        if (!childrenMapCOG.has(key)) childrenMapCOG.set(key, [])
        childrenMapCOG.get(key)!.push(row)
    }

    const idMapCOG = new Map<string, string>()
    const queueCOG: (string | null)[] = [null]
    while (queueCOG.length > 0) {
        const currentParentOldId = queueCOG.shift()!
        const children = childrenMapCOG.get(currentParentOldId) ?? []
        for (const row of children) {
            const newParentId = currentParentOldId === null ? null : idMapCOG.get(currentParentOldId) ?? null
            const created = await prisma.clasificadorCOG.create({
                data: {
                    organizationId: TEST_ORG_ID,
                    codigo: row.codigo,
                    nombre: row.nombre,
                    nivel: row.nivel,
                    parentId: newParentId,
                    cog: row.cog,
                    cuenta_registro: row.cuenta_registro,
                    aprobado: 0, modificado: 0, devengado: 0, pagado: 0,
                },
            })
            idMapCOG.set(row.id, created.id)
            if (childrenMapCOG.has(row.id)) queueCOG.push(row.id)
        }
    }

    // 4. Clone CRI hierarchically
    const masterCRI = await prisma.clasificadorCRI.findMany({
        where: { organizationId: MASTER_ORG_ID },
        orderBy: { codigo: 'asc' },
    })

    const childrenMapCRI = new Map<string | null, any[]>()
    for (const row of masterCRI) {
        const key = row.parentId ?? null
        if (!childrenMapCRI.has(key)) childrenMapCRI.set(key, [])
        childrenMapCRI.get(key)!.push(row)
    }

    const idMapCRI = new Map<string, string>()
    const queueCRI: (string | null)[] = [null]
    while (queueCRI.length > 0) {
        const currentParentOldId = queueCRI.shift()!
        const children = childrenMapCRI.get(currentParentOldId) ?? []
        for (const row of children) {
            const newParentId = currentParentOldId === null ? null : idMapCRI.get(currentParentOldId) ?? null
            const created = await prisma.clasificadorCRI.create({
                data: {
                    organizationId: TEST_ORG_ID,
                    codigo: row.codigo,
                    nombre: row.nombre,
                    nivel: row.nivel,
                    parentId: newParentId,
                    cri: row.cri,
                    cuenta_de_registro: row.cuenta_de_registro,
                    aprobado: 0, modificado: 0, recaudado: 0,
                },
            })
            idMapCRI.set(row.id, created.id)
            if (childrenMapCRI.has(row.id)) queueCRI.push(row.id)
        }
    }

    // 5. Clone Fuentes
    const masterFuentes = await prisma.fuente.findMany({ where: { organizationId: MASTER_ORG_ID } })
    for (const f of masterFuentes) {
        await prisma.fuente.create({
            data: {
                organizationId: TEST_ORG_ID,
                acronimo: f.acronimo,
                nombre: f.nombre,
                origen: f.origen,
            },
        })
    }

    // 6. Verify counts
    const clonedCOGCount = await prisma.clasificadorCOG.count({ where: { organizationId: TEST_ORG_ID } })
    const clonedCRICount = await prisma.clasificadorCRI.count({ where: { organizationId: TEST_ORG_ID } })
    const clonedFuenteCount = await prisma.fuente.count({ where: { organizationId: TEST_ORG_ID } })

    console.log(`\n📊 Cloned data: COG=${clonedCOGCount}, CRI=${clonedCRICount}, Fuentes=${clonedFuenteCount}`)

    // 7. Verify hierarchy integrity
    const clonedCOGRecords = await prisma.clasificadorCOG.findMany({ where: { organizationId: TEST_ORG_ID } })
    const clonedCRIRecords = await prisma.clasificadorCRI.findMany({ where: { organizationId: TEST_ORG_ID } })

    const checkHierarchy = (records: any[], name: string) => {
        const ids = new Set(records.map(r => r.id))
        const broken = records.filter(r => r.parentId && !ids.has(r.parentId))
        if (broken.length > 0) {
            console.error(`❌ BROKEN HIERARCHY (${name}): ${broken.length} records have broken parentIds`)
            broken.slice(0, 5).forEach(r => console.error(`   ${r.codigo}: parentId=${r.parentId}`))
            return false
        }
        return true
    }

    const cogOk = checkHierarchy(clonedCOGRecords, 'COG')
    const criOk = checkHierarchy(clonedCRIRecords, 'CRI')

    if (cogOk && criOk) {
        console.log(`✅ Hierarchy integrity verified for COG & CRI`)
    }

    // Assert counts match
    const cogMatch = clonedCOGCount === masterCOGCount
    const criMatch = clonedCRICount === masterCRICount
    const fuenteMatch = clonedFuenteCount === masterFuenteCount

    console.log(`\n${cogMatch ? '✅' : '❌'} COG count: ${clonedCOGCount} (expected ${masterCOGCount})`)
    console.log(`${criMatch ? '✅' : '❌'} CRI count: ${clonedCRICount} (expected ${masterCRICount})`)
    console.log(`${fuenteMatch ? '✅' : '❌'} Fuente count: ${clonedFuenteCount} (expected ${masterFuenteCount})`)

    // 8. Cleanup
    console.log('\n🧹 Cleaning up...')
    await prisma.$executeRawUnsafe(`DELETE FROM "ClasificadorCOG" WHERE "organizationId" = '${TEST_ORG_ID}'`)
    await prisma.$executeRawUnsafe(`DELETE FROM "ClasificadorCRI" WHERE "organizationId" = '${TEST_ORG_ID}'`)
    await prisma.$executeRawUnsafe(`DELETE FROM "Fuente" WHERE "organizationId" = '${TEST_ORG_ID}'`)
    await prisma.$executeRawUnsafe(`DELETE FROM "Organization" WHERE "id" = '${TEST_ORG_ID}'`)
    console.log('✅ Cleanup complete')

    if (cogMatch && criMatch && fuenteMatch && cogOk && criOk) {
        console.log('\n🎉 ALL TESTS PASSED!')
    } else {
        console.error('\n❌ SOME TESTS FAILED')
        process.exit(1)
    }
}

main()
    .catch((e) => { console.error('❌ Test failed:', e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect(); await pool.end() })
