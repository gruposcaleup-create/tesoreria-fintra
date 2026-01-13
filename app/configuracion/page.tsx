"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import SettingsModule from "@/components/SettingsModule"

export default function ConfiguracionPage() {
  // Estado para controlar la hidratación
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Si no ha montado, retornamos un contenedor vacío con el fondo slate
  // para evitar el salto visual (layout shift)
  if (!mounted) {
    return <div className="min-h-screen bg-slate-50" />
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <SettingsModule />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}