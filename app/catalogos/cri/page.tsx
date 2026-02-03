"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
    Plus, Search, Edit2, Filter, Layers, FileDigit, Hash, ChevronDown, ChevronRight, Trash2
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RAW_CRI_DATA } from "@/components/providers/cri-raw-data";
import { buildCRITree } from "@/components/providers/cri-tree-builder";
import { PresupuestoItem } from "@/components/providers/treasury-context";

// Helper to flatten recursive tree for stats
const flattenPresupuesto = (items: PresupuestoItem[], depth = 0): { item: PresupuestoItem, depth: number }[] => {
    return items.reduce((acc, item) => {
        acc.push({ item, depth });
        if (item.subcuentas) {
            acc.push(...flattenPresupuesto(item.subcuentas, depth + 1));
        }
        return acc;
    }, [] as { item: PresupuestoItem, depth: number }[]);
};

export default function CRIPage() {
    // Build tree from raw data
    const presupuesto = React.useMemo(() => buildCRITree(RAW_CRI_DATA), []);

    const flatOptions = React.useMemo(() => flattenPresupuesto(presupuesto), [presupuesto]);
    const totalRegistros = flatOptions.length;
    const totalCapitulos = presupuesto.length;
    // Count items that are leaves (no subcuentas) or by level if preferred
    const totalAsignadas = flatOptions.filter(o => !o.item.subcuentas || o.item.subcuentas.length === 0).length;

    const [mounted, setMounted] = React.useState(false)
    const [expandedRows, setExpandedRows] = React.useState<Record<string, boolean>>({})

    React.useEffect(() => { setMounted(true) }, [])

    const toggleRow = (codigo: string) => {
        setExpandedRows(prev => ({ ...prev, [codigo]: !prev[codigo] }))
    }

    if (!mounted) return <div className="min-h-screen bg-slate-50" />

    const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

    // Recursive Table Row Renderer
    const renderRows = (items: PresupuestoItem[], level = 0) => {
        return items.map(item => (
            <React.Fragment key={item.codigo}>
                <TableRow className={`
                    border-b border-border transition-colors
                    ${level === 0 ? 'bg-card hover:bg-muted/50' : ''}
                    ${level === 1 ? 'bg-muted/20 hover:bg-muted/40' : ''}
                    ${level >= 2 ? 'bg-muted/40 hover:bg-muted/60' : ''}
                `}>
                    <TableCell className="w-[50px]">
                        {item.subcuentas && item.subcuentas.length > 0 && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => toggleRow(item.codigo)}>
                                {expandedRows[item.codigo] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </Button>
                        )}
                    </TableCell>
                    <TableCell style={{ paddingLeft: `${8 + (level * 20)}px` }} className={`font-mono ${level === 0 ? 'font-bold text-base' : 'text-sm'} ${level === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {item.codigo}
                    </TableCell>
                    <TableCell className={`
                        ${level === 0 ? 'font-bold uppercase tracking-tight' : 'font-medium'}
                        ${level >= 2 ? 'text-foreground' : 'text-foreground'}
                    `}>
                        {item.descripcion}
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className={`
                            font-mono text-[10px] uppercase border-border
                            ${level === 0 ? 'bg-muted text-muted-foreground' : ''}
                            ${level === 1 ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400' : ''}
                            ${level >= 2 ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400' : ''}
                        `}>
                            {item.nivel || (level === 0 ? "Capítulo" : "Partida")}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-center text-muted-foreground">{item.cuenta_registro || "-"}</TableCell>
                    {/* CHANGED COLUMN CONTENT */}
                    <TableCell className="text-xs font-mono text-center text-muted-foreground">{item.cri || "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.fuenteFinanciamiento}</TableCell>
                    <TableCell className="text-right pr-6 font-mono text-xs text-muted-foreground">
                        {formatCurrency(item.aprobado)}
                    </TableCell>
                </TableRow>
                {expandedRows[item.codigo] && item.subcuentas && renderRows(item.subcuentas, level + 1)}
            </React.Fragment>
        ));
    };

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
                <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 pt-6 bg-muted/50 min-h-screen">

                    {/* HEADER */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">Clasificador CRI</h1>
                            <p className="text-muted-foreground">Clasificador por Rubro de Ingresos (CRI).</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="bg-background text-foreground border-border hover:bg-muted">
                                <Filter className="w-4 h-4 mr-2" /> Filtrar Nivel
                            </Button>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="border-border shadow-sm bg-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Elementos</CardTitle>
                                <Hash className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-foreground font-mono tracking-tight">{totalRegistros}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-border shadow-sm bg-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Capítulos</CardTitle>
                                <Layers className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-foreground font-mono tracking-tight">{totalCapitulos}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-border shadow-sm bg-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Rubros Asignados</CardTitle>
                                <FileDigit className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-foreground font-mono tracking-tight">{totalAsignadas}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* TABLA TREE VIEW */}
                    <Card className="border-border shadow-sm overflow-hidden bg-card">
                        <div className="p-4 border-b border-border bg-card flex items-center gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Buscar rubro..." className="pl-9 bg-background border-border" />
                            </div>
                        </div>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                                        <TableHead className="w-[50px]"></TableHead>
                                        <TableHead className="w-[120px] font-bold text-muted-foreground uppercase text-xs tracking-wider">Código</TableHead>
                                        <TableHead className="font-bold text-muted-foreground uppercase text-xs tracking-wider">Descripción</TableHead>
                                        <TableHead className="w-[120px] font-bold text-muted-foreground uppercase text-xs tracking-wider">Nivel</TableHead>
                                        <TableHead className="w-[100px] font-bold text-muted-foreground uppercase text-xs tracking-wider">Cuenta Reg.</TableHead>
                                        {/* CHANGED COLUMN HEADER */}
                                        <TableHead className="w-[100px] font-bold text-muted-foreground uppercase text-xs tracking-wider">CRI</TableHead>
                                        <TableHead className="w-[120px] font-bold text-muted-foreground uppercase text-xs tracking-wider">Fuente</TableHead>
                                        <TableHead className="text-right font-bold text-muted-foreground uppercase text-xs tracking-wider pr-6">Monto Aprobado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {renderRows(presupuesto)}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
