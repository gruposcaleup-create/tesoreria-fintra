"use client"

import * as React from "react"
import {
  IconChevronLeft,
  IconChevronRight,
  IconDotsVertical,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconBuildingBank,
  IconSearch,
  IconFilter,
  IconX,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Movement } from "./dashboard-data"

// --- DEFINICIÓN DE COLUMNAS ---
export const columns: ColumnDef<Movement>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "date",
    header: "Fecha",
    cell: ({ row }) => <div className="text-xs text-muted-foreground font-mono">{row.getValue("date") as string}</div>,
  },
  {
    accessorKey: "concept",
    header: "Concepto",
    cell: ({ row }) => <div className="font-medium text-sm">{row.getValue("concept") as string}</div>,
  },
  {
    accessorKey: "bank",
    header: "Banco",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-sm">
        <IconBuildingBank className="h-3 w-3 text-muted-foreground" />
        <span>{row.getValue("bank") as string}</span>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const type = row.getValue("type") as string
      return (
        <Badge
          variant="outline"
          className={`gap-1 pr-2 font-normal ${type === "Ingreso"
            ? "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
            : "text-red-600 bg-red-50 border-red-200 hover:bg-red-100"
            }`}
        >
          {type === "Ingreso" ? <IconArrowUpRight className="h-3 w-3" /> : <IconArrowDownLeft className="h-3 w-3" />}
          {type}
        </Badge>
      )
    },
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Monto</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount") as string)
      const type = row.original.type

      const formatted = new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
      }).format(amount)

      return (
        <div className={`text-right font-mono font-medium ${type === "Ingreso" ? "text-emerald-600" : "text-foreground"}`}>
          {type === "Ingreso" ? "+" : "-"}{formatted}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      let variantClass = "bg-slate-100 text-slate-700 border-slate-200" // Default

      if (status === "Completado") variantClass = "bg-emerald-50 text-emerald-700 border-emerald-200"
      if (status === "Pendiente") variantClass = "bg-yellow-50 text-yellow-700 border-yellow-200"
      if (status === "Rechazado") variantClass = "bg-red-50 text-red-700 border-red-200"

      return (
        <Badge variant="outline" className={`font-normal text-xs ${variantClass}`}>
          {status}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menú</span>
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.id)}>Copiar ID</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Ver detalles</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

interface DashboardTableProps {
  data: Movement[]
}

// --- COMPONENTE PRINCIPAL ---
export function DashboardTable({ data }: DashboardTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // Filtros únicos para el dropdown
  const uniqueBanks = Array.from(new Set(data.map(item => item.bank)))
  const uniqueStatuses = Array.from(new Set(data.map(item => item.status)))

  return (
    <div className="w-full space-y-4">

      {/* BARRA SUPERIOR: Buscador y Filtros */}
      <div className="flex items-center justify-between py-4">

        {/* Buscador alineado a la izquierda */}
        <div className="relative w-full max-w-sm">
          <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar concepto..."
            value={(table.getColumn("concept")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("concept")?.setFilterValue(event.target.value)
            }
            className="pl-8 h-9"
          />
        </div>

        {/* Botón de Filtros */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <IconFilter className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filtros</span>
              {(!!table.getColumn("bank")?.getFilterValue() || !!table.getColumn("status")?.getFilterValue()) && (
                <span className="flex h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filtrar por Banco</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {uniqueBanks.map((bank) => (
              <DropdownMenuCheckboxItem
                key={bank}
                checked={table.getColumn("bank")?.getFilterValue() === bank}
                onCheckedChange={(checked) => {
                  table.getColumn("bank")?.setFilterValue(checked ? bank : undefined)
                }}
              >
                {bank}
              </DropdownMenuCheckboxItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Filtrar por Estado</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {uniqueStatuses.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={table.getColumn("status")?.getFilterValue() === status}
                onCheckedChange={(checked) => {
                  table.getColumn("status")?.setFilterValue(checked ? status : undefined)
                }}
              >
                {status}
              </DropdownMenuCheckboxItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-center text-sm font-medium text-destructive focus:text-destructive"
              onClick={() => table.resetColumnFilters()}
            >
              <IconX className="mr-2 h-4 w-4" />
              Limpiar filtros
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* TABLA */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No se encontraron resultados.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINACIÓN */}
      <div className="flex items-center justify-end space-x-2 py-2">
        <div className="flex-1 text-xs text-muted-foreground">{table.getFilteredSelectedRowModel().rows.length} de {table.getFilteredRowModel().rows.length} fila(s).</div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="h-8 w-8 p-0"><IconChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="h-8 w-8 p-0"><IconChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  )
}