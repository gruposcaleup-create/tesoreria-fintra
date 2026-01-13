import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
// Importamos el componente que ya tienes listo
import SupplierManagement from "@/components/SupplierManagement"

export default function ProveedoresPage() {
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
          {/* Aquí cargamos tu módulo de Proveedores */}
          <SupplierManagement />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}