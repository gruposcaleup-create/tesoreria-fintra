import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function ConciliacionPage() {
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
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <h2 className="text-2xl font-semibold">Conciliación Bancaria</h2>
            <p className="text-lg">(Estará disponible muy pronto)</p>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}