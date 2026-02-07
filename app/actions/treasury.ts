"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { ClasificadorCOG, Prisma } from "@prisma/client"

// Types matching Context Interfaces roughly
type TransactionInput = {
    accountId: string
    fecha: Date
    concepto: string
    referencia?: string
    monto: number
    tipo: "Ingreso" | "Egreso"
    // For Egreso Contable
    egresoDetails?: {
        cog: string // Link to PresupuestoItem.codigo
        cuentaContable: string
        pagueseA: string
        concepto: string
        polizaNumero?: string
    }
}

type NewBudgetInput = {
    codigo: string
    descripcion: string
    nivel: "Capitulo" | "Concepto" | "Partida"
    parentId?: string
    fuenteFinanciamiento: string
    aprobado: number
}

// --- ATOMIC TRANSACTION HANDLER ---

export async function registerTransaction(data: TransactionInput) {
    try {
        // Enforce Atomic Transaction
        const result = await prisma.$transaction(async (tx) => {

            // 1. Fetch Account to check balance/existence
            const account = await tx.bankAccount.findUniqueOrThrow({
                where: { id: data.accountId }
            })

            // 2. Validate Overdraft for Egreso
            if (data.tipo === "Egreso" && account.saldoDisponible.lt(data.monto)) {
                throw new Error("Saldo insuficiente en la cuenta bancaria.");
            }

            // 3. Create Basic Transaction Record
            const transaction = await tx.transaction.create({
                data: {
                    accountId: data.accountId,
                    fecha: data.fecha,
                    concepto: data.concepto,
                    referencia: data.referencia,
                    monto: data.monto,
                    tipo: data.tipo,
                    estatus: "Conciliado" // Assuming immediate effect for now
                }
            })

            // 4. Update Bank Balance
            const balanceChange = data.tipo === "Ingreso" ? data.monto : -data.monto;

            await tx.bankAccount.update({
                where: { id: data.accountId },
                data: {
                    saldo: { increment: balanceChange },
                    saldoDisponible: { increment: balanceChange }
                }
            })

            // 5. Specifc Logic for "Egreso" with Accounting Integation
            if (data.tipo === "Egreso" && data.egresoDetails) {
                // 5a. Create Accounting Record
                const poliza = await tx.egresoContable.create({
                    data: {
                        polizaNumero: data.egresoDetails.polizaNumero || `P-${Date.now()}`,
                        fecha: data.fecha,
                        cog: data.egresoDetails.cog,
                        cuentaContable: data.egresoDetails.cuentaContable,
                        pagueseA: data.egresoDetails.pagueseA,
                        monto: data.monto,
                        concepto: data.egresoDetails.concepto,
                        tipo: "Bancario",
                        estatus: "Pagado",
                        fondo: "",
                        institucionBancaria: "",
                        cuentaBancaria: ""
                    }
                })

                // Link transaction to egreso
                await tx.transaction.update({
                    where: { id: transaction.id },
                    data: { egresoContableId: poliza.id }
                })

                // 5b. Update Budget Execution (Devengado)
                // Find the specific budget item by COG code
                const budgetItem = await tx.clasificadorCOG.findUnique({
                    where: { codigo: data.egresoDetails.cog }
                })

                if (budgetItem) {
                    await tx.clasificadorCOG.update({
                        where: { id: budgetItem.id },
                        data: {
                            devengado: { increment: data.monto },
                            pagado: { increment: data.monto } // Assuming paid immediately
                        }
                    })

                    // Note: Ideally, we should also bubble up the 'devengado' amount to parents (Capitulo)
                    // This recursive update is complex in Prisma logic alone and might need raw SQL or separate steps.
                    // For now, we update the specific item.
                }
            }

            return transaction;
        })

        revalidatePath("/dashboard")
        revalidatePath("/cuentas")
        return { success: true, data: result }

    } catch (error: any) {
        console.error("Transaction Error:", error)
        return { success: false, error: error.message }
    }
}


// --- BUDGET MANAGEMENT HANDLER ---

export async function createBudgetItem(data: NewBudgetInput) {
    try {
        // 1. Validate Code Uniqueness
        const existing = await prisma.clasificadorCOG.findUnique({
            where: { codigo: data.codigo }
        })
        if (existing) throw new Error("El Código Presupuestal ya existe.");

        // 2. Validate Parent existence if Partida
        if (data.nivel === "Partida" || data.nivel === "Concepto") {
            if (!data.parentId) throw new Error("Debe especificar un Padre para este nivel.");
            const parent = await prisma.clasificadorCOG.findUnique({
                where: { id: data.parentId }
            })
            if (!parent) throw new Error("El Capítulo/Concepto padre no existe.");
        }

        const newItem = await prisma.clasificadorCOG.create({
            data: {
                codigo: data.codigo,
                nombre: data.descripcion, // Helper maps 'descripcion' to 'nombre'
                nivel: data.nivel,
                parentId: data.parentId,
                // ClasificadorCOG doesn't have fuenteFinanciamiento directly or it might be different?
                // Checking schema: ClasificadorCOG does NOT have fuenteFinanciamiento.
                // It has 'aprobado', 'modificado' etc.
                aprobado: data.aprobado,
                modificado: data.aprobado,
            }
        })

        revalidatePath("/presupuesto")
        return { success: true, data: newItem }

    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// --- REPORT DATA FETCHing ---

export async function getConacReportData() {
    // Fetch all items
    const items = await prisma.clasificadorCOG.findMany({
        orderBy: { codigo: 'asc' },
        include: {
            subcuentas: true // Just one level deep for now
        }
    })

    // In a real app, we might need a recursive CTE (Common Table Expression) 
    // to build the full tree if it's more than 2 levels deep.
    return items.filter(item => item.nivel === "Capitulo");
}

// ============================================
// INGRESOS CONTABLES - CRUD OPERATIONS
// ============================================

export async function getIngresos() {
    try {
        const ingresos = await prisma.ingresoContable.findMany({
            orderBy: { fecha: 'desc' }
        })
        // Convert Decimal to number for client serialization
        const serializedIngresos = ingresos.map(i => ({
            ...i,
            monto: Number(i.monto)
        }))
        return { success: true, data: serializedIngresos }
    } catch (error: any) {
        console.error("Error fetching ingresos:", error)
        return { success: false, error: error.message, data: [] }
    }
}

export async function createIngreso(data: {
    concepto: string
    fuente: string
    monto: number
    estado: string
    fecha: Date | string
    cuentaBancaria?: string
    cri?: string
    cuentaContable?: string
}) {
    try {
        const ingreso = await prisma.ingresoContable.create({
            data: {
                concepto: data.concepto,
                fuente: data.fuente,
                monto: data.monto,
                estado: data.estado,
                fecha: new Date(data.fecha),
                cuentaBancaria: data.cuentaBancaria
            }
        })
        revalidatePath("/ingresos")
        revalidatePath("/dashboard")
        return { success: true, data: { ...ingreso, monto: Number(ingreso.monto) } }
    } catch (error: any) {
        console.error("Error creating ingreso:", error)
        return { success: false, error: error.message }
    }
}

export async function updateIngreso(id: string, data: Partial<{
    concepto: string
    fuente: string
    monto: number
    estado: string
    fecha: Date | string
    cuentaBancaria?: string
}>) {
    try {
        const ingreso = await prisma.ingresoContable.update({
            where: { id },
            data: {
                ...data,
                fecha: data.fecha ? new Date(data.fecha) : undefined
            }
        })
        revalidatePath("/ingresos")
        return { success: true, data: { ...ingreso, monto: Number(ingreso.monto) } }
    } catch (error: any) {
        console.error("Error updating ingreso:", error)
        return { success: false, error: error.message }
    }
}

export async function deleteIngreso(id: string) {
    try {
        await prisma.ingresoContable.delete({ where: { id } })
        revalidatePath("/ingresos")
        return { success: true }
    } catch (error: any) {
        console.error("Error deleting ingreso:", error)
        return { success: false, error: error.message }
    }
}

// ============================================
// EGRESOS CONTABLES - CRUD OPERATIONS
// ============================================

export async function getEgresos() {
    try {
        const egresos = await prisma.egresoContable.findMany({
            orderBy: { fecha: 'desc' }
        })
        // Convert Decimal to number for client serialization
        const serializedEgresos = egresos.map(e => ({
            ...e,
            monto: Number(e.monto)
        }))
        return { success: true, data: serializedEgresos }
    } catch (error: any) {
        console.error("Error fetching egresos:", error)
        return { success: false, error: error.message, data: [] }
    }
}

export async function createEgreso(data: {
    cog: string
    cuentaContable: string
    pagueseA: string
    monto: number
    concepto: string
    fondo: string
    institucionBancaria: string
    cuentaBancaria: string
    fecha: Date | string
    tipo: string
    estatus: string
    folioOrden?: number
    polizaNumero?: string
    departamento?: string
    area?: string
}) {
    try {
        const egreso = await prisma.egresoContable.create({
            data: {
                cog: data.cog,
                cuentaContable: data.cuentaContable,
                pagueseA: data.pagueseA,
                monto: data.monto,
                concepto: data.concepto,
                fondo: data.fondo,
                institucionBancaria: data.institucionBancaria,
                cuentaBancaria: data.cuentaBancaria,
                fecha: new Date(data.fecha),
                tipo: data.tipo,
                estatus: data.estatus,
                folioOrden: data.folioOrden,
                polizaNumero: data.polizaNumero,
                departamento: data.departamento,
                area: data.area
            }
        })
        revalidatePath("/egresos")
        revalidatePath("/dashboard")
        return { success: true, data: { ...egreso, monto: Number(egreso.monto) } }
    } catch (error: any) {
        console.error("Error creating egreso:", error)
        return { success: false, error: error.message }
    }
}

export async function updateEgreso(id: string, data: Partial<{
    cog: string
    cuentaContable: string
    pagueseA: string
    monto: number
    concepto: string
    fondo: string
    institucionBancaria: string
    cuentaBancaria: string
    fecha: Date | string
    tipo: string
    estatus: string
    folioOrden?: number
    departamento?: string
    area?: string
}>) {
    try {
        const egreso = await prisma.egresoContable.update({
            where: { id },
            data: {
                ...data,
                fecha: data.fecha ? new Date(data.fecha) : undefined
            }
        })
        revalidatePath("/egresos")
        return { success: true, data: { ...egreso, monto: Number(egreso.monto) } }
    } catch (error: any) {
        console.error("Error updating egreso:", error)
        return { success: false, error: error.message }
    }
}

export async function deleteEgreso(id: string) {
    try {
        await prisma.egresoContable.delete({ where: { id } })
        revalidatePath("/egresos")
        return { success: true }
    } catch (error: any) {
        console.error("Error deleting egreso:", error)
        return { success: false, error: error.message }
    }
}

// ============================================
// FUENTES (FONDOS) - CRUD OPERATIONS
// ============================================

export async function getFuentes() {
    try {
        const fuentes = await prisma.fuente.findMany({
            orderBy: { acronimo: 'asc' }
        })
        return { success: true, data: fuentes }
    } catch (error: any) {
        console.error("Error fetching fuentes:", error)
        return { success: false, error: error.message, data: [] }
    }
}

export async function createFuente(data: {
    acronimo: string
    nombre: string
    origen: string
}) {
    try {
        const fuente = await prisma.fuente.create({
            data: {
                acronimo: data.acronimo,
                nombre: data.nombre,
                origen: data.origen
            }
        })
        revalidatePath("/catalogos/fuentes")
        return { success: true, data: fuente }
    } catch (error: any) {
        console.error("Error creating fuente:", error)
        return { success: false, error: error.message }
    }
}

export async function updateFuente(id: string, data: Partial<{
    acronimo: string
    nombre: string
    origen: string
}>) {
    try {
        const fuente = await prisma.fuente.update({
            where: { id },
            data
        })
        revalidatePath("/catalogos/fuentes")
        return { success: true, data: fuente }
    } catch (error: any) {
        console.error("Error updating fuente:", error)
        return { success: false, error: error.message }
    }
}

export async function deleteFuente(id: string) {
    try {
        await prisma.fuente.delete({ where: { id } })
        revalidatePath("/catalogos/fuentes")
        return { success: true }
    } catch (error: any) {
        console.error("Error deleting fuente:", error)
        return { success: false, error: error.message }
    }
}

// ============================================
// DEPARTAMENTOS - CRUD OPERATIONS
// ============================================

export async function getDepartamentos() {
    try {
        const departamentos = await prisma.departamento.findMany({
            orderBy: { nombre: 'asc' }
        })
        return { success: true, data: departamentos }
    } catch (error: any) {
        console.error("Error fetching departamentos:", error)
        return { success: false, error: error.message, data: [] }
    }
}

export async function createDepartamento(data: {
    nombre: string
    areas: string[]
}) {
    try {
        const departamento = await prisma.departamento.create({
            data: {
                nombre: data.nombre,
                areas: data.areas
            }
        })
        revalidatePath("/catalogos/departamentos")
        return { success: true, data: departamento }
    } catch (error: any) {
        console.error("Error creating departamento:", error)
        return { success: false, error: error.message }
    }
}

export async function updateDepartamento(id: string, data: Partial<{
    nombre: string
    areas: string[]
}>) {
    try {
        const departamento = await prisma.departamento.update({
            where: { id },
            data
        })
        revalidatePath("/catalogos/departamentos")
        return { success: true, data: departamento }
    } catch (error: any) {
        console.error("Error updating departamento:", error)
        return { success: false, error: error.message }
    }
}

export async function deleteDepartamentoAction(id: string) {
    try {
        await prisma.departamento.delete({ where: { id } })
        revalidatePath("/catalogos/departamentos")
        return { success: true }
    } catch (error: any) {
        console.error("Error deleting departamento:", error)
        return { success: false, error: error.message }
    }
}

// ============================================
// SYSTEM CONFIGURATION - CRUD OPERATIONS  
// ============================================

export async function getSystemConfig(key: string) {
    try {
        const config = await prisma.systemConfig.findUnique({
            where: { key }
        })
        return { success: true, data: config?.value || null }
    } catch (error: any) {
        console.error("Error fetching system config:", error)
        return { success: false, error: error.message, data: null }
    }
}

export async function setSystemConfig(key: string, value: string) {
    try {
        const config = await prisma.systemConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        })
        revalidatePath("/configuracion")
        return { success: true, data: config }
    } catch (error: any) {
        console.error("Error setting system config:", error)
        return { success: false, error: error.message }
    }
}

export async function getAllSystemConfig() {
    try {
        const configs = await prisma.systemConfig.findMany()
        // Convert to key-value object
        const configObject = configs.reduce((acc, config) => {
            acc[config.key] = config.value
            return acc
        }, {} as Record<string, string>)
        return { success: true, data: configObject }
    } catch (error: any) {
        console.error("Error fetching all system config:", error)
        return { success: false, error: error.message, data: {} }
    }
}

// Folio Management
export async function getNextPaymentOrderFolio() {
    try {
        const config = await prisma.systemConfig.findUnique({
            where: { key: 'nextPaymentOrderFolio' }
        })
        const folio = config?.value ? parseInt(config.value) : 1
        return { success: true, data: folio }
    } catch (error: any) {
        console.error("Error fetching next folio:", error)
        return { success: false, error: error.message, data: 1 }
    }
}

export async function incrementPaymentOrderFolio() {
    try {
        const current = await getNextPaymentOrderFolio()
        const nextFolio = (current.data || 1) + 1
        await setSystemConfig('nextPaymentOrderFolio', nextFolio.toString())
        return { success: true, data: current.data }
    } catch (error: any) {
        console.error("Error incrementing folio:", error)
        return { success: false, error: error.message }
    }
}

// ============================================
// FIRMANTES - CRUD OPERATIONS
// ============================================

export async function getFirmantes() {
    try {
        const firmantes = await prisma.firmante.findMany({
            orderBy: { nombre: 'asc' }
        })
        return { success: true, data: firmantes }
    } catch (error: any) {
        console.error("Error fetching firmantes:", error)
        return { success: false, error: error.message, data: [] }
    }
}

export async function createFirmante(data: {
    nombre: string
    puesto: string
}) {
    try {
        const firmante = await prisma.firmante.create({
            data: {
                nombre: data.nombre,
                puesto: data.puesto
            }
        })
        revalidatePath("/configuracion")
        return { success: true, data: firmante }
    } catch (error: any) {
        console.error("Error creating firmante:", error)
        return { success: false, error: error.message }
    }
}

export async function updateFirmante(id: string, data: Partial<{
    nombre: string
    puesto: string
}>) {
    try {
        const firmante = await prisma.firmante.update({
            where: { id },
            data
        })
        revalidatePath("/configuracion")
        return { success: true, data: firmante }
    } catch (error: any) {
        console.error("Error updating firmante:", error)
        return { success: false, error: error.message }
    }
}

export async function deleteFirmanteAction(id: string) {
    try {
        await prisma.firmante.delete({ where: { id } })
        revalidatePath("/configuracion")
        return { success: true }
    } catch (error: any) {
        console.error("Error deleting firmante:", error)
        return { success: false, error: error.message }
    }
}

