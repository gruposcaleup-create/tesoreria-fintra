import { useState } from "react"
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
import { PlusCircle, Hash, BookOpen } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTreasury, PresupuestoItem } from "@/components/providers/treasury-context"

// Reusable form component
export function EgresoFormFields({
  formData,
  handleChange,
  handleSelectChange,
  presupuesto,
  fuentes,
  selectedCapitulo,
  setSelectedCapitulo
}: {
  formData: any,
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  handleSelectChange: (name: string, value: string) => void,
  presupuesto: PresupuestoItem[],
  fuentes: any[],
  selectedCapitulo: string,
  setSelectedCapitulo: (val: string) => void
}) {
  return (
    <div className="grid gap-4 py-4">
      {/* SECCIÓN CONTABLE - CAPÍTULO Y PARTIDA */}
      <div className="grid grid-cols-2 gap-4 pb-2">
        <div className="grid gap-2">
          <Label htmlFor="capitulo" className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-200">
            Capítulo
          </Label>
          <Select
            value={selectedCapitulo}
            onValueChange={(val) => {
              setSelectedCapitulo(val);
              handleSelectChange("cog", "");
            }}
          >
            <SelectTrigger className="font-mono text-xs">
              <SelectValue placeholder="Seleccionar capítulo" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {presupuesto.filter((p: PresupuestoItem) => p.nivel === "Capitulo").map((cap: PresupuestoItem) => (
                <SelectItem key={cap.codigo} value={cap.codigo}>
                  {cap.codigo} - {cap.descripcion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cog" className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-200">
            Partida Genérica
          </Label>
          <Select
            value={formData.cog}
            onValueChange={(val) => handleSelectChange("cog", val)}
            disabled={!selectedCapitulo}
            required
          >
            <SelectTrigger className="font-mono text-xs">
              <SelectValue placeholder={selectedCapitulo ? "Seleccionar partida" : "Seleccione capítulo primero"} />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {selectedCapitulo && presupuesto
                .find((c: PresupuestoItem) => c.codigo === selectedCapitulo)
                ?.subcuentas?.map((item: PresupuestoItem) => (
                  <SelectItem key={item.codigo} value={item.codigo}>
                    {item.codigo} - {item.descripcion}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* SECCIÓN CONTABLE - CUENTA Y FECHA */}
      <div className="grid grid-cols-2 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-2">
        <div className="grid gap-2">
          <Label htmlFor="cuentaContable" className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-200">
            Cuenta Contable
          </Label>
          <div className="relative">
            <BookOpen className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              id="cuentaContable"
              name="cuentaContable"
              value={formData.cuentaContable}
              onChange={handleChange}
              placeholder="Ej. 5121-01-01"
              className="pl-9 font-mono text-xs"
              required
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="fecha" className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-200">Fecha</Label>
          <Input id="fecha" name="fecha" type="date" value={formData.fecha} onChange={handleChange} required />
        </div>
      </div>

      {/* SECCIÓN GENERAL (Reorganizada) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="monto" className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-200">Monto</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 font-bold text-slate-500 dark:text-slate-200">$</span>
            <Input id="monto" name="monto" type="number" step="0.01" value={formData.monto} onChange={handleChange} className="pl-7 font-bold" placeholder="0.00" required />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pagueseA" className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-200">Páguese a</Label>
          <Input id="pagueseA" name="pagueseA" value={formData.pagueseA} onChange={handleChange} placeholder="Beneficiario" required />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="concepto" className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-200">Concepto del Gasto</Label>
        <Input id="concepto" name="concepto" value={formData.concepto} onChange={handleChange} placeholder="Descripción detallada..." required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="fondo" className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-200">Fuente de Financiamiento</Label>
        <Select value={formData.fondo} onValueChange={(val) => handleSelectChange("fondo", val)} required>
          <SelectTrigger><SelectValue placeholder="Seleccionar fondo" /></SelectTrigger>
          <SelectContent>
            {fuentes.map((f: any) => (
              <SelectItem key={f.acronimo} value={f.acronimo}>{f.acronimo} - {f.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export function AddEgresoDialog({ onSave }: { onSave: (data: any) => void }) {
  const { presupuesto, fuentes, cuentas } = useTreasury()
  const [open, setOpen] = useState(false)

  // State for cascading dropdown
  const [selectedCapitulo, setSelectedCapitulo] = useState<string>("")

  // Estado inicial del formulario
  const [formData, setFormData] = useState({
    cog: "",
    cuentaContable: "",
    pagueseA: "",
    monto: "",
    concepto: "",
    fondo: "",
    institucionBancaria: "",
    cuentaBancaria: "",
    fecha: new Date().toISOString().split('T')[0],
    tipo: "Bancario"
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      monto: parseFloat(formData.monto) || 0
    })
    setOpen(false)
    // Resetear formulario
    setFormData({
      cog: "",
      cuentaContable: "",
      pagueseA: "",
      monto: "",
      concepto: "",
      fondo: "",
      institucionBancaria: "",
      cuentaBancaria: "",
      fecha: new Date().toISOString().split('T')[0],
      tipo: "Bancario"
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-slate-900 text-white hover:bg-slate-800">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Póliza
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Egreso</DialogTitle>
            <DialogDescription>
              Complete los datos contables y bancarios de la póliza.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">

            {/* SECCIÓN CONTABLE */}
            <div className="grid grid-cols-2 gap-4 pb-2">
              <div className="grid gap-2">
                <Label htmlFor="capitulo" className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-200">
                  Capítulo
                </Label>
                <Select
                  onValueChange={(val) => {
                    setSelectedCapitulo(val);
                    setFormData(prev => ({ ...prev, cog: "" })); // Reset partida
                  }}
                >
                  <SelectTrigger className="font-mono text-xs">
                    <SelectValue placeholder="Seleccionar capítulo" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {presupuesto.filter((p: PresupuestoItem) => p.nivel === "Capitulo").map((cap: PresupuestoItem) => (
                      <SelectItem key={cap.codigo} value={cap.codigo}>
                        {cap.codigo} - {cap.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cog" className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-200">
                  Partida Genérica
                </Label>
                <Select
                  value={formData.cog}
                  onValueChange={(val) => handleSelectChange("cog", val)}
                  disabled={!selectedCapitulo}
                  required
                >
                  <SelectTrigger className="font-mono text-xs">
                    <SelectValue placeholder={selectedCapitulo ? "Seleccionar partida" : "Seleccione capítulo primero"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {selectedCapitulo && presupuesto
                      .find((c: PresupuestoItem) => c.codigo === selectedCapitulo)
                      ?.subcuentas?.map((item: PresupuestoItem) => (
                        <SelectItem key={item.codigo} value={item.codigo}>
                          {item.codigo} - {item.descripcion}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SECCIÓN CONTABLE - CUENTA Y FECHA */}
            <div className="grid grid-cols-2 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-2">
              <div className="grid gap-2">
                <Label htmlFor="cuentaContable" className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-200">
                  Cuenta Contable
                </Label>
                <div className="relative">
                  <BookOpen className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="cuentaContable"
                    name="cuentaContable"
                    value={formData.cuentaContable}
                    onChange={handleChange}
                    placeholder="Ej. 5121-01-01"
                    className="pl-9 font-mono text-xs"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fecha" className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-200">Fecha</Label>
                <Input id="fecha" name="fecha" type="date" value={formData.fecha} onChange={handleChange} required />
              </div>
            </div>

            {/* SECCIÓN GENERAL (Reorganizada) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="monto" className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-200">Monto</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-500 dark:text-slate-200">$</span>
                  <Input id="monto" name="monto" type="number" step="0.01" value={formData.monto} onChange={handleChange} className="pl-7 font-bold" placeholder="0.00" required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pagueseA" className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-200">Páguese a</Label>
                <Input id="pagueseA" name="pagueseA" value={formData.pagueseA} onChange={handleChange} placeholder="Beneficiario" required />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="concepto" className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-200">Concepto del Gasto</Label>
              <Input id="concepto" name="concepto" value={formData.concepto} onChange={handleChange} placeholder="Descripción detallada..." required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fondo" className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-200">Fuente de Financiamiento</Label>
              <Select onValueChange={(val) => handleSelectChange("fondo", val)} required>
                <SelectTrigger><SelectValue placeholder="Seleccionar fondo" /></SelectTrigger>
                <SelectContent>
                  {fuentes.map((f) => (
                    <SelectItem key={f.acronimo} value={f.acronimo}>{f.acronimo} - {f.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* SECCIÓN BANCARIA */}
            {/* SECCIÓN BANCARIA */}
            <div className="grid gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Label htmlFor="cuentaBancaria" className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-200">Cuenta de Retiro</Label>
              <Select
                required
                onValueChange={(val) => {
                  const account = cuentas.find(c => c.id === val);
                  if (account) {
                    setFormData(prev => ({
                      ...prev,
                      cuentaBancaria: account.id,
                      institucionBancaria: account.banco
                    }));
                  }
                }}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar cuenta de origen" /></SelectTrigger>
                <SelectContent>
                  {cuentas.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="font-medium mr-2">{c.banco}</span>
                      <span className="text-muted-foreground">{c.alias} (**{c.numeroCuenta.slice(-4)})</span>
                    </SelectItem>
                  ))}
                  <SelectItem value="MANUAL_CASH">
                    <span className="font-medium mr-2">N/A</span>
                    <span className="text-muted-foreground">Efectivo / Caja Chica</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
          <DialogFooter>
            <Button type="submit" className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800">Generar Póliza</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}