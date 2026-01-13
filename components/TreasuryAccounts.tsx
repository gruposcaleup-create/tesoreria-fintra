"use client"

import React, { useState } from "react"
import {
    Wallet, Building2, TrendingUp, TrendingDown, ArrowUpRight,
    History, ShieldCheck, CreditCard, Landmark,
    Eye, EyeOff, Plus, ArrowRightLeft, DollarSign,
    FileClock, User, MapPin, Phone, Calendar, FileText,
    MoreHorizontal, Pencil, Trash
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ... imports ...
// ... imports ...
import { useTreasury, BankAccount, LogEntry, Transaction, FuenteFinanciamiento, TipoCuenta } from "@/components/providers/treasury-context"
import { EgresoFormFields } from "@/components/add-egreso-dialog"

// ... (keep Currency component)

// REMOVED DATA_CUENTAS and DATA_LOG as they are now in context

const Currency = ({ amount, className }: { amount: number, className?: string }) => (
    <span className={`font-mono tracking-tight ${className}`}>
        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)}
    </span>
);

export default function TreasuryAccounts() {
    const { cuentas, setCuentas, systemLog, setSystemLog, addToLog, fuentes, presupuesto, setEgresosContables } = useTreasury();
    const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);

    // Modales
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [isTransactionOpen, setIsTransactionOpen] = useState(false);
    const [isLogOpen, setIsLogOpen] = useState(false);
    const [showSensitiveData, setShowSensitiveData] = useState(false);
    const [deleteConfirmAccount, setDeleteConfirmAccount] = useState<BankAccount | null>(null);

    // Estados Formularios Operativos
    const [transactionType, setTransactionType] = useState<"Ingreso" | "Egreso">("Ingreso");
    const [newAmount, setNewAmount] = useState("");
    const [newConcept, setNewConcept] = useState("");
    const [newRef, setNewRef] = useState("");

    // State for Unified Egreso Form
    const [selectedCapitulo, setSelectedCapitulo] = useState<string>("");
    const [egresoFormData, setEgresoFormData] = useState({
        cog: "",
        cuentaContable: "",
        pagueseA: "",
        monto: "",
        concepto: "",
        fondo: "",
        fecha: new Date().toISOString().split('T')[0],
        tipo: "Bancario"
    });

    const [transferOrigin, setTransferOrigin] = useState("");
    const [transferDest, setTransferDest] = useState("");
    const [transferAmount, setTransferAmount] = useState("");
    const [transferConcept, setTransferConcept] = useState("");
    const [transferDate, setTransferDate] = new Date().toISOString().split('T')[0];

    // --- ESTADOS PARA NUEVA/EDITAR CUENTA (FULL) ---
    const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
    const [newAccountBank, setNewAccountBank] = useState("BBVA");
    const [newAccountAlias, setNewAccountAlias] = useState("");
    const [newAccountBalance, setNewAccountBalance] = useState("");
    const [newNumCuenta, setNewNumCuenta] = useState("");
    const [newClabe, setNewClabe] = useState("");
    const [newSucursal, setNewSucursal] = useState("");
    const [newDireccion, setNewDireccion] = useState("");
    const [newEjecutivo, setNewEjecutivo] = useState("");
    const [newTelefono, setNewTelefono] = useState("");
    const [newFuente, setNewFuente] = useState<FuenteFinanciamiento>("Recursos Fiscales");
    const [newTipo, setNewTipo] = useState<TipoCuenta>("Cheques (Operativa)");
    const [newRegimen, setNewRegimen] = useState<"Mancomunada" | "Indistinta">("Mancomunada");
    const [newMoneda, setNewMoneda] = useState<"MXN" | "USD">("MXN");

    // Cálculos
    const saldoTotal = cuentas.reduce((acc, curr) => acc + curr.saldo, 0);
    const saldoDisponibleTotal = cuentas.reduce((acc, curr) => acc + curr.saldoDisponible, 0);

    // ... (rest of state stays the same)

    const openDetail = (cuenta: BankAccount) => { setSelectedAccount(cuenta); setShowSensitiveData(false); setIsDetailOpen(true); };
    const openTransactionModal = (type: "Ingreso" | "Egreso") => {
        setTransactionType(type);
        // Reset Standard Form
        setNewAmount("");
        setNewConcept("");
        setNewRef("");

        // Reset Unified Form
        setEgresoFormData({
            cog: "",
            cuentaContable: "",
            pagueseA: "",
            monto: "",
            concepto: "",
            fondo: "",
            fecha: new Date().toISOString().split('T')[0],
            tipo: "Bancario"
        });
        setSelectedCapitulo("");

        setIsTransactionOpen(true);
    };

    const handleEgresoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setEgresoFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleEgresoSelectChange = (name: string, value: string) => {
        setEgresoFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleConfirmTransfer = () => {
        if (!transferOrigin || !transferDest || !transferAmount) return;
        if (transferOrigin === transferDest) return alert("La cuenta origen y destino no pueden ser la misma.");
        const monto = parseFloat(transferAmount);
        if (isNaN(monto) || monto <= 0) return;
        const aliasOrigen = cuentas.find(c => c.id === transferOrigin)?.alias;
        const aliasDestino = cuentas.find(c => c.id === transferDest)?.alias;
        const txOrigen: Transaction = { id: `tr-out-${Date.now()}`, fecha: transferDate, concepto: transferConcept || `TRASPASO A ${aliasDestino}`, referencia: "TRASPASO", monto: monto, tipo: "Egreso", estatus: "Completado" };
        const txDestino: Transaction = { id: `tr-in-${Date.now()}`, fecha: transferDate, concepto: transferConcept || `TRASPASO DE ${aliasOrigen}`, referencia: "TRASPASO", monto: monto, tipo: "Ingreso", estatus: "Completado" };
        const updatedCuentas = cuentas.map(c => {
            if (c.id === transferOrigin) return { ...c, saldo: c.saldo - monto, saldoDisponible: c.saldoDisponible - monto, ultimoMovimiento: transferDate, movimientosRecientes: [txOrigen, ...c.movimientosRecientes] };
            if (c.id === transferDest) return { ...c, saldo: c.saldo + monto, saldoDisponible: c.saldoDisponible + monto, ultimoMovimiento: transferDate, movimientosRecientes: [txDestino, ...c.movimientosRecientes] };
            return c;
        });
        setCuentas(updatedCuentas); addToLog("Traspaso Interno", `Transferencia de $${monto} de ${aliasOrigen} a ${aliasDestino}`, "transfer"); setTransferAmount(""); setTransferConcept(""); setTransferOrigin(""); setTransferDest(""); setIsTransferOpen(false);
    };

    const handleRegisterTransaction = () => {
        if (!selectedAccount) return;

        let montoFloat = 0;
        let conceptoFinal = "";
        let referenciaFinal = "";

        if (transactionType === "Egreso") {
            // Unified Logic
            montoFloat = parseFloat(egresoFormData.monto);
            if (isNaN(montoFloat) || montoFloat <= 0) return alert("Monto inválido");
            conceptoFinal = egresoFormData.concepto;
            referenciaFinal = egresoFormData.cog; // Using COG as Ref for now

            // Create Accounting Record
            const newEgresoContable: any = { // Using any simply to match type structure loosely or I can import type
                id: `egr-${Date.now()}`,
                ...egresoFormData,
                monto: montoFloat,
                institucionBancaria: selectedAccount.banco,
                cuentaBancaria: selectedAccount.numeroCuenta, // Using last 4 digits logic elsewhere but here full number?
                tipo: "Bancario"
            };
            setEgresosContables(prev => [...prev, newEgresoContable]);

        } else {
            // Standard Ingreso Logic
            if (!newAmount) return;
            montoFloat = parseFloat(newAmount);
            if (isNaN(montoFloat)) return;
            conceptoFinal = newConcept || "DEPÓSITO MANUAL";
            referenciaFinal = newRef || "S/R";
        }

        const newTransaction: Transaction = {
            id: `man-${Date.now().toString().slice(-4)}`,
            fecha: transactionType === "Egreso" ? egresoFormData.fecha : new Date().toISOString().split('T')[0],
            concepto: conceptoFinal,
            referencia: referenciaFinal,
            monto: montoFloat,
            tipo: transactionType,
            estatus: "Completado"
        };

        const updatedCuentas = cuentas.map(c => {
            if (c.id === selectedAccount.id) {
                const nuevoSaldo = transactionType === "Ingreso" ? c.saldo + montoFloat : c.saldo - montoFloat;
                return { ...c, saldo: nuevoSaldo, saldoDisponible: nuevoSaldo, ultimoMovimiento: newTransaction.fecha, movimientosRecientes: [newTransaction, ...c.movimientosRecientes] };
            }
            return c;
        });
        setCuentas(updatedCuentas);
        addToLog("Ajuste Manual", `${transactionType} de $${montoFloat} en ${selectedAccount.alias}`, "update");

        const updatedSelected = updatedCuentas.find(c => c.id === selectedAccount.id) || null;
        setSelectedAccount(updatedSelected);
        setIsTransactionOpen(false);
    };

    const resetForm = () => {
        setNewAccountBank("BBVA"); setNewAccountAlias(""); setNewAccountBalance(""); setNewNumCuenta(""); setNewClabe(""); setNewSucursal(""); setNewDireccion(""); setNewEjecutivo(""); setNewTelefono(""); setNewFuente("Recursos Fiscales"); setNewTipo("Cheques (Operativa)"); setNewRegimen("Mancomunada"); setNewMoneda("MXN");
        setEditingAccountId(null);
    }

    const handleEditAccount = (cuenta: BankAccount) => {
        setEditingAccountId(cuenta.id);
        setNewAccountBank(cuenta.banco);
        setNewAccountAlias(cuenta.alias);
        setNewAccountBalance(cuenta.saldo.toString());
        setNewNumCuenta(cuenta.numeroCuenta);
        setNewClabe(cuenta.clabe);
        setNewSucursal(cuenta.sucursal);
        setNewDireccion(cuenta.direccionSucursal);
        setNewEjecutivo(cuenta.ejecutivo);
        setNewTelefono(cuenta.telefonoEjecutivo);
        setNewFuente(cuenta.fuente);
        setNewTipo(cuenta.tipo);
        setNewRegimen(cuenta.regimen || "Mancomunada");
        setNewMoneda(cuenta.moneda || "MXN");
        setIsNewAccountOpen(true);
    };

    const handleSaveAccount = () => {
        const initialBalance = parseFloat(newAccountBalance) || 0;

        if (editingAccountId) {
            // ACTUALIZACIÓN
            const updatedCuentas = cuentas.map(c => {
                if (c.id === editingAccountId) {
                    return {
                        ...c,
                        banco: newAccountBank,
                        alias: newAccountAlias || `${newAccountBank} Editada`,
                        numeroCuenta: newNumCuenta,
                        clabe: newClabe,
                        sucursal: newSucursal,
                        direccionSucursal: newDireccion,
                        ejecutivo: newEjecutivo,
                        telefonoEjecutivo: newTelefono,
                        fuente: newFuente,
                        tipo: newTipo,
                        regimen: newRegimen,
                        moneda: newMoneda,
                        // El saldo no se actualiza directamente al editar, solo por movimientos, 
                        // pero si es lo que el usuario espera al cambiar "Saldo Inicial" podríamos debatirlo.
                        // Generalmente el saldo histórico no se edita así. 
                        // Asumiremos que SOLO edita datos, no el saldo, a menos que sea una corrección de apertura.
                        // Para simplificar, si editamos, NO tocamos saldo/movimientos salvo que sea explícito.
                        // Mantenemos el saldo original para integridad.
                    };
                }
                return c;
            });
            setCuentas(updatedCuentas);
            addToLog("Edición de Cuenta", `Actualización de datos para ${newAccountAlias}`, "update");
        } else {
            // CREACIÓN
            const newAccount: BankAccount = {
                id: `cta-${Date.now()}`,
                banco: newAccountBank,
                alias: newAccountAlias || `${newAccountBank} Nueva`,
                numeroCuenta: newNumCuenta || Math.floor(Math.random() * 10000000000).toString(),
                clabe: newClabe || Math.floor(Math.random() * 100000000000000000).toString(),
                saldo: initialBalance,
                saldoDisponible: initialBalance, // Asumiendo todo disponible al inicio
                tipo: newTipo,
                fuente: newFuente,
                fechaApertura: new Date().toISOString().split('T')[0],
                ultimoMovimiento: initialBalance > 0 ? new Date().toISOString().split('T')[0] : "Sin movs.",
                movimientosRecientes: initialBalance > 0 ? [{ id: "init-001", fecha: new Date().toISOString().split('T')[0], concepto: "SALDO INICIAL", referencia: "APERTURA", monto: initialBalance, tipo: "Ingreso", estatus: "Completado" }] : [],
                sucursal: newSucursal || "Matriz Central",
                direccionSucursal: newDireccion || "Sin registrar",
                ejecutivo: newEjecutivo || "Por Asignar",
                telefonoEjecutivo: newTelefono || "S/N",
                estatus: "Activa",
                regimen: newRegimen,
                moneda: newMoneda
            };
            setCuentas([...cuentas, newAccount]);
            addToLog("Alta de Cuenta", `Vinculación de nueva cuenta ${newAccount.banco} - ${newAccount.alias}`, "create");
        }

        setIsNewAccountOpen(false);
        resetForm();
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 bg-muted/50 min-h-screen">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Bancos y Cuentas</h1>
                    <p className="text-muted-foreground text-sm">Gestión de tesorería y conciliación diaria.</p>
                </div>
                <div className="flex w-full md:w-auto items-center gap-2">
                    <Button variant="outline" onClick={() => setIsLogOpen(true)} className="flex-1 md:flex-none h-9 bg-background shadow-sm border-border">
                        <History className="w-4 h-4 mr-2 text-muted-foreground" /> Bitácora
                    </Button>
                    <Button onClick={() => { resetForm(); setIsNewAccountOpen(true); }} className="flex-1 md:flex-none h-9 shadow-sm">
                        <Plus className="w-4 h-4 mr-2" /> Agregar Cuenta
                    </Button>
                </div>
            </div>

            {/* KPI SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-sm border border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo en Libros</CardTitle>
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight truncate"><Currency amount={saldoTotal} /></div>
                        <p className="text-xs text-muted-foreground mt-1">Total global acumulado</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Disponibilidad Real</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight text-emerald-600 truncate"><Currency amount={saldoDisponibleTotal} /></div>
                        <p className="text-xs text-muted-foreground mt-1">Libre de tránsito</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border border-border bg-muted/50 flex flex-col justify-center items-center p-4">
                    <Button onClick={() => setIsTransferOpen(true)} className="w-full h-full bg-background border border-border text-foreground hover:bg-muted shadow-sm py-4 md:py-0">
                        <ArrowRightLeft className="w-4 h-4 mr-2" /> Registrar Traspaso
                    </Button>
                </Card>
            </div>

            <Separator className="hidden md:block" />

            {/* GRID DE CUENTAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cuentas.map((cuenta) => (
                    <Card key={cuenta.id} className="group cursor-pointer transition-all hover:shadow-md hover:border-border border-border shadow-sm bg-card relative" onClick={() => openDetail(cuenta)}>
                        {/* Dropdown Menu para Edición */}
                        <div className="absolute top-3 right-3 z-20">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditAccount(cuenta); }}>
                                        <Pencil className="mr-2 h-4 w-4" /> Editar Cuenta
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmAccount(cuenta); }}
                                    >
                                        <Trash className="mr-2 h-4 w-4" /> Eliminar Cuenta
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pr-10">
                            <div className="space-y-1 overflow-hidden">
                                <CardTitle className="text-base font-semibold text-foreground truncate">{cuenta.alias}</CardTitle>
                                <CardDescription className="text-xs font-mono">**** {cuenta.numeroCuenta.slice(-4)}</CardDescription>
                            </div>
                            <Badge variant="secondary" className="font-normal text-xs text-muted-foreground bg-muted shrink-0">{cuenta.banco}</Badge>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saldo Disponible</p>
                                <div className="text-2xl font-bold tracking-tight text-foreground truncate"><Currency amount={cuenta.saldoDisponible} /></div>
                            </div>
                            {cuenta.saldo !== cuenta.saldoDisponible && (
                                <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-100 dark:border-amber-900/30">
                                    <span className="text-xs text-amber-700 dark:text-amber-500 font-medium flex items-center gap-1"><History className="w-3 h-3" /> En Tránsito</span>
                                    <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-500"><Currency amount={cuenta.saldo - cuenta.saldoDisponible} /></span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className={`text-[10px] px-2 py-0 h-5 font-normal ${cuenta.fuente === 'Recursos Fiscales' ? 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30' : 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30'}`}>{cuenta.fuente}</Badge>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-0 text-xs text-muted-foreground flex justify-between items-center">
                            <span className="truncate max-w-[150px]">Act: {cuenta.ultimoMovimiento}</span>
                            <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                        </CardFooter>
                    </Card>
                ))}
                <Button variant="ghost" onClick={() => { resetForm(); setIsNewAccountOpen(true); }} className="h-auto min-h-[200px] w-full flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted hover:border-border text-muted-foreground transition-all p-6">
                    <div className="p-3 rounded-full bg-background shadow-sm border border-border"><Plus className="w-6 h-6 text-muted-foreground" /></div>
                    <div className="text-center space-y-1"><p className="font-medium text-foreground">Vincular Nueva Cuenta</p><p className="text-xs text-muted-foreground">Productiva o de Cheques</p></div>
                </Button>
            </div>

            {/* --- MODAL NUEVA/EDITAR CUENTA (STICKY FOOTER FIX + COMPACT) --- */}
            <Dialog open={isNewAccountOpen} onOpenChange={(open) => { setIsNewAccountOpen(open); if (!open) resetForm(); }}>
                <DialogContent className="sm:max-w-[750px] w-[95vw] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                    <DialogHeader className="px-6 py-4 border-b shrink-0 bg-background">
                        <DialogTitle className="text-lg">{editingAccountId ? "Editar Cuenta Bancaria" : "Nueva Cuenta Bancaria"}</DialogTitle>
                        <DialogDescription>{editingAccountId ? "Modificación de datos del contrato." : "Alta de contrato para operación."}</DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 px-6 py-6 bg-muted/20">
                        <div className="space-y-6">

                            {/* 1. Datos Generales */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2 border-b border-border pb-1 mb-3">
                                    <Building2 className="w-3 h-3" /> Datos Generales
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5"><Label className="text-xs">Banco</Label><Select onValueChange={setNewAccountBank} defaultValue={newAccountBank} value={newAccountBank}><SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="BBVA">BBVA</SelectItem><SelectItem value="Banorte">Banorte</SelectItem><SelectItem value="Santander">Santander</SelectItem><SelectItem value="Citibanamex">Citibanamex</SelectItem><SelectItem value="HSBC">HSBC</SelectItem><SelectItem value="Scotiabank">Scotiabank</SelectItem></SelectContent></Select></div>
                                    <div className="space-y-1.5"><Label className="text-xs">Alias Interno</Label><Input value={newAccountAlias} onChange={(e) => setNewAccountAlias(e.target.value)} placeholder="Ej. FISM 2025" className="h-8 text-xs bg-background" /></div>
                                    <div className="space-y-1.5"><Label className="text-xs">Fuente</Label><Select onValueChange={(val: FuenteFinanciamiento) => setNewFuente(val)} defaultValue={newFuente} value={newFuente}><SelectTrigger className="h-8 text-xs bg-background"><SelectValue placeholder="Seleccione Fuente" /></SelectTrigger><SelectContent>{fuentes.map(f => <SelectItem key={f.id} value={f.acronimo}>{f.acronimo} - {f.nombre}</SelectItem>)}</SelectContent></Select></div>
                                    <div className="space-y-1.5"><Label className="text-xs">Tipo</Label><Select onValueChange={(val: TipoCuenta) => setNewTipo(val)} defaultValue={newTipo} value={newTipo}><SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Cheques (Operativa)">Cheques (Operativa)</SelectItem><SelectItem value="Inversión (Productiva)">Inversión (Productiva)</SelectItem><SelectItem value="Nómina">Nómina</SelectItem></SelectContent></Select></div>
                                </div>
                            </div>

                            {/* 2. Identificación */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2 border-b border-border pb-1 mb-3">
                                    <CreditCard className="w-3 h-3" /> Identificación
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5"><Label className="text-xs">Cuenta (10-12 dígitos)</Label><Input value={newNumCuenta} onChange={(e) => setNewNumCuenta(e.target.value)} className="h-8 text-xs font-mono bg-background" placeholder="0000000000" /></div>
                                    <div className="space-y-1.5"><Label className="text-xs">CLABE (18 dígitos)</Label><Input value={newClabe} onChange={(e) => setNewClabe(e.target.value)} className="h-8 text-xs font-mono bg-background" placeholder="000000000000000000" /></div>
                                    <div className="space-y-1.5"><Label className="text-xs">Moneda</Label><Select onValueChange={(val: "MXN" | "USD") => setNewMoneda(val)} defaultValue={newMoneda} value={newMoneda}><SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MXN">Pesos (MXN)</SelectItem><SelectItem value="USD">Dólares (USD)</SelectItem></SelectContent></Select></div>
                                    <div className="space-y-1.5"><Label className="text-xs">Régimen</Label><Select onValueChange={(val: "Mancomunada" | "Indistinta") => setNewRegimen(val)} defaultValue={newRegimen} value={newRegimen}><SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Mancomunada">Mancomunada</SelectItem><SelectItem value="Indistinta">Indistinta</SelectItem></SelectContent></Select></div>
                                </div>
                            </div>

                            {/* 3. Contacto */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2 border-b border-border pb-1 mb-3">
                                    <MapPin className="w-3 h-3" /> Contacto y Sucursal
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5"><Label className="text-xs">Sucursal</Label><Input value={newSucursal} onChange={(e) => setNewSucursal(e.target.value)} className="h-8 text-xs bg-background" placeholder="Nombre de sucursal" /></div>
                                    <div className="space-y-1.5"><Label className="text-xs">Ejecutivo</Label><Input value={newEjecutivo} onChange={(e) => setNewEjecutivo(e.target.value)} className="h-8 text-xs bg-background" placeholder="Nombre completo" /></div>
                                    <div className="space-y-1.5 md:col-span-2"><Label className="text-xs">Dirección</Label><Input value={newDireccion} onChange={(e) => setNewDireccion(e.target.value)} className="h-8 text-xs bg-background" placeholder="Dirección completa de la sucursal" /></div>
                                    <div className="space-y-1.5"><Label className="text-xs">Teléfono</Label><Input value={newTelefono} onChange={(e) => setNewTelefono(e.target.value)} className="h-8 text-xs bg-background" placeholder="(XXX) XXX-XXXX" /></div>
                                </div>
                            </div>

                            {/* 4. Saldo Inicial - SOLO EN CREACIÓN O LECTURA EN EDICIÓN */}
                            <div className="space-y-3 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                                <h3 className="text-xs font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-wide flex items-center gap-2 mb-2">
                                    <DollarSign className="w-3 h-3" /> {editingAccountId ? "Saldo Actual (Solo Lectura)" : "Saldo de Apertura"}
                                </h3>
                                <div className="space-y-1.5">
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-emerald-600 dark:text-emerald-500 font-bold text-xs">$</span>
                                        <Input
                                            value={newAccountBalance}
                                            onChange={(e) => setNewAccountBalance(e.target.value)}
                                            type="number"
                                            disabled={!!editingAccountId} // Deshabilitado en edición
                                            className="h-9 pl-7 font-mono font-bold text-sm border-emerald-200 dark:border-emerald-900 focus-visible:ring-emerald-500 bg-background disabled:opacity-70 disabled:cursor-not-allowed"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-500">
                                        {editingAccountId ? "Realice un movimiento 'Ingreso/Egreso' para ajustar el saldo." : "Se generará un movimiento automático en bitácora."}
                                    </p>
                                </div>
                            </div>

                        </div>
                    </ScrollArea>

                    <DialogFooter className="px-6 py-4 border-t border-border bg-background shrink-0">
                        <Button variant="outline" onClick={() => setIsNewAccountOpen(false)} className="text-xs h-9">Cancelar</Button>
                        <Button onClick={handleSaveAccount} className="text-xs h-9">{editingAccountId ? "Guardar Cambios" : "Registrar Cuenta"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL DETALLE DE CUENTA (TABLA OPTIMIZADA) */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="!w-[95vw] !max-w-[95vw] !h-[95vh] !max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
                    <div className="p-4 md:p-6 border-b border-border bg-background flex flex-col md:flex-row items-start justify-between gap-4 shrink-0">
                        <div className="space-y-1"><DialogTitle className="text-lg md:text-xl font-bold tracking-tight">{selectedAccount?.alias}</DialogTitle><DialogDescription className="flex flex-wrap items-center gap-2 text-xs md:text-sm"><span>{selectedAccount?.banco}</span><span className="text-muted-foreground hidden md:inline">•</span><span className="font-mono text-xs">{selectedAccount?.clabe}</span></DialogDescription></div>
                        <div className="text-left md:text-right"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Saldo Actual</p><div className="text-2xl md:text-3xl font-bold tracking-tight font-mono">{selectedAccount && <Currency amount={selectedAccount.saldo} />}</div></div>
                    </div>
                    <Tabs defaultValue="movimientos" className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-4 md:px-6 border-b border-border bg-muted/40 shrink-0 overflow-x-auto">
                            <TabsList className="bg-transparent p-0 h-11 w-full justify-start rounded-none">
                                <TabsTrigger value="movimientos" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 font-medium">Movimientos</TabsTrigger>
                                <TabsTrigger value="datos" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 font-medium">Datos</TabsTrigger>
                            </TabsList>
                        </div>
                        <div className="flex-1 overflow-auto bg-muted/30 p-4 md:p-6">
                            {/* TABLA SIN SCROLL HORIZONTAL (Columnas colapsan en movil) */}
                            <TabsContent value="movimientos" className="mt-0 h-full space-y-4">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <h3 className="text-sm font-medium text-foreground">Historial Reciente</h3>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <Button onClick={() => openTransactionModal("Ingreso")} size="sm" className="flex-1 md:flex-none h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"><Plus className="w-3.5 h-3.5 mr-1.5" /> Ingreso</Button>
                                        <Button onClick={() => openTransactionModal("Egreso")} size="sm" variant="outline" className="flex-1 md:flex-none h-8 shadow-sm"><TrendingDown className="w-3.5 h-3.5 mr-1.5 text-red-600" /> Egreso</Button>
                                    </div>
                                </div>
                                <Card className="border-border shadow-sm overflow-hidden">
                                    <Table className="w-full">
                                        <TableHeader>
                                            <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                                                <TableHead className="w-[100px] font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Fecha</TableHead>
                                                <TableHead className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Concepto</TableHead>
                                                <TableHead className="w-[120px] font-medium text-muted-foreground text-xs uppercase tracking-wider text-center hidden md:table-cell">Estado</TableHead>
                                                <TableHead className="w-auto text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">Monto</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedAccount?.movimientosRecientes.length === 0 ? (
                                                <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground text-sm">Sin movimientos registrados.</TableCell></TableRow>
                                            ) : (
                                                selectedAccount?.movimientosRecientes.map((mov) => (
                                                    <TableRow key={mov.id} className="hover:bg-muted/50">
                                                        {/* Fecha (Oculta en movil) */}
                                                        <TableCell className="font-mono text-xs text-muted-foreground hidden md:table-cell align-top py-3">{mov.fecha}</TableCell>
                                                        {/* Concepto (Expandido en movil) */}
                                                        <TableCell className="align-top py-3">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-sm font-medium text-foreground leading-tight">{mov.concepto}</span>
                                                                {/* Subtítulos solo en móvil */}
                                                                <div className="flex flex-wrap items-center gap-2 md:hidden">
                                                                    <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1 rounded">{mov.fecha}</span>
                                                                    <span className={`text-[10px] px-1 rounded border ${mov.estatus === "Completado" ? "text-emerald-600 border-emerald-100 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-500" : "text-amber-600 border-amber-100 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-500"}`}>{mov.estatus}</span>
                                                                </div>
                                                                {mov.referencia && <span className="text-[11px] text-muted-foreground font-mono hidden md:block">REF: {mov.referencia}</span>}
                                                            </div>
                                                        </TableCell>
                                                        {/* Estado (Oculto en movil) */}
                                                        <TableCell className="text-center hidden md:table-cell align-top py-3"><Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-muted text-muted-foreground font-normal">{mov.estatus}</Badge></TableCell>
                                                        {/* Monto */}
                                                        <TableCell className="text-right align-top py-3">
                                                            <span className={`font-mono text-sm font-bold ${mov.tipo === 'Ingreso' ? 'text-emerald-600 dark:text-emerald-500' : 'text-foreground'}`}>
                                                                {mov.tipo === 'Egreso' ? '-' : '+'} <Currency amount={mov.monto} />
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </Card>
                            </TabsContent>

                            {/* (Contenido de Datos se mantiene igual que la versión anterior) */}
                            <TabsContent value="datos" className="mt-0 h-full">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                                    <Card className="shadow-sm border-border">
                                        <CardHeader className="pb-3 border-b border-border bg-muted/50"><CardTitle className="text-sm font-bold flex items-center gap-2"><CreditCard className="w-4 h-4 text-blue-600" /> Identificación Bancaria</CardTitle></CardHeader>
                                        <CardContent className="pt-4 space-y-4">
                                            <div className="space-y-1"><Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Número de Cuenta</Label><div className="flex items-center gap-2"><code className="flex-1 p-2 bg-muted border border-border rounded text-sm text-foreground overflow-hidden">{showSensitiveData ? selectedAccount?.numeroCuenta : `•••• ${selectedAccount?.numeroCuenta.slice(-4)}`}</code><Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setShowSensitiveData(!showSensitiveData)}>{showSensitiveData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Button></div></div>
                                            <div className="space-y-1"><Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">CLABE Interbancaria</Label><code className="block w-full p-2 bg-muted border border-border rounded text-sm text-foreground overflow-hidden">{showSensitiveData ? selectedAccount?.clabe : `•••• •••• •••• ${selectedAccount?.clabe.slice(-4)}`}</code></div>
                                        </CardContent>
                                    </Card>
                                    <Card className="shadow-sm border-border">
                                        <CardHeader className="pb-3 border-b border-border bg-muted/50"><CardTitle className="text-sm font-bold flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" /> Clasificación</CardTitle></CardHeader>
                                        <CardContent className="pt-4 space-y-4">
                                            <div className="space-y-1"><Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Fuente de Financiamiento</Label><div className="p-2 bg-background border border-border rounded text-sm font-medium text-foreground">{selectedAccount?.fuente}</div></div>
                                            <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Sucursal</Label><div className="text-sm font-medium text-foreground">{selectedAccount?.sucursal}</div></div><div className="space-y-1"><Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Ejecutivo</Label><div className="text-sm font-medium text-foreground">{selectedAccount?.ejecutivo}</div></div></div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </div>
                        <div className="p-4 border-t border-border bg-background flex justify-end gap-2 shrink-0"><Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button></div>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* MODAL TRASPASO */}
            <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                <DialogContent className="sm:max-w-[500px] w-[95vw]">
                    <DialogHeader><DialogTitle>Traspaso entre Cuentas</DialogTitle><DialogDescription>Movimiento interno de fondos.</DialogDescription></DialogHeader>
                    <div className="grid gap-4 py-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-xs font-semibold">Origen</Label><Select onValueChange={setTransferOrigin} value={transferOrigin}><SelectTrigger className="bg-background"><SelectValue placeholder="Seleccione..." /></SelectTrigger><SelectContent>{cuentas.filter(c => c.id !== transferDest).map(c => <SelectItem key={c.id} value={c.id}>{c.alias}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label className="text-xs font-semibold">Destino</Label><Select onValueChange={setTransferDest} value={transferDest}><SelectTrigger className="bg-background"><SelectValue placeholder="Seleccione..." /></SelectTrigger><SelectContent>{cuentas.filter(c => c.id !== transferOrigin).map(c => <SelectItem key={c.id} value={c.id}>{c.alias}</SelectItem>)}</SelectContent></Select></div></div><div className="space-y-2"><Label>Monto</Label><div className="relative"><DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} type="number" className="pl-9 font-mono font-bold" placeholder="0.00" /></div></div><div className="space-y-2"><Label>Concepto</Label><Input value={transferConcept} onChange={(e) => setTransferConcept(e.target.value)} placeholder="Motivo del traspaso" /></div></div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsTransferOpen(false)}>Cancelar</Button><Button onClick={handleConfirmTransfer}>Confirmar</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL TRANSACTION */}
            <Dialog open={isTransactionOpen} onOpenChange={setIsTransactionOpen}>
                <DialogContent className={transactionType === 'Egreso' ? "sm:max-w-[650px] w-[95vw]" : "sm:max-w-[425px] w-[95vw]"}>
                    <DialogHeader><DialogTitle>{transactionType === 'Ingreso' ? "Registrar Ingreso" : "Registrar Egreso"}</DialogTitle><DialogDescription>Movimiento manual para <strong>{selectedAccount?.alias}</strong>.</DialogDescription></DialogHeader>

                    {transactionType === 'Egreso' ? (
                        <EgresoFormFields
                            formData={egresoFormData}
                            handleChange={handleEgresoChange}
                            handleSelectChange={handleEgresoSelectChange}
                            presupuesto={presupuesto}
                            fuentes={fuentes}
                            selectedCapitulo={selectedCapitulo}
                            setSelectedCapitulo={setSelectedCapitulo}
                        />
                    ) : (
                        <div className="py-4 space-y-4"><div className="space-y-2"><Label>Monto</Label><div className="relative"><span className="absolute left-3 top-2.5 text-lg font-bold text-muted-foreground">$</span><Input value={newAmount} onChange={(e) => setNewAmount(e.target.value)} type="number" className="pl-8 text-2xl font-bold font-mono h-14" placeholder="0.00" autoFocus /></div></div><div className="space-y-2"><Label>Concepto</Label><Input value={newConcept} onChange={(e) => setNewConcept(e.target.value)} /></div></div>
                    )}

                    <DialogFooter><Button variant="outline" onClick={() => setIsTransactionOpen(false)}>Cancelar</Button><Button onClick={handleRegisterTransaction} className={transactionType === 'Ingreso' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800 text-white'}>{transactionType === 'Ingreso' ? 'Registrar' : 'Guardar Póliza'}</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL BITÁCORA */}
            <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><FileClock className="w-5 h-5 text-muted-foreground" /> Bitácora de Operaciones</DialogTitle><DialogDescription>Registro de actividad y movimientos del sistema.</DialogDescription></DialogHeader>
                    <ScrollArea className="flex-1 pr-4 mt-4">
                        <div className="space-y-4">
                            {systemLog.map((log) => (
                                <div key={log.id} className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${log.type === 'create' ? 'bg-emerald-500' : log.type === 'transfer' ? 'bg-blue-500' : log.type === 'alert' ? 'bg-amber-500' : 'bg-muted-foreground'}`} />
                                    <div className="space-y-1 flex-1">
                                        <div className="flex justify-between items-start"><p className="text-sm font-medium text-foreground leading-none">{log.action}</p><span className="text-[10px] text-muted-foreground">{log.timestamp}</span></div>
                                        <p className="text-xs text-muted-foreground">{log.details}</p>
                                        <div className="flex items-center gap-1 mt-1"><User className="w-3 h-3 text-muted-foreground" /><span className="text-[10px] font-medium text-muted-foreground">{log.user}</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* MODAL CONFIRMACIÓN ELIMINAR CUENTA */}
            <Dialog open={!!deleteConfirmAccount} onOpenChange={(open) => !open && setDeleteConfirmAccount(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash className="w-5 h-5" /> Eliminar Cuenta
                        </DialogTitle>
                        <DialogDescription>
                            Esta acción no se puede deshacer. Todos los movimientos asociados serán eliminados.
                        </DialogDescription>
                    </DialogHeader>

                    {deleteConfirmAccount && (
                        <div className="py-4">
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4 space-y-2">
                                <p className="text-sm font-semibold text-red-900 dark:text-red-400">
                                    {deleteConfirmAccount.alias}
                                </p>
                                <p className="text-xs text-red-700 dark:text-red-500">
                                    {deleteConfirmAccount.banco} • {deleteConfirmAccount.numeroCuenta}
                                </p>
                                <div className="pt-2 border-t border-red-200 dark:border-red-900/30">
                                    <p className="text-xs text-red-600 dark:text-red-400">
                                        Saldo actual: <span className="font-mono font-bold"><Currency amount={deleteConfirmAccount.saldo} /></span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmAccount(null)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (deleteConfirmAccount) {
                                    setCuentas(prev => prev.filter(c => c.id !== deleteConfirmAccount.id));
                                    addToLog('Cuenta Eliminada', `Se eliminó la cuenta ${deleteConfirmAccount.alias}`, 'delete');
                                    setDeleteConfirmAccount(null);
                                }
                            }}
                        >
                            <Trash className="w-4 h-4 mr-2" />
                            Eliminar Permanentemente
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}