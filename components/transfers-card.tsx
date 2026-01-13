"use client"

import { ArrowUpRight, ArrowDownLeft } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useTreasury } from "@/components/providers/treasury-context"

export function TransfersCard() {
  const { cuentas } = useTreasury()

  // Obtener todos los movimientos recientes de todas las cuentas
  const allMovements = cuentas.flatMap(cuenta =>
    cuenta.movimientosRecientes.map(mov => ({
      ...mov,
      cuenta: cuenta.alias
    }))
  )

  // Ordenar por fecha (más reciente primero) y tomar los últimos 5
  const recentMovements = allMovements
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 5)

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Transferencias Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        {recentMovements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">No hay movimientos registrados</p>
            <p className="text-xs text-muted-foreground mt-1">Los movimientos aparecerán aquí cuando se registren transacciones</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {recentMovements.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${item.tipo === 'Ingreso' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {item.tipo === 'Ingreso' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">{item.concepto}</p>
                    <p className="text-xs text-muted-foreground">{new Date(item.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} • {item.cuenta}</p>
                  </div>
                </div>
                <div className={`font-medium ${item.tipo === 'Ingreso' ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                  {item.tipo === 'Egreso' ? '-' : '+'}{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.monto)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}