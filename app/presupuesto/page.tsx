import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
// Importamos tu componente de Presupuesto
import BudgetManagement from "@/components/BudgetManagement"

export default function PresupuestoPage() {
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
          {/* Aquí se renderiza tu módulo de Presupuesto */}
          <BudgetManagement />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}