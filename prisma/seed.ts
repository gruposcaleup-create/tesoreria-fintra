import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { RAW_CRI_DATA } from '../components/providers/cri-raw-data'

// ---------------------------------------------------------------------------
// SEED SCRIPT — Catálogos Estándar de Contabilidad Gubernamental (CONAC)
// ---------------------------------------------------------------------------
// Idempotent: safe to run multiple times via `upsert`.
// All records are scoped to a System Admin organization.
// ---------------------------------------------------------------------------

// --- Direct PrismaClient (bypasses soft-delete extension) ---
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const ADMIN_ORG_ID = '00000000-0000-0000-0000-000000000001'
const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000002'
const ADMIN_EMAIL = 'admin@fintra.mx'
const ADMIN_PASSWORD = 'Admin123!'  // Change in production!

// ═══════════════════════════════════════════════════════════════════
// COG CATALOG DATA — Clasificador por Objeto del Gasto (CONAC)
// ═══════════════════════════════════════════════════════════════════

interface CogEntry {
    codigo: string
    nombre: string
    nivel: string
    parentCodigo?: string
    cog?: string
}

const COG_CATALOG: CogEntry[] = [
    // ───── CAPÍTULOS (Nivel 1 — Raíz) ─────
    { codigo: '1000', nombre: 'Servicios Personales', nivel: 'Capitulo' },
    { codigo: '2000', nombre: 'Materiales y Suministros', nivel: 'Capitulo' },
    { codigo: '3000', nombre: 'Servicios Generales', nivel: 'Capitulo' },
    { codigo: '4000', nombre: 'Transferencias, Asignaciones, Subsidios y Otras Ayudas', nivel: 'Capitulo' },
    { codigo: '5000', nombre: 'Bienes Muebles, Inmuebles e Intangibles', nivel: 'Capitulo' },
    { codigo: '6000', nombre: 'Inversión Pública', nivel: 'Capitulo' },
    { codigo: '7000', nombre: 'Inversiones Financieras y Otras Provisiones', nivel: 'Capitulo' },
    { codigo: '8000', nombre: 'Participaciones y Aportaciones', nivel: 'Capitulo' },
    { codigo: '9000', nombre: 'Deuda Pública', nivel: 'Capitulo' },

    // ───── CONCEPTOS (Nivel 2) — Capítulo 1000 ─────
    { codigo: '1100', nombre: 'Remuneraciones al Personal de Carácter Permanente', nivel: 'Concepto', parentCodigo: '1000', cog: '1100' },
    { codigo: '1200', nombre: 'Remuneraciones al Personal de Carácter Transitorio', nivel: 'Concepto', parentCodigo: '1000', cog: '1200' },
    { codigo: '1300', nombre: 'Remuneraciones Adicionales y Especiales', nivel: 'Concepto', parentCodigo: '1000', cog: '1300' },
    { codigo: '1400', nombre: 'Seguridad Social', nivel: 'Concepto', parentCodigo: '1000', cog: '1400' },
    { codigo: '1500', nombre: 'Otras Prestaciones Sociales y Económicas', nivel: 'Concepto', parentCodigo: '1000', cog: '1500' },
    { codigo: '1600', nombre: 'Previsiones', nivel: 'Concepto', parentCodigo: '1000', cog: '1600' },
    { codigo: '1700', nombre: 'Pago de Estímulos a Servidores Públicos', nivel: 'Concepto', parentCodigo: '1000', cog: '1700' },

    // ───── CONCEPTOS (Nivel 2) — Capítulo 2000 ─────
    { codigo: '2100', nombre: 'Materiales de Administración, Emisión de Documentos y Artículos Oficiales', nivel: 'Concepto', parentCodigo: '2000', cog: '2100' },
    { codigo: '2200', nombre: 'Alimentos y Utensilios', nivel: 'Concepto', parentCodigo: '2000', cog: '2200' },
    { codigo: '2300', nombre: 'Materias Primas y Materiales de Producción y Comercialización', nivel: 'Concepto', parentCodigo: '2000', cog: '2300' },
    { codigo: '2400', nombre: 'Materiales y Artículos de Construcción y de Reparación', nivel: 'Concepto', parentCodigo: '2000', cog: '2400' },
    { codigo: '2500', nombre: 'Productos Químicos, Farmacéuticos y de Laboratorio', nivel: 'Concepto', parentCodigo: '2000', cog: '2500' },
    { codigo: '2600', nombre: 'Combustibles, Lubricantes y Aditivos', nivel: 'Concepto', parentCodigo: '2000', cog: '2600' },
    { codigo: '2700', nombre: 'Vestuario, Blancos, Prendas de Protección y Artículos Deportivos', nivel: 'Concepto', parentCodigo: '2000', cog: '2700' },
    { codigo: '2800', nombre: 'Materiales y Suministros para Seguridad', nivel: 'Concepto', parentCodigo: '2000', cog: '2800' },
    { codigo: '2900', nombre: 'Herramientas, Refacciones y Accesorios Menores', nivel: 'Concepto', parentCodigo: '2000', cog: '2900' },

    // ───── CONCEPTOS (Nivel 2) — Capítulo 3000 ─────
    { codigo: '3100', nombre: 'Servicios Básicos', nivel: 'Concepto', parentCodigo: '3000', cog: '3100' },
    { codigo: '3200', nombre: 'Servicios de Arrendamiento', nivel: 'Concepto', parentCodigo: '3000', cog: '3200' },
    { codigo: '3300', nombre: 'Servicios Profesionales, Científicos, Técnicos y Otros Servicios', nivel: 'Concepto', parentCodigo: '3000', cog: '3300' },
    { codigo: '3400', nombre: 'Servicios Financieros, Bancarios y Comerciales', nivel: 'Concepto', parentCodigo: '3000', cog: '3400' },
    { codigo: '3500', nombre: 'Servicios de Instalación, Reparación, Mantenimiento y Conservación', nivel: 'Concepto', parentCodigo: '3000', cog: '3500' },
    { codigo: '3600', nombre: 'Servicios de Comunicación Social y Publicidad', nivel: 'Concepto', parentCodigo: '3000', cog: '3600' },
    { codigo: '3700', nombre: 'Servicios de Traslado y Viáticos', nivel: 'Concepto', parentCodigo: '3000', cog: '3700' },
    { codigo: '3800', nombre: 'Servicios Oficiales', nivel: 'Concepto', parentCodigo: '3000', cog: '3800' },
    { codigo: '3900', nombre: 'Otros Servicios Generales', nivel: 'Concepto', parentCodigo: '3000', cog: '3900' },

    // ───── PARTIDAS GENÉRICAS (Nivel 3) — Concepto 1100 ─────
    { codigo: '1110', nombre: 'Dietas', nivel: 'Partida', parentCodigo: '1100', cog: '1110' },
    { codigo: '1120', nombre: 'Haberes', nivel: 'Partida', parentCodigo: '1100', cog: '1120' },
    { codigo: '1130', nombre: 'Sueldos Base al Personal Permanente', nivel: 'Partida', parentCodigo: '1100', cog: '1130' },
    { codigo: '1140', nombre: 'Remuneraciones por Adscripción Laboral en el Extranjero', nivel: 'Partida', parentCodigo: '1100', cog: '1140' },

    // ───── PARTIDAS GENÉRICAS (Nivel 3) — Concepto 1200 ─────
    { codigo: '1210', nombre: 'Honorarios Asimilables a Salarios', nivel: 'Partida', parentCodigo: '1200', cog: '1210' },
    { codigo: '1220', nombre: 'Sueldos Base al Personal Eventual', nivel: 'Partida', parentCodigo: '1200', cog: '1220' },
    { codigo: '1230', nombre: 'Retribuciones por Servicios de Carácter Social', nivel: 'Partida', parentCodigo: '1200', cog: '1230' },
    { codigo: '1240', nombre: 'Retribución a los Representantes de los Trabajadores y de los Patrones en la Junta de Conciliación y Arbitraje', nivel: 'Partida', parentCodigo: '1200', cog: '1240' },

    // ───── PARTIDAS GENÉRICAS (Nivel 3) — Concepto 1300 ─────
    { codigo: '1310', nombre: 'Primas por Años de Servicios Efectivos Prestados', nivel: 'Partida', parentCodigo: '1300', cog: '1310' },
    { codigo: '1320', nombre: 'Primas de Vacaciones, Dominical y Gratificación de Fin de Año', nivel: 'Partida', parentCodigo: '1300', cog: '1320' },
    { codigo: '1330', nombre: 'Horas Extraordinarias', nivel: 'Partida', parentCodigo: '1300', cog: '1330' },
    { codigo: '1340', nombre: 'Compensaciones', nivel: 'Partida', parentCodigo: '1300', cog: '1340' },
    { codigo: '1350', nombre: 'Sobrehaberes', nivel: 'Partida', parentCodigo: '1300', cog: '1350' },
    { codigo: '1360', nombre: 'Asignaciones de Técnico, de Mando, por Comisión, de Vuelo y de Técnico Especial', nivel: 'Partida', parentCodigo: '1300', cog: '1360' },
    { codigo: '1370', nombre: 'Honorarios Especiales', nivel: 'Partida', parentCodigo: '1300', cog: '1370' },
    { codigo: '1380', nombre: 'Participaciones por Vigilancia en el Cumplimiento de las Leyes y Custodia de Valores', nivel: 'Partida', parentCodigo: '1300', cog: '1380' },

    // ───── PARTIDAS GENÉRICAS (Nivel 3) — Concepto 1400 ─────
    { codigo: '1410', nombre: 'Aportaciones de Seguridad Social', nivel: 'Partida', parentCodigo: '1400', cog: '1410' },
    { codigo: '1420', nombre: 'Aportaciones a Fondos de Vivienda', nivel: 'Partida', parentCodigo: '1400', cog: '1420' },
    { codigo: '1430', nombre: 'Aportaciones al Sistema para el Retiro', nivel: 'Partida', parentCodigo: '1400', cog: '1430' },
    { codigo: '1440', nombre: 'Aportaciones para Seguros', nivel: 'Partida', parentCodigo: '1400', cog: '1440' },

    // ───── PARTIDAS GENÉRICAS (Nivel 3) — Concepto 1500 ─────
    { codigo: '1510', nombre: 'Cuotas para el Fondo de Ahorro y Fondo de Trabajo', nivel: 'Partida', parentCodigo: '1500', cog: '1510' },
    { codigo: '1520', nombre: 'Indemnizaciones', nivel: 'Partida', parentCodigo: '1500', cog: '1520' },
    { codigo: '1530', nombre: 'Prestaciones y Haberes de Retiro', nivel: 'Partida', parentCodigo: '1500', cog: '1530' },
    { codigo: '1540', nombre: 'Prestaciones Contractuales', nivel: 'Partida', parentCodigo: '1500', cog: '1540' },
    { codigo: '1550', nombre: 'Apoyos a la Capacitación de los Servidores Públicos', nivel: 'Partida', parentCodigo: '1500', cog: '1550' },
    { codigo: '1590', nombre: 'Otras Prestaciones Sociales y Económicas', nivel: 'Partida', parentCodigo: '1500', cog: '1590' },
]

// ═══════════════════════════════════════════════════════════════════
// FUENTES DE FINANCIAMIENTO
// ═══════════════════════════════════════════════════════════════════

interface FuenteEntry {
    acronimo: string
    nombre: string
    origen: string
}

const FUENTES_CATALOG: FuenteEntry[] = [
    { acronimo: 'RF', nombre: 'Recursos Fiscales', origen: 'Federal' },
    { acronimo: 'PF', nombre: 'Participaciones Federales', origen: 'Federal' },
    { acronimo: 'AF', nombre: 'Aportaciones Federales', origen: 'Federal' },
    { acronimo: 'IP', nombre: 'Ingresos Propios', origen: 'Ingresos Propios' },
    { acronimo: 'CF', nombre: 'Convenios Federales', origen: 'Federal' },
    { acronimo: 'CE', nombre: 'Convenios Estatales', origen: 'Estatal' },
    { acronimo: 'DP', nombre: 'Deuda Pública', origen: 'Federal' },
    { acronimo: 'FISM', nombre: 'Fondo de Infraestructura Social Municipal', origen: 'Federal' },
    { acronimo: 'FORTAMUN', nombre: 'Fondo de Fortalecimiento Municipal', origen: 'Federal' },
]

// ═══════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ═══════════════════════════════════════════════════════════════════

async function main() {
    console.log('🌱 Starting seed...\n')

    // ─── 1. Admin Organization ──────────────────────────────────
    const org = await prisma.organization.upsert({
        where: { id: ADMIN_ORG_ID },
        update: { name: 'Fintra Admin' },
        create: { id: ADMIN_ORG_ID, name: 'Fintra Admin' },
    })
    console.log(`✅ Organization: ${org.name} (${org.id})`)

    // ─── 2. Admin User ─────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12)

    const user = await prisma.user.upsert({
        where: { email: ADMIN_EMAIL },
        update: {
            name: 'Administrador',
            role: 'admin',
            isActive: true,
        },
        create: {
            id: ADMIN_USER_ID,
            email: ADMIN_EMAIL,
            name: 'Administrador',
            password: hashedPassword,
            role: 'admin',
            isActive: true,
            organizationId: ADMIN_ORG_ID,
        },
    })
    console.log(`✅ User: ${user.email} (${user.id})`)

    // ─── 3. Clasificador por Objeto del Gasto (COG) ────────────
    console.log('\n📁 Seeding COG catalog...')

    // First pass: upsert all chapters, concepts and partidas (no parent yet)
    // We need to resolve parentId from parentCodigo, so we build a map.
    const codigoToId: Record<string, string> = {}

    // Upsert in order: Capítulos first, then Conceptos, then Partidas
    const nivelesOrder = ['Capitulo', 'Concepto', 'Partida']

    for (const nivel of nivelesOrder) {
        const entries = COG_CATALOG.filter(e => e.nivel === nivel)

        for (const entry of entries) {
            const parentId = entry.parentCodigo ? codigoToId[entry.parentCodigo] : null

            const record = await prisma.clasificadorCOG.upsert({
                where: {
                    organizationId_codigo: {
                        organizationId: ADMIN_ORG_ID,
                        codigo: entry.codigo,
                    },
                },
                update: {
                    nombre: entry.nombre,
                    nivel: entry.nivel,
                    cog: entry.cog ?? null,
                    parentId,
                },
                create: {
                    organizationId: ADMIN_ORG_ID,
                    codigo: entry.codigo,
                    nombre: entry.nombre,
                    nivel: entry.nivel,
                    cog: entry.cog ?? null,
                    parentId,
                },
            })

            codigoToId[entry.codigo] = record.id
        }

        console.log(`   ✅ ${nivel}: ${entries.length} entries`)
    }

    console.log(`   📊 Total COG entries: ${COG_CATALOG.length}`)

    // ─── 4. Clasificador de Rubro de Ingresos (CRI) ───────────
    await seedCRI()

    // ─── 5. Fuentes de Financiamiento ──────────────────────────
    console.log('\n💰 Seeding Fuentes de Financiamiento...')

    for (const fuente of FUENTES_CATALOG) {
        await prisma.fuente.upsert({
            where: {
                organizationId_acronimo: {
                    organizationId: ADMIN_ORG_ID,
                    acronimo: fuente.acronimo,
                },
            },
            update: {
                nombre: fuente.nombre,
                origen: fuente.origen,
            },
            create: {
                organizationId: ADMIN_ORG_ID,
                acronimo: fuente.acronimo,
                nombre: fuente.nombre,
                origen: fuente.origen,
            },
        })
    }

    console.log(`   ✅ Fuentes: ${FUENTES_CATALOG.length} entries`)

    // ─── Done ──────────────────────────────────────────────────
    console.log('\n🎉 Seed completed successfully!\n')
}

// ═══════════════════════════════════════════════════════════════════
// CRI CATALOG — Clasificador de Rubros de Ingresos (from raw data)
// ═══════════════════════════════════════════════════════════════════

// Nivel labels based on dot-depth in codigo
const CRI_NIVEL_LABELS: Record<number, string> = {
    1: 'Genero',
    2: 'Grupo',
    3: 'Rubro',
    4: 'Tipo',
    5: 'Clase',
    6: 'Concepto',
    7: 'SubConcepto',
    8: 'SubSubConcepto',
    9: 'Partida',
    10: 'SubPartida',
    11: 'Detalle',
}

function getParentCodigo(codigo: string): string | null {
    const parts = codigo.split('.')
    if (parts.length <= 1) return null
    return parts.slice(0, -1).join('.')
}

async function seedCRI() {
    console.log('\n📗 Seeding CRI catalog (Ley de Ingresos)...')
    console.log(`   📊 Total raw entries: ${RAW_CRI_DATA.length}`)

    // 1. Sort by depth (BFS order) — parents before children
    const sorted = [...RAW_CRI_DATA].sort((a, b) => {
        const depthA = a.codigo.split('.').length
        const depthB = b.codigo.split('.').length
        if (depthA !== depthB) return depthA - depthB
        return a.codigo.localeCompare(b.codigo)
    })

    // 2. Build codigo → dbId map for parentId resolution
    const codigoToId: Record<string, string> = {}
    let processed = 0
    let errors = 0

    // Group by depth for progress logging
    const maxDepth = Math.max(...sorted.map(r => r.codigo.split('.').length))

    for (let depth = 1; depth <= maxDepth; depth++) {
        const levelEntries = sorted.filter(r => r.codigo.split('.').length === depth)
        if (levelEntries.length === 0) continue

        for (const entry of levelEntries) {
            try {
                const parentCodigo = getParentCodigo(entry.codigo)
                const parentId = parentCodigo ? codigoToId[parentCodigo] ?? null : null
                const nivel = CRI_NIVEL_LABELS[depth] ?? `Nivel${depth}`

                const record = await prisma.clasificadorCRI.upsert({
                    where: {
                        organizationId_codigo: {
                            organizationId: ADMIN_ORG_ID,
                            codigo: entry.codigo,
                        },
                    },
                    update: {
                        nombre: entry.nombre,
                        nivel,
                        cri: entry.cri || null,
                        cuenta_de_registro: entry.cuenta_de_registro || null,
                        parentId,
                    },
                    create: {
                        organizationId: ADMIN_ORG_ID,
                        codigo: entry.codigo,
                        nombre: entry.nombre,
                        nivel,
                        cri: entry.cri || null,
                        cuenta_de_registro: entry.cuenta_de_registro || null,
                        parentId,
                        aprobado: 0,
                        modificado: 0,
                        recaudado: 0,
                    },
                })

                codigoToId[entry.codigo] = record.id
                processed++
            } catch (err) {
                errors++
                console.error(`   ❌ Error at codigo ${entry.codigo}:`, err)
            }
        }

        console.log(`   ✅ Level ${depth} (${CRI_NIVEL_LABELS[depth] ?? 'Nivel' + depth}): ${levelEntries.length} entries`)
    }

    console.log(`   📊 CRI seeding complete: ${processed} processed, ${errors} errors`)
    if (errors > 0) {
        console.warn(`   ⚠️  ${errors} entries failed — check logs above`)
    }
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
        await pool.end()
    })
