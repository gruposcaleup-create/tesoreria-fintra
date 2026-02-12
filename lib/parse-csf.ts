/**
 * parse-csf.ts
 * Client-side parser for SAT "Constancia de Situación Fiscal" PDF.
 * Uses pdfjs-dist to extract text and regex to identify key fields.
 * No backend logic — runs 100% in the browser.
 *
 * Tested against real SAT "Cédula de Identificación Fiscal / Constancia
 * de Situación Fiscal" PDFs (3-page format). Layout:
 *   Page 1: RFC, CURP, Nombre(s), Primer Apellido, Segundo Apellido,
 *           Nombre Comercial, Código Postal
 *   Page 2: Actividades Económicas, Regímenes (full description, NO code),
 *           Obligaciones
 *   Page 3: Cadena Original Sello, Sello Digital
 */

// pdfjs-dist is loaded dynamically inside parseCSF() to avoid
// SSR errors (DOMMatrix is not defined in Node.js).
// import * as pdfjsLib from "pdfjs-dist"  <-- removed

let pdfjsLibCache: typeof import("pdfjs-dist") | null = null;

async function getPdfjs() {
    if (!pdfjsLibCache) {
        const lib = await import("pdfjs-dist");
        lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        pdfjsLibCache = lib as any;
    }
    return pdfjsLibCache!;
}

// ---------- Types ----------

export interface CSFData {
    rfc: string | null
    razonSocial: string | null
    codigoPostal: string | null
    regimenFiscal: string | null   // e.g. "612 - Personas Físicas con Actividades Empresariales y Profesionales"
    regimenClave: string | null    // e.g. "612"
    tipoPersona: "moral" | "fisica" | null
    // Contacto Comercial (extracted when available)
    email: string | null
    telefono: string | null
    representanteLegal: string | null
}

// ---------- Regime catalogue (SAT) ----------
// Maps 3-digit code → description.
// Also includes common alternative phrasings used by SAT in the Constancia.

const REGIMENES: Record<string, string[]> = {
    "601": [
        "General de Ley Personas Morales",
        "Régimen General de Ley Personas Morales",
    ],
    "603": [
        "Personas Morales con Fines no Lucrativos",
        "Régimen de las Personas Morales con Fines no Lucrativos",
    ],
    "605": [
        "Sueldos y Salarios e Ingresos Asimilados a Salarios",
        "Régimen de Sueldos y Salarios e Ingresos Asimilados a Salarios",
    ],
    "606": [
        "Arrendamiento",
        "Régimen de Arrendamiento",
    ],
    "607": [
        "Enajenación o Adquisición de Bienes",
        "Régimen de Enajenación o Adquisición de Bienes",
    ],
    "608": [
        "Demás ingresos",
        "Régimen de los Demás Ingresos",
    ],
    "610": [
        "Residentes en el Extranjero sin Establecimiento Permanente en México",
        "Régimen de Residentes en el Extranjero sin Establecimiento Permanente en México",
    ],
    "611": [
        "Ingresos por Dividendos (socios y accionistas)",
        "Régimen de Ingresos por Dividendos",
    ],
    "612": [
        "Personas Físicas con Actividades Empresariales y Profesionales",
        "Régimen de las Personas Físicas con Actividades Empresariales y Profesionales",
    ],
    "614": [
        "Ingresos por intereses",
        "Régimen de Ingresos por Intereses",
    ],
    "615": [
        "Ingresos por obtención de premios",
        "Régimen de los ingresos por obtención de premios",
    ],
    "616": [
        "Sin obligaciones fiscales",
    ],
    "620": [
        "Sociedades Cooperativas de Producción que optan por diferir sus ingresos",
        "Régimen de Sociedades Cooperativas de Producción que optan por diferir sus ingresos",
    ],
    "621": [
        "Incorporación Fiscal",
        "Régimen de Incorporación Fiscal",
    ],
    "622": [
        "Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras",
        "Régimen de Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras",
    ],
    "623": [
        "Opcional para Grupos de Sociedades",
        "Régimen Opcional para Grupos de Sociedades",
    ],
    "624": [
        "Coordinados",
        "Régimen de Coordinados",
    ],
    "625": [
        "Actividades Empresariales con ingresos a través de Plataformas Tecnológicas",
        "Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas",
    ],
    "626": [
        "Simplificado de Confianza",
        "Régimen Simplificado de Confianza",
    ],
}

/**
 * Normalize text for fuzzy matching:
 *   - lowercase
 *   - strip accents
 *   - collapse whitespace
 */
function normalizeForMatch(s: string): string {
    return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")  // strip accents
        .replace(/\s+/g, " ")
        .trim()
}

/**
 * Reverse-lookup: given a regime description from the PDF, find its 3-digit code.
 * Uses fuzzy substring matching so "Régimen de las Personas Físicas con Actividades
 * Empresariales y Profesionales" matches code "612".
 */
function findRegimenCode(description: string): { code: string; label: string } | null {
    const norm = normalizeForMatch(description)

    // First pass: exact contains match
    for (const [code, variants] of Object.entries(REGIMENES)) {
        for (const variant of variants) {
            const normVariant = normalizeForMatch(variant)
            if (norm.includes(normVariant) || normVariant.includes(norm)) {
                return { code, label: variants[0] }
            }
        }
    }

    // Second pass: keyword scoring — find best match
    let bestCode: string | null = null
    let bestScore = 0
    let bestLabel = ""

    for (const [code, variants] of Object.entries(REGIMENES)) {
        for (const variant of variants) {
            const normVariant = normalizeForMatch(variant)
            const words = normVariant.split(" ").filter(w => w.length > 3)
            let score = 0
            for (const word of words) {
                if (norm.includes(word)) score++
            }
            const ratio = words.length > 0 ? score / words.length : 0
            if (ratio > 0.5 && score > bestScore) {
                bestScore = score
                bestCode = code
                bestLabel = variants[0]
            }
        }
    }

    if (bestCode) {
        return { code: bestCode, label: bestLabel }
    }

    return null
}

// ---------- Main parser ----------

export async function parseCSF(
    file: File,
    onProgress?: (percent: number) => void
): Promise<CSFData> {
    // Validate file type
    if (file.type !== "application/pdf") {
        throw new Error("El archivo debe ser un PDF.")
    }

    onProgress?.(5)

    // Dynamic import to avoid SSR DOMMatrix error
    const pdfjsLib = await getPdfjs();

    // Read file into ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    onProgress?.(15)

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    onProgress?.(30)

    // Extract text from all pages
    const totalPages = pdf.numPages
    let fullText = ""

    for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ")
        fullText += pageText + "\n"

        // Progress: 30% -> 80% spread across pages
        const pageProgress = 30 + ((i / totalPages) * 50)
        onProgress?.(Math.round(pageProgress))
    }

    onProgress?.(85)

    // ---------- Extraction via regex ----------

    const result: CSFData = {
        rfc: null,
        razonSocial: null,
        codigoPostal: null,
        regimenFiscal: null,
        regimenClave: null,
        tipoPersona: null,
        email: null,
        telefono: null,
        representanteLegal: null,
    }

    // Normalize whitespace for easier matching
    const text = fullText.replace(/\s+/g, " ")

    console.log("[CSF Parser] Extracted text length:", text.length)
    console.log("[CSF Parser] Full text:", text.substring(0, 1500))

    // ============================================================
    // 1. RFC — 12 or 13 alphanumeric characters
    //    Real SAT format: "RFC: COCA0411129M8"
    // ============================================================
    const rfcLabelMatch = text.match(/RFC\s*:\s*([A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3})/i)
    if (rfcLabelMatch) {
        result.rfc = rfcLabelMatch[1].toUpperCase()
    } else {
        // Fallback: find "Registro Federal de Contribuyentes" near an RFC
        const rfcFallback = text.match(/Registro\s*Federal\s*de\s*Contribuyentes\s*([A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3})/i)
        if (rfcFallback) {
            result.rfc = rfcFallback[1].toUpperCase()
        } else {
            // Last resort: any standalone RFC-shaped string
            const rfcLast = text.match(/\b([A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3})\b/)
            if (rfcLast) result.rfc = rfcLast[1].toUpperCase()
        }
    }

    // Determine tipo from RFC length (12 = Moral, 13 = Física)
    if (result.rfc) {
        result.tipoPersona = result.rfc.length === 12 ? "moral" : "fisica"
    }

    // ============================================================
    // 2. Razón Social / Nombre Completo
    //    Real SAT format for Persona Física (page 1):
    //      "Nombre (s): ALDAHIR FORTINO"
    //      "Primer Apellido: CORDOVA"
    //      "Segundo Apellido: CONTRERAS"
    //      "Nombre Comercial: ALDAHIR FORTINO CORDOVA CONTRERAS"
    //
    //    Real SAT format for Persona Moral (page 1):
    //      "Nombre, denominación o razón social: EMPRESA SA DE CV"
    //
    //    Priority order:
    //      1. Compose from Nombre(s) + Apellidos (most reliable for Persona Física)
    //      2. "Nombre, denominación o razón social:" (for Persona Moral)
    //      3. "Nombre Comercial:" (fallback)
    // ============================================================

    console.log("[CSF Parser] Looking for Razón Social...")

    // Strategy A (best for Persona Física): Compose from Nombre (s) + Primer Apellido + Segundo Apellido
    // These are separate labeled fields in the SAT PDF, very reliable when present
    const nombreMatch = text.match(
        /Nombre\s*\(s\)\s*:\s*([A-ZÁÉÍÓÚÑ\s]+?)(?=\s*Primer\s*Apellido)/i
    )
    const primerApMatch = text.match(
        /Primer\s*Apellido\s*:\s*([A-ZÁÉÍÓÚÑ\s]+?)(?=\s*Segundo\s*Apellido)/i
    )
    const segundoApMatch = text.match(
        /Segundo\s*Apellido\s*:\s*([A-ZÁÉÍÓÚÑ\s]+?)(?=\s*(?:Fecha|Nombre\s*Comercial|CURP|Datos|Tipo))/i
    )

    // Strategy B: "Nombre, denominación o razón social:" (Persona Moral)
    // Broad match: capture everything until common terminators
    const razonSocialMatch = text.match(
        /(?:Nombre,?\s*denominaci[oó]n\s*o\s*raz[oó]n\s*social|Denominaci[oó]n\s*[\/o]?\s*Raz[oó]n\s*Social)\s*:\s*(.+?)(?=\s*(?:Lugar|idCIF|R[eé]gimen|Fecha\s*(?:de\s*)?(?:inicio|constituci)|Tipo\s*de\s*persona|Nombre\s*Comercial|Estatus|Datos\s*del|RFC\s*:)|\s*$)/i
    )

    // Strategy C: "Nombre Comercial:" (fallback — available for both personas)
    const nombreComercialMatch = text.match(
        /Nombre\s*Comercial\s*:\s*(.+?)(?=\s*(?:Datos\s*del\s*domicilio|C[oó]digo\s*Postal|Entidad|Municipio|Colonia|Tipo\s*de\s*Vialidad|Nombre\s*de\s*Vialidad|P[aá]gina|Actividades)|\s*$)/i
    )

    // Apply in priority order
    if (nombreMatch) {
        // Build full name from parts
        const parts = [
            nombreMatch[1]?.trim(),
            primerApMatch?.[1]?.trim(),
            segundoApMatch?.[1]?.trim(),
        ].filter(Boolean)
        if (parts.length > 0) {
            result.razonSocial = parts.join(" ")
            console.log("[CSF Parser] Razón Social (from parts):", result.razonSocial)
        }
    }

    if (!result.razonSocial && razonSocialMatch && razonSocialMatch[1].trim().length > 2) {
        result.razonSocial = razonSocialMatch[1].trim()
        console.log("[CSF Parser] Razón Social (denominación):", result.razonSocial)
    }

    if (!result.razonSocial && nombreComercialMatch && nombreComercialMatch[1].trim().length > 2) {
        result.razonSocial = nombreComercialMatch[1].trim()
        console.log("[CSF Parser] Razón Social (nombre comercial):", result.razonSocial)
    }

    // ============================================================
    // 3. Código Postal
    //    Real SAT format: "Código Postal:93828" or "Código Postal: 93828"
    // ============================================================
    const cpMatch = text.match(/C[oó]digo\s*Postal\s*:?\s*(\d{5})/i)
    if (cpMatch) {
        result.codigoPostal = cpMatch[1]
    } else {
        const cpFallback = text.match(/\bCP\s*:?\s*(\d{5})\b/i)
        if (cpFallback) result.codigoPostal = cpFallback[1]
    }

    // ============================================================
    // 4. Régimen Fiscal
    //    REAL SAT FORMAT (Page 2):
    //      Section header: "Regímenes:" (or "Regimenes:")
    //      Table header: "Régimen  Fecha Inicio  Fecha Fin"
    //      Row: "Régimen de las Personas Físicas con Actividades
    //            Empresariales y Profesionales  27/03/2025"
    //
    //    KEY: The PDF does NOT show the 3-digit code!
    //    It shows the FULL description text only.
    //    We must reverse-lookup the description against our catalogue.
    // ============================================================

    console.log("[CSF Parser] Looking for Regímenes section...")

    // Strategy A: Extract the description after "Regímenes:" section header
    // The SAT PDF text typically renders as:
    //   "...Regímenes: Régimen Fecha Inicio Fecha Fin Régimen de las Personas..."
    // We need to capture the regime description that appears after the table header
    const regimenesSection = text.match(
        /Reg[ií]menes\s*:\s*R[eé]gimen\s+Fecha\s*Inicio\s+Fecha\s*Fin\s+(.+?)(?=\s*Obligaciones|\s*P[aá]gina|\s*Cadena\s*Original)/i
    )

    if (regimenesSection) {
        const regimenText = regimenesSection[1].trim()
        console.log("[CSF Parser] Regime section text:", regimenText)

        // The description may end with a date like "27/03/2025" — strip it
        const descriptionOnly = regimenText
            .replace(/\d{2}\/\d{2}\/\d{4}/g, "")  // remove dates
            .replace(/\s+/g, " ")
            .trim()

        console.log("[CSF Parser] Regime description:", descriptionOnly)

        const match = findRegimenCode(descriptionOnly)
        if (match) {
            result.regimenClave = match.code
            result.regimenFiscal = `${match.code} - ${match.label}`
            console.log("[CSF Parser] Matched regime:", result.regimenFiscal)
        }
    }

    // Strategy B: Look for regime description without the table header pattern
    if (!result.regimenClave) {
        // Try: "Régimen de las Personas Físicas..." anywhere in text
        for (const [code, variants] of Object.entries(REGIMENES)) {
            for (const variant of variants) {
                if (variant.length > 15) {
                    // Build a flexible regex from the first ~30 chars of the variant
                    const searchStr = normalizeForMatch(variant)
                    const normText = normalizeForMatch(text)
                    if (normText.includes(searchStr)) {
                        result.regimenClave = code
                        result.regimenFiscal = `${code} - ${variants[0]}`
                        console.log("[CSF Parser] Matched regime (Strategy B):", result.regimenFiscal)
                        break
                    }
                }
            }
            if (result.regimenClave) break
        }
    }

    // Strategy C: If there's a 3-digit code near "Régimen" keyword
    if (!result.regimenClave) {
        const regimenCodeMatch = text.match(
            /R[eé]gimen\s*(?:Fiscal)?\s*:?\s*(\d{3})\s*[-–]?\s*/i
        )
        if (regimenCodeMatch) {
            const code = regimenCodeMatch[1]
            if (REGIMENES[code]) {
                result.regimenClave = code
                result.regimenFiscal = `${code} - ${REGIMENES[code][0]}`
            }
        }
    }

    // ============================================================
    // 5. Contacto Comercial (best-effort — not always in Constancia)
    // ============================================================

    // Email: standard email regex anywhere in the text
    const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/i)
    if (emailMatch) {
        result.email = emailMatch[0].toLowerCase()
    }

    // Teléfono: look for labeled phone or standalone 10-digit number
    const telMatch = text.match(
        /(?:Tel[eé]fono|Tel\.?|Contacto)\s*:?\s*(\+?\d[\d\s\-().]{7,15}\d)/i
    )
    if (telMatch) {
        result.telefono = telMatch[1].replace(/\s+/g, "").trim()
    }

    // Representante Legal
    const repMatch = text.match(
        /Representante\s*Legal\s*:?\s*([A-ZÁÉÍÓÚÑ\s]+?)(?=\s*(?:RFC|CURP|Cargo|Tel|Fecha|Domicilio|$))/i
    )
    if (repMatch && repMatch[1].trim().length > 2) {
        result.representanteLegal = repMatch[1].trim()
    }

    onProgress?.(100)

    console.log("[CSF Parser] Final extracted data:", result)

    return result
}
