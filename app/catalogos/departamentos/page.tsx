"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
    Plus, Search, Edit2, Trash2, Building2, Hash, AlertTriangle
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTreasury, Departamento } from "@/components/providers/treasury-context"

export default function DepartamentosPage() {
    const { departamentos, addDepartamento, updateDepartamento, deleteDepartamento } = useTreasury()
    const [mounted, setMounted] = React.useState(false)
    const [isOpen, setIsOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")

    // Edit State
    const [editingId, setEditingId] = React.useState<string | null>(null)
    const [formData, setFormData] = React.useState<{ nombre: string, areas: string[] }>({ nombre: "", areas: [] })
    const [newArea, setNewArea] = React.useState("")

    // Delete State
    const [deleteId, setDeleteId] = React.useState<string | null>(null)

    React.useEffect(() => { setMounted(true) }, [])

    const handleOpen = (dept?: Departamento) => {
        if (dept) {
            setEditingId(dept.id)
            setFormData({ nombre: dept.nombre, areas: dept.areas || [] })
        } else {
            setEditingId(null)
            setFormData({ nombre: "", areas: [] })
        }
        setNewArea("")
        setIsOpen(true)
    }

    const handleSave = () => {
        if (!formData.nombre.trim()) return;

        if (editingId) {
            updateDepartamento(editingId, formData.nombre, formData.areas)
        } else {
            addDepartamento(formData.nombre, formData.areas)
        }
        setIsOpen(false)
    }

    const addArea = () => {
        if (!newArea.trim()) return
        if (formData.areas.includes(newArea.trim())) return
        setFormData(prev => ({ ...prev, areas: [...prev.areas, newArea.trim()] }))
        setNewArea("")
    }

    const removeArea = (areaToRemove: string) => {
        setFormData(prev => ({ ...prev, areas: prev.areas.filter(a => a !== areaToRemove) }))
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addArea()
        }
    }

    const handleDeleteConfirm = () => {
        if (deleteId) {
            deleteDepartamento(deleteId)
            setDeleteId(null)
        }
    }

    const filtered = departamentos.filter(d =>
        d.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    )

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
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">Departamentos</h1>
                            <p className="text-muted-foreground">Catálogo de unidades administrativas y departamentos.</p>
                        </div>
                        <Button onClick={() => handleOpen()} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md gap-2">
                            <Plus className="w-4 h-4" /> Nuevo Departamento
                        </Button>
                    </div>

                    {/* KPI */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className="border-border shadow-sm bg-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Departamentos</CardTitle>
                                <Building2 className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-foreground font-mono tracking-tight">{departamentos.length}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* TABLE */}
                    <Card className="border-border shadow-sm overflow-hidden bg-card">
                        <div className="p-4 border-b border-border bg-card flex items-center gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar departamento..."
                                    className="pl-9 bg-background border-border"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                                        <TableHead className="w-[100px] font-bold text-muted-foreground uppercase text-xs tracking-wider">ID</TableHead>
                                        <TableHead className="font-bold text-muted-foreground uppercase text-xs tracking-wider">Nombre del Departamento</TableHead>
                                        <TableHead className="font-bold text-muted-foreground uppercase text-xs tracking-wider">Áreas / Unidades</TableHead>
                                        <TableHead className="w-[100px] text-right font-bold text-muted-foreground uppercase text-xs tracking-wider pr-6">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((dept, idx) => (
                                        <TableRow key={dept.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                            <TableCell className="font-mono text-xs text-muted-foreground">#{idx + 1}</TableCell>
                                            <TableCell className="font-medium text-foreground">{dept.nombre}</TableCell>
                                            <TableCell className="text-muted-foreground text-xs">
                                                {dept.areas && dept.areas.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {dept.areas.slice(0, 3).map((area, i) => (
                                                            <span key={i} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] border border-slate-200 dark:border-slate-700">
                                                                {area}
                                                            </span>
                                                        ))}
                                                        {dept.areas.length > 3 && (
                                                            <span className="px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                                                +{dept.areas.length - 3} más
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="italic text-slate-400">Sin áreas registradas</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleOpen(dept)}>
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => setDeleteId(dept.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filtered.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                                No se encontraron resultados.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* DIALOG FORM */}
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>{editingId ? "Editar Departamento" : "Agregar Nuevo Departamento"}</DialogTitle>
                                <DialogDescription>
                                    Ingrese el nombre oficial de la unidad administrativa.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="nombre" className="font-semibold text-muted-foreground">Nombre del Departamento</Label>
                                    <Input
                                        id="nombre"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                                        placeholder="Ej. Protección Civil"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label className="font-semibold text-muted-foreground">Áreas / Unidades Administrativas</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={newArea}
                                        onChange={(e) => setNewArea(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Nombre del área (Ej. Recursos Humanos)"
                                        className="flex-1"
                                    />
                                    <Button type="button" onClick={addArea} variant="secondary">Agregar</Button>
                                </div>

                                {/* Areas List */}
                                <div className="mt-2 min-h-[100px] max-h-[200px] overflow-y-auto border rounded-md p-2 bg-slate-50 dark:bg-slate-900/50">
                                    {formData.areas.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic">
                                            No hay áreas agregadas
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {formData.areas.map((area, i) => (
                                                <div key={i} className="flex items-center justify-between text-sm p-2 bg-white dark:bg-slate-950 border rounded shadow-sm group">
                                                    <span>{area}</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => removeArea(area)}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                                <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                    {editingId ? "Guardar Cambios" : "Crear Departamento"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* CONFIRMATION DIALOG */}
                    <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                        <AlertDialogContent className="max-w-md">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                    <AlertTriangle className="h-5 w-5" />
                                    Confirmar Eliminación
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    ¿Está seguro que desea eliminar este departamento? Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
                                    Eliminar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                </div>
            </SidebarInset>
        </SidebarProvider >
    )
}
