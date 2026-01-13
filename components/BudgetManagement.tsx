"use client"

import React, { useState } from "react"
import {
  ArrowRightLeft, AlertCircle, MoreVertical, Filter,
  ChevronDown, ChevronRight, Wallet, Printer, FileText, PlusCircle
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert } from "@/components/ui/alert"

import { useTreasury, PresupuestoItem } from "@/components/providers/treasury-context"

const Currency = ({ amount, className }: { amount: number, className?: string }) => (
  <span className={`font-mono tracking-tight font-bold ${className}`}>
    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(amount)}
  </span>
);

export default function BudgetManagement() {
  const { presupuesto, addPresupuestoItem, fuentes, config, firmantes } = useTreasury()
  const [data, setData] = useState<PresupuestoItem[]>(presupuesto);

  // Sync state with context if context changes
  React.useEffect(() => {
    setData(presupuesto)
  }, [presupuesto])

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // NEW ITEM MODAL STATE
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemType, setNewItemType] = useState<"Capitulo" | "Partida">("Partida");
  const [newItemCode, setNewItemCode] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemMonto, setNewItemMonto] = useState("");
  const [newItemFuente, setNewItemFuente] = useState("");
  const [newItemParent, setNewItemParent] = useState("");

  const handleAddBudget = () => {
    if (!newItemCode || !newItemDesc || !newItemMonto || !newItemFuente) return alert("Complete todos los campos");

    // For Partida, parent is required
    if (newItemType === "Partida" && !newItemParent) return alert("Seleccione un Capítulo Padre");

    const amount = parseFloat(newItemMonto);
    if (isNaN(amount)) return;

    const newItem: PresupuestoItem = {
      codigo: newItemCode,
      descripcion: newItemDesc,
      nivel: newItemType === "Partida" ? "Concepto" : "Capitulo", // Using "Concepto" as generic term for Partida/Concepto level in this context
      fuenteFinanciamiento: newItemFuente,
      aprobado: amount,
      modificado: amount,
      devengado: 0,
      pagado: 0,
      subcuentas: [],
      isExpanded: false
    };

    addPresupuestoItem(newItem, newItemType === "Partida" ? newItemParent : undefined);

    // Reset and Close
    setNewItemCode(""); setNewItemDesc(""); setNewItemMonto(""); setIsAddModalOpen(false);
  };

  // Toggle para expandir/colapsar filas
  const toggleRow = (codigo: string) => {
    setData(prevData => prevData.map(item =>
      item.codigo === codigo ? { ...item, isExpanded: !item.isExpanded } : item
    ));
  };

  // Cálculos Globales
  const totalAprobado = data.reduce((acc, curr) => acc + curr.aprobado, 0);
  const totalModificado = data.reduce((acc, curr) => acc + curr.modificado, 0);
  const totalEjercido = data.reduce((acc, curr) => acc + curr.devengado, 0);
  const porcentajeAvance = totalModificado > 0 ? (totalEjercido / totalModificado) * 100 : 0;
  const disponible = totalModificado - totalEjercido;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 p-2 md:p-6 bg-muted/50 min-h-screen">

      {/* INJECT PRINT STYLES FOR FULL PAGE AND RESET */}
      <style type="text/css" media="print">
        {`
          @media print {
            @page { 
              size: landscape; 
              margin: 10mm; 
            }
            
            /* OCULTAR TODO el cuerpo original, pero permitiendo que el contenido fluya */
            body {
              visibility: hidden;
              background-color: white !important;
              height: auto !important;
              width: 100% !important;
              overflow: visible !important;
            }

            /* MOSTRAR solo el reporte */
            #printable-section {
              visibility: visible !important;
              display: block !important;
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              width: 100vw !important;
              min-height: 100vh !important;
              background: white !important;
              z-index: 99999 !important;
              margin: 0 !important;
              padding: 10px !important;
            }

            /* Asegurar que los hijos también se vean */
            #printable-section * {
              visibility: visible !important;
            }

            /* Estilos de tabla para que no se rompa feo */
            table {
              width: 100% !important;
              table-layout: fixed !important;
              border-collapse: collapse !important;
            }
            
            tr {
              page-break-inside: avoid !important;
            }

            td, th {
                font-size: 8px !important;
                padding: 2px !important;
                white-space: normal !important;
            }

            /* Esconder elementos de la interfaz del modal */
            [role="dialog"] {
              box-shadow: none !important;
              border: none !important;
              position: static !important;
              transform: none !important;
            }
            
            .dialog-close, button, [aria-label="Close"] {
              display: none !important;
            }
          }
        `}
      </style>

      {/* HEADER (Oculto al imprimir) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Presupuesto de Egresos 2024</h1>
          <p className="text-muted-foreground">Control Presupuestal por Objeto del Gasto (COG)</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <PlusCircle className="w-4 h-4 mr-2" /> Agregar
          </Button>
          <Button variant="outline" className="gap-2 bg-background border-border hover:bg-accent text-foreground" onClick={() => setIsReportOpen(true)}>
            <FileText className="w-4 h-4" /> Reporte CONAC
          </Button>
          <Button onClick={() => setIsTransferModalOpen(true)} className="bg-primary shadow-md hover:bg-primary/90 text-primary-foreground">
            <ArrowRightLeft className="w-4 h-4 mr-2" /> Adecuación / Traspaso
          </Button>
        </div>
      </div>

      {/* KPI CARDS (Oculto al imprimir) */}
      <div className="grid gap-4 md:grid-cols-4 print:hidden">
        <Card className="bg-card shadow-sm border-l-4 border-l-slate-800 dark:border-l-slate-400">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Presupuesto Modificado</CardDescription>
            <CardTitle className="text-3xl font-bold font-mono tracking-tight text-foreground"><Currency amount={totalModificado} /></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground font-medium">Inicial: <Currency amount={totalAprobado} className="text-muted-foreground font-normal" /></div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-l-4 border-l-blue-600 dark:border-l-blue-500">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Devengado (Ejercido)</CardDescription>
            <CardTitle className="text-3xl font-bold font-mono tracking-tight text-blue-700 dark:text-blue-400"><Currency amount={totalEjercido} /></CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={porcentajeAvance} className="h-2 bg-blue-100 dark:bg-blue-900" />
            <div className="mt-1 text-xs text-blue-700 dark:text-blue-400 font-medium">{porcentajeAvance.toFixed(1)}% Ejercido</div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-l-4 border-l-emerald-500 dark:border-l-emerald-400">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Disponible para Gastar</CardDescription>
            <CardTitle className="text-3xl font-bold font-mono tracking-tight text-emerald-700 dark:text-emerald-400"><Currency amount={disponible} /></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
              <Wallet className="w-3 h-3" /> Suficiencia Líquida
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-l-4 border-l-amber-500 dark:border-l-amber-400">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pagado</CardDescription>
            <CardTitle className="text-3xl font-bold font-mono tracking-tight text-amber-700 dark:text-amber-400">
              <Currency amount={data.reduce((acc, curr) => acc + curr.pagado, 0)} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground font-medium">Cuentas por Pagar: <Currency amount={totalEjercido - data.reduce((acc, curr) => acc + curr.pagado, 0)} className="text-amber-600 dark:text-amber-500 font-normal" /></div>
          </CardContent>
        </Card>
      </div>

      {/* TABLA MAESTRA UI (Oculta al imprimir) */}
      <Card className="min-h-[500px] print:hidden shadow-sm border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-bold text-foreground">Desglose por Capítulos y Partidas</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs"><Filter className="w-3.5 h-3.5" /> Fuente</Button>
            <div className="relative">
              <Input placeholder="Buscar partida..." className="h-8 w-[200px] text-xs" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[100px] text-xs font-bold uppercase tracking-wider text-muted-foreground">COG</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descripción</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fuente (Origen)</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Modificado</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Devengado</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Disponible</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">%</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((capitulo) => {
                const disponibleCap = capitulo.modificado - capitulo.devengado;
                const percentCap = capitulo.modificado > 0 ? (capitulo.devengado / capitulo.modificado) * 100 : 0;

                return (
                  <React.Fragment key={capitulo.codigo}>
                    {/* FILA CAPÍTULO */}
                    <TableRow className="bg-card hover:bg-muted/50 border-b border-border">
                      <TableCell>
                        {capitulo.subcuentas && capitulo.subcuentas.length > 0 && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => toggleRow(capitulo.codigo)}>
                            {capitulo.isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-foreground">{capitulo.codigo}</TableCell>
                      <TableCell className="font-bold text-foreground">{capitulo.descripcion}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] font-normal bg-muted text-muted-foreground">{capitulo.fuenteFinanciamiento}</Badge>
                      </TableCell>
                      <TableCell className="text-right"><Currency amount={capitulo.modificado} className="text-foreground" /></TableCell>
                      <TableCell className="text-right text-blue-700 dark:text-blue-400"><Currency amount={capitulo.devengado} /></TableCell>
                      <TableCell className="text-right text-emerald-700 dark:text-emerald-400"><Currency amount={disponibleCap} /></TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={`font-mono ${percentCap > 90 ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900' : 'bg-muted text-muted-foreground'}`}>
                          {percentCap.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="w-3 h-3 text-muted-foreground" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent><DropdownMenuItem>Ver Auxiliar</DropdownMenuItem></DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>

                    {/* NIVEL 2 Y 3 (EXPANSIÓN) */}
                    {capitulo.isExpanded && capitulo.subcuentas?.map((concepto) => (
                      <React.Fragment key={concepto.codigo}>
                        <TableRow className="bg-muted/30 hover:bg-muted/50 border-b border-border text-sm">
                          <TableCell></TableCell>
                          <TableCell className="pl-4 font-mono text-muted-foreground text-xs">{concepto.codigo}</TableCell>
                          <TableCell className="pl-8 text-foreground">{concepto.descripcion}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{concepto.fuenteFinanciamiento}</TableCell>
                          <TableCell className="text-right"><Currency amount={concepto.modificado} className="text-muted-foreground text-xs" /></TableCell>
                          <TableCell className="text-right"><Currency amount={concepto.devengado} className="text-muted-foreground text-xs" /></TableCell>
                          <TableCell className="text-right"><Currency amount={concepto.modificado - concepto.devengado} className="text-muted-foreground text-xs" /></TableCell>
                          <TableCell className="text-right font-mono text-xs text-muted-foreground">
                            {concepto.modificado > 0 ? ((concepto.devengado / concepto.modificado) * 100).toFixed(0) : 0}%
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ==================================================================================== */}
      {/* MODAL: REPORTE CONAC (FULL WIDTH, HEIGHT & TITLES)                                  */}
      {/* ==================================================================================== */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        {/*
          IMPORTANTE:
          - Usamos clases 'print:!...' para SOBREESCRIBIR los estilos por defecto del Dialog.
          - 'print:!fixed print:!left-0 print:!top-0' coloca el modal en la esquina de la hoja.
          - 'print:!transform-none' evita que el modal se intente centrar.
        */}
        <DialogContent className="
          !max-w-[98vw] !w-[98vw] !h-[98vh] flex flex-col p-0 overflow-hidden sm:rounded-lg
          print:!fixed print:!left-0 print:!top-0 print:!transform-none print:!translate-x-0 print:!translate-y-0
          print:!w-screen print:!h-screen print:!max-w-none print:!m-0 print:!p-0 print:!border-none print:!shadow-none
          print:!overflow-visible
        ">

          {/* Header del Modal (NO IMPRIMIBLE) */}
          <DialogHeader className="px-6 py-4 border-b bg-muted/50 shrink-0 print:hidden dialog-header">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
              <FileText className="w-5 h-5 text-muted-foreground" />
              Vista Previa: Reporte CONAC
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Formato LGCG para impresión en hoja Oficio/Carta Horizontal.
            </DialogDescription>
          </DialogHeader>

          {/* CUERPO DEL DOCUMENTO */}
          {/* 'print:block print:fixed print:inset-0' -> Hace que al imprimir, esto ocupe TODA la hoja */}
          <div className="flex-1 overflow-auto bg-muted/20 p-4 block print:p-0 print:bg-white print:block print:fixed print:inset-0 print:z-50 print:h-auto print:overflow-visible">

            {/* HOJA DE PAPEL SIMULADA (Ahora w-full y min-h-full) */}
            <div className="bg-white min-h-full w-full shadow-lg p-10 text-black print:shadow-none print:w-full print:h-full print:p-4" id="printable-section">

              {/* 1. ENCABEZADO OFICIAL CON LOGOS */}
              <div className="flex justify-between items-start mb-6 font-sans">
                {/* LOGO IZQUIERDO */}
                <div className="w-[150px] h-[80px] flex items-center justify-center shrink-0">
                  {config.logoLeft && <img src={config.logoLeft} alt="Logo" className="max-w-full max-h-full object-contain" />}
                </div>

                {/* TEXTO CENTRAL */}
                <div className="text-center flex-1 px-4">
                  <h2 className="font-bold text-xl uppercase tracking-wider text-black">Municipio de Tepetlán, Ver.</h2>
                  <h3 className="font-bold text-lg uppercase mt-2 border-b-2 border-black inline-block pb-1">Estado Analítico del Ejercicio del Presupuesto de Egresos</h3>
                  <p className="text-sm mt-2 font-semibold">Clasificación por Objeto del Gasto (Capítulo y Concepto)</p>
                  <p className="text-sm font-medium">Del 1 de Enero al 30 de Septiembre de 2025</p>
                  <p className="text-[10px] text-right mt-2 italic">(Cifras en Pesos)</p>
                </div>

                {/* LOGO DERECHO */}
                <div className="w-[150px] h-[80px] flex items-center justify-center shrink-0">
                  {config.logoRight && <img src={config.logoRight} alt="Logo" className="max-w-full max-h-full object-contain" />}
                </div>
              </div>

              {/* 2. TABLA LEGAL ESTRICTA */}
              <div className="border border-black">
                <table className="w-full text-[10px] border-collapse table-fixed">
                  <thead>
                    <tr className="bg-gray-100 text-black border-b border-black">
                      <th className="py-2 px-1 text-left w-[35%] border-r border-black font-bold uppercase">Concepto</th>
                      <th className="py-2 px-1 text-center w-[10%] border-r border-black font-bold uppercase">Aprobado</th>
                      <th className="py-2 px-1 text-center w-[11%] border-r border-black font-bold uppercase">Ampliaciones / <br />(Reducciones)</th>
                      <th className="py-2 px-1 text-center w-[11%] border-r border-black font-bold uppercase">Modificado</th>
                      <th className="py-2 px-1 text-center w-[11%] border-r border-black font-bold uppercase">Devengado</th>
                      <th className="py-2 px-1 text-center w-[11%] border-r border-black font-bold uppercase">Pagado</th>
                      <th className="py-2 px-1 text-center w-[11%] font-bold uppercase">Subejercicio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((cap) => {
                      const ampRed = cap.modificado - cap.aprobado;
                      const subejercicio = cap.modificado - cap.devengado;

                      return (
                        <React.Fragment key={cap.codigo}>
                          {/* CAPITULO (NEGRITAS Y GRIS) */}
                          <tr className="border-b border-black bg-gray-50/50 break-inside-avoid">
                            <td className="py-2 px-2 font-bold border-r border-black text-left align-middle">{cap.codigo} {cap.descripcion}</td>
                            <td className="py-2 px-2 font-bold border-r border-black text-right align-middle"><Currency amount={cap.aprobado} /></td>
                            <td className="py-2 px-2 font-bold border-r border-black text-right align-middle"><Currency amount={ampRed} /></td>
                            <td className="py-2 px-2 font-bold border-r border-black text-right align-middle"><Currency amount={cap.modificado} /></td>
                            <td className="py-2 px-2 font-bold border-r border-black text-right align-middle"><Currency amount={cap.devengado} /></td>
                            <td className="py-2 px-2 font-bold border-r border-black text-right align-middle"><Currency amount={cap.pagado} /></td>
                            <td className="py-2 px-2 font-bold text-right align-middle"><Currency amount={subejercicio} /></td>
                          </tr>
                          {/* CONCEPTOS (Indentados) */}
                          {cap.subcuentas?.map((con) => {
                            const ampRedCon = con.modificado - con.aprobado;
                            const subejercicioCon = con.modificado - con.devengado;
                            return (
                              <tr key={con.codigo} className="border-b border-gray-300 hover:bg-white break-inside-avoid">
                                <td className="py-1 px-2 pl-6 text-gray-800 border-r border-black text-left">{con.descripcion}</td>
                                <td className="py-1 px-2 text-right border-r border-black"><Currency amount={con.aprobado} /></td>
                                <td className="py-1 px-2 text-right border-r border-black"><Currency amount={ampRedCon} /></td>
                                <td className="py-1 px-2 text-right border-r border-black"><Currency amount={con.modificado} /></td>
                                <td className="py-1 px-2 text-right border-r border-black"><Currency amount={con.devengado} /></td>
                                <td className="py-1 px-2 text-right border-r border-black"><Currency amount={con.pagado} /></td>
                                <td className="py-1 px-2 text-right"><Currency amount={subejercicioCon} /></td>
                              </tr>
                            )
                          })}
                        </React.Fragment>
                      )
                    })}
                    {/* TOTALES FINALES */}
                    <tr className="border-t-2 border-black font-bold bg-gray-100 text-black break-inside-avoid">
                      <td className="py-3 px-2 text-right border-r border-black">Total del Gasto</td>
                      <td className="py-3 px-2 text-right border-r border-black"><Currency amount={totalAprobado} /></td>
                      <td className="py-3 px-2 text-right border-r border-black"><Currency amount={totalModificado - totalAprobado} /></td>
                      <td className="py-3 px-2 text-right border-r border-black"><Currency amount={totalModificado} /></td>
                      <td className="py-3 px-2 text-right border-r border-black"><Currency amount={totalEjercido} /></td>
                      <td className="py-3 px-2 text-right border-r border-black"><Currency amount={data.reduce((a, c) => a + c.pagado, 0)} /></td>
                      <td className="py-3 px-2 text-right"><Currency amount={totalModificado - totalEjercido} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-[9px] text-gray-500">
                Bajo protesta de decir verdad declaramos que los Estados Financieros y sus notas, son razonablemente correctos y son responsabilidad del emisor.
              </div>

              {/* 3. FIRMAS (Footer Legal) */}
              <div className="mt-20 grid grid-cols-3 gap-8 text-center text-[10px] break-inside-avoid">
                {firmantes.map((f) => (
                  <div key={f.id} className="flex flex-col items-center">
                    <div className="h-16 w-full"></div> {/* Espacio Firma */}
                    <div className="border-t border-black w-[80%] pt-2">
                      <p className="font-bold uppercase">{f.nombre}</p>
                      <p className="uppercase">{f.puesto}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t shrink-0 print:hidden bg-background dialog-footer">
            <Button variant="outline" onClick={() => setIsReportOpen(false)}>Cerrar Vista Previa</Button>
            <Button onClick={handlePrint} className="bg-primary gap-2 hover:bg-primary/90 text-primary-foreground">
              <Printer className="w-4 h-4" /> Imprimir (Oficio/Carta)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: ADECUACIÓN PRESUPUESTAL (Estilo UI Moderno) */}
      <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
              <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
              Adecuación Presupuestal
            </DialogTitle>
            <DialogDescription>
              Mueve recursos disponibles de una partida a otra.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-900">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <div className="ml-2">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  Solo puedes realizar traspasos entre partidas de la misma <strong>Fuente de Financiamiento</strong>.
                </p>
              </div>
            </Alert>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 p-3 border rounded-md bg-red-50/30 dark:bg-red-900/10 dark:border-red-900/30">
                <Label className="text-red-700 dark:text-red-400 font-semibold text-xs uppercase tracking-wide">Origen (Reduce)</Label>
                <Select>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Seleccionar Partida" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="26101">26101 - Combustibles</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-right text-muted-foreground font-mono">Disponible: <span className="font-bold text-foreground">$250,000</span></div>
              </div>
              <div className="space-y-2 p-3 border rounded-md bg-emerald-50/30 dark:bg-emerald-900/10 dark:border-emerald-900/30">
                <Label className="text-emerald-700 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wide">Destino (Aumenta)</Label>
                <Select>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Seleccionar Partida" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="21101">21101 - Materiales Oficina</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-right text-muted-foreground font-mono">Nuevo Saldo: $---</div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-foreground">Monto a Transferir</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground font-bold">$</span>
                <Input className="pl-6 text-lg font-bold font-mono tracking-tight" placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-foreground">Justificación (Para Poliza)</Label>
              <Input placeholder="Ej. Suficiencia para compra de papeleria fin de año" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransferModalOpen(false)}>Cancelar</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Aplicar Traspaso</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: AGREGAR PRESUPUESTO */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar Partida Presupuestal</DialogTitle>
            <DialogDescription>Crea un nuevo Capítulo o Partida.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Registro</Label>
                <Select value={newItemType} onValueChange={(v: "Capitulo" | "Partida") => setNewItemType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Capitulo">Capítulo (Nivel 1)</SelectItem>
                    <SelectItem value="Partida">Partida (Nivel 2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newItemType === "Partida" && (
                <div className="space-y-2">
                  <Label>Capítulo Padre</Label>
                  <Select value={newItemParent} onValueChange={setNewItemParent}>
                    <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                    <SelectContent>
                      {presupuesto.filter(p => p.nivel === "Capitulo").map(p => (
                        <SelectItem key={p.codigo} value={p.codigo}>{p.codigo} - {p.descripcion}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 space-y-2">
                <Label>Código</Label>
                <Input value={newItemCode} onChange={e => setNewItemCode(e.target.value)} placeholder="0000" className="font-mono" />
              </div>
              <div className="col-span-3 space-y-2">
                <Label>Descripción</Label>
                <Input value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} placeholder="Nombre el concepto..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monto Aprobado</Label>
                <Input type="number" value={newItemMonto} onChange={e => setNewItemMonto(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Fuente de Financiamiento</Label>
                <Select value={newItemFuente} onValueChange={setNewItemFuente}>
                  <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mixto">Mixto</SelectItem>
                    {fuentes.map(f => (
                      <SelectItem key={f.id} value={f.acronimo}>{f.acronimo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddBudget}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}