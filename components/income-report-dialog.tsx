"use client"

import React, { useRef } from "react"
import { useReactToPrint } from "react-to-print"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { useTreasury, IngresoContable } from "@/components/providers/treasury-context"
import { format, isValid, parseISO } from "date-fns"
import { es } from "date-fns/locale"

interface IncomeReportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    ingreso: IngresoContable | null
}

export function IncomeReportDialog({ open, onOpenChange, ingreso }: IncomeReportDialogProps) {
    const componentRef = useRef<HTMLDivElement>(null)
    const { config, fiscalConfig } = useTreasury()

    // Usar useRef y el hook useReactToPrint
    const handlePrint = useReactToPrint({
        contentRef: componentRef, // Pasar la ref del contenido
        documentTitle: `Recibo_Ingreso_${ingreso?.reporteAdicional?.folioRecibo || 'SN'}`,
    })

    // Fix date parsing to avoid timezone offset issues (off-by-one day)
    const formatDate = (dateString: string | Date | undefined) => {
        if (!dateString) return format(new Date(), "dd 'DE' MMMM 'DE' yyyy", { locale: es }).toUpperCase();

        try {
            // If string is YYYY-MM-DD, parse as local parts
            if (typeof dateString === 'string' && dateString.includes('-')) {
                const [year, month, day] = dateString.split('-').map(Number);
                // Create date using local constructor (months are 0-indexed)
                const date = new Date(year, month - 1, day);
                return format(date, "dd 'DE' MMMM 'DE' yyyy", { locale: es }).toUpperCase();
            }
            // Fallback for Date objects or other formats
            return format(new Date(dateString), "dd 'DE' MMMM 'DE' yyyy", { locale: es }).toUpperCase();
        } catch (e) {
            return format(new Date(), "dd 'DE' MMMM 'DE' yyyy", { locale: es }).toUpperCase();
        }
    }

    if (!ingreso || !ingreso.reporteAdicional) return null

    const { reporteAdicional } = ingreso
    const { tipo } = reporteAdicional

    if (tipo === "none") return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[95vw] !w-[95vw] !h-[95vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-4 border-b shrink-0 flex flex-row items-center justify-between">
                    <DialogTitle>Vista Previa del Recibo</DialogTitle>
                    <div className="flex gap-2">
                        <Button onClick={() => {
                            if (componentRef.current) {
                                handlePrint();
                            }
                        }}>
                            <Printer className="w-4 h-4 mr-2" />
                            Imprimir Recibo
                        </Button>
                    </div>
                </DialogHeader>

                {/* ÁREA DE IMPRESIÓN */}
                <div className="flex-1 overflow-auto bg-gray-100 p-8 flex justify-center">
                    <style type="text/css" media="print">
                        {`
                            @page { size: landscape; margin: 0.5cm; }
                            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        `}
                    </style>
                    <div
                        ref={componentRef}
                        className="w-[1050px] bg-white text-black p-8 font-sans text-[10px] shadow-lg"
                        style={{ minHeight: '500px', border: 'none' }} // Border removed for clean print, handled by inner container
                    >
                        {/* ENCABEZADO COMÚN (Solo para NO Predial, Predial tiene su propio header) */}
                        {tipo !== 'predial' && (
                            <div className="flex justify-between items-start mb-4 border-b-2 border-black pb-2">
                                {config.logoLeft && (
                                    <img src={config.logoLeft} alt="Logo Izquierdo" className="h-20 object-contain w-24" />
                                )}

                                <div className="flex-1 text-center px-4">
                                    <h1 className="text-xl font-bold uppercase mb-1">
                                        {fiscalConfig.nombreEnte || "MUNICIPIO DE XXXXXXXXXX, VER."}
                                    </h1>
                                    <p className="font-bold mb-1">R.F.C. {fiscalConfig.rfc || "AAA-000000-AAA"}</p>
                                    <p className="text-[10px] mb-1">
                                        {fiscalConfig.domicilio || "Domicilio Conocido S/N, Centro"}
                                    </p>
                                    <h2 className="text-lg font-bold mt-2 uppercase">TESORERÍA MUNICIPAL</h2>
                                </div>

                                {config.logoRight && (
                                    <img src={config.logoRight} alt="Logo Derecho" className="h-20 object-contain w-24" />
                                )}
                            </div>
                        )}

                        {/* LAYOUT PREDIAL - EXACT REPLICA */}
                        {tipo === 'predial' && (
                            <div className="flex flex-col border-[2px] border-indigo-900 text-indigo-900 p-1 h-full min-h-[600px] font-bold bg-white">
                                {/* HEADER */}
                                <div className="flex border-b-2 border-indigo-900 pb-1 mb-1">
                                    <div className="w-24 shrink-0 flex items-center justify-center p-1">
                                        {/* Logo Placeholder - User can replace or using generic one */}
                                        {config.logoLeft ? (
                                            <img src={config.logoLeft} alt="Logo" className="h-16 w-auto object-contain" />
                                        ) : (
                                            <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center text-[8px] text-center p-1">ESCUDO</div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center px-2 text-center">
                                        <h1 className="text-xl leading-none">RECIBO DEL IMPUESTO PREDIAL MUNICIPAL</h1>
                                        <div className="text-sm mt-1 flex items-center justify-center gap-2">
                                            <span>H. AYUNTAMIENTO DE:</span>
                                            <span className="underline decoration-1 underline-offset-2 uppercase">{fiscalConfig.nombreEnte || "TENOCHTITLÁN"}</span>
                                        </div>
                                        <h2 className="text-lg mt-1">TESORERIA MUNICIPAL</h2>
                                    </div>
                                    <div className="w-56 shrink-0 flex flex-col text-[10px]">
                                        <div className="text-right pr-2">FECHA DE COBRO:</div>
                                        <div className="border-2 border-indigo-900 p-1 text-center bg-indigo-50/30 grow flex items-center justify-center font-mono text-sm leading-none">
                                            {reporteAdicional.fechaCobro ?
                                                (() => {
                                                    try {
                                                        // Attempt 1: Parse as ISO if it matches YYYY-MM-DD
                                                        let date = parseISO(reporteAdicional.fechaCobro);
                                                        if (!isValid(date)) {
                                                            // Attempt 2: Direct constructor (fallback)
                                                            date = new Date(reporteAdicional.fechaCobro + 'T12:00:00');
                                                        }

                                                        if (isValid(date)) {
                                                            return format(date, "dd/MM/yyyy", { locale: es });
                                                        }
                                                        // Fallback text if invalid
                                                        return reporteAdicional.fechaCobro;
                                                    } catch (e) {
                                                        return reporteAdicional.fechaCobro;
                                                    }
                                                })()
                                                : format(new Date(), "dd/MM/yyyy", { locale: es })}
                                        </div>
                                    </div>
                                </div>

                                {/* ROW 1: FOLIO & CLAVE CATASTRAL */}
                                <div className="flex border-b-2 border-indigo-900 mb-1">
                                    <div className="w-1/3 flex items-center gap-2 pl-4 text-lg border-r-2 border-indigo-900">
                                        <span>FOLIO:</span>
                                        <span className="text-red-600 font-mono text-xl">{reporteAdicional.folioRecibo || reporteAdicional.folio}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex text-[9px] text-center border-b border-indigo-900">
                                            <div className="flex-1">CLAVE CATASTRAL</div>
                                            <div className="w-16 border-l border-indigo-900">CONDOMINIO</div>
                                        </div>
                                        <div className="grid grid-cols-[repeat(6,1fr)_40px_40px_30px] text-center text-[9px] h-10">
                                            {/* Headers */}
                                            <div className="border-r border-b border-indigo-900 flex items-center justify-center">ZONA</div>
                                            <div className="border-r border-b border-indigo-900 flex items-center justify-center">MPIO.</div>
                                            <div className="border-r border-b border-indigo-900 flex items-center justify-center">LOC.</div>
                                            <div className="border-r border-b border-indigo-900 flex items-center justify-center">REG.</div>
                                            <div className="border-r border-b border-indigo-900 flex items-center justify-center">MANZ.</div>
                                            <div className="border-r border-b border-indigo-900 flex items-center justify-center">LOTE</div>
                                            <div className="border-r border-b border-indigo-900 flex items-center justify-center text-[8px] leading-tight">NIVEL</div>
                                            <div className="border-r border-b border-indigo-900 flex items-center justify-center text-[8px] leading-tight">DEPTO</div>
                                            <div className="border-b border-indigo-900 flex items-center justify-center">D.V.</div>

                                            {/* Values */}
                                            <div className="border-r border-indigo-900 flex items-center justify-center font-mono text-xs pt-1">{reporteAdicional.zona}</div>
                                            <div className="border-r border-indigo-900 flex items-center justify-center font-mono text-xs pt-1">{reporteAdicional.municipio}</div>
                                            <div className="border-r border-indigo-900 flex items-center justify-center font-mono text-xs pt-1">{reporteAdicional.localidad}</div>
                                            <div className="border-r border-indigo-900 flex items-center justify-center font-mono text-xs pt-1">{reporteAdicional.region}</div>
                                            <div className="border-r border-indigo-900 flex items-center justify-center font-mono text-xs pt-1">{reporteAdicional.manzana}</div>
                                            <div className="border-r border-indigo-900 flex items-center justify-center font-mono text-xs pt-1">{reporteAdicional.lote}</div>
                                            <div className="border-r border-indigo-900 flex items-center justify-center font-mono text-xs pt-1">{reporteAdicional.nivel}</div>
                                            <div className="border-r border-indigo-900 flex items-center justify-center font-mono text-xs pt-1">{reporteAdicional.departamento}</div>
                                            <div className="flex items-center justify-center font-mono text-xs pt-1">{reporteAdicional.digitoVerificador}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* ROW 2: CONTRIBUYENTE, TIPO PREDIO, PERIODO */}
                                <div className="flex border-b-2 border-indigo-900 h-14 mb-1">
                                    <div className="w-[60%] border-r-2 border-indigo-900 flex flex-col">
                                        <div className="bg-indigo-50/30 border-b border-indigo-900 px-2 text-[10px] py-0.5">NOMBRE DEL CONTRIBUYENTE</div>
                                        <div className="flex-1 flex items-center px-4 uppercase text-sm">
                                            {reporteAdicional.nombreContribuyente}
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col border-r-2 border-indigo-900">
                                        <div className="bg-indigo-50/30 border-b border-indigo-900 px-2 text-center text-[10px] py-0.5">TIPO DE PREDIO</div>
                                        <div className="flex-1 flex items-center justify-center uppercase text-sm">
                                            {reporteAdicional.tipoPredio}
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <div className="bg-indigo-50/30 border-b border-indigo-900 px-2 text-center text-[10px] py-0.5">PERIODO</div>
                                        <div className="flex-1 flex items-center justify-center uppercase text-xs text-center leading-tight p-1">
                                            {reporteAdicional.periodo}
                                        </div>
                                    </div>
                                </div>

                                {/* ROW 3: UBICACION */}
                                <div className="flex border-b-2 border-indigo-900 h-14 mb-1">
                                    <div className="flex-1 flex flex-col border-r-2 border-indigo-900">
                                        <div className="flex border-b border-indigo-900 bg-indigo-50/30">
                                            <div className="w-1/2 px-2 text-[10px] py-0.5 border-r border-indigo-900">UBICACION DEL PREDIO</div>
                                            <div className="w-1/2 px-2 text-[10px] py-0.5 text-center">COLONIA</div>
                                        </div>
                                        <div className="flex-1 flex">
                                            <div className="w-1/2 flex items-center px-2 uppercase text-xs border-r border-indigo-900 truncate">
                                                {reporteAdicional.ubicacionPredio}
                                            </div>
                                            <div className="flex-1 flex items-center justify-center px-2 uppercase text-xs truncate">
                                                {reporteAdicional.colonia}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-[20%] flex flex-col justify-center px-4 items-end">
                                        <span className="text-sm font-bold">$ {reporteAdicional.baseImpuesto}</span>
                                    </div>
                                </div>

                                {/* ROW 3.5: CLASIFICACIÓN PRESUPUESTAL */}
                                <div className="flex border-b-2 border-indigo-900 mb-1">
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex border-b border-indigo-900 bg-indigo-50/30 text-[9px] text-center font-bold">
                                            <div className="w-1/4 border-r border-indigo-900 py-0.5">CAPITULO</div>
                                            <div className="w-1/2 border-r border-indigo-900 py-0.5">PARTIDA GENÉRICA / CRI</div>
                                            <div className="w-1/4 py-0.5">CUENTA CONTABLE</div>
                                        </div>
                                        <div className="flex items-center text-[10px] font-mono h-8">
                                            <div className="w-1/4 border-r border-indigo-900 px-2 flex items-center justify-center">
                                                {reporteAdicional.capitulo}
                                            </div>
                                            <div className="w-1/2 border-r border-indigo-900 px-2 flex items-center justify-center text-center leading-tight">
                                                <span className="font-bold mr-1">{reporteAdicional.cri}</span>
                                                <span className="uppercase text-[8px]">{reporteAdicional.partidaGenerica}</span>
                                            </div>
                                            <div className="w-1/4 px-2 flex items-center justify-center">
                                                {reporteAdicional.cuentaContable}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ROW 4 & 5: LIQUIDACION GRID */}
                                <div className="flex border-b-2 border-indigo-900 flex-1">
                                    {/* Left Column: Legal / Discount Text */}
                                    <div className="w-[28%] border-r-2 border-indigo-900 p-2 flex flex-col justify-between">
                                        <div className="text-[8px] text-justify leading-tight">
                                            CON EL DESCUENTO DEL {reporteAdicional.pagarConDescuento && parseFloat(reporteAdicional.pagarConDescuento.toString()) > 0 ? "20% ó 50%" : "0%"} POR EL PAGO ANUAL DURANTE EL MES DE ENERO. CONFORME AL ARTÍCULO 118 SEGUNDO PÁRRAFO DEL CÓDIGO HACENDARIO MUNICIPAL.
                                        </div>
                                        <div className="mt-2 text-xs text-center border-t border-indigo-900 pt-1">
                                            A PAGAR CON DESCUENTO
                                            <div className="text-xl mt-1">$ {reporteAdicional.totalPagar || reporteAdicional.sumaTotal}</div>
                                        </div>
                                    </div>

                                    {/* Right Column: Liquidation Table */}
                                    <div className="flex-1 flex flex-col">
                                        {/* Headers */}
                                        <div className="flex border-b border-indigo-900 bg-indigo-50/30 text-[10px] text-center">
                                            <div className="w-1/3 py-1 border-r border-indigo-900">BASE DEL IMPUESTO</div>
                                            <div className="w-1/3 py-1 border-r border-indigo-900">IMPUESTO</div>
                                            <div className="w-1/3 py-1">ADICIONAL</div>
                                        </div>
                                        {/* ValuesRow 1 */}
                                        <div className="flex border-b border-indigo-900 h-10 items-center text-sm font-bold">
                                            <div className="w-1/3 px-4 border-r border-indigo-900">$ {reporteAdicional.baseImpuesto}</div>
                                            <div className="w-1/3 px-4 text-center border-r border-indigo-900">$ {reporteAdicional.impuesto}</div>
                                            <div className="w-1/3 px-4 text-center">$ {reporteAdicional.importeAdicional}</div>
                                        </div>
                                        {/* Row 2 Headers: A Pagar Sin Desc | Recargos | Multa */}
                                        <div className="flex border-b border-indigo-900 bg-indigo-50/30 text-[10px] text-center">
                                            <div className="w-1/3 py-1 border-r border-indigo-900">A PAGAR SIN DESCUENTO</div>
                                            <div className="w-1/3 py-1 border-r border-indigo-900">RECARGOS</div>
                                            <div className="w-1/3 py-1">MULTA</div>
                                        </div>
                                        {/* Values Row 2 */}
                                        <div className="flex h-10 items-center text-sm font-bold flex-1">
                                            <div className="w-1/3 px-4 border-r border-indigo-900 flex items-center justify-between border-b-0 h-full">
                                                <span>$</span>
                                                {/* Calculo simple "A Pagar Sin Descuento": Base + Imp + Adic?? No, usually Total + Descuento */}
                                                <span>
                                                    {(parseFloat(reporteAdicional.totalPagar?.toString().replace(/,/g, '') || '0') + parseFloat(reporteAdicional.pagarConDescuento?.toString().replace(/,/g, '') || '0')).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="w-1/3 px-4 border-r border-indigo-900 flex justify-between items-center h-full">
                                                <span>$</span><span>{reporteAdicional.recargos}</span>
                                            </div>
                                            <div className="w-1/3 px-4 flex justify-between items-center h-full">
                                                <span>$</span><span>{reporteAdicional.multa}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* FOOTER: CAJERO & TOTAL */}
                                <div className="flex h-16 shrink-0">
                                    <div className="w-[28%] flex flex-col justify-end p-2 relative">
                                        <div className="border-t border-indigo-900 pt-1 text-center text-xs">
                                            NOMBRE DEL CAJERO
                                        </div>
                                        <div className="absolute top-1 left-2 text-[10px]">CAJERO TEMPORAL</div>
                                    </div>
                                    <div className="flex-1 border-l-2 border-indigo-900 flex flex-col">
                                        <div className="flex h-1/2 border-b border-indigo-900">
                                            <div className="w-1/2 flex items-center justify-end px-2 text-xs gap-2 border-r border-indigo-900">
                                                <span>NUM. DE CAJERO</span>
                                                <span className="text-lg">{reporteAdicional.numeroCajero}</span>
                                            </div>
                                            <div className="w-1/2 flex flex-col">
                                                <div className="bg-indigo-50/30 text-[10px] text-center border-b border-indigo-900 font-bold shrink-0">HONORARIOS</div>
                                                <div className="flex justify-between px-4 items-center flex-1 text-sm font-bold">
                                                    <span>$</span><span>{reporteAdicional.honorarios}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex h-1/2">
                                            <div className="w-1/2 border-r border-indigo-900 flex items-center justify-center font-mono text-xl text-gray-400">
                                                39
                                            </div>
                                            <div className="w-1/2 bg-indigo-100/50 flex flex-col">
                                                <div className="bg-indigo-200/50 text-[10px] text-center border-b border-indigo-900 font-bold shrink-0 text-indigo-900">TOTAL A PAGAR</div>
                                                <div className="flex justify-between px-4 items-center flex-1 font-bold text-lg text-indigo-900">
                                                    <span>$</span><span>{reporteAdicional.totalPagar || reporteAdicional.sumaTotal}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* LAYOUT OTROS INGRESOS (Existente) */}
                        {tipo === 'otros' && (
                            <div className="flex flex-col h-full justify-between">
                                {/* DATOS DEL CONTRIBUYENTE Y REGISTRO */}
                                <div className="flex mb-0.5 gap-1 h-36">
                                    {/* Lado Izquierdo: Datos Contribuyente */}
                                    <div className="w-[58%] border border-black rounded-lg overflow-hidden flex flex-col text-[10px]">
                                        <div className="grid grid-cols-[85px_1fr_40px_1fr] border-b border-black h-1/2">
                                            <div className="p-1 font-bold border-r border-black bg-emerald-100/50 flex items-center">NOMBRE DEL CONTRIBUYENTE</div>
                                            <div className="p-1 border-r border-black font-semibold flex items-center uppercase leading-tight">{reporteAdicional.nombre}</div>
                                            <div className="p-1 font-bold border-r border-black bg-emerald-100/50 flex items-center justify-center">R.F.C.</div>
                                            <div className="p-1 flex items-center uppercase">{reporteAdicional.rfc}</div>
                                        </div>
                                        <div className="grid grid-cols-[85px_1fr_40px_1fr] h-1/2">
                                            <div className="p-1 font-bold border-r border-black bg-emerald-100/50 flex items-center">DOMICILIO</div>
                                            <div className="p-1 border-r border-black flex items-center uppercase leading-tight">{reporteAdicional.domicilio}</div>
                                            <div className="p-1 font-bold border-r border-black bg-emerald-100/50 flex items-center justify-center">CIUDAD</div>
                                            <div className="p-1 flex items-center">VER.</div>
                                        </div>
                                    </div>

                                    {/* Lado Derecho: Registro (Budget Layout - Expanded Vertical) */}
                                    <div className="w-[42%] flex flex-col gap-1 h-full">
                                        <div className="border border-black rounded-lg overflow-hidden flex-1 flex flex-col">
                                            <div className="bg-emerald-100/50 text-center font-bold border-b border-black py-0.5 text-[9px] shrink-0">REGISTRO PRESUPUESTAL</div>
                                            <div className="flex-1 flex flex-col pl-3 font-mono border-l-4 border-emerald-500/20">
                                                {/* Fully Expanded Layout - Equal Thirds */}

                                                {/* Capítulo (1/3) */}
                                                <div className="flex-1 flex items-center border-b border-gray-200">
                                                    <span className="font-bold w-20 text-xs uppercase text-gray-500 shrink-0">CAPÍTULO:</span>
                                                    <span className="text-sm font-bold text-black truncate">{reporteAdicional.capitulo}</span>
                                                </div>

                                                {/* Partida + CRI (1/3) */}
                                                <div className="flex-1 flex items-center border-b border-gray-200">
                                                    <span className="font-bold w-20 text-xs uppercase text-gray-500 shrink-0">PARTIDA:</span>
                                                    <div className="flex flex-col justify-center leading-none overflow-hidden h-full py-1">
                                                        <span className="text-sm font-bold text-black truncate">{reporteAdicional.cri}</span>
                                                        <span className="text-[9px] font-bold uppercase mt-0.5 truncate text-gray-700">
                                                            {reporteAdicional.partidaGenerica}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Cuenta (1/3) */}
                                                <div className="flex-1 flex items-center">
                                                    <span className="font-bold w-20 text-xs uppercase text-gray-500 shrink-0">CUENTA:</span>
                                                    <span className="text-sm font-bold text-black truncate">{reporteAdicional.cuentaContable}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="border border-black rounded-lg overflow-hidden flex flex-col items-center h-[2.5rem] shrink-0">
                                            <div className="font-bold text-center border-b border-black w-full text-[9px] bg-gray-50">RECIBO OFICIAL</div>
                                            <div className="text-lg text-red-600 font-bold px-4 flex items-center justify-center flex-1 font-mono tracking-wider">{reporteAdicional.folioRecibo} A</div>
                                        </div>
                                    </div>
                                </div>

                                {/* DETALLE CONCEPTOS E IMPORTES */}
                                {/* DETALLE CONCEPTOS E IMPORTES */}
                                <div className="border-2 border-black rounded-lg mb-0.5 overflow-hidden min-h-[120px] flex">
                                    {/* Columna Concepto */}
                                    <div className="w-2/3 border-r-2 border-black flex flex-col">
                                        <div className="bg-emerald-100/50 font-bold text-center border-b border-black py-1 tracking-widest text-[10px]">
                                            C O N C E P T O
                                        </div>
                                        <div className="p-2 text-xs font-mono uppercase flex-1 whitespace-pre-wrap leading-relaxed">
                                            {reporteAdicional.conceptoDetalle}
                                        </div>
                                    </div>

                                    {/* Columna Importe */}
                                    <div className="w-1/3 flex flex-col">
                                        <div className="bg-emerald-100/50 font-bold text-center border-b border-black py-1 tracking-widest text-[10px]">
                                            IMPORTE
                                        </div>

                                        <div className="flex border-b border-black">
                                            <div className="w-24 p-1 pl-2 border-r border-black bg-gray-50">CORRIENTE</div>
                                            <div className="flex-1 p-1 text-right font-bold pr-4">${reporteAdicional.importeCorriente}</div>
                                        </div>
                                        <div className="flex border-b border-black">
                                            <div className="w-24 p-1 pl-2 border-r border-black bg-gray-50">REZAGOS</div>
                                            <div className="flex-1 p-1 text-right pr-4"></div>
                                        </div>
                                        <div className="flex border-b border-black">
                                            <div className="w-24 p-1 pl-2 border-r border-black bg-gray-50">ADICIONAL</div>
                                            <div className="flex-1 p-1 text-right font-bold pr-4">{reporteAdicional.importeAdicional}</div>
                                        </div>
                                        <div className="flex border-b border-black">
                                            <div className="w-24 p-1 pl-2 border-r border-black bg-gray-50">SUMA</div>
                                            <div className="flex-1 p-1 text-right pr-4 text-xs italic opacity-50">(${reporteAdicional.sumaTotal})</div>
                                        </div>
                                        <div className="flex border-b border-black">
                                            <div className="w-24 p-1 pl-2 border-r border-black bg-gray-50">RECARGOS</div>
                                            <div className="flex-1 p-1 text-right pr-4"></div>
                                        </div>
                                        <div className="flex border-b border-black">
                                            <div className="w-24 p-1 pl-2 border-r border-black bg-gray-50 text-[9px]">HONORARIOS EJEC.</div>
                                            <div className="flex-1 p-1 text-right pr-4"></div>
                                        </div>
                                        <div className="flex flex-1 items-end pb-1">
                                            <div className="w-24 p-1 pl-2 border-r border-black font-bold">TOTAL</div>
                                            <div className="flex-1 p-1 text-right font-bold text-lg pr-4">${reporteAdicional.sumaTotal}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* TOTAL LETRA */}
                                <div className="border-2 border-black rounded-lg mb-1 p-1 pl-2 uppercase font-bold text-sm bg-emerald-50/30">
                                    ({reporteAdicional.totalLetra}) LETRA
                                </div>

                                {/* FOOTER: APLICACION, FECHA, FIRMAS */}
                                <div className="flex gap-2 h-[100px]">
                                    {/* Tabla Aplicación */}
                                    <div className="w-1/3 border-2 border-black rounded-lg overflow-hidden flex flex-col text-[10px]">
                                        <div className="flex border-b border-black">
                                            <div className="w-32 pl-1 border-r border-black bg-emerald-100/50 font-semibold">APLICACION</div>
                                            <div className="w-8 border-r border-black text-center font-bold">X</div>
                                            <div className="flex-1 text-center bg-emerald-100/50 font-semibold">DENOMINACION</div>
                                        </div>
                                        {[
                                            "Impuestos", "Derechos", "Productos", "Aprovechamientos", "Otros"
                                        ].map((row) => (
                                            <div key={row} className="flex border-b border-black last:border-0 h-full items-center">
                                                <div className="w-32 pl-1 border-r border-black bg-emerald-50/50 truncate uppercase">{row}</div>
                                                <div className="w-8 border-r border-black text-center font-bold">
                                                    {reporteAdicional.aplicacion === row ? "X" : ""}
                                                </div>
                                                <div className="flex-1"></div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Fecha y Firmas */}
                                    <div className="flex-1 flex flex-col gap-2">
                                        <div className="border-2 border-black rounded-lg p-1 px-4 flex justify-between items-center bg-emerald-50/30">
                                            <span className="font-bold">FECHA</span>
                                            <span className="font-mono text-lg font-bold">
                                                {formatDate(reporteAdicional.fechaEmision)}
                                            </span>
                                        </div>

                                        <div className="border-2 border-black rounded-lg flex-1 relative mt-2">
                                            <div className="absolute bottom-8 w-full border-t border-black px-8"></div>
                                            <div className="absolute bottom-1 w-full text-center">
                                                <div className="font-bold text-[10px]">NOMBRE Y FIRMA DEL RECAUDADOR</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* DISCLAIMER LEGAL */}
                                <div className="mt-0 text-[6px] text-center px-1 leading-none opacity-75">
                                    LA REPRODUCCIÓN APÓCRIFA DE ESTE COMPROBANTE CONSTITUYE UN DELITO EN LOS TÉRMINOS DE LAS DISPOSICIONES FISCALES.
                                </div>
                            </div>
                        )}

                        <div className="hidden">
                            {/* Hack to force tailwind to keep these classes if they are only used dynamically */}
                            <span className="bg-emerald-100/50 bg-emerald-50/30"></span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
