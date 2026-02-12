import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Initial Fuentes data
const INITIAL_FUENTES = [
    { acronimo: "FISM-DF", nombre: "Fondo para la Infraestructura Social Municipal", origen: "Federal" },
    { acronimo: "FORTAMUN", nombre: "Fondo de Aportaciones para el Fortalecimiento de los Municipios", origen: "Federal" },
    { acronimo: "RF", nombre: "Recursos Fiscales", origen: "Ingresos Propios" },
]

// Initial Departamentos data
const INITIAL_DEPARTAMENTOS = [
    { nombre: "Presidencia municipal", areas: ["Despacho", "Secretaria Particular"] },
    { nombre: "Sindicatura", areas: ["Jurídico", "Patrimonio"] },
    { nombre: "Regiduria", areas: [] },
    { nombre: "Secretaria del ayuntamiento", areas: ["Cabildo", "Archivo"] },
    { nombre: "Tesoreria", areas: ["Ingresos", "Egresos", "Contabilidad"] },
    { nombre: "Obras publicas", areas: ["Proyectos", "Supervisión"] },
    { nombre: "Oficialia mayor", areas: ["Recursos Humanos", "Servicios Generales"] },
    { nombre: "Seguridad publica", areas: ["Preventiva", "Tránsito"] },
    { nombre: "Servicios publicos", areas: ["Limpiar", "Alumbrado"] },
    { nombre: "DIF", areas: ["Asistencia Social", "Procuraduría"] },
    { nombre: "Desarrollo social", areas: [] },
    { nombre: "Desarrollo rural", areas: [] },
    { nombre: "Proteccion civil", areas: [] },
    { nombre: "Deporte", areas: [] },
    { nombre: "Cultura", areas: [] },
    { nombre: "Turismo", areas: [] },
    { nombre: "Ecologia", areas: [] },
    { nombre: "Instituto de la mujer", areas: [] },
    { nombre: "Transparencia", areas: [] },
    { nombre: "Contraloria", areas: ["Auditoría", "Quejas"] },
]

export async function GET() {
    try {
        // Fetch default organization for seeding
        const org = await prisma.organization.findFirst();
        if (!org) {
            return NextResponse.json({ success: false, message: "No organization found. Please register an organization first." }, { status: 400 });
        }
        const organizationId = org.id;

        // Check if Fuentes table is empty for this org
        const fuentesCount = await prisma.fuente.count({ where: { organizationId } })
        if (fuentesCount === 0) {
            const dataToSeed = INITIAL_FUENTES.map(f => ({ ...f, organizationId }));
            await prisma.fuente.createMany({
                data: dataToSeed
            })
            console.log("Seeded Fuentes table with initial data")
        }

        // Check if Departamentos table is empty for this org
        const departamentosCount = await prisma.departamento.count({ where: { organizationId } })
        if (departamentosCount === 0) {
            const dataToSeed = INITIAL_DEPARTAMENTOS.map(d => ({ ...d, organizationId }));
            await prisma.departamento.createMany({
                data: dataToSeed
            })
            console.log("Seeded Departamentos table with initial data")
        }

        return NextResponse.json({
            success: true,
            message: "Seed completed",
            fuentes: fuentesCount === 0 ? "seeded" : "already has data",
            departamentos: departamentosCount === 0 ? "seeded" : "already has data"
        })
    } catch (error: any) {
        console.error("Seed error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
