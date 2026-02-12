"use client"

import React from "react"
import { useParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Cap1000Table } from "@/components/cap1000-table"
import { Cap2000Table } from "@/components/cap2000-table"
import { Cap3000Table } from "@/components/cap3000-table"
import { Cap4000Table } from "@/components/cap4000-table"
import { Cap5000Table } from "@/components/cap5000-table"
import { Cap6000Table } from "@/components/cap6000-table"
import { Cap7000Table } from "@/components/cap7000-table"
import { Cap8000Table } from "@/components/cap8000-table"
import { Cap9000Table } from "@/components/cap9000-table"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// Map slug → display title
const SLUG_TITLES: Record<string, string> = {
    "cap-1000": "CAP.1000 — Servicios Personales",
    "cap-2000": "CAP.2000 — Materiales y Suministros",
    "cap-3000": "CAP.3000 — Servicios Generales",
    "cap-4000": "CAP.4000 — Transferencias y Subsidios",
    "cap-5000": "CAP.5000 — Bienes Muebles e Inmuebles",
    "cap-6000": "CAP.6000 — Inversión Pública",
    "cap-7000": "CAP.7000 — Inversiones Financieras",
    "cap-8000": "CAP.8000 — Participaciones y Aportaciones",
    "cap-9000": "CAP.9000 — Deuda Pública",
}

function SlugContent({ slug }: { slug: string }) {
    if (slug === "cap-1000") return <Cap1000Table />
    if (slug === "cap-2000") return <Cap2000Table />
    if (slug === "cap-3000") return <Cap3000Table />
    if (slug === "cap-4000") return <Cap4000Table />
    if (slug === "cap-5000") return <Cap5000Table />
    if (slug === "cap-6000") return <Cap6000Table />
    if (slug === "cap-7000") return <Cap7000Table />
    if (slug === "cap-8000") return <Cap8000Table />
    if (slug === "cap-9000") return <Cap9000Table />

    return (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            <p className="text-sm">Vista para <strong>{SLUG_TITLES[slug] || slug.toUpperCase()}</strong> — en desarrollo.</p>
        </div>
    )
}

export default function ReporteCapituloPage() {
    const params = useParams<{ slug: string }>()
    const slug = params.slug
    const title = SLUG_TITLES[slug] || `Reporte ASF: ${slug.toUpperCase()}`

    return (
        <SidebarProvider
            style={{
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties}
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {/* Breadcrumb */}
                    <Breadcrumb className="py-2">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">Inicio</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/reportes-asf">Reportes ASF</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{title}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title */}
                    <div className="space-y-1">
                        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
                        <p className="text-sm text-muted-foreground">
                            Anexo de registros contables conforme al formato de la Auditoría Superior de la Federación.
                        </p>
                    </div>

                    {/* Content */}
                    <div className="rounded-lg border bg-card p-4 shadow-sm">
                        <SlugContent slug={slug} />
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
