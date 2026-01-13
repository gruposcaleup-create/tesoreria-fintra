"use client"

import React, { useState } from "react"
import {
    Building2, User, Search, Filter, MoreHorizontal, Plus,
    FileText, ShieldAlert, CheckCircle2, AlertTriangle,
    CreditCard, ExternalLink, Paperclip, Phone, Mail, MapPin,
    UploadCloud, FileCheck, Eye, Download
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

// --- TYPES ---

type EstatusProveedor = "Activo" | "Bloqueado" | "En Revisión";
type RiesgoSAT = "Sin Riesgo" | "Observado (69-B)" | "Opinión Negativa";

interface Proveedor {
    id: string;
    razonSocial: string;
    rfc: string;
    tipo: "Persona Moral" | "Persona Física";
    representanteLegal: string;
    email: string;
    telefono: string;
    clabe: string;
    banco: string;
    estatus: EstatusProveedor;
    riesgoSat: RiesgoSAT;
    ultimaActualizacion: string;
    documentosEntregados: number; // de 5 obligatorios
}

// --- MOCK DATA ---
const DATA_PROVEEDORES: Proveedor[] = [];

export default function SupplierManagement() {
    const [proveedores, setProveedores] = useState<Proveedor[]>(DATA_PROVEEDORES);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProvider, setSelectedProvider] = useState<Proveedor | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isNewOpen, setIsNewOpen] = useState(false);

    // Filtrado
    const filteredData = proveedores.filter(p =>
        p.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.rfc.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Abrir expediente
    const openExpediente = (proveedor: Proveedor) => {
        setSelectedProvider(proveedor);
        setIsDetailsOpen(true);
    };

    return (
        <div className="space-y-6 p-2 md:p-6 bg-muted/50 min-h-screen">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Padrón de Proveedores</h1>
                    <p className="text-muted-foreground">Gestión de Expedientes, Cuentas Bancarias y Validación SAT.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" className="gap-2 bg-background hidden md:flex">
                        <ExternalLink className="w-4 h-4" /> Consultar Listas Negras 69-B
                    </Button>
                    <Button onClick={() => setIsNewOpen(true)} className="bg-primary shadow-md w-full md:w-auto hover:bg-primary/90 text-primary-foreground">
                        <Plus className="w-4 h-4 mr-2" /> Nuevo Proveedor
                    </Button>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-card shadow-sm border-l-4 border-l-slate-800 dark:border-l-slate-400">
                    <CardHeader className="pb-2">
                        <CardDescription>Proveedores Registrados</CardDescription>
                        <CardTitle className="text-3xl font-bold text-foreground">{proveedores.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">Activos y validados</div>
                    </CardContent>
                </Card>

                <Card className="bg-card shadow-sm border-l-4 border-l-emerald-600 dark:border-l-emerald-500">
                    <CardHeader className="pb-2">
                        <CardDescription>Expedientes Completos</CardDescription>
                        <CardTitle className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                            {proveedores.filter(p => p.documentosEntregados === 5).length}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Listos para pago
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card shadow-sm border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-900/10 dark:border-red-500 sm:col-span-2 lg:col-span-1">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-red-800 dark:text-red-300">Alertas de Riesgo SAT</CardDescription>
                        <CardTitle className="text-3xl font-bold text-red-600 dark:text-red-400">
                            {proveedores.filter(p => p.riesgoSat !== "Sin Riesgo").length}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> EFOS o Incumplidos
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* TABLA DE PROVEEDORES */}
            <Card className="min-h-[500px]">
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <CardTitle>Directorio de Contratistas</CardTitle>
                    <div className="flex w-full md:w-auto gap-2">
                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por Razón Social o RFC..."
                                className="pl-8 w-full md:w-[300px]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                    <div className="overflow-x-auto">
                        <Table className="min-w-[800px]">
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Razón Social / Comercial</TableHead>
                                    <TableHead>RFC / Tipo</TableHead>
                                    <TableHead className="hidden md:table-cell">Datos Bancarios</TableHead>
                                    <TableHead>Estatus SAT</TableHead>
                                    <TableHead className="hidden lg:table-cell">Expediente</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((prov) => (
                                    <TableRow key={prov.id} className={prov.riesgoSat === 'Observado (69-B)' ? "bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20" : "hover:bg-muted/50"}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 bg-muted hidden sm:flex">
                                                    <AvatarFallback className="text-foreground font-bold text-xs">{prov.razonSocial.substring(0, 2)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-foreground break-words">{prov.razonSocial}</div>
                                                    <div className="text-xs text-muted-foreground hidden sm:block">{prov.representanteLegal}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono text-xs mb-1 bg-background whitespace-nowrap">{prov.rfc}</Badge>
                                            <div className="text-xs text-muted-foreground">{prov.tipo}</div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="text-xs space-y-1">
                                                <div className="flex items-center gap-1 font-semibold text-foreground">
                                                    <Building2 className="w-3 h-3" /> {prov.banco}
                                                </div>
                                                <div className="font-mono text-muted-foreground">{prov.clabe}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                prov.riesgoSat === "Sin Riesgo" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800" :
                                                    prov.riesgoSat === "Opinión Negativa" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800" :
                                                        "bg-red-100 text-red-800 border-red-300 font-bold dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                                            }>
                                                {prov.riesgoSat === 'Observado (69-B)' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                                {prov.riesgoSat}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <div className="flex items-center gap-2">
                                                <Progress value={(prov.documentosEntregados / 5) * 100} className="w-16 h-2" />
                                                <span className="text-xs text-muted-foreground">{prov.documentosEntregados}/5</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => openExpediente(prov)}>
                                                        <FileText className="w-4 h-4 mr-2" /> Ver Expediente
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <ShieldAlert className="w-4 h-4 mr-2" /> Validar en SAT
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600">Bloquear Proveedor</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* ==================================================================================== */}
            {/* MODAL: EXPEDIENTE DIGITAL ÚNICO */}
            {/* ==================================================================================== */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                {/* CORRECCIÓN CLAVE: "sm:max-w-[98vw]" fuerza el ancho en pantallas grandes sobre el valor por defecto */}
                <DialogContent className="w-[98vw] sm:max-w-[98vw] h-[90vh] overflow-hidden flex flex-col p-0">
                    {/* HEADER MODAL */}
                    <DialogHeader className="px-6 py-4 border-b bg-muted/50 shrink-0">
                        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                            <div>
                                <DialogTitle className="text-xl md:text-2xl flex items-center gap-2">
                                    <span className="break-words">{selectedProvider?.razonSocial}</span>
                                    {selectedProvider?.riesgoSat === "Observado (69-B)" && <Badge variant="destructive" className="text-xs shrink-0">LISTA NEGRA</Badge>}
                                </DialogTitle>
                                <DialogDescription className="mt-1 font-mono text-sm">
                                    RFC: {selectedProvider?.rfc} • ID Interno: {selectedProvider?.id}
                                </DialogDescription>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end gap-1">
                                    <Badge variant="outline" className="text-sm px-3 py-1 font-medium bg-background">
                                        Estatus: {selectedProvider?.estatus}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground hidden md:inline">Actualizado: {selectedProvider?.ultimaActualizacion}</span>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* CONTENIDO SCROLLABLE */}
                    <Tabs defaultValue="documentos" className="flex-1 flex flex-col w-full overflow-hidden">
                        <div className="px-6 pt-4 shrink-0 bg-background">
                            <TabsList className="w-full justify-start bg-muted p-1 h-auto flex-wrap">
                                <TabsTrigger value="general" className="px-4 py-2 flex-1 md:flex-none">Datos Generales</TabsTrigger>
                                <TabsTrigger value="bancario" className="px-4 py-2 flex-1 md:flex-none">Fiscal y Bancario</TabsTrigger>
                                <TabsTrigger value="documentos" className="px-4 py-2 flex-1 md:flex-none font-semibold text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none">Documentación (ORFIS)</TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1 w-full">
                            <div className="p-4 md:p-6 pb-20">
                                {/* TAB: GENERAL */}
                                <TabsContent value="general" className="space-y-6 mt-0">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <Card className="border-none shadow-none bg-muted/50">
                                            <CardHeader className="pb-2"><CardTitle className="text-base text-foreground">Contacto Comercial</CardTitle></CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 bg-card rounded border border-border">
                                                    <div className="p-2 bg-blue-100/50 dark:bg-blue-900/30 rounded text-blue-700 dark:text-blue-400 shrink-0"><User className="w-5 h-5" /></div>
                                                    <div className="w-full overflow-hidden">
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase">Representante Legal</p>
                                                        <p className="text-sm text-foreground font-medium truncate">{selectedProvider?.representanteLegal}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 bg-card rounded border border-border">
                                                    <div className="p-2 bg-blue-100/50 dark:bg-blue-900/30 rounded text-blue-700 dark:text-blue-400 shrink-0"><Mail className="w-5 h-5" /></div>
                                                    <div className="w-full overflow-hidden">
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase">Correo Electrónico</p>
                                                        <p className="text-sm text-foreground font-medium truncate">{selectedProvider?.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 bg-card rounded border border-border">
                                                    <div className="p-2 bg-blue-100/50 dark:bg-blue-900/30 rounded text-blue-700 dark:text-blue-400 shrink-0"><Phone className="w-5 h-5" /></div>
                                                    <div className="w-full overflow-hidden">
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase">Teléfono</p>
                                                        <p className="text-sm text-foreground font-medium">{selectedProvider?.telefono}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="border-none shadow-none bg-muted/50">
                                            <CardHeader className="pb-2"><CardTitle className="text-base text-foreground">Domicilio Fiscal</CardTitle></CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="flex flex-col sm:flex-row items-start gap-4 p-4 bg-card rounded border border-border h-full">
                                                    <div className="p-2 bg-blue-100/50 dark:bg-blue-900/30 rounded text-blue-700 dark:text-blue-400 mt-1 shrink-0"><MapPin className="w-5 h-5" /></div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase">Dirección Registrada</p>
                                                        <p className="text-sm text-foreground font-medium mt-1">Av. Lázaro Cárdenas #500, Col. Centro<br />Xalapa, Veracruz. CP 91000</p>
                                                        <Button variant="link" className="p-0 h-auto text-primary mt-2 text-xs">Ver ubicación en mapa</Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>

                                {/* TAB: BANCARIO */}
                                <TabsContent value="bancario" className="space-y-6 mt-0">
                                    {selectedProvider?.riesgoSat !== "Sin Riesgo" && (
                                        <Alert variant="destructive" className="mb-4">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertTitle>Precaución Fiscal</AlertTitle>
                                            <AlertDescription>
                                                Este proveedor presenta irregularidades ante el SAT ({selectedProvider?.riesgoSat}). Se recomienda suspender pagos.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-muted-foreground">Banco Receptor</Label>
                                            <div className="flex items-center h-12 px-4 rounded-md border bg-muted text-foreground font-medium">
                                                <Building2 className="w-5 h-5 mr-3 text-muted-foreground shrink-0" />
                                                {selectedProvider?.banco}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-muted-foreground">CLABE Interbancaria (18 dígitos)</Label>
                                            <div className="flex items-center h-12 px-4 rounded-md border bg-muted text-foreground font-mono text-lg tracking-wide overflow-x-auto">
                                                <CreditCard className="w-5 h-5 mr-3 text-muted-foreground shrink-0" />
                                                <span className="whitespace-nowrap">{selectedProvider?.clabe}</span>
                                            </div>
                                            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                                                <CheckCircle2 className="w-3 h-3" /> Cuenta validada por SPEI (Titular coincide)
                                            </p>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* TAB: DOCUMENTOS (FULL WIDTH) */}
                                <TabsContent value="documentos" className="mt-0">
                                    <Card className="border shadow-sm overflow-hidden">
                                        <CardHeader className="pb-0 border-b bg-muted/40 px-4 md:px-6 py-4">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div>
                                                    <CardTitle className="text-lg text-foreground">Documentación Digital SAT/ORFIS</CardTitle>
                                                    <CardDescription className="mt-1">
                                                        Expediente técnico obligatorio para la liberación de pagos.
                                                    </CardDescription>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase">Progreso</p>
                                                        <p className="text-2xl font-bold text-foreground">{selectedProvider?.documentosEntregados}/5</p>
                                                    </div>
                                                    <div className="h-10 w-10 shrink-0">
                                                        <div className="rounded-full border-4 border-emerald-500 w-full h-full"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <div className="p-0 w-full overflow-x-auto">
                                            <Table className="w-full">
                                                <TableHeader>
                                                    <TableRow className="bg-muted hover:bg-muted h-10">
                                                        <TableHead className="w-auto pl-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Documento Requerido</TableHead>
                                                        <TableHead className="w-[150px] text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Vigencia</TableHead>
                                                        <TableHead className="w-[150px] text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Estatus</TableHead>
                                                        <TableHead className="w-[150px] text-right pr-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Acciones</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>

                                                    {/* FILA 1 */}
                                                    <TableRow className="h-12 hover:bg-muted/50">
                                                        <TableCell className="pl-6 align-middle py-2">
                                                            <div className="flex items-start gap-3">
                                                                <div className="p-1.5 bg-blue-100/50 dark:bg-blue-900/30 rounded text-blue-700 dark:text-blue-400 shrink-0 mt-0.5"><FileText className="w-4 h-4" /></div>
                                                                <div className="min-w-0">
                                                                    <span className="font-semibold text-foreground block text-sm leading-tight break-words">Constancia de Situación Fiscal</span>
                                                                    <span className="text-[10px] text-muted-foreground uppercase mt-0.5 block">Actualizada al mes corriente</span>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground align-middle py-2 whitespace-nowrap">Indefinida</TableCell>
                                                        <TableCell className="align-middle py-2"><Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 px-2 py-0 h-5 text-[10px] font-medium whitespace-nowrap">Vigente</Badge></TableCell>
                                                        <TableCell className="text-right pr-6 align-middle py-2 whitespace-nowrap">
                                                            <div className="flex justify-end gap-2"><Button variant="outline" size="sm" className="gap-2 h-8 text-xs"><Eye className="w-3.5 h-3.5" /> Ver</Button><Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8"><Download className="w-3.5 h-3.5" /></Button></div>
                                                        </TableCell>
                                                    </TableRow>

                                                    {/* FILA 2 */}
                                                    <TableRow className="h-12 bg-red-50/10 hover:bg-red-50/20 dark:bg-red-900/10 dark:hover:bg-red-900/20">
                                                        <TableCell className="pl-6 align-middle py-2">
                                                            <div className="flex items-start gap-3">
                                                                <div className="p-1.5 bg-blue-100/50 dark:bg-blue-900/30 rounded text-blue-700 dark:text-blue-400 shrink-0 mt-0.5"><FileText className="w-4 h-4" /></div>
                                                                <div className="min-w-0">
                                                                    <span className="font-semibold text-foreground block text-sm leading-tight break-words">Opinión de Cumplimiento (32-D)</span>
                                                                    <span className="text-[10px] text-muted-foreground uppercase mt-0.5 block">Mensual obligatoria</span>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-xs font-bold text-red-600 dark:text-red-400 align-middle py-2 whitespace-nowrap">
                                                            <div className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Vence 2 días</div>
                                                        </TableCell>
                                                        <TableCell className="align-middle py-2"><Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 px-2 py-0 h-5 text-[10px] font-medium whitespace-nowrap">Por Renovar</Badge></TableCell>
                                                        <TableCell className="text-right pr-6 align-middle py-2 whitespace-nowrap">
                                                            <div className="flex justify-end gap-2"><Button variant="outline" size="sm" className="gap-2 border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400 h-8 text-xs"><UploadCloud className="w-3.5 h-3.5" /> Actualizar</Button></div>
                                                        </TableCell>
                                                    </TableRow>

                                                    {/* FILA 3 */}
                                                    <TableRow className="h-12 hover:bg-muted/50">
                                                        <TableCell className="pl-6 align-middle py-2">
                                                            <div className="flex items-start gap-3">
                                                                <div className="p-1.5 bg-muted rounded text-muted-foreground shrink-0 mt-0.5"><FileText className="w-4 h-4" /></div>
                                                                <div className="min-w-0">
                                                                    <span className="font-semibold text-foreground block text-sm leading-tight break-words">Acta Constitutiva</span>
                                                                    <span className="text-[10px] text-muted-foreground uppercase mt-0.5 block">Escritura Pública</span>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground align-middle py-2 whitespace-nowrap">Permanente</TableCell>
                                                        <TableCell className="align-middle py-2"><Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 px-2 py-0 h-5 text-[10px] font-medium whitespace-nowrap">Entregado</Badge></TableCell>
                                                        <TableCell className="text-right pr-6 align-middle py-2 whitespace-nowrap">
                                                            <div className="flex justify-end gap-2"><Button variant="outline" size="sm" className="gap-2 h-8 text-xs"><Eye className="w-3.5 h-3.5" /> Ver</Button></div>
                                                        </TableCell>
                                                    </TableRow>

                                                    {/* FILA 4 */}
                                                    <TableRow className="h-12 hover:bg-muted/50">
                                                        <TableCell className="pl-6 align-middle py-2">
                                                            <div className="flex items-start gap-3">
                                                                <div className="p-1.5 bg-muted rounded text-muted-foreground shrink-0 mt-0.5"><FileText className="w-4 h-4" /></div>
                                                                <div className="min-w-0">
                                                                    <span className="font-semibold text-foreground block text-sm leading-tight break-words">Comprobante de Domicilio</span>
                                                                    <span className="text-[10px] text-muted-foreground uppercase mt-0.5 block">Luz, Agua o Teléfono (Reciente)</span>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground align-middle py-2 whitespace-nowrap">Mensual</TableCell>
                                                        <TableCell className="align-middle py-2"><Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 px-2 py-0 h-5 text-[10px] font-medium hover:bg-red-100 dark:hover:bg-red-900/40 whitespace-nowrap">Faltante</Badge></TableCell>
                                                        <TableCell className="text-right pr-6 align-middle py-2 whitespace-nowrap">
                                                            <Button size="sm" className="bg-primary gap-2 shadow-sm h-8 text-xs hover:bg-primary/90 text-primary-foreground"><UploadCloud className="w-3.5 h-3.5" /> Subir</Button>
                                                        </TableCell>
                                                    </TableRow>

                                                    {/* FILA 5 */}
                                                    <TableRow className="h-12 hover:bg-muted/50">
                                                        <TableCell className="pl-6 align-middle py-2">
                                                            <div className="flex items-start gap-3">
                                                                <div className="p-1.5 bg-muted rounded text-muted-foreground shrink-0 mt-0.5"><FileText className="w-4 h-4" /></div>
                                                                <div className="min-w-0">
                                                                    <span className="font-semibold text-foreground block text-sm leading-tight break-words">INE Representante Legal</span>
                                                                    <span className="text-[10px] text-muted-foreground uppercase mt-0.5 block">Identificación Oficial</span>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground align-middle py-2 whitespace-nowrap">Vigente</TableCell>
                                                        <TableCell className="align-middle py-2"><Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 px-2 py-0 h-5 text-[10px] font-medium whitespace-nowrap">Entregado</Badge></TableCell>
                                                        <TableCell className="text-right pr-6 align-middle py-2 whitespace-nowrap">
                                                            <div className="flex justify-end gap-2"><Button variant="outline" size="sm" className="gap-2 h-8 text-xs"><Eye className="w-3.5 h-3.5" /> Ver</Button></div>
                                                        </TableCell>
                                                    </TableRow>

                                                </TableBody>
                                            </Table>
                                        </div>
                                    </Card>
                                </TabsContent>
                            </div>
                        </ScrollArea>
                    </Tabs>

                    <DialogFooter className="px-6 py-4 border-t shrink-0">
                        <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Cerrar Expediente</Button>
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Guardar Cambios</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ==================================================================================== */}
            {/* MODAL: NUEVO PROVEEDOR (MANTENIDO IGUAL) */}
            {/* ==================================================================================== */}
            <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Registrar Nuevo Proveedor</DialogTitle>
                        <DialogDescription>Complete los datos fiscales y adjunte la documentación obligatoria.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                        {/* SECCIÓN 1: DATOS FISCALES */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <Building2 className="w-4 h-4" /> Identificación Fiscal
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>RFC <span className="text-red-500">*</span></Label>
                                    <Input placeholder="XAXX010101000" className="font-mono uppercase" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tipo de Persona</Label>
                                    <Select>
                                        <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="moral">Moral (Empresa)</SelectItem>
                                            <SelectItem value="fisica">Física</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label>Razón Social / Nombre Completo <span className="text-red-500">*</span></Label>
                                    <Input placeholder="Tal cual aparece en la Constancia" />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label>Régimen Fiscal Principal</Label>
                                    <Select>
                                        <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="601">601 - General de Ley P.M.</SelectItem>
                                            <SelectItem value="612">612 - Personas Físicas</SelectItem>
                                            <SelectItem value="626">626 - RESICO</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <Separator />
                        {/* SECCIÓN 2: CARGA DE DOCUMENTOS INICIALES */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <FileCheck className="w-4 h-4" /> Documentación SAT (Obligatoria)
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="border border-dashed border-border rounded-lg p-4 bg-muted/30 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-background p-2 rounded border shadow-sm"><FileText className="w-5 h-5 text-red-600 dark:text-red-400" /></div>
                                        <div><p className="text-sm font-medium text-foreground">Constancia de Situación Fiscal</p><p className="text-xs text-muted-foreground">PDF reciente (Máx. 3 meses)</p></div>
                                    </div>
                                    <Input type="file" className="w-[120px] text-xs" />
                                </div>
                                <div className="border border-dashed border-border rounded-lg p-4 bg-muted/30 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-background p-2 rounded border shadow-sm"><FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
                                        <div><p className="text-sm font-medium text-foreground">Opinión de Cumplimiento (32-D)</p><p className="text-xs text-muted-foreground">Debe ser POSITIVA</p></div>
                                    </div>
                                    <Input type="file" className="w-[120px] text-xs" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNewOpen(false)}>Cancelar</Button>
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setIsNewOpen(false)}>Guardar y Crear Expediente</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}