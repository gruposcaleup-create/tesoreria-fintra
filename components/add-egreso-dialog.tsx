import * as React from "react"
import { useState, useMemo } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { PlusCircle, Hash, BookOpen, Building2, HelpCircle, CalendarIcon, Package } from "lucide-react"
import { format, parse } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTreasury, PresupuestoItem, Departamento, EgresoContable, Proveedor } from "@/components/providers/treasury-context"
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
  setSelectedCapitulo,
  proveedores // New prop
}: {
  formData: any,
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  handleSelectChange: (name: string, value: string) => void,
  presupuesto: PresupuestoItem[],
  fuentes: any[],
  departamentos: Departamento[], // New type
  selectedCapitulo: string,
  setSelectedCapitulo: (val: string) => void,
  proveedores: Proveedor[]
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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.fecha && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.fecha
                  ? format(parse(formData.fecha, "yyyy-MM-dd", new Date()), "dd 'de' MMMM, yyyy", { locale: es })
                  : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.fecha ? parse(formData.fecha, "yyyy-MM-dd", new Date()) : undefined}
                onSelect={(date) => {
                  if (date) {
                    const formatted = format(date, "yyyy-MM-dd")
                    handleChange({ target: { name: "fecha", value: formatted } } as any)
                  }
                }}
                locale={es}
                initialFocus
              />
            </PopoverContent>
          </Popover>
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
          <Select
            value={formData.pagueseA}
            onValueChange={(val) => handleSelectChange("pagueseA", val)}
            required
          >
            <SelectTrigger className="font-mono text-xs w-full truncate">
              <SelectValue placeholder="Seleccionar Beneficiario" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {proveedores.map((p) => (
                <SelectItem key={p.id} value={p.razonSocial}>
                  {p.razonSocial}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
    updateBudgetFromEgreso,
    proveedores // New
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

  // Asset classification checkboxes
  const [vidaUtilMayor1Ano, setVidaUtilMayor1Ano] = React.useState(false)
  const [esIdentificable, setEsIdentificable] = React.useState(false)
  const [seTieneControl, setSeTieneControl] = React.useState(false)

  // Asset (Resguardo) data - only used when clasificacion === ACTIVO
  const [activoData, setActivoData] = React.useState({
    resguardoNumero: "",
    opd: "",
    area: "",
    encargado: "",
    equipo: "",
    proveedor: "",
    factura: "",
    marca: "",
    modelo: "",
    serie: "",
    color: "",
    observaciones: "",
    referenciaPago: "",
    director: "",
    resguardante: ""
  })

  const handleActivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActivoData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Reactive classification label
  const clasificacion = useMemo(() => {
    const montoNumerico = parseFloat(formData.monto.toString().replace(/,/g, '')) || 0;
    const isActivo = montoNumerico > 8211.70 && vidaUtilMayor1Ano && esIdentificable && seTieneControl;
    return isActivo ? "ACTIVO" : "GASTO";
  }, [formData.monto, vidaUtilMayor1Ano, esIdentificable, seTieneControl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.cog || !formData.monto || !formData.concepto) {
      alert("Faltan datos requeridos")
      return
    }

    const montoNumerico = parseFloat(formData.monto.toString().replace(/,/g, ''));
    const tipoEgreso = formData.cuentaBancaria === "MANUAL_CASH" ? "Manual" : "Bancario";

    try {
      // Import and call server action
      const { createEgreso } = await import("@/app/actions/treasury");
      const result = await createEgreso({
        cog: formData.cog,
        cuentaContable: formData.cuentaContable,
        pagueseA: formData.pagueseA,
        monto: montoNumerico,
        concepto: formData.concepto,
        fondo: formData.fondo,
        institucionBancaria: formData.institucionBancaria,
        cuentaBancaria: formData.cuentaBancaria,
        fecha: formData.fecha,
        tipo: tipoEgreso,
        estatus: "Pendiente",
        folioOrden: nextPaymentOrderFolio,
        departamento: formData.departamento,
        area: formData.area,
        clasificacion: clasificacion,
        activoData: clasificacion === "ACTIVO" ? activoData : undefined
      });

      if (result.success && result.data) {
        const newEgreso: EgresoContable = {
          id: result.data.id, // Use DB-generated ID
          cog: formData.cog,
          cuentaContable: formData.cuentaContable,
          pagueseA: formData.pagueseA,
          monto: montoNumerico,
          concepto: formData.concepto,
          fondo: formData.fondo,
          institucionBancaria: formData.institucionBancaria,
          cuentaBancaria: formData.cuentaBancaria,
          estatus: "Pendiente",
          fecha: formData.fecha,
          poliza: formData.poliza || "",
          tipo: tipoEgreso,
          folioOrden: nextPaymentOrderFolio,
          departamento: formData.departamento,
          area: formData.area,
          clasificacion: clasificacion,
          activoData: clasificacion === "ACTIVO" ? activoData : undefined
        };

        setEgresosContables(prev => [newEgreso, ...prev]);
        incrementPaymentOrderFolio();
        addToLog("Egreso Registrado", `Se registró un egreso por ${newEgreso.monto}`, "create");
        updateBudgetFromEgreso(formData.cog, montoNumerico, formData.fecha);
      } else {
        console.error("Error creating egreso:", result.error);
        // Fallback to local-only
        const newEgreso: EgresoContable = {
          id: Math.random().toString(36).substr(2, 9),
          cog: formData.cog,
          cuentaContable: formData.cuentaContable,
          pagueseA: formData.pagueseA,
          monto: montoNumerico,
          concepto: formData.concepto,
          fondo: formData.fondo,
          institucionBancaria: formData.institucionBancaria,
          cuentaBancaria: formData.cuentaBancaria,
          estatus: "Pendiente",
          fecha: formData.fecha,
          poliza: formData.poliza || "",
          tipo: tipoEgreso,
          clasificacion: clasificacion,
          activoData: clasificacion === "ACTIVO" ? activoData : undefined
        };
        setEgresosContables(prev => [newEgreso, ...prev]);
        incrementPaymentOrderFolio();
        addToLog("Egreso Registrado", `Se registró un egreso por ${newEgreso.monto}`, "create");
        updateBudgetFromEgreso(formData.cog, montoNumerico, formData.fecha);
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      // Fallback to local-only on error
      const newEgreso: EgresoContable = {
        id: Math.random().toString(36).substr(2, 9),
        cog: formData.cog,
        cuentaContable: formData.cuentaContable,
        pagueseA: formData.pagueseA,
        monto: montoNumerico,
        concepto: formData.concepto,
        fondo: formData.fondo,
        institucionBancaria: formData.institucionBancaria,
        cuentaBancaria: formData.cuentaBancaria,
        estatus: "Pendiente",
        fecha: formData.fecha,
        poliza: formData.poliza || "",
        tipo: tipoEgreso,
        clasificacion: clasificacion,
        activoData: clasificacion === "ACTIVO" ? activoData : undefined
      };
      setEgresosContables(prev => [newEgreso, ...prev]);
      incrementPaymentOrderFolio();
      addToLog("Egreso Registrado", `Se registró un egreso por ${newEgreso.monto}`, "create");
      updateBudgetFromEgreso(formData.cog, montoNumerico, formData.fecha);
    }

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
    setActivoData({
      resguardoNumero: "", opd: "", area: "", encargado: "", equipo: "",
      proveedor: "", factura: "", marca: "", modelo: "", serie: "",
      color: "", observaciones: "", referenciaPago: "", director: "", resguardante: ""
    })
    setVidaUtilMayor1Ano(false)
    setEsIdentificable(false)
    setSeTieneControl(false)
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.fecha && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.fecha
                            ? format(parse(formData.fecha, "yyyy-MM-dd", new Date()), "dd 'de' MMMM, yyyy", { locale: es })
                            : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.fecha ? parse(formData.fecha, "yyyy-MM-dd", new Date()) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const formatted = format(date, "yyyy-MM-dd")
                              setFormData(prev => ({ ...prev, fecha: formatted }))
                            }
                          }}
                          locale={es}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* SECCIÓN GENERAL (Reorganizada) */}
                  <div className="grid grid-cols-2 gap-4 items-start">
                    <div className="grid gap-2">
                      <Label htmlFor="monto" className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-200">Monto</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 font-bold text-slate-500 dark:text-slate-200">$</span>
                        <Input
                          id="monto"
                          name="monto"
                          type="text"
                          value={formData.monto}
                          onChange={(e) => {
                            // Remove non-numeric chars except dot
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            // Split integer and decimal parts
                            const parts = value.split('.');
                            // Add commas to integer part
                            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                            // Reassemble
                            const formatted = parts.slice(0, 2).join('.');

                            setFormData(prev => ({ ...prev, monto: formatted }));
                          }}
                          className="pl-7 font-bold"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-2 self-start">
                      <Label htmlFor="pagueseA" className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-200">Páguese a</Label>
                      <Select
                        value={formData.pagueseA}
                        onValueChange={(val) => handleSelectChange("pagueseA", val)}
                        required
                      >
                        <SelectTrigger className="w-full truncate">
                          <SelectValue placeholder="Seleccionar Beneficiario" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {proveedores.map((p) => (
                            <SelectItem key={p.id} value={p.razonSocial}>
                              {p.razonSocial}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* ASSET CLASSIFICATION CHECKBOXES */}
                  <div className="space-y-2 p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="vidaUtilMayor1Ano"
                        checked={vidaUtilMayor1Ano}
                        onCheckedChange={(checked) => setVidaUtilMayor1Ano(checked === true)}
                      />
                      <Label htmlFor="vidaUtilMayor1Ano" className="text-xs cursor-pointer">Vida útil &gt; 1 año</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="esIdentificable"
                        checked={esIdentificable}
                        onCheckedChange={(checked) => setEsIdentificable(checked === true)}
                      />
                      <Label htmlFor="esIdentificable" className="text-xs cursor-pointer">Es identificable</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[280px] text-left text-xs leading-relaxed">
                          <p className="font-semibold mb-1">CRITERIOS:</p>
                          <ul className="list-disc pl-4 space-y-0.5">
                            <li>Tiene existencia física o jurídica.</li>
                            <li>Se puede individualizar (marca, serie, ubicación, características).</li>
                            <li>Se puede registrar en inventario patrimonial.</li>
                          </ul>
                          <p className="font-semibold mt-2 mb-1">NO SON IDENTIFICABLES:</p>
                          <p>Papelería, Combustible, Electricidad, Servicios, Materiales de consumo.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="seTieneControl"
                        checked={seTieneControl}
                        onCheckedChange={(checked) => setSeTieneControl(checked === true)}
                      />
                      <Label htmlFor="seTieneControl" className="text-xs cursor-pointer">Se tiene control</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[280px] text-left text-xs leading-relaxed">
                          <p className="font-semibold mb-1">CUANDO:</p>
                          <ul className="list-disc pl-4 space-y-0.5">
                            <li>El bien es propiedad del ente o lo tiene en resguardo oficial.</li>
                            <li>Decide quién lo usa, dónde está y para qué.</li>
                            <li>Puede dar de baja, vender o reasignar el bien.</li>
                          </ul>
                          <p className="font-semibold mt-2 mb-1">NO HAY CONTROL CUANDO:</p>
                          <ul className="list-disc pl-4 space-y-0.5">
                            <li>El bien es rentado o prestado por otra dependencia.</li>
                            <li>Está en manos de un particular sin control formal.</li>
                            <li>Es un servicio contratado.</li>
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* CLASSIFICATION LABEL */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <Badge
                        variant={clasificacion === "ACTIVO" ? "default" : "secondary"}
                        className={clasificacion === "ACTIVO"
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          : "bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium"
                        }
                      >
                        {clasificacion}
                      </Badge>
                    </div>
                  </div>

                  {/* ═══ RESGUARDO DE BIENES MUEBLES (Conditional on ACTIVO) — Full-width horizontal ═══ */}
                  {clasificacion === "ACTIVO" && (
                    <div className="p-4 rounded-lg border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/30 animate-in fade-in slide-in-from-top-2 duration-300">
                      <h4 className="font-semibold text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-300 mb-3">
                        <Package className="w-4 h-4" />
                        Resguardo de Bienes Muebles
                      </h4>

                      <div className="grid grid-cols-4 gap-3">
                        {/* Inherited fields - Read Only */}
                        <div className="grid gap-1.5">
                          <Label className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400">Costo de Adquisición</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 font-bold text-emerald-500">$</span>
                            <Input value={formData.monto} readOnly className="pl-7 font-bold bg-emerald-100/60 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 cursor-not-allowed border-emerald-200 dark:border-emerald-700" />
                          </div>
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400">Fecha de Adquisición</Label>
                          <Input value={formData.fecha} readOnly className="font-mono bg-emerald-100/60 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 cursor-not-allowed border-emerald-200 dark:border-emerald-700" />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Resguardo No.</Label>
                          <Input name="resguardoNumero" value={activoData.resguardoNumero} onChange={handleActivoChange} placeholder="Ej. 001" />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">OPD</Label>
                          <Input name="opd" value={activoData.opd} onChange={handleActivoChange} placeholder="Organismo" />
                        </div>

                        <div className="grid gap-1.5">
                          <Label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Área</Label>
                          <Input name="area" value={activoData.area} onChange={handleActivoChange} placeholder="Ej. Administrativa" />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Encargado</Label>
                          <Input name="encargado" value={activoData.encargado} onChange={handleActivoChange} placeholder="Nombre del encargado" />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Equipo</Label>
                          <Input name="equipo" value={activoData.equipo} onChange={handleActivoChange} placeholder="Ej. Impresora Multifuncional" />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Proveedor</Label>
                          <Input name="proveedor" value={activoData.proveedor} onChange={handleActivoChange} placeholder="Nombre del proveedor" />
                        </div>

                        <div className="grid gap-1.5">
                          <Label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Factura</Label>
                          <Input name="factura" value={activoData.factura} onChange={handleActivoChange} placeholder="No. de factura" />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Ref. de Pago</Label>
                          <Input name="referenciaPago" value={activoData.referenciaPago} onChange={handleActivoChange} placeholder="Transferencia / Cheque" />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Marca</Label>
                          <Input name="marca" value={activoData.marca} onChange={handleActivoChange} placeholder="Ej. Brother" />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Modelo</Label>
                          <Input name="modelo" value={activoData.modelo} onChange={handleActivoChange} placeholder="Ej. DCP-T710W" />
                        </div>

                        <div className="grid gap-1.5">
                          <Label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Serie</Label>
                          <Input name="serie" value={activoData.serie} onChange={handleActivoChange} placeholder="No. de serie" />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Color</Label>
                          <Input name="color" value={activoData.color} onChange={handleActivoChange} placeholder="Ej. Negro" />
                        </div>
                        <div className="col-span-2 grid gap-1.5">
                          <Label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Observaciones</Label>
                          <Input name="observaciones" value={activoData.observaciones} onChange={handleActivoChange} placeholder="Ej. Equipo nuevo" />
                        </div>

                        <div className="col-span-2 grid gap-1.5 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                          <Label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Director</Label>
                          <Input name="director" value={activoData.director} onChange={handleActivoChange} placeholder="Nombre y firma" />
                        </div>
                        <div className="col-span-2 grid gap-1.5 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                          <Label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-300">Resguardante</Label>
                          <Input name="resguardante" value={activoData.resguardante} onChange={handleActivoChange} placeholder="Nombre y firma" />
                        </div>
                      </div>
                    </div>
                  )}

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