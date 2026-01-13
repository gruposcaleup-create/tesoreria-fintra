"use client"

import React, { useState, useRef } from "react"
import {
  Search, Paperclip, FileCheck, FileWarning, Building2, Landmark,
  ArrowRightLeft, Filter, Download, AlertCircle, Plus, Loader2,
  CheckCircle2, UploadCloud, ShieldCheck, Eye, EyeOff,
  RefreshCw
} from "lucide-react"

// Shadcn UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"

// --- TYPES ---
type RecursoOrigen = "FISM 2024" | "FORTAMUN" | "Recursos Propios" | "Participaciones" | "Por Asignar";
type MomentoContable = "Comprometido" | "Devengado" | "Ejercido" | "Pagado" | "Por Definir";

interface Transaction {
  id: string;
  fechaBanco: string;
  conceptoBanco: string;
  referencia: string;
  montoBanco: number;
  rfcEmisor: string;
  nombreEmisor: string;
  folioFiscal: string;
  estatusSat: "Vigente" | "Cancelado" | "No Encontrado";
  montoSat: number;
  origen: RecursoOrigen;
  momento: MomentoContable;
  claveProgramatica: string;
  tieneEvidencia: boolean;
  esResultadoIA?: boolean; // Nuevo flag para resaltar
}

// --- MOCK DATA 1: HISTÓRICO (Lo que se ve al entrar) ---
const MOCK_HISTORICAL_DATA: Transaction[] = [];

// --- MOCK DATA 2: RESULTADOS IA (Lo que aparece tras el Wizard) ---
const MOCK_IA_RESULTS: Transaction[] = [];


const Currency = ({ amount, className }: { amount: number, className?: string }) => (
  <span className={`font-mono tracking-tight ${className}`}>
    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)}
  </span>
);

const ResourceBadge = ({ origen }: { origen: RecursoOrigen }) => {
  const stylesKey: Record<RecursoOrigen, string> = {
    "FISM 2024": "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    "FORTAMUN": "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    "Recursos Propios": "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    "Participaciones": "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    "Por Asignar": "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 animate-pulse",
  };
  return <Badge variant="outline" className={`${stylesKey[origen]} whitespace-nowrap`}>{origen}</Badge>;
};

// --- COMPONENTE PRINCIPAL ---

export default function BankReconciliation() {
  // --- ESTADOS GLOBALES ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOrigen, setFilterOrigen] = useState<string>("all");
  // Estado clave: ¿Qué datos estamos mostrando? Al inicio, el histórico.
  const [currentData, setCurrentData] = useState<Transaction[]>(MOCK_HISTORICAL_DATA);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // --- ESTADOS DEL WIZARD ---
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Referencia correcta para el input de archivo
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Datos del Formulario Wizard
  const [configData, setConfigData] = useState({
    cuentaBancaria: "", mes: "10", anio: "2024", fondo: "", rfc: "MVER850101XXX", ciec: "", archivoBanco: null as File | null
  });

  // --- LÓGICA DEL WIZARD ---
  const handleNextStep = () => {
    if (wizardStep === 2) {
      // Simular conexión SAT
      setIsLoading(true);
      setTimeout(() => { setIsLoading(false); setWizardStep(3); }, 2000);
    } else if (wizardStep === 3) {
      // Simular procesamiento IA y TRANSICIÓN AL DASHBOARD
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setIsWizardOpen(false); // Cerrar modal
        setWizardStep(1); // Resetear pasos
        setConfigData({ ...configData, archivoBanco: null }); // Limpiar archivo

        // --- AQUÍ OCURRE LA MAGIA ---
        // Cambiamos los datos mostrados en el dashboard por los resultados de la IA
        setCurrentData(MOCK_IA_RESULTS);
        setIsSessionActive(true); // Marcamos que hay una sesión de trabajo activa
        // Aquí podrías lanzar un toast de éxito: "Conciliación procesada correctamente"
      }, 2500);
    } else {
      setWizardStep(prev => prev + 1);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setConfigData({ ...configData, archivoBanco: e.target.files[0] });
  };

  // Función corregida para disparar el input file
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // --- CÁLCULOS DEL DASHBOARD (Usan currentData) ---
  const presupuestoTotal = 12500000.00;
  const conciliado = currentData.reduce((acc, curr) => acc + (curr.montoBanco === curr.montoSat ? curr.montoBanco : 0), 0);
  const avance = (conciliado / presupuestoTotal) * 100;
  const discrepancias = currentData.filter(item => item.montoBanco !== item.montoSat).length;
  const movimientosTotal = currentData.length;

  // Lógica de Filtrado
  const filteredData = currentData.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.claveProgramatica.toLowerCase().includes(term) ||
      item.nombreEmisor.toLowerCase().includes(term) ||
      item.referencia.toLowerCase().includes(term);

    const matchesOrigin = filterOrigen === "all" || item.origen === filterOrigen;

    return matchesSearch && matchesOrigin;
  });

  const resetDashboard = () => {
    setCurrentData(MOCK_HISTORICAL_DATA);
    setIsSessionActive(false);
  };

  return (
    <div className="space-y-6 p-2 md:p-6 bg-muted/50 min-h-screen transition-all">

      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {isSessionActive ? "Conciliación en Proceso: Octubre" : "Historial de Conciliación"}
            {isSessionActive && <Badge className="bg-blue-600 ml-2 animate-pulse">Nueva Sesión IA</Badge>}
          </h1>
          <p className="text-muted-foreground">Auditoría de Egresos y Cruce Fiscal (SAT)</p>
        </div>
        <div className="flex gap-2">
          {isSessionActive && (
            <Button variant="outline" onClick={resetDashboard}>
              <RefreshCw className="w-4 h-4 mr-2" /> Volver al Historial
            </Button>
          )}
          <Button variant="outline" className="gap-2 bg-card text-foreground border-border hover:bg-muted">
            <Download className="w-4 h-4" /> Exportar Dictamen
          </Button>
          <Button onClick={() => setIsWizardOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
            <Plus className="w-4 h-4 mr-2" /> Nueva Conciliación
          </Button>
        </div>
      </div>

      {/* KPIS DEL DASHBOARD (Se actualizan solos con currentData) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-2 border-l-4 border-l-primary shadow-sm bg-card border-y border-r border-border">
          <CardHeader className="pb-2">
            <CardDescription>Fondo Principal (Ejemplo)</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">FISM-DF 2024</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm mb-2 text-muted-foreground">
              <span>Avance Conciliado</span>
              <span className="font-bold text-foreground">{avance.toFixed(2)}%</span>
            </div>
            <Progress value={avance} className="h-2 bg-muted" />
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border border-border">
          <CardHeader className="pb-2">
            <CardDescription>Movimientos del Periodo</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">{movimientosTotal}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowRightLeft className="w-3 h-3 text-primary" />
              <span className="font-medium text-foreground">{discrepancias} pendientes</span> de cruce perfecto
            </div>
          </CardContent>
        </Card>

        <Card className={`shadow-sm transition-colors border ${discrepancias > 0 ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' : 'bg-card border-border'}`}>
          <CardHeader className="pb-2">
            <CardDescription className={discrepancias > 0 ? "text-amber-800 dark:text-amber-400" : ""}>Discrepancias / Errores</CardDescription>
            <CardTitle className={`text-2xl font-bold ${discrepancias > 0 ? "text-amber-600 dark:text-amber-500" : "text-foreground"}`}>{discrepancias}</CardTitle>
          </CardHeader>
          <CardContent>
            {discrepancias > 0 ? (
              <div className="text-xs text-amber-700/80 dark:text-amber-400/80 flex items-center gap-1">
                <FileWarning className="w-3 h-3" /> Requieren revisión manual
              </div>
            ) : (
              <div className="text-xs text-emerald-700/80 dark:text-emerald-400/80 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Todo cuadrado
              </div>
            )}

          </CardContent>
        </Card>
      </div>

      {/* 2. Filtros Avanzados */}
      <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="flex flex-1 gap-4 w-full md:w-auto flex-col md:flex-row">
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por Clave Programática, Contratista o Referencia..."
              className="pl-8 bg-background border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterOrigen} onValueChange={setFilterOrigen}>
            <SelectTrigger className="w-full md:w-[200px] bg-background border-border">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Fondo / Origen" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Fondos</SelectItem>
              <SelectItem value="FISM 2024">FISM 2024</SelectItem>
              <SelectItem value="FORTAMUN">FORTAMUN</SelectItem>
              <SelectItem value="Recursos Propios">Recursos Propios</SelectItem>
              <SelectItem value="Participaciones">Participaciones</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 3. Layout de Conciliación (Listado Inteligente) */}
      <ScrollArea className="h-[600px] rounded-md border border-border bg-card shadow-sm relative">
        {/* Overlay de carga si el wizard estuviera procesando en background (opcional) */}

        <div className="min-w-[900px]">
          {/* Header de la Tabla Custom */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-muted/80 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm">
            <div className="col-span-5 flex items-center gap-2 pl-2">
              <Landmark className="w-4 h-4" /> Movimiento Bancario
            </div>
            <div className="col-span-1 text-center border-l border-r border-border">Estatus</div>
            <div className="col-span-6 flex items-center gap-2 pl-4">
              <Building2 className="w-4 h-4" /> Documentación Fiscal (SAT)
            </div>
          </div>

          {/* Body */}
          <div className="divide-y divide-border">
            {filteredData.map((item) => {
              const isMatch = item.montoBanco === item.montoSat && item.estatusSat !== 'No Encontrado';

              return (
                <div
                  key={item.id}
                  className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors text-sm group relative
                    ${!isMatch ? 'bg-amber-50/40 dark:bg-amber-900/10 hover:bg-amber-50/70 dark:hover:bg-amber-900/20' : 'hover:bg-muted/50'}
                    ${item.esResultadoIA ? 'animate-in fade-in duration-700' : ''} 
                  `}
                >
                  {/* Indicador visual de nuevo resultado IA */}
                  {item.esResultadoIA && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r"></div>}

                  {/* COLUMNA IZQUIERDA: BANCO */}
                  <div className="col-span-5 space-y-2 pl-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="font-medium text-foreground">{item.conceptoBanco}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.fechaBanco} • Ref: {item.referencia}</p>
                      </div>
                      <Currency amount={item.montoBanco} className="font-bold text-foreground" />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <ResourceBadge origen={item.origen} />
                      <Badge variant="secondary" className="text-[10px] font-mono text-muted-foreground border-border">
                        {item.claveProgramatica}
                      </Badge>
                    </div>
                  </div>

                  {/* COLUMNA CENTRAL: STATUS LINK */}
                  <div className="col-span-1 flex flex-col items-center justify-center h-full relative">
                    {isMatch ? (
                      <div className="flex flex-col items-center gap-1 text-emerald-600 dark:text-emerald-500">
                        <div className="h-full w-px bg-emerald-100 dark:bg-emerald-900/30 absolute top-0 bottom-0 -z-10 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/30"></div>
                        <div className="bg-emerald-100 dark:bg-emerald-900/40 p-1.5 rounded-full">
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex flex-col items-center gap-1 text-amber-600 dark:text-amber-500 animate-pulse cursor-help">
                              <AlertCircle className="w-5 h-5" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {item.estatusSat === 'No Encontrado' ? <p>Sin factura correspondiente en SAT</p> : <p>Discrepancia en montos</p>}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>

                  {/* COLUMNA DERECHA: SAT / GOBIERNO */}
                  <div className="col-span-6 space-y-2 pl-4 relative">
                    {!isMatch && <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-amber-200/50 dark:bg-amber-800/50"></div>}

                    <div className="flex justify-between items-start">
                      <div className="min-w-0 pr-4">
                        <p className={`font-medium truncate max-w-[250px] ${item.nombreEmisor === 'NO ENCONTRADO EN SAT' ? 'text-amber-700 dark:text-amber-400 italic' : 'text-foreground'}`} title={item.nombreEmisor}>
                          {item.nombreEmisor}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.rfcEmisor} • UUID: <span className="font-mono">{item.folioFiscal.slice(0, 8)}...</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <Currency
                          amount={item.montoSat}
                          className={isMatch ? "text-emerald-700 dark:text-emerald-500" : "text-amber-700 dark:text-amber-500 font-bold"}
                        />
                        {!isMatch && item.montoSat > 0 && (
                          <Badge variant="outline" className="ml-auto mt-1 block w-fit border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-[10px] h-5 px-1">
                            Diferencia: <Currency amount={item.montoBanco - item.montoSat} className="ml-1" />
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-dashed border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Etapa:</span>
                        <Select defaultValue={item.momento}>
                          <SelectTrigger className="h-7 w-[130px] text-xs bg-background border-border focus:ring-primary/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Por Definir" disabled={item.momento !== 'Por Definir'}>Por Definir</SelectItem>
                            <SelectItem value="Comprometido">Comprometido</SelectItem>
                            <SelectItem value="Devengado">Devengado</SelectItem>
                            <SelectItem value="Ejercido">Ejercido</SelectItem>
                            <SelectItem value="Pagado">Pagado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={
                          item.estatusSat === "Vigente" ? "text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20" :
                            item.estatusSat === "Cancelado" ? "text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20" :
                              "text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20"
                        }>
                          {item.estatusSat}
                        </Badge>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant={item.tieneEvidencia ? "ghost" : "outline"}
                                className={`h-7 w-7 transition-all ${!item.tieneEvidencia && "border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40"}`}
                              >
                                {item.tieneEvidencia ? <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" /> : <Paperclip className="w-3.5 h-3.5" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{item.tieneEvidencia ? "Evidencia adjunta (PDF/XML)" : "Falta evidencia para ORFIS"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {filteredData.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground bg-muted/50 m-4 rounded border border-dashed border-border">
              <Search className="w-8 h-8 mb-2 opacity-20" />
              <p>No se encontraron movimientos con los filtros actuales.</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* ====================================================================
          WIZARD DE NUEVA CONCILIACIÓN (MODAL) - CON REF CORREGIDO
          ====================================================================
      */}
      <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-background border-border">
          <DialogHeader className="p-6 pb-2 bg-muted/50 border-b border-border">
            <DialogTitle className="text-xl flex items-center gap-2 text-foreground">
              <Landmark className="w-5 h-5 text-primary" />
              Iniciar Conciliación
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Configura el periodo y conecta con el SAT para descargar XMLs.
            </DialogDescription>

            {/* Pasos Visuales */}
            <div className="flex items-center justify-between mt-4 px-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border 
                            ${wizardStep >= step ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"}`}>
                    {step}
                  </div>
                  <span className={`text-xs ${wizardStep >= step ? "text-primary font-medium" : "text-muted-foreground"}`}>
                    {step === 1 ? "Configuración" : step === 2 ? "Conexión SAT" : "Banco"}
                  </span>
                  {step < 3 && <div className="w-12 h-[1px] bg-border mx-2" />}
                </div>
              ))}
            </div>
          </DialogHeader>

          <div className="p-6 min-h-[300px]">
            {/* PASO 1: CONFIGURACIÓN GENERAL */}
            {wizardStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cuenta Bancaria</Label>
                    <Select onValueChange={(v) => setConfigData({ ...configData, cuentaBancaria: v })}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Selecciona cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cta-fism">BBVA - 9988 FISM</SelectItem>
                        <SelectItem value="cta-forta">Banorte - 1122 FORTAMUN</SelectItem>
                        <SelectItem value="cta-propios">Santander - 3344 Gasto Corr.</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Origen del Recurso (Etiqueta)</Label>
                    <Select onValueChange={(v) => setConfigData({ ...configData, fondo: v })}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Ej. FISM 2024" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fism">FISM 2024</SelectItem>
                        <SelectItem value="fortamun">FORTAMUN</SelectItem>
                        <SelectItem value="part">Participaciones</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mes de Conciliación</Label>
                    <Select defaultValue={configData.mes}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="09">Septiembre</SelectItem>
                        <SelectItem value="10">Octubre</SelectItem>
                        <SelectItem value="11">Noviembre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ejercicio Fiscal</Label>
                    <Input value="2024" disabled className="bg-muted border-border" />
                  </div>
                </div>

                <Alert className="bg-blue-50/50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-300">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Nota Técnica</AlertTitle>
                  <AlertDescription className="text-xs">
                    Se creará un nuevo periodo contable. Asegúrate de haber cerrado el mes anterior.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* PASO 2: CONEXIÓN SAT (WEB SCRAPING) */}
            {wizardStep === 2 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                {!isLoading ? (
                  <>
                    <div className="text-center space-y-2 mb-6">
                      <ShieldCheck className="w-10 h-10 text-muted-foreground mx-auto" />
                      <h3 className="font-semibold text-foreground">Autenticación CIEC</h3>
                      <p className="text-sm text-muted-foreground">
                        Ingresa las credenciales para descargar los XMLs del portal del SAT.
                      </p>
                    </div>

                    <div className="space-y-4 max-w-sm mx-auto">
                      <div className="space-y-2">
                        <Label>RFC del Municipio</Label>
                        <Input value={configData.rfc} readOnly className="bg-muted font-mono border-border" />
                      </div>
                      <div className="space-y-2">
                        <Label>Contraseña (CIEC)</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Ingresa tu contraseña del SAT"
                            value={configData.ciec}
                            onChange={(e) => setConfigData({ ...configData, ciec: e.target.value })}
                            className="bg-background border-border"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Switch id="cache-creds" />
                        <Label htmlFor="cache-creds" className="text-xs font-normal text-muted-foreground">
                          Recordar credenciales para esta sesión (Encriptado)
                        </Label>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <div className="text-center">
                      <h3 className="font-semibold text-lg text-foreground">Conectando con SAT...</h3>
                      <p className="text-sm text-muted-foreground">Esto puede tardar unos segundos.</p>
                      <div className="mt-4 space-y-1">
                        <p className="text-xs text-emerald-600 dark:text-emerald-500 flex items-center gap-1 justify-center"><CheckCircle2 className="w-3 h-3" /> Validando credenciales</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center animate-pulse"><Loader2 className="w-3 h-3 animate-spin" /> Descargando Metadata (Octubre)</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PASO 3: SUBIDA BANCARIA E IA (CORREGIDO CON USE REF) */}
            {wizardStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                {!isLoading ? (
                  <>
                    {/* Input Oculto de Verdad */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".csv,.xls,.xlsx"
                      onChange={handleFileUpload}
                    />

                    {/* Área de Clic que dispara el input */}
                    <div
                      onClick={triggerFileInput}
                      className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer group"
                    >
                      <UploadCloud className="w-10 h-10 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                      <h3 className="font-medium text-foreground">Sube tu Estado de Cuenta</h3>
                      <p className="text-sm text-muted-foreground mt-1 mb-4">
                        Arrastra tu archivo CSV o Excel aquí (Formato BBVA, Banorte, Santander)
                      </p>
                      {configData.archivoBanco ? (
                        <Badge variant="secondary" className="px-4 py-2 text-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                          <FileCheck className="w-4 h-4 mr-2" />
                          {configData.archivoBanco.name}
                        </Badge>
                      ) : (
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); triggerFileInput(); }}>
                          Seleccionar Archivo
                        </Button>
                      )}
                    </div>

                    <Alert className="bg-card border-border">
                      <AlertTitle className="text-foreground">Resumen Previo</AlertTitle>
                      <AlertDescription className="text-xs text-muted-foreground grid grid-cols-2 gap-2 mt-2">
                        <div>XMLs Descargados SAT: <span className="font-bold text-foreground">145</span></div>
                        <div>Periodo: <span className="font-bold text-foreground">Octubre 2024</span></div>
                      </AlertDescription>
                    </Alert>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 space-y-6">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-foreground">IA</div>
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="font-semibold text-lg text-foreground">Procesando Conciliación</h3>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        Nuestra IA está cruzando los montos, fechas y RFCs entre el Banco y el SAT.
                      </p>
                    </div>
                    <div className="w-full max-w-xs space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Analizando descripciones...</span>
                        <span>85%</span>
                      </div>
                      <Progress value={85} className="h-1" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t border-border bg-muted/50">
            {wizardStep > 1 && !isLoading && (
              <Button variant="outline" onClick={() => setWizardStep(prev => prev - 1)} className="bg-background">
                Atrás
              </Button>
            )}
            {!isLoading && (
              <Button onClick={handleNextStep} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={wizardStep === 3 && !configData.archivoBanco}>
                {wizardStep === 3 ? "Iniciar Cruce Inteligente" : "Siguiente"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}