"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
    Plus, Search, Edit2, Filter, Layers, FileDigit, Hash
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PartidasPage() {
    const [mounted, setMounted] = React.useState(false)
    const [isOpen, setIsOpen] = React.useState(false) // Controla el modal
    const [isEditing, setIsEditing] = React.useState(false) // Sabe si es edición o nuevo

    React.useEffect(() => { setMounted(true) }, [])

    // Función para abrir modal en modo "Nuevo"
    const handleNew = () => {
        setIsEditing(false)
        setIsOpen(true)
    }

    // Función para abrir modal en modo "Editar"
    const handleEdit = () => {
        setIsEditing(true)
        setIsOpen(true)
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

                    {/* HEADER */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">Clasificador COG</h1>
                            <p className="text-muted-foreground">Administración de Capítulos, Conceptos y Partidas (Conac).</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="bg-background text-foreground border-border hover:bg-muted">
                                <Filter className="w-4 h-4 mr-2" /> Filtrar Nivel
                            </Button>
                            <Button onClick={handleNew} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md gap-2">
                                <Plus className="w-4 h-4" /> Nueva Partida
                            </Button>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="border-border shadow-sm bg-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Registros</CardTitle>
                                <Hash className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-foreground font-mono tracking-tight">2,405</div>
                            </CardContent>
                        </Card>
                        <Card className="border-border shadow-sm bg-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Capítulos</CardTitle>
                                <Layers className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-foreground font-mono tracking-tight">9</div>
                            </CardContent>
                        </Card>
                        <Card className="border-border shadow-sm bg-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Asignadas</CardTitle>
                                <FileDigit className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-foreground font-mono tracking-tight">342</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* TABLA */}
                    <Card className="border-border shadow-sm overflow-hidden bg-card">
                        <div className="p-4 border-b border-border bg-card flex items-center gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Buscar partida..." className="pl-9 bg-background border-border" />
                            </div>
                        </div>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                                        <TableHead className="w-[120px] font-bold text-muted-foreground uppercase text-xs tracking-wider pl-6">Código</TableHead>
                                        <TableHead className="font-bold text-muted-foreground uppercase text-xs tracking-wider">Descripción</TableHead>
                                        <TableHead className="w-[150px] font-bold text-muted-foreground uppercase text-xs tracking-wider">Nivel</TableHead>
                                        <TableHead className="text-right font-bold text-muted-foreground uppercase text-xs tracking-wider pr-6">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow className="hover:bg-muted/50 border-b border-border transition-colors">
                                        <TableCell className="font-mono font-bold text-foreground pl-6 text-base">1000</TableCell>
                                        <TableCell className="font-bold text-foreground uppercase tracking-tight">Servicios Personales</TableCell>
                                        <TableCell><Badge variant="outline" className="bg-muted text-muted-foreground border-border font-mono text-[10px] uppercase">Capítulo</Badge></TableCell>
                                        <TableCell className="text-right pr-6"><Button onClick={handleEdit} variant="ghost" size="icon"><Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" /></Button></TableCell>
                                    </TableRow>
                                    <TableRow className="hover:bg-muted/50 border-b border-border transition-colors">
                                        <TableCell className="font-mono font-bold text-primary pl-6">21101</TableCell>
                                        <TableCell className="font-medium text-foreground">Materiales y Útiles de Oficina</TableCell>
                                        <TableCell><Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-mono text-[10px] uppercase">Partida</Badge></TableCell>
                                        <TableCell className="text-right pr-6"><Button onClick={handleEdit} variant="ghost" size="icon"><Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" /></Button></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* --- MODAL FORMULARIO --- */}
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{isEditing ? "Editar Partida Presupuestal" : "Registrar Nueva Partida"}</DialogTitle>
                            <DialogDescription>
                                Defina el código COG y su descripción oficial según la LGCG.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="codigo" className="text-right font-semibold text-muted-foreground">Código</Label>
                                <Input id="codigo" defaultValue={isEditing ? "21101" : ""} placeholder="Ej. 21101" className="col-span-3 font-mono" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="desc" className="text-right font-semibold text-muted-foreground">Descripción</Label>
                                <Input id="desc" defaultValue={isEditing ? "Materiales y Útiles" : ""} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-semibold text-muted-foreground">Nivel</Label>
                                <div className="col-span-3">
                                    <Select defaultValue={isEditing ? "especifica" : "capitulo"}>
                                        <SelectTrigger><SelectValue placeholder="Seleccione nivel" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="capitulo">Capítulo (1000)</SelectItem>
                                            <SelectItem value="concepto">Concepto (1100)</SelectItem>
                                            <SelectItem value="generica">Partida Genérica (11100)</SelectItem>
                                            <SelectItem value="especifica">Partida Específica (11101)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setIsOpen(false)}>Guardar Registro</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </SidebarInset>
        </SidebarProvider>
    )
}