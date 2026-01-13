"use client"

import React, { useState, useMemo } from "react"
import {
    FileDown, Printer, Filter, Calendar as CalendarIcon,
    Search, ArrowDownCircle, ArrowUpCircle, AlertCircle
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useTreasury, Transaction } from "@/components/providers/treasury-context"

const Currency = ({ amount }: { amount: number }) => (
    <span className="font-mono tracking-tight">
        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)}
    </span>
);

export default function BankMovementsReport() {
    const { cuentas } = useTreasury();
    const [filterAccount, setFilterAccount] = useState("all");
    const [filterFuente, setFilterFuente] = useState("todas");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // --- 1. AGREGAR Y APLANAR MOVIMIENTOS ---
    const allMovements = useMemo(() => {
        return cuentas.flatMap(account =>
            account.movimientosRecientes.map(mov => ({
                ...mov,
                bankName: account.banco,
                bankAlias: account.alias,
                accountFuente: account.fuente,
                // Calculamos saldo simulado (esto idealmente vendría del backend con running balance)
                // Para efectos visuales, usaremos el saldo actual de la cuenta para el último movimiento y restaremos hacia atrás, o simplemente mostramos el saldo de la cuenta asociada.
                // Por simplicidad en este reporte acumulado, mostraremos el monto de la operación.
            }))
        ).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()); // Ordenar por fecha descendente
    }, [cuentas]);

    // --- 2. FILTRADO ---
    const filteredMovements = useMemo(() => {
        return allMovements.filter(mov => {
            // Filtro por Cuenta
            if (filterAccount !== "all" && mov.bankAlias !== filterAccount && mov.bankName !== filterAccount) {
                // Permitimos filtrar por alias exacto o nombre de banco (simplificación)
                // Mejor usamos ID si pudiéramos, pero el Select usa values arbitrarios.
                // Ajustemos el Select para usar IDs de cuentas reales.
                return false;
            }
            if (filterAccount !== "all" && !cuentas.find(c => c.id === filterAccount)?.movimientosRecientes.some(m => m.id === mov.id)) return false;

            // Filtro por Fuente
            if (filterFuente !== "todas" && mov.accountFuente !== filterFuente) return false;

            // Filtro por Fecha
            if (startDate && new Date(mov.fecha) < new Date(startDate)) return false;
            if (endDate && new Date(mov.fecha) > new Date(endDate)) return false;

            return true;
        });
    }, [allMovements, filterAccount, filterFuente, startDate, endDate, cuentas]);

    // --- 3. CÁLCULO DE KPIS ---
    const totalIngresos = filteredMovements.filter(m => m.tipo === "Ingreso").reduce((acc, curr) => acc + curr.monto, 0);
    const totalEgresos = filteredMovements.filter(m => m.tipo === "Egreso").reduce((acc, curr) => acc + curr.monto, 0);
    // Saldo Inicial es difícil de calcular sin un snapshot histórico. 
    // Usaremos el sumatorio de las cuentas filtradas como proxy del "Saldo Actual en Libros"
    const saldoActualGlobal = cuentas
        .filter(c => filterAccount === "all" || c.id === filterAccount)
        .filter(c => filterFuente === "todas" || c.fuente === filterFuente)
        .reduce((acc, curr) => acc + curr.saldo, 0);


    // --- FUNCIÓN 1: EXPORTAR A EXCEL (CSV) ---
    const handleExportExcel = () => {
        const headers = ["Fecha", "ID Movimiento", "Banco", "Tipo", "Concepto/Beneficiario", "Referencia", "Fuente", "Ingreso", "Egreso", "Estatus"];

        const rows = filteredMovements.map(m => [
            m.fecha,
            m.id,
            m.bankAlias,
            m.tipo,
            `"${m.concepto}"`,
            m.referencia,
            m.accountFuente,
            m.tipo === "Ingreso" ? m.monto : 0,
            m.tipo === "Egreso" ? m.monto : 0,
            m.estatus
        ]);

        const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Auxiliar_Bancos_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => { window.print(); };

    return (
        <div className="space-y-6 p-2 md:p-6 bg-muted/50 min-h-screen printable-container">

            {/* ESTILOS IMPRESIÓN */}
            <style jsx global>{`
                @media print {
                  aside, header, .no-print { display: none !important; }
                  .printable-container { padding: 0 !important; background: white !important; margin: 0 !important; }
                  .shadow-sm, .shadow-md { box-shadow: none !important; border: 1px solid #ddd !important; }
                  table { width: 100% !important; font-size: 10px !important; }
                  @page { size: landscape; margin: 1cm; }
                }
            `}</style>

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Auxiliar de Bancos</h1>
                    <p className="text-muted-foreground">Reporte detallado de movimientos para Cuenta Pública y Auditoría ORFIS.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handlePrint} variant="outline" className="bg-background gap-2 text-foreground border-border hover:bg-muted">
                        <Printer className="w-4 h-4" /> Imprimir Auxiliar
                    </Button>
                    <Button onClick={handleExportExcel} className="bg-primary text-primary-foreground shadow-md gap-2 hover:bg-primary/90">
                        <FileDown className="w-4 h-4" /> Exportar Excel (LGCG)
                    </Button>
                </div>
            </div>

            {/* FILTROS */}
            <Card className="border-none shadow-sm no-print bg-card">
                <CardContent className="p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase">Cuenta Bancaria</Label>
                            <Select value={filterAccount} onValueChange={setFilterAccount}>
                                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Todas las Cuentas" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las Cuentas</SelectItem>
                                    {cuentas.map(c => <SelectItem key={c.id} value={c.id}>{c.banco} - {c.alias}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase">Periodo</Label>
                            <div className="flex items-center gap-2">
                                <Input type="date" className="bg-background border-border" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                <span className="text-muted-foreground">-</span>
                                <Input type="date" className="bg-background border-border" value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase">Fuente Financiamiento</Label>
                            <Select value={filterFuente} onValueChange={setFilterFuente}>
                                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Cualquiera" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todas">Todas</SelectItem>
                                    <SelectItem value="Recursos Fiscales">Recursos Fiscales</SelectItem>
                                    <SelectItem value="FISM-DF">FISM-DF</SelectItem>
                                    <SelectItem value="FORTAMUN">FORTAMUN</SelectItem>
                                    <SelectItem value="Ingresos Propios">Ingresos Propios</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button className="w-full bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300" onClick={() => { setFilterAccount("all"); setFilterFuente("todas"); setStartDate(""); setEndDate(""); }}>
                                <Filter className="w-4 h-4 mr-2" /> Limpiar Filtros
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500 bg-card shadow-sm border-y border-r border-border">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div><p className="text-xs text-muted-foreground font-semibold uppercase">Saldo Actual (Global)</p><p className="text-xl font-bold font-mono text-foreground"><Currency amount={saldoActualGlobal} /></p></div>
                        <div className="h-8 w-8 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 no-print"><Filter className="w-4 h-4" /></div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-emerald-500 bg-card shadow-sm border-y border-r border-border">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div><p className="text-xs text-muted-foreground font-semibold uppercase">Total Ingresos (Filtrado)</p><p className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-500">+ <Currency amount={totalIngresos} /></p></div>
                        <div className="h-8 w-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 no-print"><ArrowDownCircle className="w-4 h-4" /></div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500 bg-card shadow-sm border-y border-r border-border">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div><p className="text-xs text-muted-foreground font-semibold uppercase">Total Egresos (Filtrado)</p><p className="text-xl font-bold font-mono text-red-700 dark:text-red-500">- <Currency amount={totalEgresos} /></p></div>
                        <div className="h-8 w-8 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 no-print"><ArrowUpCircle className="w-4 h-4" /></div>
                    </CardContent>
                </Card>
            </div>

            {/* TABLA */}
            <Card className="overflow-hidden shadow-md border-border">
                <CardHeader className="bg-muted/50 border-b border-border py-4">
                    <div className="flex justify-between items-center">
                        <div><CardTitle className="text-lg">Detalle de Movimientos</CardTitle><CardDescription>Mostrando {filteredMovements.length} operaciones.</CardDescription></div>
                        <Badge variant="outline" className="bg-card">Moneda: MXN</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow className="bg-muted hover:bg-muted">
                                    <TableHead className="w-[100px] text-xs font-bold text-muted-foreground uppercase">Fecha</TableHead>
                                    <TableHead className="w-[120px] text-xs font-bold text-muted-foreground uppercase">Banco / ID</TableHead>
                                    <TableHead className="text-xs font-bold text-muted-foreground uppercase min-w-[300px]">Beneficiario / Concepto</TableHead>
                                    <TableHead className="w-[120px] text-xs font-bold text-muted-foreground uppercase">Fuente</TableHead>
                                    <TableHead className="text-right text-xs font-bold text-emerald-700 dark:text-emerald-500 uppercase">Ingresos</TableHead>
                                    <TableHead className="text-right text-xs font-bold text-red-700 dark:text-red-500 uppercase">Egresos</TableHead>
                                    <TableHead className="text-center text-xs font-bold text-foreground uppercase">Estatus</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMovements.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No se encontraron movimientos para los filtros seleccionados.</TableCell></TableRow>
                                ) : (
                                    filteredMovements.map((mov) => (
                                        <TableRow key={mov.id} className="hover:bg-muted/50 group text-xs md:text-sm border-b border-border">
                                            <TableCell className="font-mono text-muted-foreground align-top py-3">{mov.fecha}</TableCell>
                                            <TableCell className="align-top py-3">
                                                <div className="font-bold text-blue-700 dark:text-blue-400">{mov.bankAlias}</div>
                                                <div className="text-[10px] text-muted-foreground font-mono">{mov.id}</div>
                                            </TableCell>
                                            <TableCell className="align-top py-3">
                                                <div className="font-bold text-foreground">{mov.concepto}</div>
                                                <div className="text-muted-foreground mt-1 text-[11px] leading-tight">REF: {mov.referencia}</div>
                                            </TableCell>
                                            <TableCell className="align-top py-3"><Badge variant="secondary" className="font-normal bg-muted text-muted-foreground whitespace-nowrap text-[10px]">{mov.accountFuente}</Badge></TableCell>
                                            <TableCell className="text-right font-mono font-bold text-emerald-700 dark:text-emerald-500 align-top py-3">{mov.tipo === 'Ingreso' ? <Currency amount={mov.monto} /> : "-"}</TableCell>
                                            <TableCell className="text-right font-mono font-bold text-red-700 dark:text-red-500 align-top py-3">{mov.tipo === 'Egreso' ? <Currency amount={mov.monto} /> : "-"}</TableCell>
                                            <TableCell className="text-center align-top py-3">
                                                <Badge variant="outline" className={`text-[10px] ${mov.estatus === 'Completado' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-500' : 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-500'}`}>
                                                    {mov.estatus}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/50 border-t border-border p-4 flex justify-between items-center text-xs text-muted-foreground">
                    <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /><span>Los movimientos en tránsito no afectan el saldo disponible contable hasta su conciliación.</span></div>
                    <div className="font-mono">Total Registros: {filteredMovements.length}</div>
                </CardFooter>
            </Card>
        </div>
    )
}