"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

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

// --- TIPOS PRESUPUESTALES ---
export type NivelCOG = "Capitulo" | "Concepto" | "Partida";

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
}

// --- DATA PRESUPUESTO INICIAL ---
export const INITIAL_PRESUPUESTO: PresupuestoItem[] = [
    {
        codigo: "1000",
        descripcion: "Servicios personales",
        nivel: "Capitulo",
        fuenteFinanciamiento: "Mixto",
        aprobado: 0.0,
        modificado: 0.0,
        devengado: 0.0,
        pagado: 0.0,
        isExpanded: false,
        subcuentas: [
            { codigo: "1100", descripcion: "Remuneraciones al Personal de Carácter Permanente", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false },
            { codigo: "1200", descripcion: "Remuneraciones al personal de carácter transitorio", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false },
            { codigo: "1300", descripcion: "Remuneraciones adicionales y especiales", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false },
            { codigo: "1400", descripcion: "Seguridad social", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false },
            { codigo: "1500", descripcion: "Otras prestaciones sociales y económicas", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false },
            { codigo: "1600", descripcion: "Previsiones", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false },
            { codigo: "1700", descripcion: "Pago de estímulos a servidores públicos", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false }
        ]
    },
    {
        codigo: "2000",
        descripcion: "Materiales y suministros",
        nivel: "Capitulo",
        fuenteFinanciamiento: "Mixto",
        aprobado: 0.0,
        modificado: 0.0,
        devengado: 0.0,
        pagado: 0.0,
        isExpanded: false,
        subcuentas: [
            { codigo: "2100", descripcion: "Materiales de administración, emisión de documentos y artículos oficiales", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false },
            { codigo: "2200", descripcion: "Alimentos y utensilios", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false },
            { codigo: "2300", descripcion: "Materias primas y materiales de producción y comercialización", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false },
            { codigo: "2400", descripcion: "Materiales y artículos de construcción y de reparación", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false },
            { codigo: "2500", descripcion: "Productos químicos, farmacéuticos y de laboratorio", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false },
            { codigo: "2600", descripcion: "Combustibles, lubricantes y aditivos", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false },
            { codigo: "2700", descripcion: "Vestuario, blancos, prendas de protección y artículos deportivos", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false },
            { codigo: "2800", descripcion: "Materiales y suministros para seguridad", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false },
            { codigo: "2900", descripcion: "Herramientas, refacciones y accesorios menores", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false }
        ]
    },
    {
        codigo: "3000",
        descripcion: "Servicios generales",
        nivel: "Capitulo",
        fuenteFinanciamiento: "Mixto",
        aprobado: 0.0,
        modificado: 0.0,
        devengado: 0.0,
        pagado: 0.0,
        isExpanded: false,
        subcuentas: [
            { codigo: "3100", descripcion: "Servicios básicos", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false },
            { codigo: "3200", descripcion: "Servicios de arrendamiento", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false },
            { codigo: "3300", descripcion: "Servicios Profesionales, Científicos y Técnicos y Otros Servicios", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false },
            { codigo: "3400", descripcion: "Servicios financieros, bancarios y comerciales", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false },
            { codigo: "3500", descripcion: "Servicios de instalación, reparación, mantenimiento y conservación", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false },
            { codigo: "3600", descripcion: "Servicios de comunicación social y publicidad", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false },
            { codigo: "3700", descripcion: "Servicios de traslado y viáticos", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false },
            { codigo: "3800", descripcion: "Servicios oficiales", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false },
            { codigo: "3900", descripcion: "Otros servicios generales", nivel: "Concepto", fuenteFinanciamiento: "Mixto", aprobado: 0.0, modificado: 0.0, devengado: 0.0, pagado: 0.0, subcuentas: [], isExpanded: false }
        ]
    }
];

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

// --- CONTEXT ---
interface TreasuryContextType {
    cuentas: BankAccount[];
    setCuentas: React.Dispatch<React.SetStateAction<BankAccount[]>>;
    systemLog: LogEntry[];
    setSystemLog: React.Dispatch<React.SetStateAction<LogEntry[]>>;
    addToLog: (action: string, details: string, type?: LogEntry["type"]) => void;
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
    // New (Presupuesto)
    presupuesto: PresupuestoItem[];
    addPresupuestoItem: (item: PresupuestoItem, parentCode?: string) => void;
}

const TreasuryContext = createContext<TreasuryContextType | undefined>(undefined);

export function TreasuryProvider({ children }: { children: ReactNode }) {
    const [cuentas, setCuentas] = useState<BankAccount[]>(DATA_CUENTAS);
    const [systemLog, setSystemLog] = useState<LogEntry[]>(DATA_LOG);
    const [ingresosContables, setIngresosContables] = useState<IngresoContable[]>(INITIAL_INGRESOS);
    const [egresosContables, setEgresosContables] = useState<EgresoContable[]>(INITIAL_EGRESOS);
    const [fuentes, setFuentes] = useState<Fuente[]>(INITIAL_FUENTES);
    const [origenes, setOrigenes] = useState<string[]>(INITIAL_ORIGENES);
    const [presupuesto, setPresupuesto] = useState<PresupuestoItem[]>(INITIAL_PRESUPUESTO);
    const [config, setConfig] = useState({ logoLeft: "", logoRight: "" });
    const [fiscalConfig, setFiscalConfig] = useState({
        nombreEnte: "",
        rfc: "",
        regimen: "",
        cp: "",
        domicilio: ""
    });

    const [firmantes, setFirmantes] = useState<Firmante[]>([]);

    const addFuente = (fuente: Fuente) => {
        setFuentes(prev => [...prev, fuente]);
        addToLog("Fondo Agregado", `Se agregó el fondo ${fuente.acronimo}`, "create");
    }

    const deleteFuente = (id: string) => {
        setFuentes(prev => prev.filter(f => f.id !== id));
        addToLog("Fondo Eliminado", `Se eliminó un fondo`, "delete");
    }

    const addOrigen = (origen: string) => {
        setOrigenes(prev => [...prev, origen]);
        addToLog("Fuente Agregada", `Se agregó la fuente ${origen}`, "create");
    }

    const deleteOrigen = (origen: string) => {
        setOrigenes(prev => prev.filter(o => o !== origen));
        addToLog("Fuente Eliminada", `Se eliminó la fuente ${origen}`, "delete");
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
    }

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

    const approveTransaction = (id: string, type: "Ingreso" | "Egreso") => {
        if (type === "Egreso") {
            const egreso = egresosContables.find(e => e.id === id);
            if (!egreso || egreso.estatus !== "Pendiente") return;

            // 1. Update Egreso Status
            setEgresosContables(prev => prev.map(e => e.id === id ? { ...e, estatus: "Pagado" } : e));

            // 2. Update Bank Account
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
            addToLog("Egreso Aprobado", `Egreso ${id} aprobado y descontado`, "update");
        } else {
            // INGRESO LOGIC
            const ingreso = ingresosContables.find(i => i.id === id);
            // Note: Ingresocontable uses 'estado'
            if (!ingreso || ingreso.estado !== "Pendiente") return;

            setIngresosContables(prev => prev.map(i => i.id === id ? { ...i, estado: "Completado" } : i));

            // 2. Update Bank Account for Ingreso
            // Note: We need 'cuentaBancaria' field in IngresoContable or 'fuente' logic.
            // Assuming we will add 'cuentaBancaria' prop to IngresoContable in 'add-ingreso-dialog'.
            // Assuming we will add 'cuentaBancaria' to IngresoContable type as well.
            // For now, I will optimistically check 'fuente' or 'id' if we start saving ID there.
            // Wait, I need to update IngresoContable Type too! I will do that in next step. 
            // For now, I'll put the logic assuming 'fuente' holds the Account ID (which is the plan).

            setCuentas(prev => prev.map(acc => {
                const target = ingreso.cuentaBancaria; // Assuming we save Account ID in 'fuente' or 'cuentaBancaria' field (to be added)
                // Let's use robust matching again just in case.
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

    const rejectTransaction = (id: string, type: "Ingreso" | "Egreso") => {
        if (type === "Egreso") {
            setEgresosContables(prev => prev.map(e => e.id === id ? { ...e, estatus: "Cancelado" } : e));
            addToLog("Egreso Rechazado", `Egreso ${id} cancelado`, "delete");
        } else {
            setIngresosContables(prev => prev.map(i => i.id === id ? { ...i, estado: "Procesando" } : i)); // Or equivalent to Cancelado
        }
    };

    return (
        <TreasuryContext.Provider value={{
            cuentas, setCuentas,
            systemLog, setSystemLog, addToLog,
            ingresosContables, setIngresosContables,
            egresosContables, setEgresosContables,
            fuentes, addFuente, deleteFuente,
            origenes, addOrigen, deleteOrigen,
            presupuesto, addPresupuestoItem,
            config, setConfig,
            fiscalConfig, setFiscalConfig,
            firmantes, setFirmantes,
            approveTransaction, rejectTransaction
        }}>
            {children}
        </TreasuryContext.Provider>
    );
}

// --- CONTEXT INTERFACE ---
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
    // New (Presupuesto)
    presupuesto: PresupuestoItem[];
    addPresupuestoItem: (item: PresupuestoItem, parentCode?: string) => void;
    // New (System Config)
    config: { logoLeft: string, logoRight: string };
    setConfig: React.Dispatch<React.SetStateAction<{ logoLeft: string, logoRight: string }>>;

    fiscalConfig: { nombreEnte: string, rfc: string, regimen: string, cp: string, domicilio: string };
    setFiscalConfig: React.Dispatch<React.SetStateAction<{ nombreEnte: string, rfc: string, regimen: string, cp: string, domicilio: string }>>;

    firmantes: Firmante[];
    setFirmantes: React.Dispatch<React.SetStateAction<Firmante[]>>;
}

export function useTreasury() {
    const context = useContext(TreasuryContext);
    if (context === undefined) {
        throw new Error("useTreasury must be used within a TreasuryProvider");
    }
    return context;
}
