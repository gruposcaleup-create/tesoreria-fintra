import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// -----------------------------------------------------------------------------
// EXTENDED PRISMA CLIENT WITH SOFT DELETE
// -----------------------------------------------------------------------------
// This extension automatically:
// 1. Converts delete/deleteMany -> update/updateMany (sets deletedAt = now)
// 2. Filters out deleted records from findUnique/findFirst/findMany/count
// -----------------------------------------------------------------------------

function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL
    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)

    // Create base client with log options
    const client = new PrismaClient({
        log: ['query', 'error', 'warn'],
        adapter,
    })

    // Return extended client
    return client.$extends({
        query: {
            $allModels: {
                async delete({ model, args, query }) {
                    const modelName = model // e.g. 'User'

                    // Access delegate with correct casing
                    const delegate = (client as any)[modelName] || (client as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)]

                    if (!delegate || typeof delegate.update !== 'function') {
                        // Fallback to hard delete if update is not supported (unlikely since we added deletedAt)
                        // Or throw to prevent data loss if we expect soft delete
                        console.error(`SOFT DELETE ERROR: Delegate not found for ${modelName}`, { modelName })
                        throw new Error(`Soft Delete Extension: Model delegate for ${model} not found or update method missing.`)
                    }

                    // Transform delete to update
                    return delegate.update({
                        ...args,
                        data: { deletedAt: new Date() },
                    })
                },
                async deleteMany({ model, args, query }) {
                    const modelName = model
                    const delegate = (client as any)[modelName] || (client as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)]

                    if (!delegate || typeof delegate.updateMany !== 'function') {
                        console.error(`SOFT DELETE ERROR: Delegate not found for ${modelName}`, { modelName })
                        throw new Error(`Soft Delete Extension: Model delegate for ${model} not found or updateMany method missing.`)
                    }

                    // Transform deleteMany to updateMany
                    return delegate.updateMany({
                        ...args,
                        data: { deletedAt: new Date() },
                    })
                },
                async findUnique({ model, args, query }) {
                    (args.where as any) = { ...args.where, deletedAt: null }
                    return query(args)
                },
                async findFirst({ model, args, query }) {
                    (args.where as any) = { ...args.where, deletedAt: null }
                    return query(args)
                },
                async findMany({ model, args, query }) {
                    (args.where as any) = { ...args.where, deletedAt: null }
                    return query(args)
                },
                async count({ model, args, query }) {
                    (args.where as any) = { ...args.where, deletedAt: null }
                    return query(args)
                },
            },
        },
    })
}

// Return type extraction for the extended client
export type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>

const globalForPrisma = global as unknown as { prisma: ExtendedPrismaClient }

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
