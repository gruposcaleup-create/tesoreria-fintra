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
import { useTreasury, PresupuestoItem } from "@/components/providers/treasury-context"

// Helper to flatten recursive tree for Select options
const flattenPresupuesto = (items: PresupuestoItem[], depth = 0): { item: PresupuestoItem, depth: number }[] => {
    return items.reduce((acc, item) => {
        acc.push({ item, depth });
        if (item.subcuentas) {
            acc.push(...flattenPresupuesto(item.subcuentas, depth + 1));
        }
        return acc;
    }, [] as { item: PresupuestoItem, depth: number }[]);
};

export default function PartidasPage() {
    const { presupuesto, addPresupuestoItem, fuentes } = useTreasury()
    const [mounted, setMounted] = React.useState(false)
    const [isOpen, setIsOpen] = React.useState(false)
    const [expandedRows, setExpandedRows] = React.useState<Record<string, boolean>>({})

    // Add Modal State
    const [newItemType, setNewItemType] = React.useState<"Capitulo" | "Concepto" | "Generica" | "Especifica">("Especifica");
    const [newItemCode, setNewItemCode] = React.useState("");
    const [newItemDesc, setNewItemDesc] = React.useState("");
    const [newItemMonto, setNewItemMonto] = React.useState("");
    const [newItemFuente, setNewItemFuente] = React.useState("");
    const [newItemParent, setNewItemParent] = React.useState("");

    React.useEffect(() => { setMounted(true) }, [])

    const toggleRow = (codigo: string) => {
        setExpandedRows(prev => ({ ...prev, [codigo]: !prev[codigo] }))
    }

    const handleNew = () => {
        setNewItemCode(""); setNewItemDesc(""); setNewItemMonto(""); setNewItemFuente(""); setNewItemParent("");
        setNewItemType("Especifica"); // Default most common
        setIsOpen(true)
    }

    const handleSave = () => {
        if (!newItemCode || !newItemDesc || !newItemFuente) return alert("Complete todos los campos obligatorios");
        if (newItemType !== "Capitulo" && !newItemParent) return alert("Seleccione un elemento padre");

        const amount = parseFloat(newItemMonto) || 0;

        // Map UI Type to Internal Level
        let internalLevel: PresupuestoItem["nivel"] = "Partida"; // Default fallback
        if (newItemType === "Capitulo") internalLevel = "Capitulo";
        else if (newItemType === "Concepto") internalLevel = "Concepto";

        if (newItemType === "Generica" || newItemType === "Especifica") internalLevel = "Partida";

        const newItem: PresupuestoItem = {
            codigo: newItemCode,
            descripcion: newItemDesc,
            nivel: internalLevel,
            fuenteFinanciamiento: newItemFuente,
            aprobado: amount,
            modificado: amount,
            devengado: 0,
            pagado: 0,
            subcuentas: [],
            isExpanded: false
        };

        addPresupuestoItem(newItem, newItemType === "Capitulo" ? undefined : newItemParent);
        setIsOpen(false);
    };

    // Prepare Options for Parent Select based on selected type
    const flatOptions = React.useMemo(() => flattenPresupuesto(presupuesto), [presupuesto]);

    const validParents = React.useMemo(() => {
        if (newItemType === "Capitulo") return [];
        if (newItemType === "Concepto") return flatOptions.filter(o => o.item.nivel === "Capitulo");
        if (newItemType === "Generica") return flatOptions.filter(o => o.item.nivel === "Concepto");
        if (newItemType === "Especifica") return flatOptions.filter(o => o.item.nivel === "Concepto" || o.item.nivel === "Partida");
        return [];
    }, [newItemType, flatOptions]);


    // Calculate Stats
    const totalRegistros = flatOptions.length;
    const totalCapitulos = presupuesto.length;
    const totalAsignadas = flatOptions.filter(o => o.item.nivel === "Partida").length;

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
                    <TableCell className="text-xs font-mono text-center text-muted-foreground">{item.cog || "-"}</TableCell>
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
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">Clasificador COG</h1>
                            <p className="text-muted-foreground">Administración de Capítulos, Conceptos y Partidas (Conac).</p>
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
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Partidas Asignadas</CardTitle>
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
                                <Input placeholder="Buscar partida..." className="pl-9 bg-background border-border" />
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
                                        <TableHead className="w-[100px] font-bold text-muted-foreground uppercase text-xs tracking-wider">COG</TableHead>
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

                {/* --- MODAL FORMULARIO AVANZADO --- */}
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Registrar en Clasificador COG</DialogTitle>
                            <DialogDescription>
                                Alta de elemento presupuestal (CONAC).
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {/* TIPO */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-semibold text-muted-foreground">Nivel</Label>
                                <div className="col-span-3">
                                    <Select value={newItemType} onValueChange={(v: any) => setNewItemType(v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Capitulo">Capítulo (1000)</SelectItem>
                                            <SelectItem value="Concepto">Concepto (1100)</SelectItem>
                                            <SelectItem value="Generica">Partida Genérica (11100)</SelectItem>
                                            <SelectItem value="Especifica">Partida Específica (11101)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* PARENT DROPDOWN (Tree flattener) */}
                            {newItemType !== "Capitulo" && (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right font-semibold text-muted-foreground">Padre</Label>
                                    <div className="col-span-3">
                                        <Select value={newItemParent} onValueChange={setNewItemParent}>
                                            <SelectTrigger><SelectValue placeholder="Seleccione Padre..." /></SelectTrigger>
                                            <SelectContent>
                                                {validParents.map(({ item, depth }) => (
                                                    <SelectItem key={item.codigo} value={item.codigo}>
                                                        {'\u00A0'.repeat(depth * 2)} {item.codigo} - {item.descripcion}
                                                    </SelectItem>
                                                ))}
                                                {validParents.length === 0 && <span className="p-2 text-xs text-muted-foreground block text-center">No hay padres válidos para este nivel. Cree el nivel superior primero.</span>}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {/* CODIGO */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-semibold text-muted-foreground">Código</Label>
                                <Input
                                    value={newItemCode}
                                    onChange={e => setNewItemCode(e.target.value)}
                                    placeholder={newItemType === "Capitulo" ? "1000" : "00000"}
                                    className="col-span-3 font-mono"
                                />
                            </div>

                            {/* DESC */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-semibold text-muted-foreground">Descripción</Label>
                                <Input
                                    value={newItemDesc}
                                    onChange={e => setNewItemDesc(e.target.value)}
                                    placeholder="Nombre oficial..."
                                    className="col-span-3"
                                />
                            </div>

                            {/* FUENTE */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-semibold text-muted-foreground">Fuente</Label>
                                <div className="col-span-3">
                                    <Select value={newItemFuente} onValueChange={setNewItemFuente}>
                                        <SelectTrigger><SelectValue placeholder="Seleccione Fuente" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Mixto">Mixto</SelectItem>
                                            {fuentes.map(f => (
                                                <SelectItem key={f.id} value={f.acronimo}>{f.acronimo}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* MONTO */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-semibold text-muted-foreground">Monto $</Label>
                                <Input
                                    type="number"
                                    value={newItemMonto}
                                    onChange={e => setNewItemMonto(e.target.value)}
                                    placeholder="0.00"
                                    className="col-span-3 font-mono"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">Guardar Registro</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </SidebarInset>
        </SidebarProvider>
    )
}