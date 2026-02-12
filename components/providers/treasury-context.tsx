"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"

// --- TYPES ---
export type TipoCuenta = "Cheques (Operativa)" | "Inversión (Productiva)" | "Nómina" | "Fondo Revolvente";
export type FuenteFinanciamiento = string;

export interface Transaction {
    id: string;
    fecha: string;
    concepto: string;
    referencia: string;
    monto: number;
    tipo: "Ingreso" | "Egreso";
    estatus: "Completado" | "En Tránsito" | "Cancelado";
}

export interface BankAccount {
    id: string;
    banco: string;
    alias: string;
    numeroCuenta: string;
    clabe: string;
    saldo: number;
    saldoDisponible: number;
    tipo: TipoCuenta;
    fuente: FuenteFinanciamiento;
    sucursal: string;
    direccionSucursal: string;
    ejecutivo: string;
    telefonoEjecutivo: string;
    fechaApertura: string;
    estatus: "Activa" | "Bloqueada" | "En Trámite";
    regimen: "Mancomunada" | "Indistinta";
    moneda: "MXN" | "USD";
    ultimoMovimiento: string;
    movimientosRecientes: Transaction[];
}

export interface LogEntry {
    id: string;
    timestamp: string;
    action: string;
    details: string;
    user: string;
    type: "create" | "update" | "transfer" | "alert" | "delete";
}

// --- NUEVOS TIPOS CONTABLES ---
export type IngresoContable = {
    id: string
    concepto: string
    fuente: string
    monto: number
    estado: "Completado" | "Pendiente" | "Procesando"
    fecha: string
    cuentaBancaria?: string
    cri?: string;
    cuentaContable?: string;
    reporteAdicional?: {
        tipo: "none" | "predial" | "otros"
        nombre: string
        rfc: string
        domicilio: string
        conceptoDetalle: string
        aplicacion: string
        importeCorriente: string | number
        importeAdicional: string | number
        sumaTotal: string
        totalLetra: string
        fechaEmision: Date | string
        folioRecibo: string

        // Budget Classification (New)
        capitulo?: string
        partidaGenerica?: string
        cri?: string
        cuentaContable?: string

        // Campos específicos para Predial
        folio?: string
        fechaCobro?: string
        numeroCajero?: string

        // Clave Catastral
        zona?: string
        municipio?: string
        localidad?: string
        region?: string
        manzana?: string
        lote?: string
        nivel?: string
        departamento?: string
        digitoVerificador?: string

        // Info Contribuyente y Predio
        nombreContribuyente?: string
        tipoPredio?: string
        periodo?: string
        ubicacionPredio?: string
        colonia?: string

        // Liquidación
        baseImpuesto?: number | string
        impuesto?: number | string
        // adicional ya existe (importeAdicional)
        recargos?: number | string
        multa?: number | string
        honorarios?: number | string
        pagarConDescuento?: number | string
        totalPagar?: string
        // total a pagar es sumaTotal o totalPagar
    }
}

export type EgresoContable = {
    id: string
    cog: string
    cuentaContable: string
    pagueseA: string
    monto: number
    concepto: string
    fondo: string
    institucionBancaria: string
    cuentaBancaria: string
    fecha: string
    tipo: "Manual" | "Bancario"
    estatus: "Pendiente" | "Pagado" | "Cancelado"
    folioOrden?: number
    departamento?: string
    area?: string
    poliza?: string
    clasificacion?: "ACTIVO" | "GASTO"
    activoData?: {
        resguardoNumero: string
        opd: string
        area: string
        encargado: string
        equipo: string
        proveedor: string
        factura: string
        marca: string
        modelo: string
        serie: string
        color: string
        observaciones: string
        referenciaPago: string
        director: string
        resguardante: string
    }
}

export type Fuente = {
    id: string
    acronimo: string
    nombre: string
    origen: string
}

export type Firmante = {
    id: string
    nombre: string
    puesto: string
}

export type PaymentOrderSigner = {
    autoriza: string
    comisionHacienda1: string
    comisionHacienda2: string
    doyFe: string
}

// --- TIPOS PRESUPUESTALES ---
export type NivelCOG = "Capitulo" | "Concepto" | "Partida" | "Partida Generica";

export interface PresupuestoItem {
    codigo: string;
    descripcion: string;
    nivel: NivelCOG;
    fuenteFinanciamiento: string;
    aprobado: number;
    modificado: number;
    devengado: number;
    pagado: number;
    subcuentas?: PresupuestoItem[];
    isExpanded?: boolean;
    // New fields
    cuenta_registro?: string;
    cri?: string;
    cog?: string;
    // Monthly breakdown
    enero?: number;
    febrero?: number;
    marzo?: number;
    abril?: number;
    mayo?: number;
    junio?: number;
    julio?: number;
    agosto?: number;
    septiembre?: number;
    octubre?: number;
    noviembre?: number;
    diciembre?: number;
    // Monthly Accounting (Contable)
    enero_contable?: number;
    febrero_contable?: number;
    marzo_contable?: number;
    abril_contable?: number;
    mayo_contable?: number;
    junio_contable?: number;
    julio_contable?: number;
    agosto_contable?: number;
    septiembre_contable?: number;
    octubre_contable?: number;
    noviembre_contable?: number;
    diciembre_contable?: number;
}

// --- DATA PRESUPUESTO INICIAL ---
import { RAW_COG_DATA } from "./cog-raw-data";
import { buildCOGTree } from "./cog-tree-builder";
import { RAW_CRI_DATA } from "./cri-raw-data";
import { buildCRITree } from "./cri-tree-builder";

export const INITIAL_PRESUPUESTO: PresupuestoItem[] = [];
const INITIAL_LEY_INGRESOS: PresupuestoItem[] = [];


// --- DATOS MOCK INICIALES (Cuentas) ---
const DATA_CUENTAS: BankAccount[] = [];

const DATA_LOG: LogEntry[] = [];

// --- DATOS MOCK INICIALES (Contables) ---
const INITIAL_INGRESOS: IngresoContable[] = []

const INITIAL_EGRESOS: EgresoContable[] = []

const INITIAL_FUENTES: Fuente[] = [
    { id: "1", acronimo: "FISM-DF", nombre: "Fondo para la Infraestructura Social Municipal", origen: "Federal" },
    { id: "2", acronimo: "FORTAMUN", nombre: "Fondo de Aportaciones para el Fortalecimiento de los Municipios", origen: "Federal" },
    { id: "3", acronimo: "RF", nombre: "Recursos Fiscales", origen: "Ingresos Propios" },
]

const INITIAL_ORIGENES: string[] = [
    "Ramo 33 (Aportaciones Federales)",
    "Ramo 28 (Participaciones Federales)",
    "Ingresos Propios",
    "Estatal",
    "Convenios",
    "Otros"
]

// --- DEPARTAMENTOS ---
export type Departamento = {
    id: string
    nombre: string
    areas: string[]
}

const INITIAL_DEPARTAMENTOS: Departamento[] = [
    { id: "dept-1", nombre: "Presidencia municipal", areas: ["Despacho", "Secretaria Particular"] },
    { id: "dept-2", nombre: "Sindicatura", areas: ["Jurídico", "Patrimonio"] },
    { id: "dept-3", nombre: "Regiduria", areas: [] },
    { id: "dept-4", nombre: "Secretaria del ayuntamiento", areas: ["Cabildo", "Archivo"] },
    { id: "dept-5", nombre: "Tesoreria", areas: ["Ingresos", "Egresos", "Contabilidad"] },
    { id: "dept-6", nombre: "Obras publicas", areas: ["Proyectos", "Supervisión"] },
    { id: "dept-7", nombre: "Oficialia mayor", areas: ["Recursos Humanos", "Servicios Generales"] },
    { id: "dept-8", nombre: "Seguridad publica", areas: ["Preventiva", "Tránsito"] },
    { id: "dept-9", nombre: "Servicios publicos", areas: ["Limpiar", "Alumbrado"] },
    { id: "dept-10", nombre: "DIF", areas: ["Asistencia Social", "Procuraduría"] },
    { id: "dept-11", nombre: "Desarrollo social", areas: [] },
    { id: "dept-12", nombre: "Desarrollo rural", areas: [] },
    { id: "dept-13", nombre: "Proteccion civil", areas: [] },
    { id: "dept-14", nombre: "Deporte", areas: [] },
    { id: "dept-15", nombre: "Cultura", areas: [] },
    { id: "dept-16", nombre: "Turismo", areas: [] },
    { id: "dept-17", nombre: "Ecologia", areas: [] },
    { id: "dept-18", nombre: "Instituto de la mujer", areas: [] },
    { id: "dept-19", nombre: "Transparencia", areas: [] },
    { id: "dept-20", nombre: "Contraloria", areas: ["Auditoría", "Quejas"] },
]

// --- CONTEXT ---
interface TreasuryContextType {
    cuentas: BankAccount[];
    setCuentas: React.Dispatch<React.SetStateAction<BankAccount[]>>;
    systemLog: LogEntry[];
    setSystemLog: React.Dispatch<React.SetStateAction<LogEntry[]>>;
    addToLog: (action: string, details: string, type?: LogEntry["type"]) => void;
    approveTransaction: (id: string, type: "Ingreso" | "Egreso") => void;
    rejectTransaction: (id: string, type: "Ingreso" | "Egreso") => void;
    // New
    ingresosContables: IngresoContable[];
    setIngresosContables: React.Dispatch<React.SetStateAction<IngresoContable[]>>;
    egresosContables: EgresoContable[];
    setEgresosContables: React.Dispatch<React.SetStateAction<EgresoContable[]>>;
    // New
    fuentes: Fuente[];
    addFuente: (fuente: Fuente) => void;
    deleteFuente: (id: string) => void;
    // New (Origenes)
    origenes: string[];
    addOrigen: (origen: string) => void;
    deleteOrigen: (origen: string) => void;
    // New (Departamentos)
    departamentos: Departamento[];
    addDepartamento: (nombre: string, areas?: string[]) => void;
    updateDepartamento: (id: string, nombre: string, areas: string[]) => void;
    deleteDepartamento: (id: string) => void;
    // New (Presupuesto)
    presupuesto: PresupuestoItem[];
    setPresupuesto: React.Dispatch<React.SetStateAction<PresupuestoItem[]>>;
    addPresupuestoItem: (item: PresupuestoItem, parentCode?: string) => void;
    updateBudgetFromEgreso: (cog: string, monto: number, fecha: string) => void;

    leyIngresos: PresupuestoItem[];
    setLeyIngresos: React.Dispatch<React.SetStateAction<PresupuestoItem[]>>;
    updateLeyIngresosFromIngreso: (cuentaContable: string, monto: number, fecha: string) => void;

    // Proveedores (New)
    proveedores: Proveedor[];
    setProveedores: React.Dispatch<React.SetStateAction<Proveedor[]>>;
    addProveedor: (proveedor: Proveedor) => void;

    // New (System Config)
    config: { logoLeft: string, logoRight: string };
    setConfig: React.Dispatch<React.SetStateAction<{ logoLeft: string, logoRight: string }>>;

    fiscalConfig: { nombreEnte: string, rfc: string, regimen: string, cp: string, domicilio: string };
    setFiscalConfig: React.Dispatch<React.SetStateAction<{ nombreEnte: string, rfc: string, regimen: string, cp: string, domicilio: string }>>;

    firmantes: Firmante[];
    setFirmantes: React.Dispatch<React.SetStateAction<Firmante[]>>;

    paymentOrderSigners: PaymentOrderSigner;
    setPaymentOrderSigners: React.Dispatch<React.SetStateAction<PaymentOrderSigner>>;

    // New (Payment Order Folio)
    nextPaymentOrderFolio: number;
    incrementPaymentOrderFolio: () => void;
}

// --- PROVEEDOR TYPES ---
export type EstatusProveedor = "Activo" | "Bloqueado" | "En Revisión";
export type RiesgoSAT = "Sin Riesgo" | "Observado (69-B)" | "Opinión Negativa";

export interface Proveedor {
    id: string;
    razonSocial: string;
    rfc: string;
    tipo: "Persona Moral" | "Persona Física";
    codigoPostal: string;
    regimenFiscal: string;
    representanteLegal: string;
    email: string;
    telefono: string;
    clabe: string;
    banco: string;
    estatus: EstatusProveedor;
    riesgoSat: RiesgoSAT;
    ultimaActualizacion: string;
    documentosEntregados: number; // de 5 obligatorios
    csfPdfBase64?: string;
    csfFileName?: string;
    actaBase64?: string;
    actaFileName?: string;
    comprobanteBase64?: string;
    comprobanteFileName?: string;
}

const TreasuryContext = createContext<TreasuryContextType | undefined>(undefined);

export function TreasuryProvider({ children }: { children: ReactNode }) {
    const [cuentas, setCuentas] = useState<BankAccount[]>(DATA_CUENTAS);
    const [systemLog, setSystemLog] = useState<LogEntry[]>(DATA_LOG);
    const [ingresosContables, setIngresosContables] = useState<IngresoContable[]>(INITIAL_INGRESOS);
    const [egresosContables, setEgresosContables] = useState<EgresoContable[]>(INITIAL_EGRESOS);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Hydrate from Database
    React.useEffect(() => {
        const loadData = async () => {
            setIsLoadingData(true);
            try {
                // Import server actions dynamically to avoid SSR issues
                const {
                    getIngresos,
                    getEgresos,
                    getFuentes,
                    getDepartamentos,
                    getAllSystemConfig,
                    getFirmantes,
                    getNextPaymentOrderFolio
                } = await import("@/app/actions/treasury");

                // Fetch from DB
                const [
                    ingresosRes,
                    egresosRes,
                    fuentesRes,
                    departamentosRes,
                    configRes,
                    firmantesRes,
                    folioRes
                ] = await Promise.all([
                    getIngresos(),
                    getEgresos(),
                    getFuentes(),
                    getDepartamentos(),
                    getAllSystemConfig(),
                    getFirmantes(),
                    getNextPaymentOrderFolio()
                ]);

                if (ingresosRes.success && ingresosRes.data) {
                    // Transform DB data to match context types (handle Decimal -> number)
                    const ingresos = ingresosRes.data.map((i: any) => ({
                        id: i.id,
                        concepto: i.concepto,
                        fuente: i.fuente,
                        monto: Number(i.monto),
                        estado: i.estado as "Completado" | "Pendiente" | "Procesando",
                        fecha: new Date(i.fecha).toISOString().split('T')[0],
                        cuentaBancaria: i.cuentaBancaria || undefined
                    }));
                    setIngresosContables(ingresos);
                }

                if (egresosRes.success && egresosRes.data) {
                    const egresos = egresosRes.data.map((e: any) => ({
                        id: e.id,
                        cog: e.cog,
                        cuentaContable: e.cuentaContable,
                        pagueseA: e.pagueseA,
                        monto: Number(e.monto),
                        concepto: e.concepto,
                        fondo: e.fondo,
                        institucionBancaria: e.institucionBancaria,
                        cuentaBancaria: e.cuentaBancaria,
                        fecha: new Date(e.fecha).toISOString().split('T')[0],
                        tipo: e.tipo as "Manual" | "Bancario",
                        estatus: e.estatus as "Pendiente" | "Pagado" | "Cancelado",
                        folioOrden: e.folioOrden || undefined,
                        departamento: e.departamento || undefined,
                        area: e.area || undefined,
                        clasificacion: e.clasificacion || undefined,
                        activoData: e.activoData || undefined
                    }));
                    setEgresosContables(egresos);
                }

                // Load Fuentes from DB (if available) or keep initial
                if (fuentesRes.success && fuentesRes.data && fuentesRes.data.length > 0) {
                    setFuentes(fuentesRes.data);
                }

                // Load Departamentos from DB (if available) or keep initial
                if (departamentosRes.success && departamentosRes.data && departamentosRes.data.length > 0) {
                    setDepartamentos(departamentosRes.data);
                }

                // Load System Config from DB
                if (configRes.success && configRes.data) {
                    const cfg = configRes.data as Record<string, string>;
                    // Set logos
                    if (cfg['logoLeft'] || cfg['logoRight']) {
                        setConfig({
                            logoLeft: cfg['logoLeft'] || "",
                            logoRight: cfg['logoRight'] || ""
                        });
                    }
                    // Set fiscal config
                    setFiscalConfig({
                        nombreEnte: cfg['nombreEnte'] || "",
                        rfc: cfg['rfc'] || "",
                        regimen: cfg['regimen'] || "",
                        cp: cfg['cp'] || "",
                        domicilio: cfg['domicilio'] || ""
                    });
                    // Set payment order signers
                    if (cfg['paymentOrderSigners']) {
                        try {
                            setPaymentOrderSigners(JSON.parse(cfg['paymentOrderSigners']));
                        } catch (e) {
                            console.warn("Error parsing paymentOrderSigners:", e);
                        }
                    }
                }

                // Load Firmantes from DB
                if (firmantesRes.success && firmantesRes.data) {
                    setFirmantes(firmantesRes.data);
                }

                // Load Next Folio from DB
                if (folioRes.success && folioRes.data) {
                    setNextPaymentOrderFolio(folioRes.data);
                }
            } catch (error) {
                console.error("Error fetching data from DB:", error);
            } finally {
                setIsLoadingData(false);
            }
        };

        loadData();
    }, []);
    const [fuentes, setFuentes] = useState<Fuente[]>(INITIAL_FUENTES);
    const [origenes, setOrigenes] = useState<string[]>(INITIAL_ORIGENES);
    const [departamentos, setDepartamentos] = useState<Departamento[]>(INITIAL_DEPARTAMENTOS);
    const [presupuesto, setPresupuesto] = useState<PresupuestoItem[]>(INITIAL_PRESUPUESTO);
    const [leyIngresos, setLeyIngresos] = useState<PresupuestoItem[]>(INITIAL_LEY_INGRESOS);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);

    useEffect(() => {
        // Load proveedores from localStorage
        if (typeof window !== "undefined") {
            try {
                const raw = localStorage.getItem("fintra_proveedores");
                if (raw) {
                    setProveedores(JSON.parse(raw));
                }
            } catch (error) {
                console.error("Error loading proveedores:", error);
            }
        }
    }, []);

    const addProveedor = (proveedor: Proveedor) => {
        setProveedores(prev => {
            const updated = [...prev, proveedor];
            if (typeof window !== "undefined") {
                localStorage.setItem("fintra_proveedores", JSON.stringify(updated));
            }
            return updated;
        });
        addToLog("Proveedor Agregado", `Se registró al proveedor ${proveedor.razonSocial}`, "create");
    };

    // Config states (loaded from DB)
    const [config, setConfig] = useState({ logoLeft: "", logoRight: "" });
    const [fiscalConfig, setFiscalConfig] = useState({
        nombreEnte: "",
        rfc: "",
        regimen: "",
        cp: "",
        domicilio: ""
    });

    // Performance: Load heavy data asynchronously using requestIdleCallback for better responsiveness
    React.useEffect(() => {
        const loadHeavyData = () => {
            const cogTree = buildCOGTree(RAW_COG_DATA);
            setPresupuesto(prev => prev.length === 0 ? cogTree : prev);

            const criTree = buildCRITree(RAW_CRI_DATA);
            setLeyIngresos(prev => prev.length === 0 ? criTree : prev);
        };

        // Use requestIdleCallback for better performance, fall back to setTimeout
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            (window as any).requestIdleCallback(loadHeavyData, { timeout: 100 });
        } else {
            setTimeout(loadHeavyData, 0);
        }
    }, []);

    const [firmantes, setFirmantes] = useState<Firmante[]>([]);
    const [paymentOrderSigners, setPaymentOrderSigners] = useState<PaymentOrderSigner>({
        autoriza: "",
        comisionHacienda1: "",
        comisionHacienda2: "",
        doyFe: ""
    });
    const [nextPaymentOrderFolio, setNextPaymentOrderFolio] = useState(1);

    const incrementPaymentOrderFolio = async () => {
        try {
            const { incrementPaymentOrderFolio: incrementFolioAction } = await import("@/app/actions/treasury");
            const result = await incrementFolioAction();
            if (result.success && result.data) {
                // result.data contains the current (pre-increment) folio
                setNextPaymentOrderFolio(result.data + 1);
                addToLog("Folio Incrementado", `Folio de Orden de Pago actualizado a ${result.data + 1}`, "update");
            }
        } catch (error) {
            console.error("Error incrementing folio:", error);
            // Fallback to optimistic update
            setNextPaymentOrderFolio(prev => prev + 1);
            addToLog("Folio Incrementado", `Folio de Orden de Pago actualizado a ${nextPaymentOrderFolio + 1}`, "update");
        }
    };

    const addFuente = async (fuente: Fuente) => {
        try {
            const { createFuente } = await import("@/app/actions/treasury");
            const result = await createFuente({
                acronimo: fuente.acronimo,
                nombre: fuente.nombre,
                origen: fuente.origen
            });
            if (result.success && result.data) {
                setFuentes(prev => [...prev, result.data]);
                addToLog("Fondo Agregado", `Se agregó el fondo ${fuente.acronimo}`, "create");
            }
        } catch (error) {
            console.error("Error adding fuente:", error);
            // Optimistic update as fallback
            setFuentes(prev => [...prev, fuente]);
            addToLog("Fondo Agregado", `Se agregó el fondo ${fuente.acronimo}`, "create");
        }
    }

    const deleteFuenteHandler = async (id: string) => {
        try {
            const { deleteFuente: deleteFuenteAction } = await import("@/app/actions/treasury");
            const result = await deleteFuenteAction(id);
            if (result.success) {
                setFuentes(prev => prev.filter(f => f.id !== id));
                addToLog("Fondo Eliminado", `Se eliminó un fondo`, "delete");
            }
        } catch (error) {
            console.error("Error deleting fuente:", error);
            // Optimistic update as fallback
            setFuentes(prev => prev.filter(f => f.id !== id));
            addToLog("Fondo Eliminado", `Se eliminó un fondo`, "delete");
        }
    }

    const addOrigen = (origen: string) => {
        setOrigenes(prev => [...prev, origen]);
        addToLog("Fuente Agregada", `Se agregó la fuente ${origen}`, "create");
    }

    const deleteOrigen = (origen: string) => {
        setOrigenes(prev => prev.filter(o => o !== origen));
        addToLog("Fuente Eliminada", `Se eliminó la fuente ${origen}`, "delete");
    }

    const addDepartamento = async (nombre: string, areas: string[] = []) => {
        try {
            const { createDepartamento } = await import("@/app/actions/treasury");
            const result = await createDepartamento({ nombre, areas });
            if (result.success && result.data) {
                setDepartamentos(prev => [...prev, result.data]);
                addToLog("Departamento Agregado", `Se agregó el departamento ${nombre}`, "create");
            }
        } catch (error) {
            console.error("Error adding departamento:", error);
            // Optimistic update as fallback
            const newDept: Departamento = {
                id: `dept-${Date.now()}`,
                nombre,
                areas
            };
            setDepartamentos(prev => [...prev, newDept]);
            addToLog("Departamento Agregado", `Se agregó el departamento ${nombre}`, "create");
        }
    }

    const updateDepartamento = async (id: string, nombre: string, areas: string[] = []) => {
        try {
            const { updateDepartamento: updateDepartamentoAction } = await import("@/app/actions/treasury");
            const result = await updateDepartamentoAction(id, { nombre, areas });
            if (result.success) {
                setDepartamentos(prev => prev.map(d => d.id === id ? { ...d, nombre, areas } : d));
                addToLog("Departamento Actualizado", `Se actualizó el departamento ${nombre}`, "update");
            }
        } catch (error) {
            console.error("Error updating departamento:", error);
            // Optimistic update as fallback
            setDepartamentos(prev => prev.map(d => d.id === id ? { ...d, nombre, areas } : d));
            addToLog("Departamento Actualizado", `Se actualizó el departamento ${nombre}`, "update");
        }
    }

    const deleteDepartamento = async (id: string) => {
        try {
            const { deleteDepartamentoAction } = await import("@/app/actions/treasury");
            const result = await deleteDepartamentoAction(id);
            if (result.success) {
                setDepartamentos(prev => prev.filter(d => d.id !== id));
                addToLog("Departamento Eliminado", `Se eliminó un departamento`, "delete");
            }
        } catch (error) {
            console.error("Error deleting departamento:", error);
            // Optimistic update as fallback
            setDepartamentos(prev => prev.filter(d => d.id !== id));
            addToLog("Departamento Eliminado", `Se eliminó un departamento`, "delete");
        }
    }

    // Recursive helper to add item to tree
    const addItemToTree = (items: PresupuestoItem[], parentCode: string, newItem: PresupuestoItem): PresupuestoItem[] => {
        return items.map(item => {
            if (item.codigo === parentCode) {
                return { ...item, subcuentas: [...(item.subcuentas || []), newItem] };
            }
            if (item.subcuentas && item.subcuentas.length > 0) {
                return { ...item, subcuentas: addItemToTree(item.subcuentas, parentCode, newItem) };
            }
            return item;
        });
    };

    const addPresupuestoItem = (item: PresupuestoItem, parentCode?: string) => {
        if (!parentCode) {
            // Add as root Item (Chapter)
            setPresupuesto(prev => {
                const updated = [...prev, item];
                // Sort by code for visual consistency
                return updated.sort((a, b) => a.codigo.localeCompare(b.codigo));
            });
            addToLog("Presupuesto Actualizado", `Se agregó el Capítulo ${item.codigo}`, "create");
        } else {
            // Add as subItem (Concept/Partida)
            setPresupuesto(prev => addItemToTree(prev, parentCode, item));
            addToLog("Presupuesto Actualizado", `Se agregó la Partida ${item.codigo} al Capítulo ${parentCode}`, "create");
        }
    };

    // Función para actualizar el presupuesto desde un egreso
    const updateBudgetFromEgreso = (cog: string, monto: number, fecha: string) => {
        const date = new Date(fecha);
        const monthIndex = date.getMonth();
        const monthKeys = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const contableKey = `${monthKeys[monthIndex]}_contable` as keyof PresupuestoItem;

        const updateItemRecursive = (items: PresupuestoItem[]): PresupuestoItem[] => {
            return items.map(item => {
                if (item.cog === cog || item.codigo === cog) {
                    return {
                        ...item,
                        [contableKey]: (item[contableKey] as number || 0) + monto,
                        devengado: (item.devengado || 0) + monto
                    };
                }
                if (item.subcuentas && item.subcuentas.length > 0) {
                    const updatedSubcuentas = updateItemRecursive(item.subcuentas);
                    const hasUpdate = updatedSubcuentas.some((sub, idx) => sub !== item.subcuentas![idx]);
                    if (hasUpdate) {
                        return {
                            ...item,
                            subcuentas: updatedSubcuentas,
                            [contableKey]: (item[contableKey] as number || 0) + monto,
                            devengado: (item.devengado || 0) + monto
                        };
                    }
                }
                return item;
            });
        };

        setPresupuesto(prev => updateItemRecursive(prev));
    };

    const addToLog = (action: string, details: string, type: LogEntry["type"] = "update") => {
        const newEntry: LogEntry = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleString("es-MX", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
            action,
            details,
            user: "Tesorero",
            type
        };
        setSystemLog(prev => [newEntry, ...prev]);
    };

    const approveTransaction = async (id: string, type: "Ingreso" | "Egreso") => {
        if (type === "Egreso") {
            const egreso = egresosContables.find(e => e.id === id);
            if (!egreso || egreso.estatus !== "Pendiente") return;

            // 1. Update Egreso Status in DB first
            try {
                const { updateEgreso } = await import("@/app/actions/treasury");
                await updateEgreso(id, { estatus: "Pagado" });
            } catch (error) {
                console.error("Error persisting egreso approval:", error);
            }

            // 2. Update local state
            setEgresosContables(prev => prev.map(e => e.id === id ? { ...e, estatus: "Pagado" } : e));

            // 3. Update Bank Account
            setCuentas(prev => prev.map(acc => {
                // Robust Match: ID, Number, Alias, or Bank Name
                const target = egreso.cuentaBancaria;
                const isMatch = acc.id === target ||
                    acc.numeroCuenta === target ||
                    acc.alias === target ||
                    acc.banco === target;

                if (isMatch) {
                    const newTransaction: Transaction = {
                        id: `txn-aprob-${Date.now()}`,
                        fecha: new Date().toISOString().split('T')[0],
                        concepto: egreso.concepto,
                        referencia: `Apr. Egreso ${id}`,
                        monto: egreso.monto,
                        tipo: "Egreso",
                        estatus: "Completado"
                    };
                    return {
                        ...acc,
                        saldo: acc.saldo - egreso.monto,
                        saldoDisponible: acc.saldoDisponible - egreso.monto,
                        movimientosRecientes: [newTransaction, ...acc.movimientosRecientes]
                    };
                }
                return acc;
            }));

            // 4. Update Presupuesto de Egresos - reflect the amount in the COG partida by month
            updateBudgetFromEgreso(egreso.cog, egreso.monto, egreso.fecha);

            addToLog("Egreso Aprobado", `Egreso ${id} aprobado y descontado`, "update");
        } else {
            // INGRESO LOGIC
            const ingreso = ingresosContables.find(i => i.id === id);
            // Note: Ingresocontable uses 'estado'
            if (!ingreso || ingreso.estado !== "Pendiente") return;

            // 1. Update Ingreso Status in DB first
            try {
                const { updateIngreso } = await import("@/app/actions/treasury");
                await updateIngreso(id, { estado: "Completado" });
            } catch (error) {
                console.error("Error persisting ingreso approval:", error);
            }

            setIngresosContables(prev => prev.map(i => i.id === id ? { ...i, estado: "Completado" } : i));

            // 2. Update Bank Account for Ingreso
            setCuentas(prev => prev.map(acc => {
                const target = ingreso.cuentaBancaria;
                const isMatch = acc.id === target || acc.numeroCuenta === target || acc.alias === target;

                if (isMatch) {
                    const newTransaction: Transaction = {
                        id: `txn-ing-aprob-${Date.now()}`,
                        fecha: new Date().toISOString().split('T')[0],
                        concepto: ingreso.concepto,
                        referencia: `Apr. Ingreso ${id}`,
                        monto: ingreso.monto,
                        tipo: "Ingreso",
                        estatus: "Completado"
                    };
                    return {
                        ...acc,
                        saldo: acc.saldo + ingreso.monto,
                        saldoDisponible: acc.saldoDisponible + ingreso.monto,
                        movimientosRecientes: [newTransaction, ...acc.movimientosRecientes]
                    }
                }
                return acc;
            }));

            addToLog("Ingreso Aprobado", `Ingreso ${id} marcado como completado y sumado`, "update");
        }
    };

    const rejectTransaction = async (id: string, type: "Ingreso" | "Egreso") => {
        if (type === "Egreso") {
            // 1. Update Egreso Status in DB first (persistent)
            try {
                const { updateEgreso } = await import("@/app/actions/treasury");
                await updateEgreso(id, { estatus: "Cancelado" });
            } catch (error) {
                console.error("Error persisting egreso rejection:", error);
            }

            // 2. Update local state
            setEgresosContables(prev => prev.map(e => e.id === id ? { ...e, estatus: "Cancelado" } : e));
            addToLog("Egreso Rechazado", `Egreso ${id} cancelado`, "delete");
        } else {
            // 1. Update Ingreso Status in DB first (persistent)
            try {
                const { updateIngreso } = await import("@/app/actions/treasury");
                await updateIngreso(id, { estado: "Procesando" });
            } catch (error) {
                console.error("Error persisting ingreso rejection:", error);
            }

            // 2. Update local state
            setIngresosContables(prev => prev.map(i => i.id === id ? { ...i, estado: "Procesando" } : i));
            addToLog("Ingreso Rechazado", `Ingreso ${id} cancelado`, "delete");
        }
    };

    // Función para actualizar la ley de ingresos desde un ingreso
    const updateLeyIngresosFromIngreso = (cuentaContable: string, monto: number, fecha: string) => {
        const date = new Date(fecha);
        const monthIndex = date.getMonth();
        const monthKeys = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const contableKey = `${monthKeys[monthIndex]}_contable` as keyof PresupuestoItem;

        const updateItemRecursive = (items: PresupuestoItem[]): PresupuestoItem[] => {
            return items.map(item => {
                if (item.codigo === cuentaContable) {
                    return {
                        ...item,
                        [contableKey]: (item[contableKey] as number || 0) + monto,
                        devengado: (item.devengado || 0) + monto
                    };
                }
                if (item.subcuentas && item.subcuentas.length > 0) {
                    const updatedSubcuentas = updateItemRecursive(item.subcuentas);
                    const hasUpdate = updatedSubcuentas.some((sub, idx) => sub !== item.subcuentas![idx]);
                    if (hasUpdate) {
                        return {
                            ...item,
                            subcuentas: updatedSubcuentas,
                            [contableKey]: (item[contableKey] as number || 0) + monto,
                            devengado: (item.devengado || 0) + monto
                        };
                    }
                }
                return item;
            });
        };

        setLeyIngresos(prev => updateItemRecursive(prev));
    };

    // Memoize the context value to prevent unnecessary re-renders in consumers
    const contextValue = React.useMemo(() => ({
        cuentas, setCuentas,
        systemLog, setSystemLog, addToLog,
        ingresosContables, setIngresosContables,
        egresosContables, setEgresosContables,
        fuentes, addFuente, deleteFuente: deleteFuenteHandler,
        origenes, addOrigen, deleteOrigen,
        departamentos, addDepartamento, updateDepartamento, deleteDepartamento,
        presupuesto,
        setPresupuesto,
        addPresupuestoItem,
        updateBudgetFromEgreso,
        leyIngresos,
        setLeyIngresos,
        updateLeyIngresosFromIngreso,
        proveedores, setProveedores, addProveedor,
        config, setConfig,
        fiscalConfig, setFiscalConfig,
        firmantes, setFirmantes,
        paymentOrderSigners, setPaymentOrderSigners,
        approveTransaction, rejectTransaction,
        nextPaymentOrderFolio, incrementPaymentOrderFolio
    }), [
        cuentas, systemLog, ingresosContables, egresosContables, fuentes, origenes, departamentos,
        presupuesto, leyIngresos, proveedores, config, fiscalConfig, firmantes, paymentOrderSigners, nextPaymentOrderFolio
    ]);

    return (
        <TreasuryContext.Provider value={contextValue}>
            {children}
        </TreasuryContext.Provider>
    );
}

// --- HOOK ---
export function useTreasury() {
    const context = useContext(TreasuryContext);
    if (context === undefined) {
        throw new Error("useTreasury must be used within a TreasuryProvider");
    }
    return context;
}
