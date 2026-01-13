"use client"

import React, { useState } from "react"
import {
    CalendarClock,
    Wallet,
    Building2,
    FileText,
    AlertTriangle,
    CheckCircle2,
    Search,
    Filter,
    MoreHorizontal,
    Plus,
    ArrowUpRight,
    CreditCard,
    Banknote,
    Calendar
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// --- TYPES ---

type FondoOrigen = "FISM-DF" | "FORTAMUN" | "Recursos Fiscales" | "Participaciones";
type EstatusPago = "Por Programar" | "Programado" | "Pagado Parcial" | "Vencido";

interface Compromiso {
    id: string;
    proveedor: string;
    concepto: string;
    montoTotal: number;
    montoPagado: number;
    fechaVencimiento: string;
    fondo: FondoOrigen;
    partida: string; // Ej: 24601 - Material Eléctrico
    estatus: EstatusPago;
    cuentaBancariaSugerida: string; // La cuenta de donde debe salir
    xmlUuid?: string;
}

// --- MOCK DATA ---
const DATA_COMPROMISOS: Compromiso[] = [];

// Helper Moneda
const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

// Helper Fechas
const getDiasRestantes = (fecha: string) => {
    const diff = new Date(fecha).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
}

export default function PaymentCommitments() {
    const [commitments, setCommitments] = useState<Compromiso[]>(DATA_COMPROMISOS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterFondo, setFilterFondo] = useState("all");

    // Estado para Nuevo Compromiso
    const [newCommitment, setNewCommitment] = useState<Partial<Compromiso>>({
        fondo: "Recursos Fiscales",
        estatus: "Por Programar"
    });

    // Lógica de filtrado
    const filteredData = commitments.filter(item =>
        filterFondo === "all" || item.fondo === filterFondo
    );

    // Totales para KPIs
    const totalDeuda = commitments.reduce((acc, curr) => acc + (curr.montoTotal - curr.montoPagado), 0);
    const totalVencido = commitments.filter(c => c.estatus === "Vencido").reduce((acc, curr) => acc + (curr.montoTotal - curr.montoPagado), 0);
    const totalProgramado = commitments.filter(c => c.estatus === "Programado").reduce((acc, curr) => acc + (curr.montoTotal - curr.montoPagado), 0);

    // Función inteligente que sugiere cuenta bancaria según el fondo
    const handleFondoChange = (fondo: string) => {
        let cuenta = "";
        switch (fondo) {
            case "FISM-DF": cuenta = "BBVA ***9988 (FISM)"; break;
            case "FORTAMUN": cuenta = "Banorte ***1122 (FORTAMUN)"; break;
            case "Participaciones": cuenta = "Banamex ***5566 (PART)"; break;
            default: cuenta = "Santander ***3344 (Gasto Corr.)";
        }
        setNewCommitment({ ...newCommitment, fondo: fondo as FondoOrigen, cuentaBancariaSugerida: cuenta });
    }

    const handleSave = () => {
        // Aquí iría la lógica de guardado a DB
        setIsModalOpen(false);
        // Simulación de agregar
        const newItem: Compromiso = {
            id: `CP-00${commitments.length + 1}`,
            proveedor: newCommitment.proveedor || "Nuevo Proveedor",
            concepto: newCommitment.concepto || "Concepto General",
            montoTotal: Number(newCommitment.montoTotal) || 0,
            montoPagado: 0,
            fechaVencimiento: newCommitment.fechaVencimiento || "2024-11-01",
            fondo: newCommitment.fondo as FondoOrigen,
            partida: newCommitment.partida || "00000",
            estatus: "Por Programar",
            cuentaBancariaSugerida: newCommitment.cuentaBancariaSugerida || ""
        };
        setCommitments([...commitments, newItem]);
    }

    return (
        <div className="space-y-6 p-2 md:p-6 bg-muted/50 min-h-screen">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Compromisos de Pago</h1>
                    <p className="text-muted-foreground">Gestión de Cuentas por Pagar (Devengado)</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 shadow-md text-primary-foreground">
                        <Plus className="w-4 h-4 mr-2" /> Registrar Compromiso
                    </Button>
                </div>
            </div>

            {/* KPI CARDS - SEMÁFORO FINANCIERO */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-card border-l-4 border-l-primary shadow-sm border-y border-r border-border">
                    <CardHeader className="pb-2">
                        <CardDescription>Deuda Flotante Total</CardDescription>
                        <CardTitle className="text-3xl font-bold text-foreground">{formatCurrency(totalDeuda)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">Comprometido + Devengado</div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-l-4 border-l-emerald-600 shadow-sm border-y border-r border-border">
                    <CardHeader className="pb-2">
                        <CardDescription>Programado para Pago (Semana)</CardDescription>
                        <CardTitle className="text-3xl font-bold text-emerald-700 dark:text-emerald-500">{formatCurrency(totalProgramado)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Progress value={45} className="h-2 flex-1 bg-emerald-100 dark:bg-emerald-950" />
                            <span className="text-xs text-emerald-600 dark:text-emerald-400">Suficiencia Bancaria OK</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-l-4 border-l-red-500 shadow-sm border-y border-r border-border">
                    <CardHeader className="pb-2">
                        <CardDescription>Pasivos Vencidos</CardDescription>
                        <CardTitle className="text-3xl font-bold text-red-600 dark:text-red-500">{formatCurrency(totalVencido)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Atención Inmediata requerida
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* TABLERO DE CONTROL */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* PANEL LATERAL: FILTROS Y ORIGEN */}
                <Card className="lg:col-span-1 h-fit border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-lg">Filtrar por Fondo</CardTitle>
                        <CardDescription>Selecciona el origen del recurso</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button
                            variant={filterFondo === "all" ? "default" : "ghost"}
                            className={`w-full justify-start ${filterFondo === "all" ? "bg-slate-800 dark:bg-slate-200 dark:text-slate-900" : ""}`}
                            onClick={() => setFilterFondo("all")}
                        >
                            <Building2 className="w-4 h-4 mr-2" /> Todos los Fondos
                        </Button>
                        <Button
                            variant={filterFondo === "FISM-DF" ? "secondary" : "ghost"}
                            className="w-full justify-start text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                            onClick={() => setFilterFondo("FISM-DF")}
                        >
                            <Wallet className="w-4 h-4 mr-2" /> FISM-DF (Obra)
                        </Button>
                        <Button
                            variant={filterFondo === "FORTAMUN" ? "secondary" : "ghost"}
                            className="w-full justify-start text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                            onClick={() => setFilterFondo("FORTAMUN")}
                        >
                            <ShieldCheckIcon className="w-4 h-4 mr-2" /> FORTAMUN (Seguridad)
                        </Button>
                        <Button
                            variant={filterFondo === "Recursos Fiscales" ? "secondary" : "ghost"}
                            className="w-full justify-start text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                            onClick={() => setFilterFondo("Recursos Fiscales")}
                        >
                            <Banknote className="w-4 h-4 mr-2" /> Rec. Propios (Gasto)
                        </Button>
                    </CardContent>
                </Card>

                {/* LISTADO DE COMPROMISOS */}
                <Card className="lg:col-span-3 border-border bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle>Listado de Pasivos</CardTitle>
                            <CardDescription>Facturas recibidas y validadas pendientes de pago.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Buscar proveedor..." className="pl-8 w-[200px] bg-background border-border" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-muted/50 border-border">
                                    <TableHead className="text-muted-foreground">Proveedor / Concepto</TableHead>
                                    <TableHead className="text-muted-foreground">Vencimiento</TableHead>
                                    <TableHead className="text-muted-foreground">Origen / Partida</TableHead>
                                    <TableHead className="text-muted-foreground">Cuenta Salida</TableHead>
                                    <TableHead className="text-right text-muted-foreground">Monto</TableHead>
                                    <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((item) => {
                                    const dias = getDiasRestantes(item.fechaVencimiento);
                                    const esVencido = dias < 0;
                                    const esUrgente = dias >= 0 && dias <= 5;

                                    return (
                                        <TableRow key={item.id} className="hover:bg-muted/50 border-border">
                                            <TableCell>
                                                <div className="font-medium text-foreground">{item.proveedor}</div>
                                                <div className="text-xs text-muted-foreground max-w-[200px] truncate" title={item.concepto}>
                                                    {item.concepto}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className={`flex items-center gap-1 text-sm ${esVencido ? 'text-red-600 dark:text-red-400 font-bold' : esUrgente ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-muted-foreground'}`}>
                                                    <CalendarClock className="w-3.5 h-3.5" />
                                                    {item.fechaVencimiento}
                                                </div>
                                                {esVencido && <Badge variant="destructive" className="text-[10px] h-5 mt-1">Vencido</Badge>}
                                                {esUrgente && <Badge variant="outline" className="text-[10px] h-5 mt-1 border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400">Por Vencer</Badge>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="mb-1 text-[10px] border-border text-foreground">{item.fondo}</Badge>
                                                <div className="text-[10px] font-mono text-muted-foreground">P: {item.partida.split(' ')[0]}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-xs text-secondary-foreground bg-muted p-1.5 rounded border border-border">
                                                    <CreditCard className="w-3 h-3 text-muted-foreground" />
                                                    {item.cuentaBancariaSugerida.split('(')[0]}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="font-mono font-bold text-foreground">{formatCurrency(item.montoTotal)}</div>
                                                {item.montoPagado > 0 && <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Pagado: {formatCurrency(item.montoPagado)}</div>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-popover border-border">
                                                        <DropdownMenuItem className="text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer">
                                                            <ArrowUpRight className="mr-2 h-4 w-4" /> Programar Pago
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer">Ver Factura (XML)</DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer">Ver Contrato</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* MODAL: REGISTRAR NUEVO COMPROMISO (DEVENGADO) */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[700px] bg-background border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-foreground">
                            <FileText className="w-5 h-5 text-primary" />
                            Registrar Pasivo (Devengado)
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Vincula una factura recibida a una partida presupuestal y fondo.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">

                        {/* SECCIÓN 1: CLASIFICACIÓN PRESUPUESTAL (CRÍTICO) */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border border-border">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Origen del Recurso (Fondo)</Label>
                                <Select onValueChange={handleFondoChange}>
                                    <SelectTrigger className="bg-background border-border">
                                        <SelectValue placeholder="Selecciona Fondo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="FISM-DF">FISM-DF (Infraestructura)</SelectItem>
                                        <SelectItem value="FORTAMUN">FORTAMUN (Seguridad/Nómina)</SelectItem>
                                        <SelectItem value="Recursos Fiscales">Recursos Propios (Impuestos)</SelectItem>
                                        <SelectItem value="Participaciones">Participaciones Federales</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Cuenta de Salida (Automática)</Label>
                                <div className="flex items-center h-10 px-3 rounded-md border border-border bg-background text-sm font-mono text-muted-foreground">
                                    {newCommitment.cuentaBancariaSugerida || "Selecciona un fondo..."}
                                </div>
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label className="text-foreground">Partida Presupuestal / Clave Programática</Label>
                                <Select onValueChange={(v) => setNewCommitment({ ...newCommitment, partida: v })}>
                                    <SelectTrigger className="bg-background border-border">
                                        <SelectValue placeholder="Ej. 61401 Obras Públicas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="61401">61401 - División de Terrenos (Obra)</SelectItem>
                                        <SelectItem value="21101">21101 - Materiales de Administración</SelectItem>
                                        <SelectItem value="31101">31101 - Servicio de Energía Eléctrica</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* SECCIÓN 2: DATOS DEL PASIVO */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label className="text-foreground">Proveedor / Acreedor</Label>
                                <div className="flex gap-2">
                                    <Input placeholder="RFC o Razón Social" className="bg-background border-border" onChange={(e) => setNewCommitment({ ...newCommitment, proveedor: e.target.value })} />
                                    <Button variant="outline" size="icon" className="border-border"><Search className="w-4 h-4" /></Button>
                                </div>
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label className="text-foreground">Concepto / Descripción del Gasto</Label>
                                <Input placeholder="Ej. Estimación 1 de Obra..." className="bg-background border-border" onChange={(e) => setNewCommitment({ ...newCommitment, concepto: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground">Monto Total (Factura)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                    <Input className="pl-6 bg-background border-border" type="number" placeholder="0.00" onChange={(e) => setNewCommitment({ ...newCommitment, montoTotal: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground">Fecha Vencimiento (Pago)</Label>
                                <Input type="date" className="bg-background border-border" onChange={(e) => setNewCommitment({ ...newCommitment, fechaVencimiento: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-border text-foreground hover:bg-muted">Cancelar</Button>
                        <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">Guardar Compromiso</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function ShieldCheckIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}