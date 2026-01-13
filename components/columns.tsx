"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

// Definimos el tipo de dato para una transacción bancaria
export type Transaction = {
  id: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
  description: string // Concepto
  date: string // Fecha
  type: "income" | "expense" // Para saber si es ingreso o egreso
}

export const columns: ColumnDef<Transaction>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  // Columna: ESTADO
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === "success" ? "default" : "secondary"}>
          {status}
        </Badge>
      )
    },
  },
  // Columna: CONCEPTO (Descripción)
  {
    accessorKey: "description",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Concepto
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
        // Icono visual para ingreso vs egreso
        const type = row.original.type
        return (
            <div className="flex items-center gap-2">
                {type === 'income' 
                    ? <ArrowUpCircle className="h-4 w-4 text-green-500" /> 
                    : <ArrowDownCircle className="h-4 w-4 text-red-500" />
                }
                <span className="font-medium">{row.getValue("description")}</span>
            </div>
        )
    },
  },
  // Columna: FECHA
  {
    accessorKey: "date",
    header: "Fecha",
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("date")}</div>,
  },
  // Columna: MONTO (Formateado)
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Monto</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const type = row.original.type
 
      const formatted = new Intl.NumberFormat("es-MX", { // O en-US según prefieras
        style: "currency",
        currency: "USD",
      }).format(amount)
 
      // Color verde para ingresos, rojo para egresos (opcional)
      const colorClass = type === 'income' ? "text-green-600" : "text-red-600"

      return <div className={`text-right font-medium ${colorClass}`}>{type === 'expense' ? '-' : '+'}{formatted}</div>
    },
  },
  // Columna: ACCIONES
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const transaction = row.original
 
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(transaction.id)}
            >
              Copiar ID Transacción
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Ver detalles</DropdownMenuItem>
            <DropdownMenuItem>Descargar factura</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]