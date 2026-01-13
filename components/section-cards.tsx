"use client"

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { useState, useMemo } from "react"

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TasksCard } from "@/components/tasks-card"
import { DashboardTable } from "./dashboard-table"
import { useTreasury } from "@/components/providers/treasury-context"
import { Movement } from "./dashboard-data"

export function SectionCards() {
  const { cuentas } = useTreasury();
  const [openIngresos, setOpenIngresos] = useState(false)
  const [openEgresos, setOpenEgresos] = useState(false)

  // 1. Aplanar y mapear transacciones del contexo al tipo Movement
  const allMovements: Movement[] = useMemo(() => {
    return cuentas.flatMap(account =>
      account.movimientosRecientes.map(t => ({
        id: t.id,
        date: t.fecha,
        concept: t.concepto,
        bank: account.banco as any, // Cast simple por compatibilidad de strings
        type: t.tipo as "Ingreso" | "Egreso",
        amount: t.monto,
        status: (t.estatus === "Completado" ? "Completado" : "Pendiente") as Movement["status"] // Mapeo simple de estados
      }))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [cuentas]);

  // 2. Filtrar datos para las Dialogs
  const ingresosData = allMovements.filter(m => m.type === "Ingreso");
  const egresosData = allMovements.filter(m => m.type === "Egreso");

  // 3. Calcular Totales Dinámicos
  const totalIngresos = ingresosData.reduce((acc, curr) => acc + curr.amount, 0);
  const totalEgresos = egresosData.reduce((acc, curr) => acc + curr.amount, 0);

  // Formateador de moneda
  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  return (
    <>
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">

        {/* --- TARJETA 1: INGRESOS --- */}
        <Card
          className="@container/card flex flex-col overflow-hidden h-full cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setOpenIngresos(true)}
        >
          <CardHeader className="p-4 pb-2"> {/* Padding reducido */}
            <div className="flex items-center justify-between">
              <CardDescription>Ingresos Totales</CardDescription>
              <Badge variant="outline" className="h-5 px-1.5">
                <IconTrendingUp className="mr-1 h-3 w-3" /> +12.5%
              </Badge>
            </div>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {formatCurrency(totalIngresos)}
            </CardTitle>
          </CardHeader>

          <CardContent className="px-4 pb-3 flex-1">
            <div className="flex flex-col gap-1 text-sm mb-3">
              <div className="flex items-center gap-2 font-medium text-xs">
                Pendiente corroborar <IconTrendingUp className="size-3 text-emerald-500" />
              </div>
            </div>

            {/* Lista compacta */}
            <div className="bg-muted/30 rounded-md p-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Recientes
              </p>
              <ul className="space-y-1">
                {ingresosData.slice(0, 3).map((mov, i) => (
                  <li key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground truncate">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" /> {mov.concept}
                  </li>
                ))}
                {ingresosData.length === 0 && <li className="text-[10px] text-muted-foreground">Sin movimientos recientes</li>}
              </ul>
            </div>
          </CardContent>

          <CardFooter className="px-4 py-2 bg-muted/10 border-t min-h-[40px] flex items-center">
            <div className="text-muted-foreground text-[10px]">
              Ingresos manuales y bancarios
            </div>
          </CardFooter>
        </Card>

        {/* --- TARJETA 2: EGRESOS --- */}
        <Card
          className="@container/card flex flex-col overflow-hidden h-full cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setOpenEgresos(true)}
        >
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Egresos Totales</CardDescription>
              <Badge variant="outline" className="h-5 px-1.5">
                <IconTrendingDown className="mr-1 h-3 w-3" /> -20%
              </Badge>
            </div>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {formatCurrency(totalEgresos)}
            </CardTitle>
          </CardHeader>

          <CardContent className="px-4 pb-3 flex-1">
            <div className="flex flex-col gap-1 text-sm mb-3">
              <div className="flex items-center gap-2 font-medium text-xs">
                3 pagos pendientes <IconTrendingDown className="size-3 text-red-500" />
              </div>
            </div>

            <div className="bg-muted/30 rounded-md p-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Recientes
              </p>
              <ul className="space-y-1">
                {egresosData.slice(0, 3).map((mov, i) => (
                  <li key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground truncate">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" /> {mov.concept}
                  </li>
                ))}
                {egresosData.length === 0 && <li className="text-[10px] text-muted-foreground">Sin movimientos recientes</li>}
              </ul>
            </div>
          </CardContent>

          <CardFooter className="px-4 py-2 bg-muted/10 border-t min-h-[40px] flex items-center">
            <div className="text-muted-foreground text-[10px]">
              Egresos manuales y bancarios
            </div>
          </CardFooter>
        </Card>

        {/* --- TARJETA 3: COMPROMISOS --- */}
        <Card className="@container/card flex flex-col overflow-hidden h-full">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Por vencer</CardDescription>
              <Badge variant="outline" className="h-5 px-1.5">
                <IconTrendingUp className="mr-1 h-3 w-3" /> +2%
              </Badge>
            </div>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              18
            </CardTitle>
          </CardHeader>

          <CardContent className="px-4 pb-3 flex-1">
            <div className="flex flex-col gap-1 text-sm mb-3">
              <div className="flex items-center gap-2 font-medium text-xs">
                Vence: 12/12/2025 <IconTrendingUp className="size-3 text-amber-500" />
              </div>
            </div>

            <div className="bg-muted/30 rounded-md p-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Vencimientos
              </p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2 text-[11px] text-muted-foreground truncate">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" /> Licencia Software
                </li>
                <li className="flex items-center gap-2 text-[11px] text-muted-foreground truncate">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" /> Seguro Flotilla
                </li>
                <li className="flex items-center gap-2 text-[11px] text-muted-foreground truncate">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" /> Impuestos SAT
                </li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="px-4 py-2 bg-muted/10 border-t min-h-[40px] flex items-center">
            <div className="text-muted-foreground text-[10px]">
              Documentación pendiente
            </div>
          </CardFooter>
        </Card>

        {/* --- TARJETA 4: TAREAS --- */}
        <TasksCard />

        {/* --- DIALOGS --- */}
        <Dialog open={openIngresos} onOpenChange={setOpenIngresos}>
          <DialogContent className="!max-w-[95vw] !w-[95vw] !h-[95vh] !max-h-[95vh] overflow-y-auto flex flex-col gap-0 p-0 sm:p-6">
            <DialogHeader className="mb-4">
              <DialogTitle>Detalle de Ingresos</DialogTitle>
              <DialogDescription>
                Lista de todos los movimientos registrados como Ingreso.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1">
              <DashboardTable data={ingresosData} />
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={openEgresos} onOpenChange={setOpenEgresos}>
          <DialogContent className="!max-w-[95vw] !w-[95vw] !h-[95vh] !max-h-[95vh] overflow-y-auto flex flex-col gap-0 p-0 sm:p-6">
            <DialogHeader className="mb-4">
              <DialogTitle>Detalle de Egresos</DialogTitle>
              <DialogDescription>
                Lista de todos los movimientos registrados como Egreso.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1">
              <DashboardTable data={egresosData} />
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </>
  )
}