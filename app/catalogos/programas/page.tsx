"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Plus, Search, Users, HeartHandshake, MoreHorizontal, Filter, FolderOpen } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function ProgramasPage() {
    const [mounted, setMounted] = React.useState(false)
    const [isOpen, setIsOpen] = React.useState(false)

    React.useEffect(() => { setMounted(true) }, [])

    const handleNew = () => setIsOpen(true)
    // Nota: En la tabla de programas usé un dropdown menu, 
    // así que el "Editar" estaría dentro de ese dropdown.

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
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">Programas Sociales</h1>
                            <p className="text-muted-foreground">Catálogo de obras y acciones sociales autorizadas.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="bg-background text-foreground border-border hover:bg-muted">
                                <Filter className="w-4 h-4 mr-2" /> Filtrar Estatus
                            </Button>
                            <Button onClick={handleNew} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
                                <Plus className="w-4 h-4 mr-2" /> Nuevo Programa
                            </Button>
                        </div>
                    </div>

                    {/* KPIs se mantienen igual... */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="border-border shadow-sm bg-card"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground uppercase">Programas Activos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">12</div></CardContent></Card>
                        {/* ... */}
                    </div>

                    <Card className="border-border shadow-sm overflow-hidden bg-card">
                        <div className="p-4 border-b border-border bg-card flex items-center gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Buscar programa..." className="pl-9 bg-background border-border" />
                            </div>
                        </div>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                                        <TableHead className="w-[100px] font-bold text-muted-foreground uppercase text-xs tracking-wider pl-6">Clave</TableHead>
                                        <TableHead className="font-bold text-muted-foreground uppercase text-xs tracking-wider">Nombre del Programa</TableHead>
                                        <TableHead className="w-[150px] font-bold text-muted-foreground uppercase text-xs tracking-wider">Fuente</TableHead>
                                        <TableHead className="w-[150px] font-bold text-muted-foreground uppercase text-xs tracking-wider">Estatus</TableHead>
                                        <TableHead className="w-[120px] font-bold text-muted-foreground uppercase text-xs tracking-wider text-right pr-6">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow className="hover:bg-muted/50 border-b border-border transition-colors">
                                        <TableCell className="font-mono font-bold text-blue-900 dark:text-blue-300 pl-6">PROG-001</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col"><span className="font-medium text-foreground">Apoyo Alimentario</span></div>
                                        </TableCell>
                                        <TableCell><Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-mono text-[10px]">FORTAMUN</Badge></TableCell>
                                        <TableCell><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emerald-500"></div><span className="text-sm text-muted-foreground">Activo</span></div></TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => setIsOpen(true)}>Editar Datos</DropdownMenuItem>
                                                    <DropdownMenuItem>Ver Padrón</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                    {/* ... Más filas ... */}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* --- MODAL FORMULARIO PROGRAMA --- */}
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Registro de Programa Social</DialogTitle>
                            <DialogDescription>
                                Datos generales y fuente de financiamiento autorizada.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="clave" className="text-right font-semibold text-muted-foreground">Clave</Label>
                                <Input id="clave" placeholder="Ej. PROG-005" className="col-span-3 font-mono uppercase bg-background" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="nombre_prog" className="text-right font-semibold text-muted-foreground">Nombre</Label>
                                <Input id="nombre_prog" placeholder="Nombre del programa" className="col-span-3 bg-background" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-semibold text-muted-foreground">Fuente</Label>
                                <div className="col-span-3">
                                    <Select>
                                        <SelectTrigger className="bg-background"><SelectValue placeholder="Seleccione fuente" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fism">FISM-DF</SelectItem>
                                            <SelectItem value="fortamun">FORTAMUN</SelectItem>
                                            <SelectItem value="fiscales">Recursos Fiscales</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-semibold text-muted-foreground">Estatus</Label>
                                <div className="col-span-3">
                                    <Select defaultValue="activo">
                                        <SelectTrigger className="bg-background"><SelectValue placeholder="Estado actual" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="activo">Activo (En operación)</SelectItem>
                                            <SelectItem value="cerrado">Cerrado (Concluido)</SelectItem>
                                            <SelectItem value="suspendido">Suspendido</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setIsOpen(false)}>Crear Programa</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </SidebarInset>
        </SidebarProvider>
    )
}