import { saveAs } from "file-saver"

/** Convert SVG URL to PNG base64 for Excel embedding */
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
            const dataUrl = canvas.toDataURL("image/png")
            resolve(dataUrl.split(",")[1])
            canvas.remove()
        }
        img.onerror = reject
        img.src = svgUrl
    })
}

export interface ExcelColumn {
    header: string
    key: string
    width: number
    format?: string // e.g. currency
}

export interface ExportOptions {
    fileName: string
    title: string
    subTitle?: string
    columns: ExcelColumn[]
    rows: any[]
    totalRow?: { label: string; value: number }
    fiscalConfig: { nombreEnte?: string }
}

export async function exportCapTable({
    fileName,
    title,
    subTitle,
    columns,
    rows,
    totalRow,
    fiscalConfig,
}: ExportOptions) {
    const ExcelJS = (await import("exceljs")).default
    const wb = new ExcelJS.Workbook()
    wb.creator = "FINTRA.ai"
    wb.created = new Date()

    const ws = wb.addWorksheet("Hoja1", {
        pageSetup: { paperSize: 5, orientation: "landscape", fitToPage: true, fitToWidth: 1 },
    })

    // ── Define Columns ──
    ws.columns = columns.map((c) => ({
        header: "", // We'll set headers manually for styling
        key: c.key,
        width: c.width,
    }))

    // ── Metrics/Styles ──
    const borderThin = {
        top: { style: "thin" as const },
        left: { style: "thin" as const },
        bottom: { style: "thin" as const },
        right: { style: "thin" as const },
    }
    const currencyFmt = '"$"#,##0.00'
    const currentYear = new Date().getFullYear()

    // ── Header Section (Rows 1-5) ──

    // Logo
    try {
        const pngBase64 = await svgToPngBase64("/logo-asf.svg", 600, 200)
        const logoId = wb.addImage({ base64: pngBase64, extension: "png" })
        ws.addImage(logoId, {
            tl: { col: 0, row: 0 },
            ext: { width: 240, height: 80 },
        })
    } catch (e) {
        console.warn("Logo embed failed:", e)
    }

    const lastColIndex = columns.length
    const mergeRange = (r: number) => `C${r}:${String.fromCharCode(64 + lastColIndex)}${r}`

    // Row 1: State
    ws.mergeCells(mergeRange(1))
    const r1 = ws.getCell("C1")
    r1.value = "Gobierno del estado de Veracruz de Ignacio de la Llave"
    r1.font = { size: 8, color: { argb: "FF666666" } }
    r1.alignment = { horizontal: "center", vertical: "middle" }
    ws.getRow(1).height = 18

    // Row 2: Entity
    ws.mergeCells(mergeRange(2))
    const r2 = ws.getCell("C2")
    r2.value = fiscalConfig.nombreEnte || "MUNICIPIO"
    r2.font = { size: 11, bold: true, color: { argb: "FF1a2744" } }
    r2.alignment = { horizontal: "center", vertical: "middle" }
    ws.getRow(2).height = 18

    // Row 3: Subtitle
    ws.mergeCells(mergeRange(3))
    const r3 = ws.getCell("C3")
    r3.value = "Auditoría Superior de la Federación • Información Preliminar"
    r3.font = { size: 8, color: { argb: "FF888888" } }
    r3.alignment = { horizontal: "center", vertical: "middle" }
    ws.getRow(3).height = 15

    // Row 4: Metadata (Audit, Account, Entity, Executor, Title)
    // We'll just put the Title here prominently
    ws.mergeCells(`A4:${String.fromCharCode(64 + lastColIndex)}4`)
    const r4 = ws.getCell("A4")
    r4.value = title
    r4.font = { size: 12, bold: true }
    r4.alignment = { horizontal: "center", vertical: "middle" }
    ws.getRow(4).height = 25

    // Row 5: Metadata Grid (approximated)
    ws.mergeCells(`A5:${String.fromCharCode(64 + lastColIndex)}5`)
    const r5 = ws.getCell("A5")
    r5.value = `Cuenta Pública: ${currentYear} | ${subTitle || ""}`
    r5.font = { size: 8, color: { argb: "FF444444" } }
    r5.alignment = { horizontal: "center", vertical: "middle" }
    ws.getRow(5).height = 20

    // ── Table Header (Row 6) ──
    const headerRow = ws.getRow(6)
    headerRow.height = 30
    columns.forEach((col, idx) => {
        const cell = headerRow.getCell(idx + 1)
        cell.value = col.header
        cell.font = { size: 9, bold: true }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } }
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
        cell.border = borderThin
    })

    // Sub-header (Row 7) - Chapter Title
    const subHeaderRow = ws.getRow(7)
    ws.mergeCells(`A7:${String.fromCharCode(64 + lastColIndex)}7`)
    const subHeaderCell = subHeaderRow.getCell(1)
    subHeaderCell.value = subTitle || title
    subHeaderCell.font = { size: 9, bold: true }
    subHeaderCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } }
    subHeaderCell.alignment = { horizontal: "center", vertical: "middle" }
    subHeaderCell.border = borderThin

    // ── Data Rows (starting 8) ──
    let currentRow = 8

    // Safety check just in case no rows
    if (rows.length === 0) {
        const r = ws.getRow(currentRow)
        ws.mergeCells(`A${currentRow}:${String.fromCharCode(64 + lastColIndex)}${currentRow}`)
        r.getCell(1).value = "Sin registros"
        r.getCell(1).alignment = { horizontal: "center" }
        currentRow++
    }

    for (const row of rows) {
        const r = ws.getRow(currentRow)
        r.height = 15 // compact
        columns.forEach((col, idx) => {
            const cell = r.getCell(idx + 1)
            cell.value = row[col.key]
            cell.font = { size: 8 }
            cell.border = borderThin

            // formatting
            if (col.format === "currency") {
                cell.numFmt = currencyFmt
                cell.alignment = { horizontal: "right" }
            } else if (["fechaPoliza", "fechaPago", "numPoliza", "rfcProveedor"].includes(col.key)) {
                cell.alignment = { horizontal: "center" }
            } else {
                cell.alignment = { horizontal: "left", wrapText: false }
            }
        })
        currentRow++
    }

    // ── Total Row ──
    if (totalRow) {
        const totalR = ws.getRow(currentRow)
        // Merge from 1 to Last-1
        const mergeEnd = lastColIndex - 1
        ws.mergeCells(`A${currentRow}:${String.fromCharCode(64 + mergeEnd)}${currentRow}`)

        const labelCell = totalR.getCell(1)
        labelCell.value = totalRow.label
        labelCell.font = { size: 9, bold: true }
        labelCell.alignment = { horizontal: "right" }
        labelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCE6F1" } }
        labelCell.border = borderThin

        const valCell = totalR.getCell(lastColIndex)
        valCell.value = totalRow.value
        valCell.numFmt = currencyFmt
        valCell.font = { size: 9, bold: true }
        valCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCE6F1" } }
        valCell.alignment = { horizontal: "right" }
        valCell.border = borderThin

        currentRow += 2
    } else {
        currentRow += 2
    }

    // ── Signatures ──
    // A: Elaboró, D (or close to middle): Autorizó
    const signRowHeader = ws.getRow(currentRow)
    signRowHeader.getCell(1).value = "Elaboró"
    signRowHeader.getCell(1).font = { size: 9, bold: true }

    // Roughly calculate middle column for "Autorizó"
    const middleCol = Math.floor(lastColIndex / 2) + 1
    signRowHeader.getCell(middleCol).value = "Autorizó"
    signRowHeader.getCell(middleCol).font = { size: 9, bold: true }

    currentRow += 4

    const signRowLine = ws.getRow(currentRow)
    const c1 = signRowLine.getCell(1)
    c1.value = "Nombre, cargo y firma del servidor público"
    c1.font = { size: 8, color: { argb: "FF888888" } }
    c1.border = { top: { style: "thin" } }

    const c2 = signRowLine.getCell(middleCol)
    c2.value = "Nombre, cargo y firma del servidor público"
    c2.font = { size: 8, color: { argb: "FF888888" } }
    c2.border = { top: { style: "thin" } }

    // ── Save ──
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    saveAs(blob, `${fileName}.xlsx`)
}
