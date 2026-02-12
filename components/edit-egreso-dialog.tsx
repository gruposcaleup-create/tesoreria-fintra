import * as React from "react"
import { useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useTreasury, EgresoContable } from "@/components/providers/treasury-context"
import { EgresoFormFields } from "./add-egreso-dialog"
import { Building2, Package } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { updateEgreso } from "@/app/actions/treasury"

interface EditEgresoDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    egreso: EgresoContable | null
}

export function EditEgresoDialog({ open, onOpenChange, egreso }: EditEgresoDialogProps) {
    const {
        presupuesto,
        fuentes,
        departamentos,
        // updateBudgetFromEgreso, // TODO: Decide if we update budget on edit? Complex logic.
        setEgresosContables,
        addToLog,
        proveedores
    } = useTreasury()

    const [selectedCapitulo, setSelectedCapitulo] = React.useState("")

    // Initial State
    const initialFormState = {
        cog: "",
        capitulo: "",
        partida: "",
        cuentaContable: "",
        monto: "",
        fecha: "",
        concepto: "",
        pagueseA: "",
        departamento: "",
        area: "",
        fondo: "",
        institucionBancaria: "",
        cuentaBancaria: "",
        poliza: ""
    }

    const [formData, setFormData] = React.useState(initialFormState)

    // Asset classification checkboxes
    const [vidaUtilMayor1Ano, setVidaUtilMayor1Ano] = React.useState(false)
    const [esIdentificable, setEsIdentificable] = React.useState(false)
    const [seTieneControl, setSeTieneControl] = React.useState(false)

    // Asset (Resguardo) data
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

    // Load Egreso Data on Open
    useEffect(() => {
        if (open && egreso) {
            setFormData({
                cog: egreso.cog || "",
                capitulo: egreso.cog ? egreso.cog.substring(0, 1) + "000" : "", // Approximate chapter from COG
                partida: "", // Not stored directly usually, derived from COG
                cuentaContable: egreso.cuentaContable || "",
                monto: egreso.monto.toString(),
                fecha: egreso.fecha,
                concepto: egreso.concepto,
                pagueseA: egreso.pagueseA || "",
                departamento: egreso.departamento || "",
                area: egreso.area || "",
                fondo: egreso.fondo || "",
                institucionBancaria: egreso.institucionBancaria || "",
                cuentaBancaria: egreso.cuentaBancaria || "",
                poliza: egreso.poliza || ""
            })

            setSelectedCapitulo(egreso.cog ? egreso.cog.substring(0, 1) + "000" : "")

            if (egreso.activoData) {
                setActivoData(egreso.activoData as any)
            }

            // If it was classified as Asset, likely satisfied conditions
            if (egreso.clasificacion === "ACTIVO") {
                setVidaUtilMayor1Ano(true)
                setEsIdentificable(true)
                setSeTieneControl(true)
            } else {
                setVidaUtilMayor1Ano(false)
                setEsIdentificable(false)
                setSeTieneControl(false)
            }
        }
    }, [open, egreso])


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
        if (!egreso) return

        if (!formData.cog || !formData.monto || !formData.concepto) {
            alert("Faltan datos requeridos")
            return
        }

        const montoNumerico = parseFloat(formData.monto.toString().replace(/,/g, ''));

        try {
            const result = await updateEgreso(egreso.id, {
                cog: formData.cog,
                cuentaContable: formData.cuentaContable,
                pagueseA: formData.pagueseA,
                monto: montoNumerico,
                concepto: formData.concepto,
                fondo: formData.fondo,
                // institucionBancaria: formData.institucionBancaria, // Usually not editable here if tied to bank transaction? let's allow for now
                // cuentaBancaria: formData.cuentaBancaria, 
                fecha: formData.fecha,
                // tipo: egreso.tipo, // Keep original type
                // estatus: egreso.estatus,
                departamento: formData.departamento,
                area: formData.area,
                clasificacion: clasificacion,
                activoData: clasificacion === "ACTIVO" ? activoData : undefined
            })

            if (result.success) {
                // Update Context State
                setEgresosContables(prev => prev.map(e => {
                    if (e.id === egreso.id) {
                        return {
                            ...e,
                            ...result.data,
                            activoData: clasificacion === "ACTIVO" ? activoData : undefined // Manually update this in state even if server doesn't return it yet (consistency)
                        } as EgresoContable
                    }
                    return e
                }))

                addToLog("Egreso Actualizado", `Se actualizó el egreso ${egreso.poliza || egreso.id}`, "update")
                onOpenChange(false)
            } else {
                alert("Error al actualizar: " + result.error)
            }
        } catch (error) {
            console.error("Error updating", error)
            alert("Ocurrió un error al actualizar.")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[95vw] !h-[95vh] flex flex-col p-0 overflow-hidden">
                <form onSubmit={handleSubmit} className="flex flex-col h-full w-full">
                    <DialogHeader className="p-6 border-b shrink-0">
                        <DialogTitle>Editar Póliza de Egreso</DialogTitle>
                        <DialogDescription>
                            Modificar detalles del egreso {egreso?.poliza || egreso?.id}
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

                                {/* DEPARTAMENTO - Reuse structure from AddDialog */}
                                <div className="grid md:grid-cols-3 gap-4">
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
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* REUSE CORE FIELDS */}
                            <EgresoFormFields
                                formData={formData}
                                handleChange={handleChange}
                                handleSelectChange={handleSelectChange}
                                presupuesto={presupuesto}
                                fuentes={fuentes}
                                departamentos={departamentos}
                                selectedCapitulo={selectedCapitulo}
                                setSelectedCapitulo={setSelectedCapitulo}
                                proveedores={proveedores}
                            />

                            {/* ASSET LOGIC (Simplified copy) */}
                            <div className="space-y-2 p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="vidaUtilMayor1Ano"
                                        checked={vidaUtilMayor1Ano}
                                        onCheckedChange={(checked) => setVidaUtilMayor1Ano(checked === true)}
                                    />
                                    <Label htmlFor="vidaUtilMayor1Ano" className="text-xs cursor-pointer">Vida útil &gt; 1 año</Label>
                                </div>
                                {/* ... other checkboxes (identificable, control) ... keeping it simple for now or copy all? */}
                                {/* Let's copy basic structure to ensure functionality */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="esIdentificable"
                                        checked={esIdentificable}
                                        onCheckedChange={(checked) => setEsIdentificable(checked === true)}
                                    />
                                    <Label htmlFor="esIdentificable" className="text-xs cursor-pointer">Es identificable</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="seTieneControl"
                                        checked={seTieneControl}
                                        onCheckedChange={(checked) => setSeTieneControl(checked === true)}
                                    />
                                    <Label htmlFor="seTieneControl" className="text-xs cursor-pointer">Se tiene control</Label>
                                </div>
                            </div>

                            {/* CLASIFICACION RESULT */}
                            <div className={`p-4 rounded-lg flex items-center justify-between border ${clasificacion === 'ACTIVO' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider block opacity-70">Clasificación Automática</span>
                                    <div className="font-bold text-xl flex items-center gap-2">
                                        {clasificacion === 'ACTIVO' ? <Package className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                                        {clasificacion}
                                    </div>
                                </div>
                                {clasificacion === 'ACTIVO' && (
                                    <div className="text-xs text-indigo-600 max-w-[50%] text-right">
                                        Se habilitará el formato de resguardo al guardar esta póliza.
                                    </div>
                                )}
                            </div>

                            {/* ACTIVE DATA FIELDS (Only if ACTIVO) */}
                            {clasificacion === 'ACTIVO' && (
                                <div className="grid gap-4 p-4 border border-indigo-200 rounded-lg bg-indigo-50/50">
                                    <h4 className="font-semibold text-sm text-indigo-800">Datos para Resguardo</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2"><Label className="text-xs">Número de Resguardo</Label><Input name="resguardoNumero" value={activoData.resguardoNumero} onChange={handleActivoChange} className="bg-white h-8 text-xs" /></div>
                                        <div className="grid gap-2"><Label className="text-xs">Resguardante</Label><Input name="resguardante" value={activoData.resguardante} onChange={handleActivoChange} className="bg-white h-8 text-xs" /></div>
                                        <div className="grid gap-2"><Label className="text-xs">Marca</Label><Input name="marca" value={activoData.marca} onChange={handleActivoChange} className="bg-white h-8 text-xs" /></div>
                                        <div className="grid gap-2"><Label className="text-xs">Modelo</Label><Input name="modelo" value={activoData.modelo} onChange={handleActivoChange} className="bg-white h-8 text-xs" /></div>
                                        <div className="grid gap-2"><Label className="text-xs">Serie</Label><Input name="serie" value={activoData.serie} onChange={handleActivoChange} className="bg-white h-8 text-xs" /></div>
                                        <div className="grid gap-2"><Label className="text-xs">Color</Label><Input name="color" value={activoData.color} onChange={handleActivoChange} className="bg-white h-8 text-xs" /></div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t shrink-0">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">Guardar Cambios</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
