"use client"

import React from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AddIngresoDialog } from "@/components/add-ingreso-dialog"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { BankCards } from "@/components/bank-cards"
import { useTreasury, IngresoContable } from "@/components/providers/treasury-context"
import { useRouter } from "next/navigation"
import { IncomeReportDialog } from "@/components/income-report-dialog"

import {
  Check,
  X,
  MoreHorizontal,
  FileText,
  Printer
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// 2. Columnas (usando tipo del contexto)
// Define actions logic inside component to access context, or pass handlers
// But table columns are static. We can use a custom cell renderer that consumes context?
// Actually, standard way is defining columns inside component or passing handlers.
// For simplicity, I will move columns definition INSIDE the component using useMemo, 
// OR keep it outside but the cell renderer for 'actions/validacion' will need a wrapper or I use `meta` feature.
// Simplest given current setup: Move columns inside component.

// Removing static columns definition


export default function IngresosPage() {
  const { ingresosContables, setIngresosContables, approveTransaction, rejectTransaction, updateLeyIngresosFromIngreso } = useTreasury();
  const [confirmAction, setConfirmAction] = React.useState<{ id: string, type: "Ingreso" | "Egreso", action: "approve" | "reject" } | null>(null);
  const [selectedIngresoForReport, setSelectedIngresoForReport] = React.useState<IngresoContable | null>(null);
  const [editingIngreso, setEditingIngreso] = React.useState<IngresoContable | null>(null);
  const router = useRouter();

  const handleActionClick = (id: string, type: "Ingreso" | "Egreso", action: "approve" | "reject") => {
    setConfirmAction({ id, type, action });
  }

  const confirmAndExecute = () => {
    if (!confirmAction) return;
    if (confirmAction.action === "approve") {
      approveTransaction(confirmAction.id, confirmAction.type);
    } else {
      rejectTransaction(confirmAction.id, confirmAction.type);
    }
    setConfirmAction(null);
  }

  // Función que recibe los datos del Modal y actualiza la tabla (global)
  const handleAddIngreso = (newIngreso: { concepto: string, fuente: string, monto: number, fecha: string, cuentaBancaria?: string, cri?: string, cuentaContable?: string, reporteAdicional?: any }) => {
    const newItem: IngresoContable = {
      id: Math.random().toString(36).substr(2, 9), // ID temporal aleatorio
      ...newIngreso,
      estado: "Pendiente" // Por defecto entra como pendiente
    }

    // Agregamos el nuevo item al principio de la lista global
    setIngresosContables([newItem, ...ingresosContables])

    // Actualizar la Ley de Ingresos si tenemos cuenta contable
    if (newIngreso.cuentaContable) {
      updateLeyIngresosFromIngreso(newIngreso.cuentaContable, newIngreso.monto, newIngreso.fecha)
    }
  }

  const columns = React.useMemo<ColumnDef<IngresoContable>[]>(() => [
    {
      accessorKey: "concepto",
      header: "Concepto / Descripción",
    },
    {
      accessorKey: "fuente",
      header: "Fuente / Origen",
    },
    {
      accessorKey: "fecha",
      header: "Fecha",
    },
    {
      id: "validacion",
      header: "Validación",
      cell: ({ row }) => {
        const ingreso = row.original;

        // Normalize status check (handling 'estatus' vs 'estado' confusion if any, but type says 'estado')
        const estado = ingreso.estado || "Pendiente";

        if (estado === "Pendiente") {
          return (
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                onClick={() => handleActionClick(ingreso.id, "Ingreso", "approve")}
                title="Aprobar e Integrar a Banco"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                onClick={() => handleActionClick(ingreso.id, "Ingreso", "reject")}
                title="Cancelar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )
        }
        if (estado === "Completado") {
          return (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
              <Check className="h-3 w-3" /> Completado
            </Badge>
          )
        }
        // Using "Procesando" as cancelled equivalent from context logic, or just fallback
        if (estado === "Procesando" || (estado as string) === "Cancelado") {
          return (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
              <X className="h-3 w-3" /> Cancelado
            </Badge>
          )
        }
        return null;
      }
    },
    {
      accessorKey: "monto",
      header: () => <div className="text-right">Monto</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("monto"))
        const formatted = new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "MXN",
        }).format(amount)
        return <div className="text-right font-medium text-green-600">{formatted}</div>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const ingreso = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setEditingIngreso(ingreso)}
                className="cursor-pointer text-blue-600 focus:bg-blue-50"
              >
                <FileText className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const highlightValue = ingreso.cuentaContable || ingreso.cri || '';
                  if (highlightValue) {
                    router.push(`/presupuesto/ley-ingresos?highlight=${highlightValue}`)
                  }
                }}
                className="cursor-pointer text-blue-700 focus:bg-blue-50"
              >
                <FileText className="mr-2 h-4 w-4" /> Ver en Ley de Ingresos
              </DropdownMenuItem>
              {ingreso.reporteAdicional && (
                <DropdownMenuItem
                  onClick={() => setSelectedIngresoForReport(ingreso)}
                  className="cursor-pointer text-slate-700 focus:bg-slate-50"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  {ingreso.reporteAdicional.tipo === 'predial' ? "Ver reporte predial" : "Ver reporte de ingreso"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ], [ingresosContables, router]);

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">

          {/* SECCIÓN 1: Tarjetas Bancarias (Vista Contable / Saldos Oficiales) */}
          <div className="py-4">
            <BankCards
              title="Disponibilidad en Bancos (Saldos Contables)"
              hideHeader={false}
              className="mb-2"
              showAccountingBalance={true}
              enableModal={false}
            />
          </div>

          <Separator />

          {/* SECCIÓN 2: Tabla de Registro de Ingresos Contables */}
          <div className="flex items-center justify-between space-y-2 py-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Ingresos Contables (Pre-Bancarios)</h2>
              <p className="text-muted-foreground">
                Registro de ingresos previos a su reflejo oficial en estados de cuenta bancarios.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <AddIngresoDialog onSave={handleAddIngreso} />
            </div>
          </div>

          <div className="h-full flex-1 flex-col space-y-8 md:flex py-4">
            <DataTable columns={columns} data={ingresosContables} searchKey="concepto" />
          </div>
        </div>

        <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmAction?.action === "approve" ? "¿Confirmar Ingreso?" : "¿Cancelar Ingreso?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAction?.action === "approve"
                  ? "Esta acción marcará el ingreso como completado y sumará el monto a la cuenta bancaria de destino."
                  : "Esta acción cancelará el registro del ingreso."}
                <br /><br />
                ¿Estás seguro de continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Volver</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmAndExecute}
                className={confirmAction?.action === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
              >
                {confirmAction?.action === "approve" ? "Aprobar e Integrar" : "Confirmar Cancelación"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <IncomeReportDialog
          open={!!selectedIngresoForReport}
          onOpenChange={(open) => !open && setSelectedIngresoForReport(null)}
          ingreso={selectedIngresoForReport}
        />

        {/* Dialogo de Edición */}
        {editingIngreso && (
          <AddIngresoDialog
            open={!!editingIngreso}
            onOpenChange={(open) => !open && setEditingIngreso(null)}
            initialData={editingIngreso}
            onSave={(updatedData) => {
              const updatedIngreso: IngresoContable = {
                ...editingIngreso,
                ...(updatedData as any),
                // Mantener estado original o resetear? Generalmente al editar se mantiene, salvo que cambie algo critico.
                // Si el monto cambia, la validación debería re-hacerse?
                // Por simplicidad mantenemos el ID y actualizamos datos.
              }

              setIngresosContables(prev => prev.map(item => item.id === editingIngreso.id ? updatedIngreso : item))
              setEditingIngreso(null)
            }}
          />
        )}
      </SidebarInset >
    </SidebarProvider >
  )
}