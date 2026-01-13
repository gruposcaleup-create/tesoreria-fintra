export type Movement = {
    id: string
    date: string
    concept: string
    bank: "BBVA" | "Santander" | "Banorte" | "AMEX" | "Caja Chica"
    type: "Ingreso" | "Egreso"
    amount: number
    status: "Completado" | "Pendiente" | "Rechazado"
}

export const DATA_MOVEMENTS: Movement[] = []
