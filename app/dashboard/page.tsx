import * as React from "react"
import { AppSidebar } from '@/components/app-sidebar'
import { SectionCards } from '@/components/section-cards'
import { SiteHeader } from '@/components/site-header'
import { BankCards } from "@/components/bank-cards"
import { TransfersCard } from "@/components/transfers-card"
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'

export default function DashboardPage() {
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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

              <div className="px-4 lg:px-6">
                <h2 className="text-lg font-semibold mb-4">Mis Cuentas</h2>
                <BankCards />
              </div>

              <SectionCards />

              <div className="px-4 lg:px-6">
                <TransfersCard />
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}