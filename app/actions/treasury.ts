"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { PresupuestoItem, Prisma } from "@prisma/client"

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
                        origenBancario: true,
                        // Link implicitly or explicitly if schema supports 1-1
                        // bankTransaction: { connect: { id: transaction.id } } 
                    }
                })

                // Link transaction to egreso
                await tx.transaction.update({
                    where: { id: transaction.id },
                    data: { egresoContableId: poliza.id }
                })

                // 5b. Update Budget Execution (Devengado)
                // Find the specific budget item by COG code
                const budgetItem = await tx.presupuestoItem.findUnique({
                    where: { codigo: data.egresoDetails.cog }
                })

                if (budgetItem) {
                    await tx.presupuestoItem.update({
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
        const existing = await prisma.presupuestoItem.findUnique({
            where: { codigo: data.codigo }
        })
        if (existing) throw new Error("El Código Presupuestal ya existe.");

        // 2. Validate Parent existence if Partida
        if (data.nivel === "Partida" || data.nivel === "Concepto") {
            if (!data.parentId) throw new Error("Debe especificar un Padre para este nivel.");
            const parent = await prisma.presupuestoItem.findUnique({
                where: { id: data.parentId }
            })
            if (!parent) throw new Error("El Capítulo/Concepto padre no existe.");
        }

        const newItem = await prisma.presupuestoItem.create({
            data: {
                codigo: data.codigo,
                descripcion: data.descripcion,
                nivel: data.nivel,
                parentId: data.parentId,
                fuenteFinanciamiento: data.fuenteFinanciamiento,
                aprobado: data.aprobado,
                modificado: data.aprobado, // Init modified = approved
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
    // Fetch all items, ideally we want them ordered by Code
    const items = await prisma.presupuestoItem.findMany({
        orderBy: { codigo: 'asc' },
        include: {
            subcuentas: true // Just one level deep for now
        }
    })

    // In a real app, we might need a recursive CTE (Common Table Expression) 
    // to build the full tree if it's more than 2 levels deep.
    return items.filter(item => item.nivel === "Capitulo");
}
