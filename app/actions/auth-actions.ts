'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', { ...Object.fromEntries(formData), redirect: true, redirectTo: '/' });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Credenciales inválidas.';
                default:
                    return 'Algo salió mal.';
            }
        }
        throw error;
    }
}

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

// Master Organization ID — holds the standard CONAC catalogs
const MASTER_ORG_ID = '00000000-0000-0000-0000-000000000001'

const RegisterSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    email: z.string().email("Correo inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

// ─────────────────────────────────────────────────────────────
// Helper: Clone a hierarchical catalog (COG or CRI) from the
// master org into a new org, preserving parent/child structure.
// ─────────────────────────────────────────────────────────────
async function cloneHierarchicalCatalog(
    tx: any,
    model: 'clasificadorCOG' | 'clasificadorCRI',
    newOrgId: string,
) {
    // 1. Fetch ALL rows from the master organization
    const masterRows: any[] = await tx[model].findMany({
        where: { organizationId: MASTER_ORG_ID, deletedAt: null },
        orderBy: { codigo: 'asc' },
    })

    if (masterRows.length === 0) {
        console.log(`⚠️  No master data found for ${model}, skipping clone.`)
        return
    }

    // 2. Build parent→children adjacency + identify roots
    const childrenMap = new Map<string | null, any[]>()
    for (const row of masterRows) {
        const key = row.parentId ?? null
        if (!childrenMap.has(key)) childrenMap.set(key, [])
        childrenMap.get(key)!.push(row)
    }

    // 3. BFS: process roots first, then children, then grandchildren...
    //    maintaining an oldId → newId map for parentId remapping.
    const idMap = new Map<string, string>() // oldId → newId

    const queue: (string | null)[] = [null] // start with roots (parentId = null)

    while (queue.length > 0) {
        const currentParentOldId = queue.shift()!
        const children = childrenMap.get(currentParentOldId) ?? []

        for (const row of children) {
            const newParentId = currentParentOldId === null
                ? null
                : idMap.get(currentParentOldId) ?? null

            // Build the data payload — only structural + identity fields, zero out balances
            const createData: any = {
                organizationId: newOrgId,
                codigo: row.codigo,
                nombre: row.nombre,
                nivel: row.nivel,
                parentId: newParentId,
                // Budget fields → all zeroed out
                aprobado: 0,
                modificado: 0,
            }

            // Model-specific fields
            if (model === 'clasificadorCOG') {
                createData.cog = row.cog
                createData.cuenta_registro = row.cuenta_registro
                createData.devengado = 0
                createData.pagado = 0
            } else {
                // CRI
                createData.cri = row.cri
                createData.cuenta_de_registro = row.cuenta_de_registro
                createData.recaudado = 0
            }

            const created = await tx[model].create({ data: createData })
            idMap.set(row.id, created.id)

            // If this node has children, enqueue it for processing
            if (childrenMap.has(row.id)) {
                queue.push(row.id)
            }
        }
    }

    console.log(`✅ Cloned ${idMap.size} ${model} records for org ${newOrgId}`)
}

// ─────────────────────────────────────────────────────────────
// Helper: Clone Fuentes de Financiamiento (flat, no hierarchy)
// ─────────────────────────────────────────────────────────────
async function cloneFuentes(tx: any, newOrgId: string) {
    const masterFuentes: any[] = await tx.fuente.findMany({
        where: { organizationId: MASTER_ORG_ID, deletedAt: null },
    })

    if (masterFuentes.length === 0) {
        console.log('⚠️  No master Fuentes found, skipping clone.')
        return
    }

    for (const fuente of masterFuentes) {
        await tx.fuente.create({
            data: {
                organizationId: newOrgId,
                acronimo: fuente.acronimo,
                nombre: fuente.nombre,
                origen: fuente.origen,
            },
        })
    }

    console.log(`✅ Cloned ${masterFuentes.length} Fuentes for org ${newOrgId}`)
}

// ─────────────────────────────────────────────────────────────
// REGISTER — Creates Org + User + Clones Master Catalogs
// ─────────────────────────────────────────────────────────────
export async function register(prevState: string | undefined, formData: FormData) {
    const validatedFields = RegisterSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedFields.success) {
        return "Campos inválidos. Revisa los datos."
    }

    const { name, email, password } = validatedFields.data

    try {
        const userExists = await (prisma as any).user.findUnique({
            where: { email },
        })

        if (userExists) {
            return "El correo ya está registrado."
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        // Multi-tenancy: Create Org + User + Clone Catalogs in a single transaction
        await prisma.$transaction(async (tx: any) => {
            // 1. Create Organization
            const newOrg = await tx.organization.create({
                data: {
                    name: `Organización de ${name}`,
                },
            });

            // 2. Create User linked to Organization
            await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: 'admin', // Creator is Admin
                    organizationId: newOrg.id,
                },
            });

            // 3. Clone master catalogs into the new organization
            console.log(`🔄 Cloning catalogs for new org: ${newOrg.id}...`)
            await cloneHierarchicalCatalog(tx, 'clasificadorCOG', newOrg.id)
            await cloneHierarchicalCatalog(tx, 'clasificadorCRI', newOrg.id)
            await cloneFuentes(tx, newOrg.id)
            console.log(`🎉 Catalog cloning complete for org: ${newOrg.id}`)
        }, {
            timeout: 30000, // 30s timeout for the full transaction
        });

        return "Usuario y Organización creados exitosamente."
    } catch (error) {
        console.error("Registration error:", error)
        if (error instanceof Error) {
            return `Error detallado: ${error.message}`
        }
        return "Error al crear el usuario."
    }
}

export async function signOutAction() {
    await signOut();
}
