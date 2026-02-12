
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            config,
            fiscalConfig,
            firmantes,
            paymentOrderSigners,
            nextPaymentOrderFolio
        } = body

        // Fetch default organization
        const org = await prisma.organization.findFirst();
        if (!org) {
            return NextResponse.json({ success: false, message: "No organization found." }, { status: 400 });
        }
        const organizationId = org.id;

        //Save config (logos)
        if (config) {
            if (config.logoLeft) {
                await prisma.systemConfig.upsert({
                    where: {
                        organizationId_key: { organizationId, key: 'logoLeft' }
                    },
                    update: { value: config.logoLeft },
                    create: { key: 'logoLeft', value: config.logoLeft, organizationId }
                })
            }
            if (config.logoRight) {
                await prisma.systemConfig.upsert({
                    where: {
                        organizationId_key: { organizationId, key: 'logoRight' }
                    },
                    update: { value: config.logoRight },
                    create: { key: 'logoRight', value: config.logoRight, organizationId }
                })
            }
        }

        // Save fiscal config
        if (fiscalConfig) {
            for (const [key, value] of Object.entries(fiscalConfig)) {
                await prisma.systemConfig.upsert({
                    where: {
                        organizationId_key: { organizationId, key }
                    },
                    update: { value: value as string },
                    create: { key, value: value as string, organizationId }
                })
            }
        }

        // Save payment order signers
        if (paymentOrderSigners) {
            await prisma.systemConfig.upsert({
                where: {
                    organizationId_key: { organizationId, key: 'paymentOrderSigners' }
                },
                update: { value: JSON.stringify(paymentOrderSigners) },
                create: { key: 'paymentOrderSigners', value: JSON.stringify(paymentOrderSigners), organizationId }
            })
        }

        // Save next folio
        if (nextPaymentOrderFolio) {
            await prisma.systemConfig.upsert({
                where: {
                    organizationId_key: { organizationId, key: 'nextPaymentOrderFolio' }
                },
                update: { value: nextPaymentOrderFolio.toString() },
                create: { key: 'nextPaymentOrderFolio', value: nextPaymentOrderFolio.toString(), organizationId }
            })
        }

        // Save firmantes
        if (firmantes && Array.isArray(firmantes)) {
            for (const firmante of firmantes) {
                await prisma.firmante.create({
                    data: {
                        nombre: firmante.nombre,
                        puesto: firmante.puesto,
                        organizationId
                    }
                })
            }
        }

        return NextResponse.json({
            success: true,
            message: "Configuration migrated successfully"
        })
    } catch (error: any) {
        console.error("Migration error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
