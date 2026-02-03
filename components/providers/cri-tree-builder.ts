
// Reusing PresupuestoItem type structure but adapted for CRI if needed, 
// for now we use the same structure as it is compatible
import { PresupuestoItem } from "./treasury-context";

export type RawCRIItem = {
    codigo: string;
    nombre: string;
    cuenta_de_registro: string;
    cri: string;
};

// Simplified hierarchical level logic based on dots/length as requested
// 4 -> Capitulo (Root)
// 4.1 -> Concepto (conceptually)
// 4.1.1 -> Partida Generica
// ... etc
// We will assign "Capitulo" to single digits (or 3 parts like 4.1.1 if we follow COG)
// Let's adapt to the user's request: "hierarchy of chapter, concept and item"

function getNivelFromCodigo(codigo: string): PresupuestoItem["nivel"] {
    const parts = codigo.split('.');

    // Based on visual hierarchy in the user's data:
    // 4 -> Capitulo
    // 4.1 -> Concepto
    // 4.1.1 -> Partida (or deeper)

    // However, looking at COG logic:
    // 5.1.1 (3 parts) -> Capitulo
    // 5.1.1.1 (4 parts) -> Concepto

    // In CRI data provided:
    // 4 (1 part) -> Capitulo
    // 4.1 (2 parts) -> Concepto? 
    // Wait, typical CONAC hierarchy is Rubro(1), Tipo(2), Clase(3), Concepto(4)

    // User asked for "Capitulo, Concepto y Partida" hierarchy.
    // I will map:
    // 1 part ("4") -> Capitulo
    // 2 parts ("4.1") -> Concepto 
    // 3+ parts -> Partida

    if (parts.length === 1) return "Capitulo";
    if (parts.length === 2) return "Concepto";
    return "Partida";
}

export function buildCRITree(rawData: RawCRIItem[]): PresupuestoItem[] {
    const sorted = [...rawData].sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true, sensitivity: 'base' }));
    const nodeMap = new Map<string, PresupuestoItem>();
    const roots: PresupuestoItem[] = [];

    // Create all nodes
    sorted.forEach(item => {
        const node: PresupuestoItem = {
            codigo: item.codigo,
            descripcion: item.nombre,
            nivel: getNivelFromCodigo(item.codigo),
            fuenteFinanciamiento: "Mixto", // Default
            aprobado: 0,
            modificado: 0,
            devengado: 0,
            pagado: 0,
            subcuentas: [],
            isExpanded: false,
            cuenta_registro: item.cuenta_de_registro,
            cri: item.cri
            // cog is undefined
        };
        nodeMap.set(item.codigo, node);
    });

    // Link children to parents
    sorted.forEach(item => {
        const node = nodeMap.get(item.codigo)!;
        const parts = item.codigo.split('.');

        if (parts.length > 1) {
            // Has a parent
            const parentCode = parts.slice(0, -1).join('.');
            const parent = nodeMap.get(parentCode);
            if (parent) {
                parent.subcuentas?.push(node);
            } else {
                // Orphan or partial root logic (if parent missing, treat as root or skip?)
                // In this dataset, parents seem to exist.
                // 4.1 needs 4. 4 needs nothing.
                roots.push(node);
            }
        } else {
            // Is a root (e.g. "4")
            roots.push(node);
        }
    });

    return roots;
}
