import * as React from "react"
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
import { PlusCircle, Hash, BookOpen, Building2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTreasury, PresupuestoItem, Departamento, EgresoContable } from "@/components/providers/treasury-context"
import { RAW_COG_DATA } from "./providers/cog-raw-data"

// Reusable form component
export function EgresoFormFields({
  formData,
  handleChange,
  handleSelectChange,
  presupuesto,
  fuentes,
  departamentos, // New prop
  selectedCapitulo,
  setSelectedCapitulo
}: {
  formData: any,
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  handleSelectChange: (name: string, value: string) => void,
  presupuesto: PresupuestoItem[],
  fuentes: any[],
  departamentos: Departamento[], // New type
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
            onValueChange={(val) => {
              // Validar que selectedCapitulo existe antes de procesar
              if (!selectedCapitulo) return;

              // Encontrar el item seleccionado
              // Comparamos contra cog O codigo, dependiendo de qué usamos como value
              const selectedItem = RAW_COG_DATA
                .filter(item =>
                  item.cuenta_registro === "Si" &&
                  item.codigo.startsWith(selectedCapitulo)
                )
                .find(item => (item.cog || item.codigo) === val);

              if (selectedItem) {
                handleSelectChange("cog", val);
                handleSelectChange("cuentaContable", selectedItem.codigo);
              }
            }}
            disabled={!selectedCapitulo}
            required
          >
            <SelectTrigger className="font-mono text-xs">
              <SelectValue placeholder={selectedCapitulo ? "Seleccionar partida" : "Seleccione capítulo primero"} />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {selectedCapitulo && RAW_COG_DATA
                .filter(item =>
                  item.cuenta_registro === "Si" &&
                  item.codigo.startsWith(selectedCapitulo)
                )
                .map((item) => {
                  const val = item.cog || item.codigo;
                  const display = item.cog ? `${item.cog} - ${item.nombre}` : `${item.codigo} - ${item.nombre}`;
                  return (
                    <SelectItem key={item.codigo} value={val}>
                      {display}
                    </SelectItem>
                  );
                })}
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
        <div className="space-y-2">
          <Label htmlFor="monto" className="font-bold text-gray-700">Monto</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-lg font-bold text-gray-500">$</span>
            <Input
              id="monto"
              name="monto"
              type="text"
              value={formData.monto}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9.]/g, '');
                const parts = value.split('.');
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                const formatted = parts.join('.');
                handleChange({ target: { name: 'monto', value: formatted } } as any);
              }}
              className="pl-7 font-bold"
              placeholder="0.00"
              required
            />
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

interface EgresoFormFields {
  cog: string;
  capitulo: string;
  partida: string;
  cuentaContable: string;
  monto: string;
  fecha: string;
  concepto: string;
  pagueseA: string;
  departamento: string;
  area: string;
  fondo: string;
  institucionBancaria: string;
  cuentaBancaria: string;
  poliza?: string;
}

export function AddEgresoDialog({ onSave }: { onSave?: (data: any) => void }) {
  const {
    cuentas,
    presupuesto,
    fuentes,
    egresosContables, setEgresosContables,
    addToLog,
    fiscalConfig,
    nextPaymentOrderFolio, incrementPaymentOrderFolio,
    departamentos,
    updateBudgetFromEgreso
  } = useTreasury()

  const [open, setOpen] = React.useState(false)
  const [selectedCapitulo, setSelectedCapitulo] = React.useState("")
  const [formData, setFormData] = React.useState<EgresoFormFields>({
    cog: "",
    capitulo: "",
    partida: "",
    cuentaContable: "",
    monto: "",
    fecha: new Date().toISOString().split("T")[0],
    concepto: "",
    pagueseA: "",
    departamento: "",
    area: "",
    fondo: "",
    institucionBancaria: "",
    cuentaBancaria: "",
    poliza: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.cog || !formData.monto || !formData.concepto) {
      alert("Faltan datos requeridos")
      return
    }

    const newEgreso: EgresoContable = {
      id: Math.random().toString(36).substr(2, 9),
      cog: formData.cog,
      cuentaContable: formData.cuentaContable,
      pagueseA: formData.pagueseA,
      monto: parseFloat(formData.monto.toString().replace(/,/g, '')),
      concepto: formData.concepto,
      fondo: formData.fondo,
      institucionBancaria: formData.institucionBancaria,
      cuentaBancaria: formData.cuentaBancaria,
      estatus: "Pendiente",
      fecha: formData.fecha,
      poliza: formData.poliza || "",
      tipo: formData.cuentaBancaria === "MANUAL_CASH" ? "Manual" : "Bancario",
    };

    setEgresosContables(prev => [newEgreso, ...prev])
    incrementPaymentOrderFolio()
    addToLog("Egreso Registrado", `Se registró un egreso por ${newEgreso.monto}`, "create")

    // Actualizar el presupuesto con el monto del egreso
    updateBudgetFromEgreso(formData.cog, parseFloat(formData.monto), formData.fecha);

    setOpen(false)
    setFormData({
      cog: "",
      capitulo: "",
      partida: "",
      cuentaContable: "",
      monto: "",
      fecha: new Date().toISOString().split("T")[0],
      concepto: "",
      pagueseA: "",
      departamento: "",
      area: "",
      fondo: "",
      institucionBancaria: "",
      cuentaBancaria: ""
    });
    setSelectedCapitulo("")
  }

  // Component Logic for inline form
  // ...

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md gap-2">
          <BookOpen className="w-4 h-4" />
          Nueva Póliza
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-[95vw] !h-[95vh] flex flex-col p-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-full w-full">
          <DialogHeader className="p-6 border-b shrink-0">
            <DialogTitle>Nueva Póliza de Egreso</DialogTitle>
            <DialogDescription>
              Registro de gasto y asignación presupuestal.
              <span className="mt-2 text-xs text-muted-foreground flex gap-4">
                <span className="font-mono">Folio: #{nextPaymentOrderFolio.toString().padStart(6, '0')}</span>
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid gap-6">

              {/* CLASIFICACION */}
              <div className="grid gap-4 p-4 border rounded-lg bg-muted/20">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Clasificación Presupuestal
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* DEPARTAMENTO */}
                  <div className="grid gap-2">
                    <Label htmlFor="departamento" className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-200">
                      Departamento / Área
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        name="departamento"
                        value={formData.departamento}
                        onValueChange={(val) => setFormData(prev => ({ ...prev, departamento: val, area: "" }))}
                      >
                        <SelectTrigger className="w-full truncate">
                          <SelectValue placeholder="Seleccionar Depto." />
                        </SelectTrigger>
                        <SelectContent>
                          {departamentos.map((dept) => (
                            <SelectItem key={dept.id} value={dept.nombre}>
                              {dept.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        name="area"
                        value={formData.area}
                        onValueChange={(val) => setFormData(prev => ({ ...prev, area: val }))}
                        disabled={!formData.departamento}
                      >
                        <SelectTrigger className="w-full truncate">
                          <SelectValue placeholder="Seleccionar Área" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.departamento && departamentos.find(d => d.nombre === formData.departamento)?.areas?.map((area, idx) => (
                            <SelectItem key={`${area}-${idx}`} value={area}>
                              {area}
                            </SelectItem>
                          ))}
                          {formData.departamento && (!departamentos.find(d => d.nombre === formData.departamento)?.areas?.length) && (
                            <div className="p-2 text-xs text-muted-foreground text-center italic">
                              Sin áreas disponibles
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

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
                      <SelectTrigger className="font-mono text-xs w-full truncate">
                        <SelectValue placeholder="Seleccionar capítulo" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] max-w-[500px]">
                        {presupuesto.filter((p: PresupuestoItem) => p.nivel === "Capitulo").map((cap: PresupuestoItem) => (
                          <SelectItem key={cap.codigo} value={cap.codigo}>
                            <span className="block whitespace-normal" title={`${cap.codigo} - ${cap.descripcion}`}>
                              {cap.codigo} - {cap.descripcion}
                            </span>
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
                      onValueChange={(val) => {
                        // Validar que selectedCapitulo existe antes de procesar
                        if (!selectedCapitulo) return;

                        // Encontrar el item seleccionado
                        const selectedItem = RAW_COG_DATA
                          .filter(item =>
                            item.cuenta_registro === "Si" &&
                            item.codigo.startsWith(selectedCapitulo)
                          )
                          .find(item => (item.cog || item.codigo) === val);

                        if (selectedItem) {
                          handleSelectChange("cog", val);
                          handleSelectChange("cuentaContable", selectedItem.codigo);
                        }
                      }}
                      disabled={!selectedCapitulo}
                      required
                    >
                      <SelectTrigger className="font-mono text-xs w-full truncate">
                        <SelectValue placeholder={selectedCapitulo ? "Seleccionar partida" : "Seleccione capítulo primero"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] max-w-[500px]">
                        {selectedCapitulo && RAW_COG_DATA
                          .filter(item =>
                            item.cuenta_registro === "Si" &&
                            item.codigo.startsWith(selectedCapitulo)
                          )
                          .map((item) => {
                            const val = item.cog || item.codigo;
                            const display = item.cog ? `${item.cog} - ${item.nombre}` : `${item.codigo} - ${item.nombre}`;
                            return (
                              <SelectItem key={item.codigo} value={val}>
                                <span className="block whitespace-normal" title={display}>
                                  {display}
                                </span>
                              </SelectItem>
                            );
                          })}
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
                        readOnly
                        placeholder="Se llena automáticamente"
                        className="pl-9 font-mono text-xs bg-slate-100 text-slate-500 cursor-not-allowed dark:bg-slate-900"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fecha" className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-200">Fecha</Label>
                    <Input id="fecha" name="fecha" type="date" value={formData.fecha} onChange={handleChange} required />
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
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 border-t shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
            <Button type="submit" className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800">Generar Póliza</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}