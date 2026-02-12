"use client"

import React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { GlobalASFTable } from "@/components/global-asf-table"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default function ReportesASFPage() {
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
                                <BreadcrumbPage>Global ASF</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title */}
                    <div className="space-y-1">
                        <h1 className="text-xl font-bold tracking-tight">Formatos ASF — Global</h1>
                        <p className="text-sm text-muted-foreground">
                            Vista consolidada ANEXO 6: Egresos por capítulo de gasto y mes, conforme al formato de la Auditoría Superior de la Federación.
                        </p>
                    </div>

                    {/* ASF Table */}
                    <div className="rounded-lg border bg-card p-4 shadow-sm">
                        <GlobalASFTable />
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
