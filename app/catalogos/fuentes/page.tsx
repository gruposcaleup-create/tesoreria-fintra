"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Plus, Search, Edit2, Landmark, Wallet, PiggyBank, Trash } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { useTreasury, Fuente } from "@/components/providers/treasury-context"

export default function FuentesPage() {
    const { fuentes, addFuente, deleteFuente, origenes, addOrigen, deleteOrigen } = useTreasury()
    const [mounted, setMounted] = React.useState(false)
    const [isOpen, setIsOpen] = React.useState(false)
    const [isEditing, setIsEditing] = React.useState(false)
    const [viewMode, setViewMode] = React.useState<"FONDOS" | "ORIGENES">("FONDOS")
    const [modalType, setModalType] = React.useState<"FONDO" | "FUENTE">("FONDO")

    // Form state
    const [formData, setFormData] = React.useState<Partial<Fuente>>({ origen: "" })
    const [newOrigenName, setNewOrigenName] = React.useState("")

    React.useEffect(() => { setMounted(true) }, [])

    const handleNew = (type: "FONDO" | "FUENTE") => {
        setModalType(type)
        if (type === "FONDO") {
            setFormData({ origen: origenes[0] || "", acronimo: "", nombre: "" })
        } else {
            setNewOrigenName("")
        }
        setIsEditing(false)
        setIsOpen(true)
    }

    // Placeholder for edit
    const handleEdit = (fuente: Fuente) => {
        setModalType("FONDO")
        setFormData(fuente)
        setIsEditing(true)
        setIsOpen(true)
    }

    const handleSave = () => {
        if (modalType === "FUENTE") {
            if (!newOrigenName) return;
            addOrigen(newOrigenName);
        } else {
            if (!formData.acronimo || !formData.nombre || !formData.origen) return;
            // Edit logic skipped for now
            if (isEditing) {
                // edit implementation
            } else {
                addFuente({
                    id: crypto.randomUUID(),
                    acronimo: formData.acronimo,
                    nombre: formData.nombre,
                    origen: formData.origen
                })
            }
        }
        setIsOpen(false)
    }

    if (!mounted) return <div className="min-h-screen bg-slate-50" />

    return (
        <SidebarProvider
            style={{
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties}
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 pt-6 bg-muted/50 min-h-screen">

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">Fuentes y Fondos</h1>
                            <p className="text-muted-foreground">Origen del recurso financiero (Federal, Estatal, Propio).</p>
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={() => handleNew("FONDO")} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md gap-2">
                                <Plus className="w-4 h-4" /> Nuevo Fondo
                            </Button>
                            <Button onClick={() => handleNew("FUENTE")} variant="secondary" className="shadow-md gap-2">
                                <Plus className="w-4 h-4" /> Nueva Fuente
                            </Button>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card
                            className={`border-border shadow-sm cursor-pointer transition-all ${viewMode === 'FONDOS' ? 'ring-2 ring-primary' : 'opacity-60 hover:opacity-100'}`}
                            onClick={() => setViewMode('FONDOS')}
                        >
                            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground uppercase">Fondos Activos</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-foreground tabular-nums">{fuentes.length}</div></CardContent>
                        </Card>
                        <Card
                            className={`border-border shadow-sm cursor-pointer transition-all ${viewMode === 'ORIGENES' ? 'ring-2 ring-primary' : 'opacity-60 hover:opacity-100'}`}
                            onClick={() => setViewMode('ORIGENES')}
                        >
                            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground uppercase">Fuentes (Orígenes)</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-foreground tabular-nums">{origenes.length}</div></CardContent>
                        </Card>
                    </div>

                    <Card className="border-border shadow-sm overflow-hidden bg-card">
                        <div className="p-4 border-b border-border bg-card flex items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={viewMode === "FONDOS" ? "Buscar fondo..." : "Buscar fuente..."}
                                    className="pl-9 bg-background border-border"
                                />
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">
                                Viendo: <span className="text-foreground">{viewMode === "FONDOS" ? "Catálogo de Fondos" : "Catálogo de Orígenes"}</span>
                            </div>
                        </div>
                        <CardContent className="p-0">
                            {viewMode === "FONDOS" ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                                            <TableHead className="w-[150px] font-bold text-muted-foreground uppercase text-xs tracking-wider pl-6">Acrónimo</TableHead>
                                            <TableHead className="font-bold text-muted-foreground uppercase text-xs tracking-wider">Nombre Oficial</TableHead>
                                            <TableHead className="w-[200px] font-bold text-muted-foreground uppercase text-xs tracking-wider">Fuente (Origen)</TableHead>
                                            <TableHead className="text-right font-bold text-muted-foreground uppercase text-xs tracking-wider pr-6">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {fuentes.map((fuente) => (
                                            <TableRow key={fuente.id} className="hover:bg-muted/50 border-b border-border transition-colors">
                                                <TableCell className="font-mono font-bold text-foreground pl-6 text-sm">{fuente.acronimo}</TableCell>
                                                <TableCell className="text-sm font-medium text-foreground">{fuente.nombre}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-normal bg-muted">
                                                        {fuente.origen}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Button onClick={() => handleEdit(fuente)} variant="ghost" size="icon">
                                                        <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                                    </Button>
                                                    <Button onClick={() => deleteFuente(fuente.id)} variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                        <Trash className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {fuentes.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center">No hay fondos registrados.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                                            <TableHead className="font-bold text-muted-foreground uppercase text-xs tracking-wider pl-6">Nombre de la Fuente / Origen</TableHead>
                                            <TableHead className="text-right font-bold text-muted-foreground uppercase text-xs tracking-wider pr-6">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {origenes.map((origen) => (
                                            <TableRow key={origen} className="hover:bg-muted/50 border-b border-border transition-colors">
                                                <TableCell className="font-medium text-foreground pl-6 text-sm">{origen}</TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Button onClick={() => deleteOrigen(origen)} variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                        <Trash className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {origenes.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={2} className="h-24 text-center">No hay orígenes registrados.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* --- MODAL FORMULARIO --- */}
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{isEditing ? "Editar Fondo" : (modalType === "FONDO" ? "Registrar Nuevo Fondo" : "Registrar Nueva Fuente")}</DialogTitle>
                            <DialogDescription>
                                {modalType === "FONDO" ? "Datos para la identificación contable del recurso." : "Agrega una nueva clasificación de origen."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">

                            {modalType === "FUENTE" ? (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="origenName" className="text-right font-semibold text-muted-foreground">Nombre Fuente</Label>
                                    <Input
                                        id="origenName"
                                        value={newOrigenName}
                                        onChange={(e) => setNewOrigenName(e.target.value)}
                                        placeholder="Ej. Subsidio Federal Extraordinario"
                                        className="col-span-3 bg-background"
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="acronimo" className="text-right font-semibold text-muted-foreground">Acrónimo</Label>
                                        <Input
                                            id="acronimo"
                                            value={formData.acronimo || ""}
                                            onChange={(e) => setFormData({ ...formData, acronimo: e.target.value })}
                                            placeholder="Ej. FISM-24"
                                            className="col-span-3 font-mono uppercase bg-background"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="nombre" className="text-right font-semibold text-muted-foreground">Nombre Oficial</Label>
                                        <Input
                                            id="nombre"
                                            value={formData.nombre || ""}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            className="col-span-3 bg-background"
                                            placeholder="Descripción del Fondo"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right font-semibold text-muted-foreground">Fuente (Origen)</Label>
                                        <div className="col-span-3">
                                            <Select
                                                value={formData.origen}
                                                onValueChange={(val) => setFormData({ ...formData, origen: val })}
                                            >
                                                <SelectTrigger className="bg-background"><SelectValue placeholder="Seleccione Fuente/Origen" /></SelectTrigger>
                                                <SelectContent>
                                                    {origenes.map((orig) => (
                                                        <SelectItem key={orig} value={orig}>{orig}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </>
                            )}

                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleSave}>
                                {modalType === "FONDO" ? "Guardar Fondo" : "Guardar Fuente"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </SidebarInset>
        </SidebarProvider>
    )
}