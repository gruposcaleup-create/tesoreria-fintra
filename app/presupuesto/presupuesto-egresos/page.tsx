"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ChevronDown, ChevronRight, Download, Filter } from "lucide-react"
import { useSearchParams } from "next/navigation"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTreasury, PresupuestoItem } from "@/components/providers/treasury-context"
import { Badge } from "@/components/ui/badge"
import { Calendar, TrendingDown } from "lucide-react"

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

function PresupuestoEgresosContent() {
    const { presupuesto, egresosContables } = useTreasury()
    const searchParams = useSearchParams()
    const highlightCog = searchParams.get('highlight')
    const [highlightedRow, setHighlightedRow] = React.useState<string | null>(null)

    // Refs
    const highlightedRowRef = React.useRef<HTMLTableRowElement | null>(null)
    const tableContainerRef = React.useRef<HTMLDivElement | null>(null)

    // State
    const [searchTerm, setSearchTerm] = React.useState("")
    // Performance Optimization: Visible Items for Infinite Scroll
    const [visibleCount, setVisibleCount] = React.useState(50)
    const observerRef = React.useRef<IntersectionObserver | null>(null)
    const loadMoreRef = React.useRef<HTMLTableRowElement | null>(null)

    // Flatten recursive tree
    const flattenItems = React.useCallback((items: PresupuestoItem[], depth = 0): { item: PresupuestoItem, depth: number }[] => {
        return items.reduce((acc, item) => {
            acc.push({ item, depth });
            if (item.subcuentas) {
                acc.push(...flattenItems(item.subcuentas, depth + 1));
            }
            return acc;
        }, [] as { item: PresupuestoItem, depth: number }[]);
    }, []);


    // Calculate contable amounts from approved egresos for each COG by month
    const contableByMonth = React.useMemo(() => {
        const monthKeys = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const result: Record<string, Record<string, number>> = {};

        // Only count egresos that are "Pagado" (approved)
        egresosContables
            .filter(e => e.estatus === 'Pagado')
            .forEach(egreso => {
                const cog = egreso.cog;
                if (!cog) return;

                const date = new Date(egreso.fecha);
                const monthIndex = date.getMonth();
                const monthKey = `${monthKeys[monthIndex]}_contable`;

                if (!result[cog]) {
                    result[cog] = {};
                }
                result[cog][monthKey] = (result[cog][monthKey] || 0) + egreso.monto;
            });

        return result;
    }, [egresosContables]);

    // Enrich presupuesto items with contable values from egresos
    const enrichedPresupuesto = React.useMemo(() => {
        const enrichItem = (item: PresupuestoItem): PresupuestoItem => {
            const cogContable = item.cog ? contableByMonth[item.cog] : {};
            const enrichedSubcuentas = item.subcuentas?.map(enrichItem);

            // Aggregate subcuentas contable values to parent
            let aggregatedContable: Record<string, number> = { ...cogContable };
            if (enrichedSubcuentas) {
                enrichedSubcuentas.forEach(sub => {
                    Object.keys(sub).forEach(key => {
                        if (key.endsWith('_contable') && typeof (sub as any)[key] === 'number') {
                            aggregatedContable[key] = (aggregatedContable[key] || 0) + ((sub as any)[key] || 0);
                        }
                    });
                });
            }

            return {
                ...item,
                ...aggregatedContable,
                subcuentas: enrichedSubcuentas
            };
        };

        return presupuesto.map(enrichItem);
    }, [presupuesto, contableByMonth]);

    // Helper to calculate flat items (memoized) - now uses enriched presupuesto
    const flatPresupuesto = React.useMemo(() => {
        let items = flattenItems(enrichedPresupuesto);
        // Implement filter logic if needed (currently UI has a filter button but no logic visible in code, assuming standard filter)
        // If there was a search term logic, it would go here.
        // For now, just return all flat items.
        return items;
    }, [enrichedPresupuesto, flattenItems]);

    // Helper function to match COG codes flexibly
    const matchesCog = React.useCallback((item: PresupuestoItem, targetCog: string): boolean => {
        if (!targetCog) return false;
        const itemCog = item.cog || '';
        const itemCodigo = item.codigo || '';

        // Exact match
        if (itemCog === targetCog || itemCodigo === targetCog) return true;

        // COG starts with target (e.g., item.cog "26103" matches target "26103")
        if (itemCog && itemCog.startsWith(targetCog)) return true;
        if (itemCodigo && itemCodigo.includes(targetCog)) return true;

        // Target contains item COG (e.g., target "26103" contains item.cog "26103")
        if (itemCog && targetCog.includes(itemCog) && itemCog.length >= 4) return true;

        // For COG format like "1.2.3.4.26103", extract the last part
        const targetParts = targetCog.split('.');
        const lastPart = targetParts[targetParts.length - 1];
        if (itemCog === lastPart) return true;

        return false;
    }, []);

    // Detectar si hay un COG para highlight y aplicar animación
    React.useEffect(() => {
        if (highlightCog) {
            setHighlightedRow(highlightCog)

            // Find index and force load if needed using improved matching
            const index = flatPresupuesto.findIndex(({ item }) => matchesCog(item, highlightCog))

            if (index !== -1 && index >= visibleCount) {
                setVisibleCount(index + 50)
            }

            // Hacer scroll dentro del contenedor de la tabla
            setTimeout(() => {
                if (highlightedRowRef.current && tableContainerRef.current) {
                    const container = tableContainerRef.current
                    const row = highlightedRowRef.current

                    // Calcular la posición del row relativa al contenedor
                    const containerRect = container.getBoundingClientRect()
                    const rowRect = row.getBoundingClientRect()

                    // Calcular el offset necesario para centrar la fila
                    const scrollTop = container.scrollTop + (rowRect.top - containerRect.top) - (container.clientHeight / 2) + (rowRect.height / 2)

                    // Hacer scroll suave dentro del contenedor
                    container.scrollTo({
                        top: scrollTop,
                        behavior: 'smooth'
                    })
                }
            }, 300) // Increase delay for render

            // Remover el highlight después de 3 segundos
            const timer = setTimeout(() => setHighlightedRow(null), 3000)
            return () => clearTimeout(timer)
        }
    }, [highlightCog, flatPresupuesto, matchesCog]) // Added dependency

    // Infinite Scroll Observer
    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((prev) => Math.min(prev + 50, flatPresupuesto.length))
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
    }, [flatPresupuesto.length, visibleCount])

    // Helper items to render
    const visibleItems = flatPresupuesto.slice(0, visibleCount)

    // Format Currency Helper
    const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

    return (
        <SidebarProvider
            style={{
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties}
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 pt-6 min-h-screen bg-gray-50/50 w-full min-w-0 overflow-x-hidden">

                    {/* HEADER */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Presupuesto de Egresos</h1>
                            <p className="text-gray-500">Consulta y seguimiento del presupuesto anual autorizado vs ejercido.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="gap-2">
                                <Filter className="w-4 h-4" /> Filtrar
                            </Button>
                            <Button variant="outline" className="gap-2">
                                <Download className="w-4 h-4" /> Exportar
                            </Button>
                        </div>
                    </div>

                    {/* RECENT MOVEMENTS */}
                    <Card className="border shadow-sm bg-white mb-4">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingDown className="h-5 w-5 text-red-600" />
                                <h3 className="font-semibold text-sm">Últimos Movimientos Registrados</h3>
                            </div>
                            {egresosContables.length > 0 ? (
                                <div className="space-y-2">
                                    {egresosContables.slice(0, 3).map((egreso) => (
                                        <div
                                            key={egreso.id}
                                            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer border border-transparent hover:border-emerald-300"
                                            onClick={() => {
                                                // Use egreso.cog for better matching with presupuesto items
                                                const highlightValue = egreso.cog || egreso.cuentaContable
                                                setHighlightedRow(highlightValue)

                                                // Ensure loaded using matchesCog
                                                const index = flatPresupuesto.findIndex(({ item }) => matchesCog(item, highlightValue))
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
                                                setTimeout(() => setHighlightedRow(null), 3000)
                                            }}
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                <Badge variant="secondary" className="font-mono text-[10px]">
                                                    {egreso.cog}
                                                </Badge>
                                                <span className="text-xs text-gray-600 truncate max-w-[300px]">
                                                    {egreso.concepto}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Calendar className="h-3 w-3" />
                                                    {egreso.fecha}
                                                </div>
                                                <span className="font-bold text-red-600 text-sm">
                                                    -{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(egreso.monto)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No hay movimientos registrados</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* MAIN TABLE CARD */}
                    <Card className="border shadow-sm bg-white min-w-0 flex flex-col max-h-[calc(100vh-220px)]">
                        <CardContent ref={tableContainerRef} className="p-0 flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            <div className="relative min-w-[3000px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50 border-b border-gray-200">
                                            <TableHead rowSpan={2} className="w-[300px] font-bold text-gray-600 uppercase text-xs tracking-wider sticky left-0 z-20 bg-gray-50 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">Cog</TableHead>
                                            <TableHead rowSpan={2} className="min-w-[250px] font-bold text-gray-600 uppercase text-xs tracking-wider pl-4">Concepto</TableHead>
                                            <TableHead rowSpan={2} className="min-w-[120px] text-right font-bold text-gray-600 uppercase text-xs tracking-wider pr-4">Anual</TableHead>
                                            {MONTHS.map(month => (
                                                <TableHead key={month.key} colSpan={3} className="text-center font-bold text-gray-600 uppercase text-xs tracking-wider border-l border-gray-200">
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
                                        {visibleItems.map(({ item, depth }) => {
                                            const parts = item.codigo.split('.');
                                            const isChapter = parts.length <= 3;
                                            const isConcepto = parts.length === 4;
                                            const isPartidaGenerica = parts.length === 5;

                                            // Define backgrounds and text styles
                                            let rowClass = "border-b border-gray-200 transition-all duration-500 group";
                                            let stickyBg = "";

                                            // Agregar clase de highlight si coincide usando matchesCog
                                            const isHighlighted = highlightedRow && matchesCog(item, highlightedRow);
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
                                                    key={item.codigo}
                                                    className={rowClass}
                                                    ref={isHighlighted ? highlightedRowRef : null}
                                                >
                                                    {/* COG Column */}
                                                    <TableCell className={`font-mono text-xs p-2 sticky left-0 z-[5] shadow-[1px_0_0_0_rgba(0,0,0,0.1)] ${stickyBg}`}>
                                                        <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
                                                            <span>{item.cog || item.codigo}</span>
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
                                                        const presupuestoVal = (item as any)[month.key] || 0;
                                                        const contableVal = (item as any)[`${month.key}_contable`] || 0;
                                                        const diferencia = presupuestoVal - contableVal;

                                                        return (
                                                            <React.Fragment key={`${item.codigo}-${month.key}`}>
                                                                {/* Presupuestado */}
                                                                <TableCell className="text-right font-mono text-xs p-2 pr-2 border-l border-gray-100 text-gray-600">
                                                                    {formatCurrency(presupuestoVal)}
                                                                </TableCell>
                                                                {/* Contable */}
                                                                <TableCell className="text-right font-mono text-xs p-2 pr-2 text-blue-600">
                                                                    {formatCurrency(contableVal)}
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
                                        {visibleCount < flatPresupuesto.length && (
                                            <TableRow ref={loadMoreRef}>
                                                <TableCell colSpan={3 + (MONTHS.length * 3)} className="text-center p-4 text-gray-400">
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
            </SidebarInset>
        </SidebarProvider>
    )
}

export default function PresupuestoEgresosPage() {
    return (
        <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <PresupuestoEgresosContent />
        </React.Suspense>
    )
}
