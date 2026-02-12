"use client"

import React, { useMemo } from "react"
import { useTreasury, EgresoContable, PresupuestoItem } from "@/components/providers/treasury-context"

import { FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportCapTable } from "@/lib/export-reportes"
const COLUMN_HEADERS = [
    "CAPÍTULO DE GASTO",
    "PARTIDA ESPECÍFICA",
    "CONCEPTO",
    "NÚM. DE PÓLIZA",
    "FECHA DE PÓLIZA",
    "FECHA DE PAGO",
    "IMPORTE DE PAGO",
] as const

// ── Helpers ──

function resolveCapitulo(cog: string, tree: PresupuestoItem[]): string {
    if (!cog) return ""
    const firstDigit = cog.replace(/\D/g, "")[0]
    if (!firstDigit) return ""
    for (const item of tree) {
        const itemDigit = (item.codigo || item.cog || "").replace(/\D/g, "")[0]
        if (itemDigit === firstDigit) return `${item.codigo || item.cog} ${item.descripcion}`
    }
    return `${firstDigit}000 INVERSIONES FINANCIERAS Y OTRAS PROVISIONES`
}

function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr)
        return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })
    } catch {
        return dateStr
    }
}

const fmtMoney = (v: number) =>
    new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2,
    }).format(v)

// ── Mapped row type (7 columns) ──
interface Cap7000Row {
    capituloDeGasto: string
    partidaEspecifica: string
    concepto: string
    numPoliza: string
    fechaPoliza: string
    fechaPago: string
    importePago: number
}

function buildCap7000Rows(
    egresos: EgresoContable[],
    presupuesto: PresupuestoItem[]
): Cap7000Row[] {
    return egresos
        .filter((e) => {
            const stripped = e.cog.replace(/\D/g, "")
            return stripped.length > 0 && stripped[0] === "7"
        })
        .map((e) => ({
            capituloDeGasto: resolveCapitulo(e.cog, presupuesto),
            partidaEspecifica: e.cog,
            concepto: e.concepto,
            numPoliza: e.poliza || (e.folioOrden ? String(e.folioOrden) : ""),
            fechaPoliza: formatDate(e.fecha),
            fechaPago: formatDate(e.fecha),
            importePago: e.monto,
        }))
}

// ══════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════

export function Cap7000Table() {
    const { egresosContables, presupuesto, fiscalConfig } = useTreasury()

    const rows = useMemo(
        () => buildCap7000Rows(egresosContables, presupuesto),
        [egresosContables, presupuesto]
    )

    const total = useMemo(() => rows.reduce((s, r) => s + r.importePago, 0), [rows])

    const handleExport = () => {
        exportCapTable({
            fileName: "ANEXO_CAP_7000_INVERSIONES_FINANCIERAS",
            title: "ANEXO DE REGISTROS CONTABLES DEL CAPÍTULO 7000",
            subTitle: "CAPÍTULO 7000 INVERSIONES FINANCIERAS Y OTRAS PROVISIONES",
            fiscalConfig,
            rows,
            totalRow: { label: "TOTAL INVERSIONES FINANCIERAS Y OTRAS PROVISIONES", value: total },
            columns: [
                { header: "CAPÍTULO DE GASTO", key: "capituloDeGasto", width: 25 },
                { header: "PARTIDA ESPECÍFICA", key: "partidaEspecifica", width: 15 },
                { header: "CONCEPTO", key: "concepto", width: 35 },
                { header: "NÚM. DE PÓLIZA", key: "numPoliza", width: 12 },
                { header: "FECHA DE PÓLIZA", key: "fechaPoliza", width: 12 },
                { header: "FECHA DE PAGO", key: "fechaPago", width: 12 },
                { header: "IMPORTE DE PAGO", key: "importePago", width: 15, format: "currency" },
            ],
        })
    }

    const thBase =
        "px-3 py-2 text-[9px] font-bold uppercase tracking-wide border border-black/30 bg-[#d9e1f2] text-center whitespace-nowrap"
    const tdBase = "px-3 py-1.5 text-[9px] border border-black/15 whitespace-nowrap"
    const tdRight = `${tdBase} text-right font-mono`
    const tdLeft = `${tdBase} text-left`
    const tdCenter = `${tdBase} text-center`

    return (
        <div className="w-full overflow-x-auto">
            {/* ═══ HEADER ═══ */}
            <div className="mb-4 space-y-2 print:mb-2">
                <div className="flex items-start justify-between gap-4">
                    <img
                        src="/logo-asf.svg"
                        alt="ASF — Auditoría Superior de la Federación"
                        className="h-16 w-auto shrink-0"
                    />
                    <Button
                        onClick={handleExport}
                        size="sm"
                        className="gap-2 bg-[#217346] hover:bg-[#1a5c38] text-white shadow-md text-xs h-8"
                    >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        Exportar Excel
                    </Button>
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-[9px] max-w-2xl">
                    <span className="font-bold">Núm. auditoría:</span>
                    <span>Información Preliminar</span>
                    <span className="font-bold">Cuenta Pública:</span>
                    <span>{new Date().getFullYear()}</span>
                    <span className="font-bold">Entidad Fiscalizada:</span>
                    <span>Gobierno del estado de VERACRUZ DE IGNACIO DE LA LLAVE</span>
                    <span className="font-bold">Nombre del Ejecutor:</span>
                    <span className="uppercase">{fiscalConfig.nombreEnte || "MUNICIPIO"}</span>
                    <span className="font-bold">Título:</span>
                    <span>PARTICIPACIONES FEDERALES A MUNICIPIOS (PARTICIPACIONES A MUN)</span>
                </div>

                <h2 className="text-sm font-black tracking-wide uppercase pt-2">
                    ANEXO DE REGISTROS CONTABLES DEL CAPÍTULO 7000
                </h2>
            </div>

            {/* ═══ TABLE ═══ */}
            <table className="w-full border-collapse text-[9px] min-w-[1000px]">
                <thead className="sticky top-0 z-10">
                    <tr>
                        {COLUMN_HEADERS.map((h) => (
                            <th key={h} className={thBase}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {/* Sub-header */}
                    <tr className="bg-[#f2f2f2]">
                        <td colSpan={7} className={`${tdBase} text-center font-bold text-[10px] bg-[#f2f2f2]`}>
                            CAPÍTULO 7000 INVERSIONES FINANCIERAS Y OTRAS PROVISIONES
                        </td>
                    </tr>

                    {rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/30">
                            <td className={tdLeft} title={row.capituloDeGasto}>
                                <span className="max-w-[200px] block truncate">{row.capituloDeGasto}</span>
                            </td>
                            <td className={tdCenter}>{row.partidaEspecifica}</td>
                            <td className={tdLeft} title={row.concepto}>
                                <span className="max-w-[300px] block truncate">{row.concepto}</span>
                            </td>
                            <td className={tdCenter}>{row.numPoliza}</td>
                            <td className={tdCenter}>{row.fechaPoliza}</td>
                            <td className={tdCenter}>{row.fechaPago}</td>
                            <td className={tdRight}>{fmtMoney(row.importePago)}</td>
                        </tr>
                    ))}

                    {rows.length === 0 && (
                        <tr>
                            <td colSpan={7} className="text-center text-muted-foreground text-[9px] py-4 border border-black/10">
                                Sin registros para el Capítulo 7000
                            </td>
                        </tr>
                    )}

                    {/* Total row */}
                    <tr className="bg-[#dce6f1] font-bold">
                        <td colSpan={6} className={`${tdBase} text-right font-bold text-[10px]`}>
                            TOTAL INVERSIONES FINANCIERAS Y OTRAS PROVISIONES
                        </td>
                        <td className={`${tdRight} font-bold bg-[#dce6f1]`}>
                            {fmtMoney(total)}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* ═══ FOOTER SIGNATURES ═══ */}
            <div className="mt-8 grid grid-cols-2 gap-8 text-[9px] max-w-xl">
                <div>
                    <p className="font-bold mb-8">Elaboró</p>
                    <div className="border-t border-black pt-1">
                        <p className="text-muted-foreground">Nombre, cargo y firma del servidor público</p>
                    </div>
                </div>
                <div>
                    <p className="font-bold mb-8">Autorizó</p>
                    <div className="border-t border-black pt-1">
                        <p className="text-muted-foreground">Nombre, cargo y firma del servidor público</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
