"use client"

import * as React from "react"
import { usePathname } from "next/navigation" // <--- IMPORTANTE
import {
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFolder,
  IconHelp,
  IconListDetails,
  IconReport,
  IconSettings,
  IconUsers,
  IconMail,
  IconBuildingBank,
  IconListTree,
  IconCoins,
} from "@tabler/icons-react"
import Link from "next/link"

import { NavDocuments } from '@/components/nav-documents'
import { NavMain } from '@/components/nav-main'
import { NavSecondary } from '@/components/nav-secondary'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

// Definimos los datos base (sin isActive fijo)
const baseData = {
  user: {
    name: "Tesorero",
    email: "tesoreria@municipio.gob.mx",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Bancos y Cuentas",
      url: "/bancos", // Base URL para lógica
      icon: IconBuildingBank,
      items: [
        { title: "Cuentas y Saldos", url: "/bancos" },
        { title: "Movimientos Bancarios", url: "/bancos/movimientos" },
      ],
    },
    {
      title: "Ingresos contables",
      url: "/ingresos",
      icon: IconListDetails,
    },
    {
      title: "Egresos contables",
      url: "/egresos",
      icon: IconChartBar,
    },
    // --- CATÁLOGOS MAESTROS ---
    {
      title: "Catálogos Maestros",
      url: "/catalogos", // Base URL para lógica
      icon: IconDatabase,
      items: [
        { title: "Clasificador (COG)", url: "/catalogos/partidas" },
        { title: "Clasificador (CRI)", url: "/catalogos/cri" },
        { title: "Fuentes y Fondos", url: "/catalogos/fuentes" },
        { title: "Programas Sociales", url: "/catalogos/programas" },
        { title: "Departamentos", url: "/catalogos/departamentos" },
      ],
    },
    // --------------------------
    {
      title: "Compromisos de pago",
      url: "/compromisos",
      icon: IconFolder,
    },
    {
      title: "Conciliacion Bancaria",
      url: "/conciliacion",
      icon: IconUsers,
    },
  ],
  navSecondary: [
    { title: "Reportes", url: "#", icon: IconHelp },
    { title: "Configuración", url: "/configuracion", icon: IconSettings },
  ],
  documents: [
    { name: "Presupuesto", url: "/presupuesto", icon: IconListTree },
    { name: "Ley de Ingresos", url: "/presupuesto/ley-ingresos", icon: IconCoins },
    { name: "Presupuesto de Egresos", url: "/presupuesto/presupuesto-egresos", icon: IconCoins },
    { name: "Proveedores", url: "/proveedores", icon: IconReport },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname() // Obtenemos la ruta actual

  // Lógica Dinámica: Activamos el menú si la ruta actual coincide con la del item
  const navMainWithActiveState = baseData.navMain.map((item) => ({
    ...item,
    // Está activo si: Tiene subitems Y la ruta actual empieza con la url del padre
    isActive: item.items ? pathname.startsWith(item.url) : pathname === item.url,
  }))

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5! flex-1">
              <Link href="/dashboard">
                <img src="/logompv.png" alt="Logo" className="size-10!" />
                <span className="text-base font-bold tracking-tight">Fintra.</span>
              </Link>
            </SidebarMenuButton>
            <SidebarMenuButton asChild className="flex shrink-0 size-8 items-center justify-center rounded-full hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden">
              <Link href="/chat"><IconMail className="size-4 text-muted-foreground" /></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Pasamos los datos calculados dinámicamente */}
        <NavMain items={navMainWithActiveState} />
        <NavDocuments items={baseData.documents} />
        <NavSecondary items={baseData.navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={baseData.user} />
      </SidebarFooter>
    </Sidebar>
  )
}