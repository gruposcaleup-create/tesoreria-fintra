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
import { Plus, CalendarIcon, BookOpen } from "lucide-react"
import { format, isValid, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useTreasury, IngresoContable } from "@/components/providers/treasury-context"
import { RAW_CRI_DATA } from "@/components/providers/cri-raw-data"
import { numberToLetter } from "@/lib/number-utils"

interface NewIngresoData {
  concepto: string
  fuente: string
  monto: number
  fecha: string
  cuentaBancaria?: string
  cri?: string
  cuentaContable?: string
  reporteAdicional?: {
    tipo: "predial" | "otros"
    nombre?: string
    domicilio?: string
    rfc?: string
    conceptoDetalle?: string
    aplicacion?: string
    importeCorriente?: string
    importeAdicional?: string
    sumaTotal?: string
    totalLetra?: string
    folioRecibo?: string
    fechaEmision?: string

    // Budget Classification
    capitulo?: string
    partidaGenerica?: string
    cri?: string
    cuentaContable?: string

    // Predial Specifics
    folio?: string
    fechaCobro?: string
    numeroCajero?: string
    zona?: string
    municipio?: string
    localidad?: string
    region?: string
    manzana?: string
    lote?: string
    nivel?: string
    departamento?: string
    digitoVerificador?: string
    nombreContribuyente?: string
    tipoPredio?: string
    periodo?: string
    ubicacionPredio?: string
    colonia?: string
    baseImpuesto?: string
    impuesto?: string
    recargos?: string
    multa?: string
    honorarios?: string
    pagarConDescuento?: string
    totalPagar?: string
  }
}

interface AddIngresoDialogProps {
  onSave: (data: NewIngresoData) => void
  initialData?: IngresoContable | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddIngresoDialog({ onSave, initialData, open: controlledOpen, onOpenChange }: AddIngresoDialogProps) {
  const { cuentas, ingresosContables } = useTreasury();
  const [internalOpen, setInternalOpen] = React.useState(false)

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) onOpenChange(newOpen)
    setInternalOpen(newOpen)
  }

  const [concepto, setConcepto] = React.useState("")
  const [fuente, setFuente] = React.useState("")
  const [cuentaBancaria, setCuentaBancaria] = React.useState("")
  const [monto, setMonto] = React.useState("")
  const [fecha, setFecha] = React.useState<Date | undefined>(new Date())

  // Estados para CRI
  const [selectedCapitulo, setSelectedCapitulo] = React.useState("")
  const [selectedCRI, setSelectedCRI] = React.useState("")
  const [cuentaContable, setCuentaContable] = React.useState("")

  // Estados para Reportes Adicionales
  const [reportType, setReportType] = React.useState<"none" | "predial" | "otros">("none")

  // Estado para Reportes Adicionales (Unificad para Otros y Predial)
  const [reportData, setReportData] = React.useState({
    // Comunes / Otros
    nombre: "",
    domicilio: "",
    rfc: "",
    conceptoDetalle: "",
    aplicacion: "",
    importeCorriente: "",
    importeAdicional: "",
    sumaTotal: "",
    totalLetra: "",
    folioRecibo: "",
    fechaEmision: new Date(),

    // Campos específicos para Predial
    folio: "",
    fechaCobro: "",
    numeroCajero: "",
    zona: "",
    municipio: "001", // Default o vacio
    localidad: "",
    region: "",
    manzana: "",
    lote: "",
    nivel: "",
    departamento: "",
    digitoVerificador: "",
    nombreContribuyente: "",
    tipoPredio: "URBANO",
    periodo: "",
    ubicacionPredio: "",
    colonia: "",
    baseImpuesto: "",
    impuesto: "",
    recargos: "",
    multa: "",
    honorarios: "",
    pagarConDescuento: "",
    totalPagar: ""
  })

  // Populate form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setConcepto(initialData.concepto)
      setFuente((initialData as any).fuente || "") // Fuente might not be in IngresoContable directly? Based on types it is NOT in IngresoContable but is passed in NewIngresoData. The type definition says IngresoContable has `id, concepto, monto, fecha, estado`. It might NOT have `fuente`. Let's check `treasury-context.tsx` type definition. 
      // Checking previous view_code_item for IngresoContable:
      // export type IngresoContable = { id, concepto, monto, fecha, estado, cuentaBancaria?, cuentaContable?, cri?, reporteAdicional? }
      // It does NOT have `fuente` explicitly in the type viewed in step 410. BUT `NewIngresoData` has it.
      // Assuming `ingresosContables` might have it if it comes from `NewIngresoData` but typed strictly. 
      // I will trust it might be saved or I'll default to "Otros".
      // Actually, let me check the type definition again.
      // In Step 410, `IngresoContable` definition: 
      // export type IngresoContable = { id, concepto, monto... } NO fuente.
      // Wait, `NewIngresoData` has `fuente`. 
      // If it's lost in `IngresoContable`, I can't restore it perfectly unless I add it to the type.
      // For now I will set it if it exists (casted) or empty.
      setFuente((initialData as any).fuente || "")

      setMonto(initialData.monto.toString())
      setFecha(new Date(initialData.fecha + "T12:00:00")) // Append time to avoid timezone shifts if strictly date
      setCuentaBancaria(initialData.cuentaBancaria || "")
      setSelectedCRI(initialData.cri || "")
      setCuentaContable(initialData.cuentaContable || "")

      if (initialData.reporteAdicional) {
        setReportType(initialData.reporteAdicional.tipo)

        // Restore Budget Selection if available in reporteAdicional
        if (initialData.reporteAdicional.capitulo) {
          setSelectedCapitulo(initialData.reporteAdicional.capitulo);
        }
        if (initialData.reporteAdicional.cri) {
          setSelectedCRI(initialData.reporteAdicional.cri);
        }
        // Account is already restored above from root, but ensure it syncs if in reporteAdicional
        if (initialData.reporteAdicional.cuentaContable) {
          setCuentaContable(initialData.reporteAdicional.cuentaContable);
        }

        // Convert any number values to strings to match state type
        const stringifiedReport = Object.fromEntries(
          Object.entries(initialData.reporteAdicional).map(([k, v]) => [k, v !== undefined && v !== null ? v.toString() : ""])
        );

        setReportData(prev => ({
          ...prev,
          ...stringifiedReport,
          fechaEmision: initialData.reporteAdicional?.fechaEmision ? new Date(initialData.reporteAdicional.fechaEmision) : new Date()
        }))
      } else {
        setReportType("none")
      }
    } else {
      // Reset if no initialData (or modal closed depending on usage)
      // If reusing dialog, we might want to reset.
    }
  }, [initialData])

  // Effect to auto-set folio when dialog opens -> ONLY if NOT editing (no initialData)
  React.useEffect(() => {
    if (isOpen && !initialData) {
      // Calculate next folio
      const nextFolio = (ingresosContables.length + 1).toString();

      setReportData(prev => ({
        ...prev,
        folio: nextFolio,
        folioRecibo: nextFolio
      }));
    }
  }, [isOpen, ingresosContables.length, initialData]);

  // Obtener capítulos únicos del CRI
  const capitulos = React.useMemo(() => {
    const caps = RAW_CRI_DATA.filter(item => {
      const parts = item.codigo.split('.');
      return parts.length <= 2; // Solo capítulos de nivel 1 y 2
    });
    return caps;
  }, []);

  const handleSubmit = () => {
    if (!concepto || !monto || !fecha) return

    const newIngreso: NewIngresoData = {
      concepto,
      fuente: fuente || "Otros",
      monto: parseFloat(monto.replace(/,/g, '')),
      fecha: format(fecha, "yyyy-MM-dd"),
      cuentaBancaria,
      cri: selectedCRI,
      cuentaContable,
      reporteAdicional: reportType !== "none" ? {
        tipo: reportType,
        ...reportData,
        fechaEmision: format(reportData.fechaEmision, "yyyy-MM-dd")
      } : undefined
    }

    // TIMESTAMP: Append submission time to fechaCobro for Predial
    if (reportType === "predial" && newIngreso.reporteAdicional?.fechaCobro) {
      const now = new Date();
      const timeString = format(now, "HH:mm:ss");
      // Ensure we don't double-append if logic runs multiple times (though handleSubmit closes dialog)
      if (!newIngreso.reporteAdicional.fechaCobro.includes('T')) {
        newIngreso.reporteAdicional.fechaCobro = `${newIngreso.reporteAdicional.fechaCobro}T${timeString}`;
      }
    }

    // VALIDATION LOGIC FOR PREDIAL
    if (reportType === "predial") {
      const requiredFields = [
        "folio", "numeroCajero", "zona", "municipio", "localidad", "region",
        "manzana", "lote", "nivel", "departamento", "digitoVerificador",
        "nombreContribuyente", "tipoPredio", "periodo", "ubicacionPredio",
        "colonia", "baseImpuesto", "impuesto", "recargos", "multa",
        "honorarios", "pagarConDescuento"
      ];

      const missingFields = requiredFields.filter(field => {
        const val = (reportData as any)[field];
        return val === "" || val === undefined || val === null;
      });

      if (missingFields.length > 0) {
        alert(`Faltan datos obligatorios para el reporte Predial: ${missingFields.join(", ")}`);
        return;
      }
    }

    // Get Name of Partida Generica
    const selectedCriItem = RAW_CRI_DATA.find(i => i.cri === selectedCRI || i.codigo === selectedCRI);
    const nombrePartida = selectedCriItem ? selectedCriItem.nombre : "";

    const finalIngreso: NewIngresoData = {
      ...newIngreso,
      reporteAdicional: reportType !== "none" ? {
        ...newIngreso.reporteAdicional!,
        // Add Budget Classification
        capitulo: selectedCapitulo,
        partidaGenerica: nombrePartida,
        cri: selectedCRI,
        cuentaContable: cuentaContable
      } : undefined
    };

    onSave(finalIngreso)

    // Resetear formulario
    setConcepto("")
    setMonto("")
    setCuentaBancaria("")
    setFecha(new Date())
    setSelectedCapitulo("")
    setSelectedCRI("")
    setCuentaContable("")
    setReportType("none")
    setReportData({
      nombre: "",
      domicilio: "",
      rfc: "",
      conceptoDetalle: "",
      aplicacion: "",
      importeCorriente: "",
      importeAdicional: "",
      sumaTotal: "",
      totalLetra: "",
      folioRecibo: "",
      fechaEmision: new Date(),
      folio: "",
      fechaCobro: "",
      numeroCajero: "",
      zona: "",
      municipio: "001",
      localidad: "",
      region: "",
      manzana: "",
      lote: "",
      nivel: "",
      departamento: "",
      digitoVerificador: "",
      nombreContribuyente: "",
      tipoPredio: "URBANO",
      periodo: "",
      ubicacionPredio: "",
      colonia: "",
      baseImpuesto: "",
      impuesto: "",
      recargos: "",
      multa: "",
      honorarios: "",
      pagarConDescuento: "",
      totalPagar: ""
    })
    handleOpenChange(false)
  }

  const handleReportDataChange = (field: string, value: any) => {
    setReportData(prev => {
      const newData = { ...prev, [field]: value }

      // Limpiar strings para obtener números
      const cleanNumber = (str: string) => {
        if (!str) return 0
        return parseFloat(str.toString().replace(/[^0-9.]/g, '')) || 0
      }

      // Auto-calcular para Reporte OTROS INGRESOS
      if (reportType === "otros" && (field === "importeCorriente" || field === "importeAdicional")) {
        const corrienteStr = field === "importeCorriente" ? value : prev.importeCorriente
        const adicionalStr = field === "importeAdicional" ? value : prev.importeAdicional

        const corriente = cleanNumber(corrienteStr)
        const adicional = cleanNumber(adicionalStr)
        const suma = corriente + adicional

        const sumaFormatted = suma.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        newData.sumaTotal = sumaFormatted
        newData.totalLetra = numberToLetter(suma)
        setMonto(sumaFormatted) // Opcional: sincronizar con monto principal
      }

      // Auto-calcular para Reporte PREDIAL
      const camposLiquidacion = ["baseImpuesto", "impuesto", "recargos", "multa", "honorarios", "pagarConDescuento"]
      if (reportType === "predial" && camposLiquidacion.includes(field)) {
        // Necesitamos valores actualizados. Si el campo actual es uno de ellos, usar 'value', sino el de 'prev'
        const getVal = (k: string) => field === k ? value : (prev as any)[k]

        // El cálculo: (Impuesto + Recargos + Multa + Honorarios) - Descuento
        // Nota: Base Impuesto es informativo, no se suma al total a pagar usualmente, pero depende de la regla.
        // En predial suele ser: Impuesto (que sale de la base) + Recargos + Gastos Ejecución (Honorarios) + Multas

        const imp = cleanNumber(getVal("impuesto"))
        const rec = cleanNumber(getVal("recargos"))
        const mul = cleanNumber(getVal("multa"))
        const hon = cleanNumber(getVal("honorarios"))
        const desc = cleanNumber(getVal("pagarConDescuento"))
        // Base no se suma al cobro, es el valor catastral o base gravable

        const total = (imp + rec + mul + hon) - desc
        const totalFormatted = total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")

        newData.totalPagar = totalFormatted
        newData.totalLetra = numberToLetter(total)

        // Sincronizar monto principal
        setMonto(totalFormatted)
      }

      // Sincronizar fecha de emisión con fecha principal
      if (field === "fechaEmision") {
        setFecha(value)
      }

      return newData
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!initialData && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Agregar Ingreso
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="!max-w-[95vw] !h-[95vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b shrink-0">
          <DialogTitle>Registrar Nuevo Ingreso</DialogTitle>
          <DialogDescription>
            Ingresa los detalles del ingreso municipal o fiscal aquí.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4">

            {/* SECCIÓN CONTABLE - CAPÍTULO Y PARTIDA */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <h3 className="font-semibold text-sm">Clasificación CRI</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capitulo" className="text-xs font-semibold uppercase text-slate-500">
                    Capítulo
                  </Label>
                  <Select
                    value={selectedCapitulo}
                    onValueChange={(val) => {
                      setSelectedCapitulo(val);
                      setSelectedCRI("");
                      setCuentaContable("");
                    }}
                  >
                    <SelectTrigger className="font-mono text-xs">
                      <SelectValue placeholder="Seleccionar capítulo" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {capitulos.map((cap) => (
                        <SelectItem key={cap.codigo} value={cap.codigo}>
                          {cap.codigo} - {cap.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cri" className="text-xs font-semibold uppercase text-slate-500">
                    Partida Genérica
                  </Label>
                  <Select
                    value={selectedCRI}
                    onValueChange={(val) => {
                      // Encontrar el item seleccionado por CRI o codigo
                      const selectedItem = RAW_CRI_DATA.find(item =>
                        item.cri === val || item.codigo === val
                      );

                      if (selectedItem) {
                        setSelectedCRI(selectedItem.cri || selectedItem.codigo);
                        setCuentaContable(selectedItem.codigo);
                      }
                    }}
                    disabled={!selectedCapitulo}
                    required
                  >
                    <SelectTrigger className="font-mono text-xs">
                      <SelectValue placeholder={selectedCapitulo ? "Seleccionar partida" : "Seleccione capítulo primero"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] max-w-[500px]">
                      {selectedCapitulo && RAW_CRI_DATA
                        .filter(item =>
                          item.codigo.startsWith(selectedCapitulo) &&
                          item.cri &&
                          item.cri.length >= 4  // Solo mostrar los que tienen CRI de al menos 4 dígitos
                        )
                        .map((item) => {
                          const val = item.cri || item.codigo;
                          const display = item.cri ? `${item.cri} - ${item.nombre}` : `${item.codigo} - ${item.nombre}`;
                          return (
                            <SelectItem key={item.codigo} value={val}>
                              <span className="block truncate max-w-[450px]" title={display}>
                                {display}
                              </span>
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuentaContable" className="text-xs font-semibold uppercase text-slate-500">
                  Cuenta Contable
                </Label>
                <div className="relative">
                  <BookOpen className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="cuentaContable"
                    value={cuentaContable}
                    readOnly
                    placeholder="Se llena automáticamente"
                    className="pl-9 font-mono text-xs bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

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
                type="text"
                value={monto}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = value.split('.');
                  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                  setMonto(parts.join('.'));
                }}
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

            {/* SECCIÓN REPORTES OPCIONALES */}
            <div className="space-y-4 pt-4 border-t mt-4">
              <Label className="text-base font-semibold">Opciones de Reporte</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={reportType === "predial" ? "default" : "outline"}
                  onClick={() => setReportType(reportType === "predial" ? "none" : "predial")}
                  className="w-1/2"
                >
                  Reporte ingreso predial
                </Button>
                <Button
                  type="button"
                  variant={reportType === "otros" ? "default" : "outline"}
                  onClick={() => setReportType(reportType === "otros" ? "none" : "otros")}
                  className="w-1/2"
                >
                  Reporte otros ingresos
                </Button>
              </div>

              {reportType === "predial" && (
                <div className="space-y-6 mt-4 p-4 border rounded-lg bg-slate-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-lg text-slate-800">Reporte de Ingreso Predial</h3>
                    <span className="text-xs text-slate-500">Complete los campos para el recibo oficial</span>
                  </div>

                  {/* 1. Identificación y Control */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm border-b pb-1 text-slate-700">1. Identificación y Control</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="predialFolio" className="text-xs">Folio</Label>
                        <Input
                          id="predialFolio"
                          className="h-8 font-mono"
                          value={reportData.folio}
                          onChange={(e) => handleReportDataChange("folio", e.target.value)}
                          placeholder="Automatico o Manual"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="predialCajero" className="text-xs">Cajero</Label>
                        <Input
                          id="predialCajero"
                          className="h-8"
                          value={reportData.numeroCajero}
                          onChange={(e) => handleReportDataChange("numeroCajero", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1 flex flex-col pt-5">
                        <Label className="text-xs mb-1 sr-only">Fecha de Cobro</Label>
                        <Popover modal={true}>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "h-8 w-full justify-start text-left font-normal text-xs",
                                !reportData.fechaCobro && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-3 w-3" />
                              {reportData.fechaCobro ? (() => {
                                try {
                                  let date = parseISO(reportData.fechaCobro);
                                  if (!isValid(date)) date = new Date(reportData.fechaCobro + 'T00:00:00');
                                  return isValid(date) ? format(date, "PPP", { locale: es }) : reportData.fechaCobro;
                                } catch (e) { return reportData.fechaCobro; }
                              })() : <span>Fecha Cobro</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-50">
                            <Calendar
                              mode="single"
                              // Convert YYYY-MM-DD string back to Date for the calendar
                              selected={reportData.fechaCobro ? (() => {
                                try {
                                  let date = parseISO(reportData.fechaCobro);
                                  if (!isValid(date)) date = new Date(reportData.fechaCobro + 'T00:00:00');
                                  return isValid(date) ? date : undefined;
                                } catch (e) { return undefined; }
                              })() : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  const dateStr = format(date, "yyyy-MM-dd");
                                  handleReportDataChange("fechaCobro", dateStr);
                                  setFecha(date); // SYNC: Update main date
                                }
                              }}
                              initialFocus
                              locale={es}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  {/* 2. Clave Catastral */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm border-b pb-1 text-slate-700">2. Clave Catastral</h4>
                    <div className="grid grid-cols-9 gap-2 text-center">
                      <div className="space-y-1"><Label className="text-[10px]">Zona</Label><Input className="h-8 text-center px-1" value={reportData.zona} onChange={(e) => handleReportDataChange("zona", e.target.value)} maxLength={3} /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Mpio</Label><Input className="h-8 text-center px-1" value={reportData.municipio} onChange={(e) => handleReportDataChange("municipio", e.target.value)} maxLength={3} /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Loc</Label><Input className="h-8 text-center px-1" value={reportData.localidad} onChange={(e) => handleReportDataChange("localidad", e.target.value)} maxLength={3} /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Reg</Label><Input className="h-8 text-center px-1" value={reportData.region} onChange={(e) => handleReportDataChange("region", e.target.value)} maxLength={3} /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Manz</Label><Input className="h-8 text-center px-1" value={reportData.manzana} onChange={(e) => handleReportDataChange("manzana", e.target.value)} maxLength={3} /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Lote</Label><Input className="h-8 text-center px-1" value={reportData.lote} onChange={(e) => handleReportDataChange("lote", e.target.value)} maxLength={3} /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Nivel</Label><Input className="h-8 text-center px-1" value={reportData.nivel} onChange={(e) => handleReportDataChange("nivel", e.target.value)} maxLength={3} /></div>
                      <div className="space-y-1"><Label className="text-[10px]">Depto</Label><Input className="h-8 text-center px-1" value={reportData.departamento} onChange={(e) => handleReportDataChange("departamento", e.target.value)} maxLength={3} /></div>
                      <div className="space-y-1"><Label className="text-[10px]">DV</Label><Input className="h-8 text-center px-1" value={reportData.digitoVerificador} onChange={(e) => handleReportDataChange("digitoVerificador", e.target.value)} maxLength={3} /></div>
                    </div>
                  </div>

                  {/* 3. Información del Contribuyente y Predio */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm border-b pb-1 text-slate-700">3. Información del Contribuyente y Predio</h4>
                    <div className="grid gap-3">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs">Nombre</Label>
                        <Input className="col-span-3 h-8" value={reportData.nombreContribuyente} onChange={(e) => handleReportDataChange("nombreContribuyente", e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs w-24 text-right">Tipo Predio</Label>
                          <Select value={reportData.tipoPredio} onValueChange={(val) => handleReportDataChange("tipoPredio", val)}>
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="URBANO">URBANO</SelectItem>
                              <SelectItem value="RUSTICO">RUSTICO</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs w-24 text-right">Periodo Pago</Label>
                          <Input className="h-8" placeholder="Ej. 2024" value={reportData.periodo} onChange={(e) => handleReportDataChange("periodo", e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs">Ubicación</Label>
                        <Input className="col-span-3 h-8" value={reportData.ubicacionPredio} onChange={(e) => handleReportDataChange("ubicacionPredio", e.target.value)} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs">Colonia</Label>
                        <Input className="col-span-3 h-8" value={reportData.colonia} onChange={(e) => handleReportDataChange("colonia", e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {/* 4. Liquidación del Impuesto */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm border-b pb-1 text-slate-700">4. Liquidación del Impuesto</h4>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                      {/* Columna Izquierda */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Base del Impuesto</Label>
                          <Input className="h-8 w-32 text-right" value={reportData.baseImpuesto} onChange={(e) => { const val = e.target.value.replace(/[^0-9.]/g, ''); handleReportDataChange("baseImpuesto", val); }} placeholder="0.00" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold">Impuesto</Label>
                          <Input className="h-8 w-32 text-right" value={reportData.impuesto} onChange={(e) => { const val = e.target.value.replace(/[^0-9.]/g, ''); handleReportDataChange("impuesto", val); }} placeholder="0.00" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Adicional (o Otros)</Label>
                          <Input className="h-8 w-32 text-right" value={reportData.importeAdicional} onChange={(e) => { const val = e.target.value.replace(/[^0-9.]/g, ''); handleReportDataChange("importeAdicional", val); }} placeholder="0.00" />
                        </div>
                      </div>
                      {/* Columna Derecha */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Recargos</Label>
                          <Input className="h-8 w-32 text-right" value={reportData.recargos} onChange={(e) => { const val = e.target.value.replace(/[^0-9.]/g, ''); handleReportDataChange("recargos", val); }} placeholder="0.00" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Multa / Honorarios</Label>
                          <div className="flex gap-1 w-32">
                            <Input className="h-8 w-1/2 text-right px-1" value={reportData.multa} onChange={(e) => { const val = e.target.value.replace(/[^0-9.]/g, ''); handleReportDataChange("multa", val); }} placeholder="Mul" title="Multa" />
                            <Input className="h-8 w-1/2 text-right px-1" value={reportData.honorarios} onChange={(e) => { const val = e.target.value.replace(/[^0-9.]/g, ''); handleReportDataChange("honorarios", val); }} placeholder="Hon" title="Honorarios" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-red-600">
                          <Label className="text-xs">(-) Descuento</Label>
                          <Input className="h-8 w-32 text-right text-red-600" value={reportData.pagarConDescuento} onChange={(e) => { const val = e.target.value.replace(/[^0-9.]/g, ''); handleReportDataChange("pagarConDescuento", val); }} placeholder="0.00" />
                        </div>
                      </div>
                    </div>
                    {/* Totales Predial */}
                    <div className="mt-4 pt-4 border-t grid gap-3">
                      <div className="flex items-center justify-between bg-slate-100 p-2 rounded">
                        <Label className="font-bold text-sm">TOTAL A PAGAR</Label>
                        <span className="font-mono font-bold text-lg">${reportData.totalPagar || "0.00"}</span>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Total en Letra</Label>
                        <Input className="h-8 bg-slate-50 text-xs" value={reportData.totalLetra} readOnly />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {reportType === "otros" && (
                <div className="space-y-6 mt-4 p-4 border rounded-lg bg-slate-50 animate-in fade-in slide-in-from-top-2">

                  {/* 1. Datos del Contribuyente */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm border-b pb-1">1. Datos del Contribuyente</h4>
                    <div className="grid gap-3">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="repNombre" className="text-right text-xs">Nombre</Label>
                        <Input
                          id="repNombre"
                          className="col-span-3 h-8"
                          value={reportData.nombre}
                          onChange={(e) => handleReportDataChange("nombre", e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="repDomicilio" className="text-right text-xs">Domicilio</Label>
                        <Input
                          id="repDomicilio"
                          className="col-span-3 h-8"
                          value={reportData.domicilio}
                          onChange={(e) => handleReportDataChange("domicilio", e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="repRFC" className="text-right text-xs">R.F.C.</Label>
                        <Input
                          id="repRFC"
                          className="col-span-3 h-8"
                          value={reportData.rfc}
                          onChange={(e) => handleReportDataChange("rfc", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Detalle del Pago */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm border-b pb-1">2. Detalle del Pago</h4>
                    <div className="grid gap-3">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="repConcepto" className="text-right text-xs">Concepto</Label>
                        <Input
                          id="repConcepto"
                          className="col-span-3 h-8"
                          value={reportData.conceptoDetalle}
                          onChange={(e) => handleReportDataChange("conceptoDetalle", e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right text-xs pt-2">Aplicación</Label>
                        <div className="col-span-3 grid grid-cols-2 gap-2">
                          {["Impuestos", "Derechos", "Productos", "Aprovechamientos", "Otros"].map((opcion) => (
                            <div key={opcion} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`app-${opcion}`}
                                name="aplicacion"
                                value={opcion}
                                checked={reportData.aplicacion === opcion}
                                onChange={(e) => handleReportDataChange("aplicacion", e.target.value)}
                                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                              />
                              <Label htmlFor={`app-${opcion}`} className="text-xs font-normal cursor-pointer">{opcion}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Importes */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm border-b pb-1">3. Importes (Desglose Económico)</h4>
                    <div className="grid gap-3">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="repCorriente" className="text-right text-xs">Corriente</Label>
                        <Input
                          id="repCorriente"
                          className="col-span-3 h-8"
                          value={reportData.importeCorriente}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            handleReportDataChange("importeCorriente", val)
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="repAdicional" className="text-right text-xs">Adicional (10%)</Label>
                        <Input
                          id="repAdicional"
                          className="col-span-3 h-8"
                          value={reportData.importeAdicional}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            handleReportDataChange("importeAdicional", val)
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="repSumaTotal" className="text-right text-xs font-bold">Suma Total</Label>
                        <Input
                          id="repSumaTotal"
                          className="col-span-3 h-8 font-bold bg-slate-100 text-slate-700"
                          value={reportData.sumaTotal}
                          readOnly
                          tabIndex={-1}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="repTotalLetra" className="text-right text-xs">Total en Letra</Label>
                        <Input
                          id="repTotalLetra"
                          className="col-span-3 h-8 bg-slate-100 text-slate-700"
                          placeholder="ej. CIENTO DIECINUEVE PESOS 43/100 M.N."
                          value={reportData.totalLetra}
                          readOnly
                          tabIndex={-1}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. Registro e Identificación del Recibo */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm border-b pb-1">4. Registro e Identificación del Recibo</h4>
                    <div className="grid gap-3">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="repFolio" className="text-right text-xs">Folio (Recibo Oficial)</Label>
                        <Input
                          id="repFolio"
                          className="col-span-3 h-8"
                          value={reportData.folioRecibo}
                          onChange={(e) => handleReportDataChange("folioRecibo", e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs">Fecha de Emisión</Label>
                        <Popover modal={true}>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              type="button"
                              className={cn(
                                "col-span-3 h-8 justify-start text-left font-normal text-xs",
                                !reportData.fechaEmision && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-3 w-3" />
                              {reportData.fechaEmision ? format(reportData.fechaEmision, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-[60]" align="start">
                            <Calendar
                              mode="single"
                              selected={reportData.fechaEmision}
                              onSelect={(date) => date && handleReportDataChange("fechaEmision", date)}
                              initialFocus
                              locale={es}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
        <DialogFooter className="p-6 border-t shrink-0 bg-slate-50/50">
          <Button type="submit" onClick={handleSubmit}>Guardar Ingreso</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}