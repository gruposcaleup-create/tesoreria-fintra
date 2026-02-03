import { PresupuestoItem, NivelCOG } from "./treasury-context";

type RawCOGItem = {
    codigo: string;
    nombre: string;
    cuenta_registro: string;
    cri: string;
    cog: string;
};

function getNivelFromCodigo(codigo: string): NivelCOG {
    const parts = codigo.split('.');
    // 5.1.1 -> 3 parts -> Capitulo
    // 5.1.1.1 -> 4 parts -> Concepto  
    // 5.1.1.1.01 or deeper -> Partida
    if (parts.length <= 3) return "Capitulo";
    if (parts.length === 4) return "Concepto";
    return "Partida";
}

export function buildCOGTree(rawData: RawCOGItem[]): PresupuestoItem[] {
    const sorted = [...rawData].sort((a, b) => a.codigo.localeCompare(b.codigo));
    const nodeMap = new Map<string, PresupuestoItem>();
    const roots: PresupuestoItem[] = [];

    // Create all nodes
    sorted.forEach(item => {
        const node: PresupuestoItem = {
            codigo: item.codigo,
            descripcion: item.nombre,
            nivel: getNivelFromCodigo(item.codigo),
            fuenteFinanciamiento: "Mixto",
            aprobado: 0,
            modificado: 0,
            devengado: 0,
            pagado: 0,
            subcuentas: [],
            isExpanded: false,
            cuenta_registro: item.cuenta_registro,
            cri: item.cri,
            cog: item.cog
        };
        nodeMap.set(item.codigo, node);
    });

    // Link children to parents
    sorted.forEach(item => {
        const node = nodeMap.get(item.codigo)!;
        const parts = item.codigo.split('.');

        if (parts.length > 3) {
            // Has a parent
            const parentCode = parts.slice(0, -1).join('.');
            const parent = nodeMap.get(parentCode);
            if (parent) {
                parent.subcuentas?.push(node);
            } else {
                roots.push(node);
            }
        } else {
            // Is a root (5.1.1)
            roots.push(node);
        }
    });

    return roots;
}
