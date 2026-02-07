"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ChevronDown, ChevronRight, Download, Filter, CheckSquare } from "lucide-react"
import { useSearchParams } from "next/navigation"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { PresupuestoItem, useTreasury } from "@/components/providers/treasury-context"
import { RAW_CRI_DATA } from "@/components/providers/cri-raw-data"
import { buildCRITree } from "@/components/providers/cri-tree-builder"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useReactToPrint } from "react-to-print"
import { FileSpreadsheet, FileText } from "lucide-react"

const MONTHS = [
    { key: 'enero', label: 'Enero' },
    { key: 'febrero', label: 'Febrero' },
    { key: 'marzo', label: 'Marzo' },
    { key: 'abril', label: 'Abril' },
    { key: 'mayo', label: 'Mayo' },
    { key: 'junio', label: 'Junio' },
    { key: 'julio', label: 'Julio' },
    { key: 'agosto', label: 'Agosto' },
    { key: 'septiembre', label: 'Septiembre' },
    { key: 'octubre', label: 'Octubre' },
    { key: 'noviembre', label: 'Noviembre' },
    { key: 'diciembre', label: 'Diciembre' },
] as const;

function LeyIngresosContent() {
    const { leyIngresos, ingresosContables } = useTreasury()
    const searchParams = useSearchParams()
    const highlightCog = searchParams.get('highlight')
    const [highlightedRow, setHighlightedRow] = React.useState<string | null>(null)

    // Refs
    const highlightedRowRef = React.useRef<HTMLTableRowElement | null>(null)
    const tableContainerRef = React.useRef<HTMLDivElement | null>(null)
    const pdfPrintRef = React.useRef<HTMLDivElement>(null)

    // State
    const [searchTerm, setSearchTerm] = React.useState("")
    const [isSelectionMode, setIsSelectionMode] = React.useState(false)
    const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set())

    // Performance Optimization: Visible Items for Infinite Scroll
    const [visibleCount, setVisibleCount] = React.useState(50)
    const observerRef = React.useRef<IntersectionObserver | null>(null)
    const loadMoreRef = React.useRef<HTMLTableRowElement | null>(null)

    const toggleSelection = (id: string) => {
        const newSelection = new Set(selectedItems)
        if (newSelection.has(id)) {
            newSelection.delete(id)
        } else {
            newSelection.add(id)
        }
        setSelectedItems(newSelection)
    }

    const toggleAll = (items: { item: PresupuestoItem }[]) => {
        if (selectedItems.size === items.length) {
            setSelectedItems(new Set())
        } else {
            const newSelection = new Set<string>()
            items.forEach(({ item }) => newSelection.add(item.cri || item.codigo || ""))
            setSelectedItems(newSelection)
        }
    }

    const handlePrint = useReactToPrint({
        contentRef: pdfPrintRef,
        documentTitle: "Ley de Ingresos (Vertical)",
    });

    // Flatten recursive tree
    const flattenItems = (items: PresupuestoItem[], depth = 0): { item: PresupuestoItem, depth: number }[] => {
        return items.reduce((acc, item) => {
            acc.push({ item, depth });
            if (item.subcuentas) {
                acc.push(...flattenItems(item.subcuentas, depth + 1));
            }
            return acc;
        }, [] as { item: PresupuestoItem, depth: number }[]);
    };

    const flatCRI = React.useMemo(() => {
        let items = flattenItems(leyIngresos);
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            items = items.filter(({ item }) =>
                (item.cri && item.cri.toLowerCase().includes(lowerTerm)) ||
                (item.codigo && item.codigo.toLowerCase().includes(lowerTerm)) ||
                (item.descripcion && item.descripcion.toLowerCase().includes(lowerTerm))
            );
        }
        return items;
    }, [leyIngresos, searchTerm]);

    // Detectar si hay un codigo para highlight y aplicar animación
    React.useEffect(() => {
        if (highlightCog) {
            setHighlightedRow(highlightCog)

            // Encontrar el índice del item
            const index = flatCRI.findIndex(({ item }) =>
                item.cri === highlightCog || item.codigo === highlightCog
            )

            // Si el item está más allá de lo visible, aumentar visibleCount
            if (index !== -1 && index >= visibleCount) {
                setVisibleCount(index + 50) // Cargar hasta ese item mas un buffer
            }

            // Hacer scroll dentro del contenedor de la tabla
            setTimeout(() => {
                if (highlightedRowRef.current && tableContainerRef.current) {
                    const container = tableContainerRef.current
                    const row = highlightedRowRef.current

                    const containerRect = container.getBoundingClientRect()
                    const rowRect = row.getBoundingClientRect()

                    const scrollTop = container.scrollTop + (rowRect.top - containerRect.top) - (container.clientHeight / 2) + (rowRect.height / 2)

                    container.scrollTo({
                        top: scrollTop,
                        behavior: 'smooth'
                    })
                }
            }, 300) // Delay un poco mayor para dar tiempo al renderizado

            const timer = setTimeout(() => setHighlightedRow(null), 3000)
            return () => clearTimeout(timer)
        }
    }, [highlightCog, flatCRI]) // Añadido flatCRI a dependencias para asegurar recalculo si datos cambian

    // Reset visible count when search changes
    React.useEffect(() => {
        setVisibleCount(50)
        // Scroll to top when filter changes
        if (tableContainerRef.current) {
            tableContainerRef.current.scrollTop = 0
        }
    }, [searchTerm])

    // Infinite Scroll Observer
    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((prev) => Math.min(prev + 50, flatCRI.length))
                }
            },
            { root: tableContainerRef.current, threshold: 0.1 }
        )

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current)
        }

        observerRef.current = observer

        return () => {
            if (observerRef.current) observerRef.current.disconnect()
        }
    }, [flatCRI.length, visibleCount]) // Re-run when list size changes or we load more

    // Format Currency Helper
    const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

    const handleExportCSV = (mode: 'all' | 'selection' | 'view' = 'view') => {
        // Headers for Long/Vertical Format
        const headers = ["CRI", "Concepto", "Anual Approved", "Mes", "Presupuesto", "Contable", "Diferencia"];

        // Rows
        const rows: string[] = [];

        let itemsToExport = flatCRI; // Default to 'view' (filtered but ALL filtered items, not just visible)

        if (mode === 'all') {
            // Export everything regardless of filter (re-flatten full list)
            itemsToExport = flattenItems(leyIngresos);
        } else if (mode === 'selection' && selectedItems.size > 0) {
            itemsToExport = flatCRI.filter(({ item }) => selectedItems.has(item.cri || item.codigo || ""));
        } else {
            // 'view' -> use flatCRI (which is already filtered by search).
            // NO SLICING HERE - user expects all filtered items.
        }

        itemsToExport.forEach(({ item }) => {
            const cri = item.cri || item.codigo || "";
            const descripcion = `"${item.descripcion.replace(/"/g, '""')}"`;
            const anual = item.aprobado?.toString() || "0";

            MONTHS.forEach(m => {
                const est = (item as any)[m.key] || 0;
                const rec = (item as any)[`${m.key}_contable`] || 0;
                const dif = est - rec;

                // Push one row per month
                rows.push([
                    cri,
                    descripcion,
                    anual,
                    m.label,
                    est.toString(),
                    rec.toString(),
                    dif.toString()
                ].join(","));
            });
        });

        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `ley_ingresos_${mode}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // items to render (Visible subset)
    const visibleItems = flatCRI.slice(0, visibleCount)

    return (
        <SidebarProvider
            style={{
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties}
            className="h-svh overflow-hidden"
        >
            <AppSidebar variant="inset" />
            <SidebarInset className="h-full overflow-hidden flex flex-col">
                <SiteHeader />
                <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 pt-6 bg-gray-50/50 w-full min-w-0 overflow-hidden min-h-0">

                    {/* HEADER */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Ley de Ingresos</h1>
                            <p className="text-gray-500">Consulta y seguimiento de la Ley de Ingresos estimada vs recaudada.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={isSelectionMode ? "secondary" : "outline"}
                                onClick={() => setIsSelectionMode(!isSelectionMode)}
                                className={`gap-2 ${isSelectionMode ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200" : ""}`}
                            >
                                <CheckSquare className="w-4 h-4" />
                                {isSelectionMode ? "Selección Activa" : "Seleccionar"}
                            </Button>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="gap-2">
                                        <Filter className="w-4 h-4" /> Filtrar
                                        {searchTerm && <span className="ml-1 rounded-full bg-emerald-100 px-2 text-[10px] text-emerald-700">Activo</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-4" align="end">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Filtrar por Código o Concepto</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Ingresa el CRI o descripción para buscar.
                                        </p>
                                        <Input
                                            id="search"
                                            placeholder="Ej. Impuestos, 1.1.2..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="h-8"
                                            autoFocus
                                        />
                                        {searchTerm && (
                                            <Button variant="ghost" size="sm" onClick={() => setSearchTerm("")} className="w-full h-8 text-xs">
                                                Limpiar filtro
                                            </Button>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="gap-2">
                                        <Download className="w-4 h-4" /> Exportar
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Selecciona formato</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleExportCSV('selection')} disabled={selectedItems.size === 0} className="cursor-pointer">
                                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar Selección ({selectedItems.size})
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExportCSV('view')} className="cursor-pointer">
                                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar Vista Actual
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExportCSV('all')} className="cursor-pointer">
                                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar Todo (Base Completa)
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handlePrint && handlePrint()} className="cursor-pointer">
                                        <FileText className="mr-2 h-4 w-4" /> PDF (Vertical) {selectedItems.size > 0 ? '(Selección)' : '(Vista)'}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* SECCIÓN DE ÚLTIMOS MOVIMIENTOS */}
                    <Card className="border shadow-sm bg-white shrink-0">
                        <CardContent className="p-4">
                            <h2 className="text-sm font-semibold mb-2">Últimos 3 Movimientos</h2>
                            <div className="space-y-1">
                                {ingresosContables.slice(0, 3).map((ingreso) => (
                                    <div
                                        key={ingreso.id}
                                        onClick={() => {
                                            const highlightValue = ingreso.cuentaContable || ingreso.cri || '';
                                            if (highlightValue) {
                                                setHighlightedRow(highlightValue)
                                                // Find index and force load if needed
                                                const index = flatCRI.findIndex(({ item }) =>
                                                    item.cri === highlightValue || item.codigo === highlightValue
                                                )
                                                if (index !== -1 && index >= visibleCount) {
                                                    setVisibleCount(index + 50)
                                                }

                                                setTimeout(() => {
                                                    if (highlightedRowRef.current && tableContainerRef.current) {
                                                        const container = tableContainerRef.current
                                                        const row = highlightedRowRef.current
                                                        const containerRect = container.getBoundingClientRect()
                                                        const rowRect = row.getBoundingClientRect()
                                                        const scrollTop = container.scrollTop + (rowRect.top - containerRect.top) - (container.clientHeight / 2) + (rowRect.height / 2)
                                                        container.scrollTo({ top: scrollTop, behavior: 'smooth' })
                                                    }
                                                }, 300)
                                                const timer = setTimeout(() => setHighlightedRow(null), 3000)
                                            }
                                        }}
                                        className="flex justify-between items-center p-2 rounded hover:bg-emerald-50 transition-colors cursor-pointer border border-transparent hover:border-emerald-200"
                                    >
                                        <div className="flex gap-3 items-center">
                                            <span className="font-mono text-[10px] text-gray-500">{ingreso.cri || ingreso.cuentaContable}</span>
                                            <span className="text-xs font-medium truncate max-w-[300px]">{ingreso.concepto}</span>
                                        </div>
                                        <div className="flex gap-3 items-center">
                                            <span className="text-[10px] text-gray-500">{ingreso.fecha}</span>
                                            <span className="text-xs font-semibold text-emerald-600">
                                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(ingreso.monto)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* MAIN TABLE CARD */}
                    <Card className="border shadow-sm bg-white min-w-0 flex flex-col flex-1 min-h-0 overflow-hidden">
                        <CardContent ref={tableContainerRef} className="p-0 flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 h-full">
                            <div className="relative min-w-[3000px]">
                                <Table>
                                    <TableHeader className="sticky top-0 z-10">
                                        <TableRow className="bg-gray-50 border-b border-gray-200">
                                            {isSelectionMode && (
                                                <TableHead rowSpan={2} className="w-[40px] sticky left-0 z-20 bg-gray-50 border-b border-gray-200">
                                                    <Checkbox
                                                        checked={flatCRI.length > 0 && selectedItems.size === flatCRI.length}
                                                        onCheckedChange={() => toggleAll(flatCRI)}
                                                    />
                                                </TableHead>
                                            )}
                                            <TableHead rowSpan={2} className={`w-[300px] font-bold text-gray-600 uppercase text-xs tracking-wider sticky z-20 bg-gray-50 shadow-[1px_0_0_0_rgba(0,0,0,0.1)] ${isSelectionMode ? 'left-[40px]' : 'left-0'}`}>CRI</TableHead>
                                            <TableHead rowSpan={2} className="min-w-[250px] font-bold text-gray-600 uppercase text-xs tracking-wider pl-4 bg-gray-50">Concepto</TableHead>
                                            <TableHead rowSpan={2} className="min-w-[120px] text-right font-bold text-gray-600 uppercase text-xs tracking-wider pr-4 bg-gray-50">Anual</TableHead>
                                            {MONTHS.map(month => (
                                                <TableHead key={month.key} colSpan={3} className="text-center font-bold text-gray-600 uppercase text-xs tracking-wider border-l border-gray-200 bg-gray-50">
                                                    {month.label}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                        <TableRow className="bg-gray-50 border-b border-gray-200">
                                            {/* Nested Headers for Months */}
                                            {MONTHS.map(month => (
                                                <React.Fragment key={`${month.key}-sub`}>
                                                    <TableHead className="min-w-[100px] text-right text-[10px] text-gray-500 uppercase tracking-wider pr-2 border-l border-gray-200 bg-gray-50">Presup.</TableHead>
                                                    <TableHead className="min-w-[100px] text-right text-[10px] text-gray-500 uppercase tracking-wider pr-2 bg-gray-50">Cont.</TableHead>
                                                    <TableHead className="min-w-[100px] text-right text-[10px] text-gray-500 uppercase tracking-wider pr-2 bg-gray-50">Dif.</TableHead>
                                                </React.Fragment>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {visibleItems.map(({ item, depth }, index) => {
                                            // Hierarchy styling
                                            const isChapter = item.nivel === "Capitulo";
                                            const isConcepto = item.nivel === "Concepto";
                                            const isPartida = item.nivel === "Partida";
                                            const isPartidaGenerica = item.nivel === "Partida Generica";

                                            // Define backgrounds and text styles
                                            let rowClass = "border-b border-gray-200 transition-all duration-500 group";
                                            let stickyBg = "";

                                            // Agregar clase de highlight si coincide EXACTAMENTE
                                            const isHighlighted = highlightedRow && (
                                                item.cri === highlightedRow ||
                                                item.codigo === highlightedRow
                                            );
                                            if (isHighlighted) {
                                                rowClass += " animate-pulse bg-emerald-200 ring-2 ring-emerald-400";
                                            }

                                            if (isChapter) {
                                                rowClass += " bg-blue-100 text-blue-900 font-bold";
                                                stickyBg = isHighlighted ? "bg-emerald-200" : "bg-blue-100";
                                            } else if (isConcepto) {
                                                rowClass += " bg-gray-100 text-gray-900 font-semibold";
                                                stickyBg = isHighlighted ? "bg-emerald-200" : "bg-gray-100";
                                            } else if (isPartidaGenerica) {
                                                rowClass += " bg-amber-50 text-gray-800 font-medium";
                                                stickyBg = isHighlighted ? "bg-emerald-200" : "bg-amber-50";
                                            } else {
                                                // Partida Específica (Generic)
                                                rowClass += " bg-white hover:bg-gray-50 text-gray-700";
                                                stickyBg = isHighlighted ? "bg-emerald-200" : "bg-white group-hover:bg-gray-50";
                                            }

                                            return (
                                                <TableRow
                                                    key={`${item.codigo}-${index}`}
                                                    className={rowClass}
                                                    ref={isHighlighted ? highlightedRowRef : null}
                                                >
                                                    {/* Checkbox Column */}
                                                    {isSelectionMode && (
                                                        <TableCell className="p-2 sticky left-0 z-[5] bg-white border-b border-gray-200">
                                                            <Checkbox
                                                                checked={selectedItems.has(item.cri || item.codigo || "")}
                                                                onCheckedChange={() => toggleSelection(item.cri || item.codigo || "")}
                                                            />
                                                        </TableCell>
                                                    )}

                                                    {/* CRI Column */}
                                                    <TableCell className={`font-mono text-xs p-2 sticky z-[5] shadow-[1px_0_0_0_rgba(0,0,0,0.1)] ${stickyBg} ${isSelectionMode ? 'left-[40px]' : 'left-0'}`}>
                                                        <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
                                                            <span>{item.cri || item.codigo}</span>
                                                        </div>

                                                    </TableCell>

                                                    {/* Concepto Column */}
                                                    <TableCell className="text-xs uppercase p-2 min-w-[250px] max-w-[250px] truncate pl-4" title={item.descripcion}>
                                                        {item.descripcion}
                                                    </TableCell>

                                                    {/* Anual Column */}
                                                    <TableCell className="text-right font-mono text-xs p-2 pr-4 font-bold text-gray-700">
                                                        {formatCurrency(item.aprobado)}
                                                    </TableCell>

                                                    {/* Monthly Triplets */}
                                                    {MONTHS.map(month => {
                                                        const estimadoVal = (item as any)[month.key] || 0;
                                                        // For ingresos, we might use different keys later, but for now reuse the structure 
                                                        // assuming 'contable' prop holds the 'recaudado' value or similar.
                                                        // In PresupuestoEgresos it used `[month.key]_contable`
                                                        const recaudadoVal = (item as any)[`${month.key}_contable`] || 0;
                                                        const diferencia = estimadoVal - recaudadoVal;

                                                        return (
                                                            <React.Fragment key={`${item.codigo}-${month.key}`}>
                                                                {/* Estimado */}
                                                                <TableCell className="text-right font-mono text-xs p-2 pr-2 border-l border-gray-100 text-gray-600">
                                                                    {formatCurrency(estimadoVal)}
                                                                </TableCell>
                                                                {/* Recaudado */}
                                                                <TableCell className="text-right font-mono text-xs p-2 pr-2 text-blue-600">
                                                                    {formatCurrency(recaudadoVal)}
                                                                </TableCell>
                                                                {/* Diferencia */}
                                                                <TableCell className={`text-right font-mono text-xs p-2 pr-2 ${diferencia < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                                    {formatCurrency(diferencia)}
                                                                </TableCell>
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </TableRow>
                                            );
                                        })}
                                        {/* Sentinel for Infinite Scroll */}
                                        {visibleCount < flatCRI.length && (
                                            <TableRow ref={loadMoreRef}>
                                                <TableCell colSpan={4 + (MONTHS.length * 3) + (isSelectionMode ? 1 : 0)} className="text-center p-4 text-gray-400">
                                                    Cargando más...
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* HIDDEN PRINT TABLE (Vertical Format) */}
                <div className="hidden print:block fixed top-0 left-0 w-full h-full bg-white z-[9999] p-8" ref={pdfPrintRef}>
                    <style type="text/css" media="print">
                        {`
                            @page { size: portrait; margin: 10mm; }
                            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
                        `}
                    </style>
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Ley de Ingresos - Reporte Detallado</h1>
                        <p className="text-sm text-gray-500" suppressHydrationWarning>Generado el: {new Date().toLocaleDateString()}</p>
                    </div>
                    <table className="w-full border-collapse text-[10px]">
                        <thead>
                            <tr className="bg-gray-100 border-b-2 border-gray-300">
                                <th className="border-b p-2 text-left font-bold text-gray-700 w-[10%]">CRI</th>
                                <th className="border-b p-2 text-left font-bold text-gray-700 w-[30%]">Concepto</th>
                                <th className="border-b p-2 text-right font-bold text-gray-700 w-[15%]">Anual</th>
                                <th className="border-b p-2 text-left font-bold text-gray-700 w-[10%]">Mes</th>
                                <th className="border-b p-2 text-right font-bold text-gray-700 w-[10%]">Presup.</th>
                                <th className="border-b p-2 text-right font-bold text-gray-700 w-[10%]">Contable</th>
                                <th className="border-b p-2 text-right font-bold text-gray-700 w-[15%]">Diferencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            {flatCRI
                                .filter(({ item }) => selectedItems.size === 0 || selectedItems.has(item.cri || item.codigo || ""))
                                .map(({ item }, index) => (
                                    <React.Fragment key={`${item.cri || item.codigo}-${index}`}>
                                        {/* Only show items that have some value or specifically requested? Showing all for "Completo" */}
                                        {MONTHS.map((m, idx) => {
                                            const est = (item as any)[m.key] || 0;
                                            const rec = (item as any)[`${m.key}_contable`] || 0;
                                            const dif = est - rec;

                                            // Optimization: Skip empty rows if desired? User asked for "Completa", implies all.

                                            return (
                                                <tr key={`${item.codigo}-${m.key}`} className="break-inside-avoid hover:bg-gray-50">
                                                    {/* Show CRI/Desc only on first month row for clarity? Or repeat? Repeating is safer for page breaks. */}
                                                    <td className="border-b p-1 font-mono text-gray-600 align-top">{idx === 0 ? (item.cri || item.codigo) : ''}</td>
                                                    <td className="border-b p-1 truncate max-w-[200px] text-gray-800 align-top">{idx === 0 ? item.descripcion : ''}</td>
                                                    <td className="border-b p-1 text-right font-mono align-top">{idx === 0 ? formatCurrency(item.aprobado || 0) : ''}</td>

                                                    <td className="border-b p-1 font-medium">{m.label}</td>
                                                    <td className="border-b p-1 text-right font-mono">{formatCurrency(est)}</td>
                                                    <td className="border-b p-1 text-right font-mono text-blue-600 font-semibold">{formatCurrency(rec)}</td>
                                                    <td className={`border-b p-1 text-right font-mono ${dif < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(dif)}</td>
                                                </tr>
                                            )
                                        })}
                                        <tr className="bg-gray-50/50"><td colSpan={7} className="h-2"></td></tr>
                                    </React.Fragment>
                                ))}
                        </tbody>
                    </table>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default function LeyIngresosPage() {
    return (
        <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <LeyIngresosContent />
        </React.Suspense>
    )
}
