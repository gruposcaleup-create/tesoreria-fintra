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
        // Check if Fuentes table is empty
        const fuentesCount = await prisma.fuente.count()
        if (fuentesCount === 0) {
            await prisma.fuente.createMany({
                data: INITIAL_FUENTES
            })
            console.log("Seeded Fuentes table with initial data")
        }

        // Check if Departamentos table is empty
        const departamentosCount = await prisma.departamento.count()
        if (departamentosCount === 0) {
            await prisma.departamento.createMany({
                data: INITIAL_DEPARTAMENTOS
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
