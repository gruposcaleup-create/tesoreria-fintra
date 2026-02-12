"use client"

import React, { useMemo, useState, useCallback } from "react"
import { useTreasury, EgresoContable, PresupuestoItem } from "@/components/providers/treasury-context"
import { ChevronDown, ChevronRight, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"

// ── ASF Chapter definitions (CAP.1000 – CAP.9000) ──
const ASF_CHAPTERS = [
    { key: "1", label: "CAP.1000", title: "CAPITULO 1000 - SERVICIOS PERSONALES" },
    { key: "2", label: "CAP.2000", title: "CAPITULO 2000 - MATERIALES Y SUMINISTROS" },
    { key: "3", label: "CAP.3000", title: "CAPITULO 3000 - SERVICIOS GENERALES" },
    { key: "4", label: "CAP.4000", title: "CAPITULO 4000 - TRANSFERENCIAS, ASIGNACIONES, SUBSIDIOS Y OTRAS AYUDAS" },
    { key: "5", label: "CAP.5000", title: "CAPITULO 5000 - BIENES MUEBLES, INMUEBLES E INTANGIBLES" },
    { key: "6", label: "CAP.6000", title: "CAPITULO 6000 - INVERSIÓN PÚBLICA" },
    { key: "7", label: "CAP.7000", title: "CAPITULO 7000 - INVERSIONES FINANCIERAS Y OTRAS PROVISIONES" },
    { key: "8", label: "CAP.8000", title: "CAPITULO 8000 - PARTICIPACIONES Y APORTACIONES" },
    { key: "9", label: "CAP.9000", title: "CAPITULO 9000 - DEUDA PÚBLICA" },
]

const MONTH_HEADERS = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
]

// Format MXN currency—compact for the table
const fmt = (v: number) =>
    v === 0
        ? ""
        : new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
            minimumFractionDigits: 2,
        }).format(v)

const fmtForce = (v: number) =>
    new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2,
    }).format(v)

// ── Row type after aggregation ──
interface ASFRow {
    cuentaContable: string
    concepto: string
    months: number[] // 14 buckets: ene..dic (current) + ene,feb (next) 
    acumulado: number
}

interface ChapterBlock {
    chapter: typeof ASF_CHAPTERS[number]
    rows: ASFRow[]
    totals: number[] // 14 months
    acumulado: number
}

// ── Helpers ──

function chapterKeyFromCOG(cog: string): string | null {
    if (!cog) return null
    const stripped = cog.replace(/\D/g, "")
    if (stripped.length === 0) return null
    return stripped[0]
}

function resolveConcepto(cog: string, tree: PresupuestoItem[]): string {
    for (const item of tree) {
        if (item.codigo === cog || item.cog === cog) return item.descripcion
        if (item.subcuentas) {
            const found = resolveConcepto(cog, item.subcuentas)
            if (found) return found
        }
    }
    return ""
}

function buildASFData(
    egresos: EgresoContable[],
    presupuesto: PresupuestoItem[],
    fiscalYear: number
): ChapterBlock[] {
    const chapterMap = new Map<string, Map<string, number[]>>()

    for (const e of egresos) {
        const ck = chapterKeyFromCOG(e.cog)
        if (!ck) continue

        const d = new Date(e.fecha)
        const year = d.getFullYear()
        const month = d.getMonth()

        let bucket: number | null = null
        if (year === fiscalYear) {
            bucket = month
        } else if (year === fiscalYear + 1 && month <= 1) {
            bucket = 12 + month
        }
        if (bucket === null) continue

        if (!chapterMap.has(ck)) chapterMap.set(ck, new Map())
        const cogMap = chapterMap.get(ck)!
        if (!cogMap.has(e.cog)) cogMap.set(e.cog, new Array(14).fill(0))
        cogMap.get(e.cog)![bucket] += e.monto
    }

    return ASF_CHAPTERS.map((ch) => {
        const cogMap = chapterMap.get(ch.key) ?? new Map<string, number[]>()

        const rows: ASFRow[] = Array.from(cogMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([cog, months]) => ({
                cuentaContable: cog,
                concepto: resolveConcepto(cog, presupuesto) || cog,
                months,
                acumulado: months.reduce((s, v) => s + v, 0),
            }))

        const totals = new Array(14).fill(0)
        let acumulado = 0
        for (const r of rows) {
            for (let i = 0; i < 14; i++) totals[i] += r.months[i]
            acumulado += r.acumulado
        }

        return { chapter: ch, rows, totals, acumulado }
    })
}

// ══════════════════════════════════════════════════════
// Excel Export Logic
// ══════════════════════════════════════════════════════

/** Convert the ASF logo SVG to a PNG base64 data URL via canvas. */
async function svgToPngBase64(svgUrl: string, width = 600, height = 200): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
            const canvas = document.createElement("canvas")
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext("2d")!
            ctx.fillStyle = "white"
            ctx.fillRect(0, 0, width, height)
            ctx.drawImage(img, 0, 0, width, height)
            // Return just the base64 data (no data URI prefix)
            const dataUrl = canvas.toDataURL("image/png")
            resolve(dataUrl.split(",")[1])
            canvas.remove()
        }
        img.onerror = reject
        img.src = svgUrl
    })
}

async function exportToExcel(
    blocks: ChapterBlock[],
    grandTotals: { months: number[]; acumulado: number },
    fiscalYear: number,
    entityName: string
) {
    const ExcelJS = (await import("exceljs")).default
    const { saveAs } = await import("file-saver")

    const wb = new ExcelJS.Workbook()
    wb.creator = "FINTRA.ai"
    wb.created = new Date()

    const ws = wb.addWorksheet("ANEXO 6", {
        pageSetup: { paperSize: 5, orientation: "landscape", fitToPage: true, fitToWidth: 1 },
    })

    const nextYear = fiscalYear + 1

    // ── Column widths ──
    ws.columns = [
        { width: 22 },  // A: CUENTA CONTABLE
        { width: 42 },  // B: CONCEPTO
        { width: 14 },  // C: ENERO
        { width: 14 },  // D: FEBRERO
        { width: 14 },  // E: MARZO
        { width: 14 },  // F: ABRIL
        { width: 14 },  // G: MAYO
        { width: 14 },  // H: JUNIO
        { width: 14 },  // I: JULIO
        { width: 14 },  // J: AGOSTO
        { width: 14 },  // K: SEPTIEMBRE
        { width: 14 },  // L: OCTUBRE
        { width: 14 },  // M: NOVIEMBRE
        { width: 14 },  // N: DICIEMBRE
        { width: 14 },  // O: ENERO next
        { width: 14 },  // P: FEBRERO next
        { width: 16 },  // Q: ACUMULADO
    ]

    // ── Style constants ──
    const borderThin = {
        top: { style: "thin" as const },
        left: { style: "thin" as const },
        bottom: { style: "thin" as const },
        right: { style: "thin" as const },
    }

    const currencyFmt = '"$"#,##0.00'

    // ── Embed ASF Logo ──
    try {
        const pngBase64 = await svgToPngBase64("/logo-asf.svg", 600, 200)
        const logoId = wb.addImage({
            base64: pngBase64,
            extension: "png",
        })
        ws.addImage(logoId, {
            tl: { col: 0, row: 0 },
            ext: { width: 240, height: 80 },
        })
    } catch (e) {
        console.warn("Could not embed ASF logo:", e)
    }

    // ── Header rows (rows 1-5) ──
    // Row 1: Leave space for logo + entity header
    ws.mergeCells("C1:P1")
    const headerCell = ws.getCell("C1")
    headerCell.value = `Gobierno del estado de Veracruz de Ignacio de la Llave`
    headerCell.font = { size: 8, color: { argb: "FF666666" } }
    headerCell.alignment = { horizontal: "center", vertical: "middle" }
    ws.getRow(1).height = 18

    // Row 2: Entity name
    ws.mergeCells("C2:P2")
    const entityCell = ws.getCell("C2")
    entityCell.value = entityName || "MUNICIPIO"
    entityCell.font = { size: 11, bold: true, color: { argb: "FF1a2744" } }
    entityCell.alignment = { horizontal: "center", vertical: "middle" }
    ws.getRow(2).height = 18

    // Row 3: ASF subtitle
    ws.mergeCells("C3:P3")
    const subtitleCell = ws.getCell("C3")
    subtitleCell.value = "Auditoría Superior de la Federación • Información Preliminar"
    subtitleCell.font = { size: 8, color: { argb: "FF888888" } }
    subtitleCell.alignment = { horizontal: "center", vertical: "middle" }
    ws.getRow(3).height = 15

    // Row 4: ANEXO 6
    ws.mergeCells("A4:Q4")
    const anexoCell = ws.getCell("A4")
    anexoCell.value = "ANEXO 6"
    anexoCell.font = { size: 13, bold: true }
    anexoCell.alignment = { horizontal: "center", vertical: "middle" }
    ws.getRow(4).height = 22

    // Row 5: Instructions
    ws.mergeCells("A5:Q5")
    const instrCell = ws.getCell("A5")
    instrCell.value = `INDICACIONES: EL LLENADO DE ESTE FORMATO REPRESENTA LA SUMA MENSUAL DE LAS PARTIDAS ESPECÍFICAS POR CAPÍTULO DE GASTO QUE CONFORMAN LAS CUENTAS (FILAS) DERIVADOS DE LOS RECURSOS RECIBIDOS DE LAS PARTICIPACIONES A ENE ${fiscalYear}`
    instrCell.font = { size: 7, color: { argb: "FF666666" } }
    instrCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
    ws.getRow(5).height = 28

    // ── Table Header Row 1 (Year groupings) — Row 6 ──
    const yearHeaderFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFB4C6E7" } }
    const nextYearFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFCE4D6" } }
    const acumFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFE2EFDA" } }
    const headerFont = { size: 8, bold: true }

    // Merge A6:B6 (empty top-left)
    ws.mergeCells("A6:B6")
    ws.getCell("A6").fill = yearHeaderFill
    ws.getCell("A6").border = borderThin

    // Merge C6:N6 (fiscal year)
    ws.mergeCells("C6:N6")
    const yearCell = ws.getCell("C6")
    yearCell.value = fiscalYear
    yearCell.font = headerFont
    yearCell.fill = yearHeaderFill
    yearCell.alignment = { horizontal: "center", vertical: "middle" }
    yearCell.border = borderThin

    // Merge O6:P6 (next year)
    ws.mergeCells("O6:P6")
    const nyCell = ws.getCell("O6")
    nyCell.value = nextYear
    nyCell.font = headerFont
    nyCell.fill = nextYearFill
    nyCell.alignment = { horizontal: "center", vertical: "middle" }
    nyCell.border = borderThin

    // Q6: ACUMULADO (merge with Q7)
    ws.mergeCells("Q6:Q7")
    const acumHeaderCell = ws.getCell("Q6")
    acumHeaderCell.value = "ACUMULADO\nPERIODO\nANTERIOR"
    acumHeaderCell.font = headerFont
    acumHeaderCell.fill = acumFill
    acumHeaderCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
    acumHeaderCell.border = borderThin

    ws.getRow(6).height = 18

    // ── Table Header Row 2 (Month names) — Row 7 ──
    const monthNames = [...MONTH_HEADERS, `ENERO ${nextYear}`, `FEBRERO ${nextYear}`]
    const row7Labels = ["CUENTA CONTABLE", "CONCEPTO", ...monthNames]

    const row7 = ws.getRow(7)
    row7.height = 16
    row7Labels.forEach((label, i) => {
        const cell = row7.getCell(i + 1)
        cell.value = label
        cell.font = headerFont
        cell.fill = i >= 14 ? nextYearFill : yearHeaderFill
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
        cell.border = borderThin
    })

    // ── Data Rows ──
    let currentRow = 8
    const chapterFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFDCE6F1" } }
    const chapterFont = { size: 9, bold: true }
    const dataFont = { size: 8, name: "Consolas" }
    const dataFontLeft = { size: 8 }

    for (const block of blocks) {
        // Chapter header
        const chRow = ws.getRow(currentRow)
        ws.mergeCells(`A${currentRow}:B${currentRow}`)
        const chLabelCell = chRow.getCell(1)
        chLabelCell.value = block.chapter.title
        chLabelCell.font = chapterFont
        chLabelCell.fill = chapterFill
        chLabelCell.border = borderThin

        // Chapter totals
        for (let i = 0; i < 14; i++) {
            const cell = chRow.getCell(i + 3)
            cell.value = block.totals[i] || null
            cell.numFmt = currencyFmt
            cell.font = { ...dataFont, bold: true }
            cell.fill = chapterFill
            cell.alignment = { horizontal: "right" }
            cell.border = borderThin
        }
        // Acumulado
        const acumCell = chRow.getCell(17)
        acumCell.value = block.acumulado || null
        acumCell.numFmt = currencyFmt
        acumCell.font = { ...dataFont, bold: true }
        acumCell.fill = acumFill
        acumCell.alignment = { horizontal: "right" }
        acumCell.border = borderThin

        currentRow++

        // Partida rows
        for (const row of block.rows) {
            const dataRow = ws.getRow(currentRow)

            // A: Cuenta Contable
            const ccCell = dataRow.getCell(1)
            ccCell.value = row.cuentaContable
            ccCell.font = dataFont
            ccCell.border = borderThin

            // B: Concepto
            const cpCell = dataRow.getCell(2)
            cpCell.value = row.concepto
            cpCell.font = dataFontLeft
            cpCell.border = borderThin

            // Monthly values
            for (let i = 0; i < 14; i++) {
                const cell = dataRow.getCell(i + 3)
                cell.value = row.months[i] || null
                cell.numFmt = currencyFmt
                cell.font = dataFont
                cell.alignment = { horizontal: "right" }
                cell.border = borderThin
            }

            // Acumulado
            const aCell = dataRow.getCell(17)
            aCell.value = row.acumulado || null
            aCell.numFmt = currencyFmt
            aCell.font = dataFont
            aCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5FAF0" } }
            aCell.alignment = { horizontal: "right" }
            aCell.border = borderThin

            currentRow++
        }

        // Empty chapter placeholder
        if (block.rows.length === 0) {
            const emptyRow = ws.getRow(currentRow)
            ws.mergeCells(`A${currentRow}:Q${currentRow}`)
            const emptyCell = emptyRow.getCell(1)
            emptyCell.value = "Sin registros para este capítulo"
            emptyCell.font = { size: 8, italic: true, color: { argb: "FF999999" } }
            emptyCell.alignment = { horizontal: "center" }
            emptyCell.border = borderThin
            currentRow++
        }
    }

    // ── Grand Total Row ──
    const grandRow = ws.getRow(currentRow)
    ws.mergeCells(`A${currentRow}:B${currentRow}`)
    const gtLabel = grandRow.getCell(1)
    const totalFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF4472C4" } }
    const totalFont = { size: 9, bold: true, color: { argb: "FFFFFFFF" } }

    gtLabel.value = "TOTAL GENERAL"
    gtLabel.font = totalFont
    gtLabel.fill = totalFill
    gtLabel.border = borderThin

    for (let i = 0; i < 14; i++) {
        const cell = grandRow.getCell(i + 3)
        cell.value = grandTotals.months[i]
        cell.numFmt = currencyFmt
        cell.font = totalFont
        cell.fill = totalFill
        cell.alignment = { horizontal: "right" }
        cell.border = borderThin
    }

    const gtAcum = grandRow.getCell(17)
    gtAcum.value = grandTotals.acumulado
    gtAcum.numFmt = currencyFmt
    gtAcum.font = totalFont
    gtAcum.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF375A9E" } }
    gtAcum.alignment = { horizontal: "right" }
    gtAcum.border = borderThin

    currentRow += 2

    // ── Signature Area ──
    ws.getCell(`A${currentRow}`).value = "Elaboró:"
    ws.getCell(`A${currentRow}`).font = { size: 9, bold: true }
    ws.getCell(`D${currentRow}`).value = "Autorizó:"
    ws.getCell(`D${currentRow}`).font = { size: 9, bold: true }

    currentRow += 3
    ws.getCell(`A${currentRow}`).value = "Nombre, cargo y firma del servidor público"
    ws.getCell(`A${currentRow}`).font = { size: 8, color: { argb: "FF888888" } }
    ws.getCell(`D${currentRow}`).value = "Nombre, cargo y firma del servidor público"
    ws.getCell(`D${currentRow}`).font = { size: 8, color: { argb: "FF888888" } }

    // Add underlines above signatures
    for (const col of ["A", "B", "D", "E"]) {
        const cell = ws.getCell(`${col}${currentRow}`)
        cell.border = { top: { style: "thin" } }
    }

    // ── Generate & Download ──
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    saveAs(blob, `ANEXO_6_EGRESOS_ASF_${fiscalYear}.xlsx`)
}

// ══════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════

export function GlobalASFTable() {
    const { egresosContables, presupuesto, fiscalConfig } = useTreasury()
    const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {}
        ASF_CHAPTERS.forEach((ch) => (init[ch.key] = true))
        return init
    })
    const [isExporting, setIsExporting] = useState(false)

    const fiscalYear = useMemo(() => {
        if (egresosContables.length === 0) return new Date().getFullYear()
        const dates = egresosContables.map((e) => new Date(e.fecha).getFullYear())
        const counts: Record<number, number> = {}
        dates.forEach((y) => (counts[y] = (counts[y] || 0) + 1))
        return Number(
            Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
        )
    }, [egresosContables])

    const blocks = useMemo(
        () => buildASFData(egresosContables, presupuesto, fiscalYear),
        [egresosContables, presupuesto, fiscalYear]
    )

    const grandTotals = useMemo(() => {
        const t = new Array(14).fill(0)
        let acc = 0
        blocks.forEach((b) => {
            b.totals.forEach((v, i) => (t[i] += v))
            acc += b.acumulado
        })
        return { months: t, acumulado: acc }
    }, [blocks])

    const toggleChapter = (key: string) =>
        setExpandedChapters((prev) => ({ ...prev, [key]: !prev[key] }))

    const handleExport = useCallback(async () => {
        setIsExporting(true)
        try {
            await exportToExcel(blocks, grandTotals, fiscalYear, fiscalConfig.nombreEnte)
        } catch (err) {
            console.error("Export error:", err)
        } finally {
            setIsExporting(false)
        }
    }, [blocks, grandTotals, fiscalYear, fiscalConfig.nombreEnte])

    const nextYear = fiscalYear + 1

    // Styles
    const thBase =
        "px-2 py-1.5 text-[9px] font-bold uppercase tracking-wide border border-black/30 bg-[#d9e1f2] text-center whitespace-nowrap"
    const tdBase = "px-2 py-1 text-[9px] border border-black/15 text-right font-mono whitespace-nowrap"
    const tdLeft = "px-2 py-1 text-[9px] border border-black/15 text-left"

    return (
        <div className="w-full overflow-x-auto">
            {/* ═══ HEADER ═══ */}
            <div className="mb-4 text-center space-y-1 print:mb-2">
                <div className="flex items-start justify-between">
                    {/* Top-Left: ASF Logo */}
                    <img
                        src="/logo-asf.svg"
                        alt="ASF — Auditoría Superior de la Federación"
                        className="h-16 w-auto shrink-0"
                    />

                    {/* Center: Entity info */}
                    <div className="flex-1 text-center px-4">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                            Gobierno del estado de Veracruz de Ignacio de la Llave
                        </p>
                        <p className="text-xs font-bold uppercase">
                            {fiscalConfig.nombreEnte || "MUNICIPIO"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                            Auditoría Superior de la Federación • Información Preliminar
                        </p>
                    </div>

                    {/* Top-Right: Export button */}
                    <Button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="shrink-0 gap-2 bg-[#217346] hover:bg-[#1a5c38] text-white shadow-md"
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        {isExporting ? "Exportando..." : "Exportar Excel"}
                    </Button>
                </div>
                <p className="text-sm font-black tracking-wider uppercase">ANEXO 6</p>
                <p className="text-[9px] text-muted-foreground max-w-3xl mx-auto">
                    INDICACIONES: EL LLENADO DE ESTE FORMATO REPRESENTA LA SUMA MENSUAL DE LAS PARTIDAS ESPECÍFICAS POR CAPÍTULO DE GASTO QUE CONFORMAN LAS CUENTAS
                    (FILAS DEL PRESENTE ARCHIVO EN EXCEL) DERIVADOS DE LOS RECURSOS RECIBIDOS DE LAS PARTICIPACIONES A ENE {fiscalYear}
                </p>
            </div>

            {/* ═══ TABLE ═══ */}
            <table className="w-full border-collapse text-[9px] min-w-[1400px]">
                <thead className="sticky top-0 z-20 bg-background shadow-sm">
                    {/* Row 1: Year groupings */}
                    <tr>
                        <th colSpan={2} className={`${thBase} bg-[#b4c6e7]`} />
                        <th colSpan={12} className={`${thBase} bg-[#b4c6e7]`}>
                            {fiscalYear}
                        </th>
                        <th colSpan={2} className={`${thBase} bg-[#fce4d6]`}>
                            {nextYear}
                        </th>
                        <th className={`${thBase} bg-[#e2efda]`} rowSpan={2}>
                            ACUMULADO
                            <br />
                            PERIODO
                            <br />
                            ANTERIOR
                        </th>
                    </tr>
                    {/* Row 2: Month names */}
                    <tr>
                        <th className={`${thBase} w-[140px] min-w-[140px]`}>CUENTA CONTABLE</th>
                        <th className={`${thBase} w-[220px] min-w-[220px]`}>CONCEPTO</th>
                        {MONTH_HEADERS.map((m) => (
                            <th key={m} className={thBase}>
                                {m}
                            </th>
                        ))}
                        <th className={`${thBase} bg-[#fce4d6]`}>ENERO {nextYear}</th>
                        <th className={`${thBase} bg-[#fce4d6]`}>FEBRERO {nextYear}</th>
                    </tr>
                </thead>

                <tbody>
                    {blocks.map((block) => {
                        const isExpanded = expandedChapters[block.chapter.key]
                        return (
                            <React.Fragment key={block.chapter.key}>
                                {/* Chapter header row */}
                                <tr
                                    className="bg-[#dce6f1] hover:bg-[#cdd8eb] cursor-pointer select-none transition-colors"
                                    onClick={() => toggleChapter(block.chapter.key)}
                                >
                                    <td colSpan={2} className={`${tdLeft} font-bold text-[10px]`}>
                                        <div className="flex items-center gap-1">
                                            {isExpanded ? (
                                                <ChevronDown className="h-3 w-3 shrink-0" />
                                            ) : (
                                                <ChevronRight className="h-3 w-3 shrink-0" />
                                            )}
                                            {block.chapter.title}
                                        </div>
                                    </td>
                                    {block.totals.map((v, i) => (
                                        <td key={i} className={`${tdBase} font-bold bg-[#dce6f1]`}>
                                            {fmt(v)}
                                        </td>
                                    ))}
                                    <td className={`${tdBase} font-bold bg-[#e2efda]`}>
                                        {fmt(block.acumulado)}
                                    </td>
                                </tr>

                                {/* Partida rows */}
                                {isExpanded &&
                                    block.rows.map((row, idx) => (
                                        <tr key={`${block.chapter.key}-${idx}`} className="hover:bg-muted/30">
                                            <td className={`${tdLeft} font-mono text-[8px] text-muted-foreground`}>
                                                {row.cuentaContable}
                                            </td>
                                            <td
                                                className={`${tdLeft} max-w-[220px] truncate`}
                                                title={row.concepto}
                                            >
                                                {row.concepto}
                                            </td>
                                            {row.months.map((v, i) => (
                                                <td key={i} className={tdBase}>
                                                    {fmt(v)}
                                                </td>
                                            ))}
                                            <td className={`${tdBase} bg-[#f5faf0]`}>{fmt(row.acumulado)}</td>
                                        </tr>
                                    ))}

                                {/* Empty chapter placeholder */}
                                {isExpanded && block.rows.length === 0 && (
                                    <tr>
                                        <td colSpan={17} className="text-center text-muted-foreground text-[9px] py-2 border border-black/10">
                                            Sin registros para este capítulo
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        )
                    })}

                    {/* ═══ GRAND TOTAL ═══ */}
                    <tr className="bg-[#4472c4] text-white font-bold">
                        <td colSpan={2} className={`${tdLeft} font-bold text-[10px] text-white border-black/30`}>
                            TOTAL GENERAL
                        </td>
                        {grandTotals.months.map((v, i) => (
                            <td key={i} className={`${tdBase} text-white border-black/30`}>
                                {fmtForce(v)}
                            </td>
                        ))}
                        <td className={`${tdBase} text-white border-black/30 bg-[#375a9e]`}>
                            {fmtForce(grandTotals.acumulado)}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* ═══ FOOTER SIGNATURES ═══ */}
            <div className="mt-8 grid grid-cols-2 gap-8 text-[9px] max-w-xl">
                <div className="text-center">
                    <p className="font-bold">Elaboró:</p>
                    <div className="border-t border-black mt-8 pt-1">
                        <p className="text-muted-foreground">Nombre, cargo y firma del servidor público</p>
                    </div>
                </div>
                <div className="text-center">
                    <p className="font-bold">Autorizó:</p>
                    <div className="border-t border-black mt-8 pt-1">
                        <p className="text-muted-foreground">Nombre, cargo y firma del servidor público</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
