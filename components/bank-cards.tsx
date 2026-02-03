"use client"

import React, { useState } from "react"
import {
  Wifi,
  Nfc,
  Eye,
  EyeOff,
  CreditCard as CreditCardIcon,
  MoreHorizontal,
  Landmark,
  Calculator,
  ArrowRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription as UICardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
// NUEVOS IMPORTS
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"

// ... existing code ...

// Componente reutilizable para la tarjeta
interface BankCardProps {
  bankName: string
  balance: string
  last4: string
  scheme: "Visa" | "Mastercard" | "Amex"
  variant?: "dark" | "light" | "outline"
  showData: boolean
  onToggleData: (e?: React.MouseEvent) => void // Updated signature
  style?: React.CSSProperties
  className?: string
}

const BankCard = ({
  bankName,
  balance,
  last4,
  scheme,
  variant = "dark",
  showData,
  onToggleData,
  style,
  className
}: BankCardProps) => {

  // Estilos según la variante
  const variants = {
    dark: "bg-zinc-950 text-white border-zinc-800",
    light: "bg-white text-zinc-950 border-zinc-200",
    outline: "bg-transparent border-dashed border-2 border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 transition-colors"
  }

  const isOutline = variant === "outline"

  return (
    <Card
      className={cn(
        "relative h-[220px] w-full overflow-hidden rounded-xl shadow-sm transition-all duration-300 hover:shadow-md",
        variants[variant],
        className
      )}
      style={style}
    >
      <CardContent className="flex h-full flex-col justify-between p-6">

        {/* --- HEADER: Banco y Chip --- */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5 opacity-70" />
            <span className="font-semibold tracking-tight text-lg">{bankName}</span>
          </div>

          {!isOutline && (
            <Wifi className="h-5 w-5 rotate-90 opacity-50" />
          )}
        </div>

        {/* --- MIDDLE: Chip y NFC --- */}
        {!isOutline ? (
          <div className="flex items-center gap-3">
            {/* Chip Minimalista */}
            <div className={cn(
              "h-9 w-11 rounded-md border bg-gradient-to-br opacity-90",
              variant === 'dark'
                ? "from-yellow-200/20 to-yellow-500/20 border-yellow-500/30"
                : "from-zinc-200 to-zinc-300 border-zinc-400"
            )} />
            <Nfc className="h-6 w-6 opacity-40" />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm font-medium">Tarjeta Virtual / Inactiva</span>
          </div>
        )}

        {/* --- FOOTER: Saldos y Número --- */}
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-medium uppercase opacity-60 tracking-wider">
                Saldo Total
              </p>
              {/* Botón discreto para ver/ocultar */}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-50 hover:opacity-100 hover:bg-transparent"
                onClick={onToggleData}
              >
                {showData ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>

            <div className="flex items-baseline gap-1">
              <h3 className={cn(
                "font-mono text-2xl font-bold tracking-tighter",
                showData ? "" : "blur-sm select-none" // Efecto borroso si está oculto
              )}>
                {showData ? balance : "••••••••••"}
              </h3>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-opacity-10 border-current">
            <div className="flex items-center gap-1 font-mono text-sm opacity-80">
              <span>****</span>
              <span>****</span>
              <span>****</span>
              <span>{showData ? last4 : "****"}</span>
            </div>
            <span className="text-xs font-bold italic tracking-wider opacity-90">
              {scheme.toUpperCase()}
            </span>
          </div>
        </div>
      </CardContent>

      {/* Decoración de fondo sutil (Glass effect) */}
      {
        !isOutline && (
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
        )
      }
    </Card >
  )
}

import { useTreasury } from "@/components/providers/treasury-context"

// ... imports remain the same

// BankCard component remains the same ...

// ... imports

// ... BankCard definition

interface BankCardsProps {
  className?: string
  title?: string
  hideHeader?: boolean
  showAccountingBalance?: boolean // New: Show projected balance
  enableModal?: boolean // New: clickable cards
}

export function BankCards({
  className,
  title = "Mis Tarjetas",
  hideHeader = false,
  showAccountingBalance = false,
  enableModal = true
}: BankCardsProps) {
  const { cuentas, ingresosContables, egresosContables } = useTreasury(); // Get accounting data
  const [showData, setShowData] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<typeof cuentas[0] | null>(null); // State for modal

  const toggleData = () => setShowData(!showData)

  // Función para obtener estilos según el banco
  const getBankStyle = (bankName: string) => {
    const name = bankName.toLowerCase();
    if (name.includes("bbva")) return { background: "linear-gradient(135deg, #004481 0%, #1464A5 100%)", color: "white", border: "none" };
    if (name.includes("banorte")) return { background: "linear-gradient(135deg, #EB0029 0%, #B3001F 100%)", color: "white", border: "none" };
    if (name.includes("santander")) return { background: "linear-gradient(135deg, #EC0000 0%, #CC0000 100%)", color: "white", border: "none" };
    if (name.includes("citibanamex") || name.includes("banamex")) return { background: "linear-gradient(135deg, #005CAA 0%, #003B70 100%)", color: "white", border: "none" };
    if (name.includes("hsbc")) return { background: "linear-gradient(135deg, #DB0011 0%, #900000 100%)", color: "white", border: "none" };
    if (name.includes("scotiabank")) return { background: "linear-gradient(135deg, #EC111A 0%, #A60C12 100%)", color: "white", border: "none" };
    if (name.includes("amex") || name.includes("american express")) return { background: "linear-gradient(135deg, #2F6F9F 0%, #1A4C75 100%)", color: "white", border: "none" };
    if (name.includes("nu")) return { background: "linear-gradient(135deg, #820AD1 0%, #4D067D 100%)", color: "white", border: "none" };
    return { background: "linear-gradient(135deg, #18181b 0%, #27272a 100%)", color: "white", border: "1px solid #3f3f46" };
  }

  const getCardScheme = (bankName: string): "Visa" | "Mastercard" | "Amex" => {
    const name = bankName.toLowerCase();
    if (name.includes("amex")) return "Amex";
    if (name.includes("santander") || name.includes("hsbc")) return "Mastercard";
    return "Visa";
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  // --- CALCULO DE SALDOS CONTABLES ---
  const getAccountingBalance = (account: typeof cuentas[0]) => {
    // 1. Ingresos Contables PENDIENTES
    // Filtramos solo los pendientes para no sumar doble (ya que los completados están en el saldo real)
    // Usamos el ID de cuentaBancaria si existe, para mayor precisión.
    const totalIngresosPendientes = ingresosContables
      .filter(i => {
        const isPending = i.estado === "Pendiente";
        const isMatch = i.cuentaBancaria ? i.cuentaBancaria === account.id : i.fuente === account.fuente;
        return isPending && isMatch;
      })
      .reduce((sum, i) => sum + i.monto, 0);

    // 2. Egresos Contables PENDIENTES
    const totalEgresosPendientes = egresosContables
      .filter(e => {
        const isPending = e.estatus === "Pendiente";
        // Preferimos match por ID, fallback a nombre de banco
        const isMatch = e.cuentaBancaria
          ? e.cuentaBancaria === account.id
          : e.institucionBancaria.toLowerCase().includes(account.banco.toLowerCase());
        return isPending && isMatch;
      })
      .reduce((sum, e) => sum + e.monto, 0);

    return account.saldo + totalIngresosPendientes - totalEgresosPendientes;
  }

  return (
    <div className={cn("w-full", className)}>
      {!hideHeader && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
          <Button variant="outline" size="sm" onClick={toggleData} className="gap-2">
            {showData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showData ? "Ocultar saldos" : "Mostrar saldos"}
          </Button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {cuentas.map((cuenta, index) => {
          const style = getBankStyle(cuenta.banco);

          // Determine displayed balance
          const displayedBalance = showAccountingBalance
            ? getAccountingBalance(cuenta)
            : cuenta.saldo;

          return (
            <div
              key={cuenta.id}
              onClick={() => enableModal && setSelectedAccount(cuenta)}
              className={cn(
                "transition-transform duration-300",
                enableModal ? "cursor-pointer hover:scale-105" : "cursor-default"
              )}
            >
              <BankCard
                bankName={cuenta.banco}
                balance={formatCurrency(displayedBalance)}
                last4={cuenta.numeroCuenta.slice(-4)}
                scheme={getCardScheme(cuenta.banco)}
                variant="dark"
                style={style}
                showData={showData || hideHeader}
                onToggleData={(e) => {
                  e?.stopPropagation(); // Prevent modal opening if clicking eye
                  toggleData();
                }}
              />
            </div>
          )
        })}

        {cuentas.length === 0 && (
          <div className="col-span-3 text-center py-10 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            No hay cuentas registradas. Ve a "Bancos y Cuentas" para agregar una.
          </div>
        )}
      </div>

      {/* --- MODAL DETALLE SALDOS (REAL vs CONTABLE) - REFINED SHADCN DESIGN --- */}
      <Dialog open={!!selectedAccount && enableModal} onOpenChange={(open) => !open && setSelectedAccount(null)}>
        <DialogContent className="max-w-5xl w-full">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <Landmark className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Detalle de Saldos: {selectedAccount?.banco}</DialogTitle>
                <DialogDescription>
                  Comparativa entre saldo real bancario y saldo contable proyectado.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* CARD 1: SALDO REAL */}
            <Card className="border-muted bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Landmark className="h-4 w-4" />
                  Saldo Real (Bancario)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">
                  {selectedAccount && formatCurrency(selectedAccount.saldo)}
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                  Sincronizado Oficialmente
                </p>
              </CardContent>
            </Card>

            {/* CARD 2: SALDO CONTABLE */}
            <Card className="border-primary/20 bg-primary/5 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-primary uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Saldo Contable
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary tabular-nums">
                  {selectedAccount && formatCurrency(getAccountingBalance(selectedAccount))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Base Inicial + Ingresos - Egresos
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setSelectedAccount(null)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}