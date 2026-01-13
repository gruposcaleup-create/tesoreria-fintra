"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Plus, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useTreasury } from "@/components/providers/treasury-context"

interface NewIngresoData {
  concepto: string
  fuente: string
  monto: number
  fecha: string
  cuentaBancaria?: string
}

interface AddIngresoDialogProps {
  onSave: (data: NewIngresoData) => void
}

export function AddIngresoDialog({ onSave }: AddIngresoDialogProps) {
  const { cuentas } = useTreasury();
  const [open, setOpen] = React.useState(false)

  const [concepto, setConcepto] = React.useState("")
  const [fuente, setFuente] = React.useState("")
  const [cuentaBancaria, setCuentaBancaria] = React.useState("")
  const [monto, setMonto] = React.useState("")
  const [fecha, setFecha] = React.useState<Date | undefined>(new Date())

  const handleSubmit = () => {
    if (!concepto || !monto || !fecha) return

    const newIngreso: NewIngresoData = {
      concepto,
      fuente: fuente || "Otros",
      monto: parseFloat(monto),
      fecha: format(fecha, "yyyy-MM-dd"),
      cuentaBancaria,
    }

    onSave(newIngreso)

    // Resetear formulario
    setConcepto("")
    setMonto("")
    setCuentaBancaria("")
    setFecha(new Date())
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Agregar Ingreso
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Ingreso</DialogTitle>
          <DialogDescription>
            Ingresa los detalles del ingreso municipal o fiscal aquí.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">

          {/* Campo: Concepto */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="concepto" className="text-right">
              Concepto
            </Label>
            <Input
              id="concepto"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Ej. Impuesto Predial"
              className="col-span-3"
            />
          </div>

          {/* Campo: Fuente */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fuente" className="text-right">
              Fuente
            </Label>
            <Select onValueChange={setFuente}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona fuente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Recursos Propios">Recursos Propios</SelectItem>
                <SelectItem value="Participaciones Federales">Participaciones Federales</SelectItem>
                <SelectItem value="Aportaciones (Ramo 33)">Aportaciones (Ramo 33)</SelectItem>
                <SelectItem value="Otros Ingresos">Otros Ingresos</SelectItem>
              </SelectContent>
            </Select>
          </div>


          {/* Campo: Cuenta Bancaria Destino */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="banco" className="text-right">
              Destino
            </Label>
            <Select onValueChange={setCuentaBancaria} value={cuentaBancaria}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleccionar Cuenta Bancaria" />
              </SelectTrigger>
              <SelectContent>
                {cuentas.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.banco} - {c.alias} (**{c.numeroCuenta.slice(-4)})
                  </SelectItem>
                ))}
                <SelectItem value="CAJA_GENERAL">Caja General (Efectivo)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campo: Monto */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="monto" className="text-right">
              Monto
            </Label>
            <Input
              id="monto"
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              className="col-span-3"
            />
          </div>

          {/* Campo: Fecha (CORREGIDO) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Fecha</Label>

            {/* CORRECCIÓN: modal={true} permite interactuar con el calendario dentro del Dialog */}
            <Popover modal={true}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  type="button"
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !fecha && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fecha ? format(fecha, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                </Button>
              </PopoverTrigger>

              {/* CORRECCIÓN: z-50 asegura que el calendario se vea por encima de todo */}
              <PopoverContent className="w-auto p-0 z-50" align="start">
                <Calendar
                  mode="single"
                  selected={fecha}
                  onSelect={setFecha}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Guardar Ingreso</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}