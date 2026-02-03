"use client"

import * as React from "react"
import { IconCalendar, IconArrowUpCircle, IconArrowDownCircle } from "@tabler/icons-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useTreasury } from "@/components/providers/treasury-context"

export function TasksCard() {
  const { ingresosContables, egresosContables } = useTreasury()

  // Unified Pending Tasks
  const tasks = React.useMemo(() => {
    const pendingIngresos = ingresosContables
      .filter(i => i.estado === "Pendiente")
      .map(i => ({
        id: i.id,
        title: i.concepto,
        description: `Ingreso por recaudar: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(i.monto)}`,
        date: i.fecha,
        type: "Ingreso" as const
      }));

    const pendingEgresos = egresosContables
      .filter(e => e.estatus === "Pendiente")
      .map(e => ({
        id: e.id,
        title: e.concepto,
        description: `Egreso por pagar: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(e.monto)}`,
        date: e.fecha,
        type: "Egreso" as const
      }));

    // Merge and sort by date (oldest first for urgency)
    return [...pendingIngresos, ...pendingEgresos].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [ingresosContables, egresosContables]);

  return (
    <Card className="@container/card flex flex-col overflow-hidden h-full shadow-xs">

      <CardHeader className="p-4 pb-1 relative">
        <div className="flex items-center justify-between z-10">
          <CardDescription className="text-xs font-medium">Tareas Pendientes</CardDescription>
        </div>
        <CardTitle className="text-xl font-bold tabular-nums mt-0.5">
          {tasks.length}
        </CardTitle>
      </CardHeader>

      {/* CONTENIDO (Lista con scroll) */}
      <CardContent className="px-4 pb-2 pt-1 flex-1">
        <div className="h-[125px] overflow-y-auto pr-1 space-y-3">
          {tasks.map((task, index) => (
            <div key={task.id}>
              <div className="flex items-start gap-2.5">
                <div className="mt-1 shrink-0">
                  {task.type === "Ingreso" ? <IconArrowUpCircle className="w-3 h-3 text-emerald-500" /> : <IconArrowDownCircle className="w-3 h-3 text-red-500" />}
                </div>
                <div className="grid gap-0.5 leading-none w-full">
                  <div className="flex justify-between items-start gap-2">
                    <label className="text-[11px] font-medium leading-none break-words">
                      {task.title}
                    </label>
                    <span className="shrink-0 text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                      {task.date ? format(new Date(task.date), "dd MMM", { locale: es }) : "S/F"}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-1 break-all">
                    {task.description}
                  </p>
                </div>
              </div>
              {index < tasks.length - 1 && <div className="h-px bg-border/40 mt-3" />}
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <p className="text-xs text-muted-foreground">¡Todo al día! Sin pendientes.</p>
            </div>
          )}
        </div>
      </CardContent>

      {/* FOOTER */}
      <CardFooter className="px-4 py-1.5 bg-muted/10 border-t min-h-[32px] flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground opacity-80">
          <IconCalendar className="h-3 w-3" />
          <span>Agenda financiera</span>
        </div>
      </CardFooter>
    </Card>
  )
}