"use client"

import React, { useState } from "react"
import {
    Building2, Users, ShieldCheck, CreditCard,
    Save, Upload, Plus, Trash2, Lock, Check,
    Palette, Moon, Sun, Laptop, FileText
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useTheme } from "next-themes"
import { useTreasury } from "@/components/providers/treasury-context"
import { useToast } from "@/components/ui/use-toast"

export default function SettingsModule() {
    const [is2FAEnabled, setIs2FAEnabled] = useState(false)
    const { setTheme } = useTheme()
    const { toast } = useToast()
    const { config, setConfig, addToLog, fiscalConfig, setFiscalConfig, firmantes, setFirmantes, paymentOrderSigners, setPaymentOrderSigners } = useTreasury()

    // Estado local para firmantes de póliza de pago
    const [localPaymentOrderSigners, setLocalPaymentOrderSigners] = useState(paymentOrderSigners)

    // Sincronizar estado local cuando cambie el contexto
    React.useEffect(() => {
        setLocalPaymentOrderSigners(paymentOrderSigners)
    }, [paymentOrderSigners])

    // Handlers for Logos
    const handleLogoChange = (side: "left" | "right", value: string) => {
        setConfig(prev => ({ ...prev, [side === "left" ? "logoLeft" : "logoRight"]: value }));
    };

    const handleSavePaymentOrderSigners = () => {
        setPaymentOrderSigners(localPaymentOrderSigners)
        addToLog("Configuración Actualizada", "Se actualizaron los firmantes de póliza de pago", "update")
        toast({
            title: "Cambios Guardados Exitosamente",
            description: "Los firmantes de póliza se han actualizado correctamente.",
            duration: 3000
        })
    }

    const removeSigner = (id: string) => {
        setFirmantes(prev => prev.filter(s => s.id !== id));
        addToLog("Firmante Eliminado", "Se eliminó un firmante de la configuración", "delete");
        toast({ title: "Firmante Eliminado", description: "El firmante ha sido removido correctamente." });
    };

    const addSigner = () => {
        setFirmantes(prev => [...prev, { id: Date.now().toString(), nombre: "Nuevo Firmante", puesto: "Cargo" }]);
        addToLog("Firmante Agregado", "Se agregó un nuevo firmante", "create");
    };

    return (
        <div className="flex flex-col gap-6 p-2 md:p-6 bg-slate-50/50 dark:bg-black min-h-screen">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Configuración</h1>
                    <p className="text-muted-foreground">Administración de la cuenta, seguridad y plan de suscripción.</p>
                </div>
            </div>

            <Tabs defaultValue="perfil" className="space-y-6">

                {/* NAVEGACIÓN */}
                <div className="flex items-center">
                    <TabsList className="bg-white dark:bg-slate-950 border h-10 p-1">
                        <TabsTrigger value="perfil" className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800">
                            <Building2 className="w-4 h-4 mr-2" /> Perfil
                        </TabsTrigger>
                        <TabsTrigger value="reportes" className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800">
                            <FileText className="w-4 h-4 mr-2" /> Reportes
                        </TabsTrigger>
                        <TabsTrigger value="usuarios" className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800">
                            <Users className="w-4 h-4 mr-2" /> Usuarios
                        </TabsTrigger>

                        <TabsTrigger value="seguridad" className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800">
                            <ShieldCheck className="w-4 h-4 mr-2" /> Seguridad
                        </TabsTrigger>
                        <TabsTrigger value="facturacion" className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800">
                            <CreditCard className="w-4 h-4 mr-2" /> Planes
                        </TabsTrigger>
                        <TabsTrigger value="apariencia" className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800">
                            <Palette className="w-4 h-4 mr-2" /> Apariencia
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* --- TAB 1: PERFIL --- */}
                <TabsContent value="perfil" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Identidad</CardTitle>
                                    <CardDescription>Escudo para reportes oficiales.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center gap-4">
                                    <div className="h-40 w-40 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-slate-400 transition-colors">
                                        <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 group-hover:text-slate-500" />
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full">Subir Imagen</Button>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Datos Fiscales</CardTitle>
                                    <CardDescription>Información del Ente Público para facturación y timbrado.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Nombre del Ente</Label>
                                            <Input
                                                value={fiscalConfig.nombreEnte}
                                                onChange={(e) => setFiscalConfig(prev => ({ ...prev, nombreEnte: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>RFC</Label>
                                            <Input
                                                value={fiscalConfig.rfc}
                                                onChange={(e) => setFiscalConfig(prev => ({ ...prev, rfc: e.target.value }))}
                                                className="font-mono uppercase"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Régimen Fiscal</Label>
                                            <Select
                                                value={fiscalConfig.regimen}
                                                onValueChange={(val) => setFiscalConfig(prev => ({ ...prev, regimen: val }))}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="601">601 - General de Ley Personas Morales</SelectItem>
                                                    <SelectItem value="603">603 - Personas Morales con Fines no Lucrativos</SelectItem>
                                                    <SelectItem value="605">605 - Sueldos y Salarios e Ingresos Asimilados a Salarios</SelectItem>
                                                    <SelectItem value="606">606 - Arrendamiento</SelectItem>
                                                    <SelectItem value="607">607 - Régimen de Enajenación o Adquisición de Bienes</SelectItem>
                                                    <SelectItem value="608">608 - Demás ingresos</SelectItem>
                                                    <SelectItem value="610">610 - Residentes en el Extranjero sin Establecimiento Permanente en México</SelectItem>
                                                    <SelectItem value="611">611 - Ingresos por Dividendos (socios y accionistas)</SelectItem>
                                                    <SelectItem value="612">612 - Personas Físicas con Actividades Empresariales y Profesionales</SelectItem>
                                                    <SelectItem value="614">614 - Ingresos por intereses</SelectItem>
                                                    <SelectItem value="615">615 - Régimen de los ingresos por obtención de premios</SelectItem>
                                                    <SelectItem value="616">616 - Sin obligaciones fiscales</SelectItem>
                                                    <SelectItem value="620">620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos</SelectItem>
                                                    <SelectItem value="621">621 - Incorporación Fiscal</SelectItem>
                                                    <SelectItem value="622">622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras</SelectItem>
                                                    <SelectItem value="623">623 - Opcional para Grupos de Sociedades</SelectItem>
                                                    <SelectItem value="624">624 - Coordinados</SelectItem>
                                                    <SelectItem value="625">625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas</SelectItem>
                                                    <SelectItem value="626">626 - Régimen Simplificado de Confianza</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>C.P.</Label>
                                            <Input
                                                value={fiscalConfig.cp}
                                                onChange={(e) => setFiscalConfig(prev => ({ ...prev, cp: e.target.value }))}
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label>Domicilio</Label>
                                            <Input
                                                value={fiscalConfig.domicilio}
                                                onChange={(e) => setFiscalConfig(prev => ({ ...prev, domicilio: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t px-6 py-4 flex justify-end">
                                    <Button
                                        className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-100"
                                        onClick={() => {
                                            addToLog("Perfil Actualizado", "Se guardaron los datos fiscales", "update")
                                            toast({ title: "Perfil Actualizado", description: "Los datos fiscales se han guardado correctamente.", duration: 3000 })
                                        }}
                                    >
                                        <Save className="w-4 h-4 mr-2" /> Guardar Cambios
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* --- TAB 2: REPORTES --- */}
                <TabsContent value="reportes" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personalización de Reportes</CardTitle>
                            <CardDescription>Configura los logotipos que aparecerán en los encabezados de los reportes oficiales (CONAC).</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* LOGO IZQUIERDO */}
                                <LogoDropzone
                                    side="left"
                                    label="Logo Izquierdo (Ayuntamiento)"
                                    badge="Encabezado Izq."
                                    currentImage={config.logoLeft}
                                    onImageUpload={(val) => handleLogoChange("left", val)}
                                />

                                {/* LOGO DERECHO */}
                                <LogoDropzone
                                    side="right"
                                    label="Logo Derecho (Tesorería / Admin)"
                                    badge="Encabezado Der."
                                    currentImage={config.logoRight}
                                    onImageUpload={(val) => handleLogoChange("right", val)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4 flex justify-end bg-slate-50/50 dark:bg-slate-900/50 rounded-b-lg">
                            <p className="text-xs text-muted-foreground mr-auto">
                                * Nota: Por ahora, ingresa URLs de imágenes alojadas (ej. postimages.org, imgur) o data URIs.
                            </p>
                            <Button
                                className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-100"
                                onClick={() => {
                                    addToLog("Configuración Actualizada", "Se actualizaron los logos de reportes", "update")
                                    toast({ title: "Configuración Guardada", description: "Los logotipos se han actualizado correctamente.", duration: 3000 })
                                }}
                            >
                                <Save className="w-4 h-4 mr-2" /> Guardar Configuración
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* FIRMANTES */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Firmantes de Documentos</CardTitle>
                                <CardDescription>Configura los nombres y cargos que aparecerán al pie de los reportes.</CardDescription>
                            </div>
                            <Button size="sm" variant="outline" onClick={addSigner}>
                                <Plus className="w-4 h-4 mr-2" /> Agregar Firmante
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre Completo</TableHead>
                                        <TableHead>Cargo / Puesto</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {firmantes.map((firmante, index) => (
                                        <TableRow key={firmante.id}>
                                            <TableCell>
                                                <Input
                                                    value={firmante.nombre}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setFirmantes(prev => prev.map((f, i) => i === index ? { ...f, nombre: val } : f));
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={firmante.puesto}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setFirmantes(prev => prev.map((f, i) => i === index ? { ...f, puesto: val } : f));
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => removeSigner(firmante.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {firmantes.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                                                No hay firmantes configurados.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* FIRMANTES DE POLIZA DE PAGO */}
                    <Card>
                        <CardHeader>
                            <div>
                                <CardTitle>Firmantes de Póliza de Pago</CardTitle>
                                <CardDescription>Configura los nombres que aparecerán en las órdenes de pago.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="autoriza">Autoriza</Label>
                                <Input
                                    id="autoriza"
                                    value={localPaymentOrderSigners.autoriza}
                                    onChange={(e) => setLocalPaymentOrderSigners(prev => ({ ...prev, autoriza: e.target.value }))}
                                    placeholder="Nombre del Presidente Municipal"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Comisión de Hacienda Municipal</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        value={localPaymentOrderSigners.comisionHacienda1}
                                        onChange={(e) => setLocalPaymentOrderSigners(prev => ({ ...prev, comisionHacienda1: e.target.value }))}
                                        placeholder="Síndico (a) Municipal"
                                    />
                                    <Input
                                        value={localPaymentOrderSigners.comisionHacienda2}
                                        onChange={(e) => setLocalPaymentOrderSigners(prev => ({ ...prev, comisionHacienda2: e.target.value }))}
                                        placeholder="Regidor (a) Municipal"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="doyFe">Doy Fé</Label>
                                <Input
                                    id="doyFe"
                                    value={localPaymentOrderSigners.doyFe}
                                    onChange={(e) => setLocalPaymentOrderSigners(prev => ({ ...prev, doyFe: e.target.value }))}
                                    placeholder="Nombre del Secretario del Ayuntamiento"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4 flex justify-end">
                            <Button
                                className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-100"
                                onClick={handleSavePaymentOrderSigners}
                            >
                                <Save className="w-4 h-4 mr-2" /> Guardar Cambios
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="usuarios" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div><CardTitle>Información de la Cuenta</CardTitle><CardDescription>Usuario actualmente registrado en el sistema.</CardDescription></div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader><TableRow><TableHead>Usuario</TableHead><TableHead>Rol</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback className="bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900">AC</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-semibold">Aldahir Córdova</div>
                                                    <div className="text-xs text-muted-foreground">aldahir@tesoreria.gob.mx</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell><Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Administrador</Badge></TableCell>
                                        <TableCell><Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Activo</Badge></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TAB 3: SEGURIDAD --- */}
                <TabsContent value="seguridad" className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Contraseña</CardTitle><CardDescription>Cambia tu contraseña de acceso.</CardDescription></CardHeader>
                        <CardContent className="space-y-4 max-w-md">
                            <div className="space-y-2"><Label>Nueva Contraseña</Label><Input type="password" /></div>
                            <Button>Actualizar</Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Autenticación de Dos Factores</CardTitle><CardDescription>Aumenta la seguridad de tu cuenta.</CardDescription></CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <div className="space-y-1"><p className="font-medium">Autenticación (2FA)</p><p className="text-sm text-muted-foreground">Se requerirá un código extra al iniciar sesión.</p></div>
                            <Switch checked={is2FAEnabled} onCheckedChange={setIs2FAEnabled} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TAB 4: FACTURACIÓN Y PLANES (ESTILO SHADCN UI PRICING) --- */}
                <TabsContent value="facturacion" className="space-y-8">

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {/* PLAN BASICO */}
                        <Card className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-slate-900">Municipal Básico</CardTitle>
                                <CardDescription>Para pequeños entes.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 flex-1">
                                <div className="text-4xl font-bold">$15,000<span className="text-sm font-normal text-muted-foreground">/año</span></div>
                                <div className="grid gap-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2"><Check className="h-4 w-4 text-slate-900" /> 1 Usuario</div>
                                    <div className="flex items-center gap-2"><Check className="h-4 w-4 text-slate-900" /> Conciliación Manual</div>
                                    <div className="flex items-center gap-2"><Check className="h-4 w-4 text-slate-900" /> Soporte por Email</div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant="outline">Elegir Plan</Button>
                            </CardFooter>
                        </Card>

                        {/* PLAN PRO (ACTIVO) - DISEÑO SHADCN "POPULAR" */}
                        <Card className="flex flex-col border-slate-900 shadow-md relative">
                            {/* Badge Sutil de Shadcn */}
                            <div className="absolute top-0 right-0 -mt-2 -mr-2">
                                <span className="flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-900"></span>
                                </span>
                            </div>

                            <CardHeader>
                                <CardTitle className="text-slate-900">Fintra Pro</CardTitle>
                                <CardDescription>Ideal para cumplimiento ORFIS.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 flex-1">
                                <div className="text-4xl font-bold">$45,000<span className="text-sm font-normal text-muted-foreground">/año</span></div>
                                <div className="grid gap-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2"><Check className="h-4 w-4 text-slate-900" /> <strong>5 Usuarios</strong></div>
                                    <div className="flex items-center gap-2"><Check className="h-4 w-4 text-slate-900" /> Conciliación Automática</div>
                                    <div className="flex items-center gap-2"><Check className="h-4 w-4 text-slate-900" /> Auditoría en Tiempo Real</div>
                                    <div className="flex items-center gap-2"><Check className="h-4 w-4 text-slate-900" /> Soporte Prioritario</div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-100">Plan Actual</Button>
                            </CardFooter>
                        </Card>

                        {/* PLAN ENTERPRISE */}
                        <Card className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-slate-900">Enterprise</CardTitle>
                                <CardDescription>Para grandes municipios.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 flex-1">
                                <div className="text-4xl font-bold">Personalizado</div>
                                <div className="grid gap-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2"><Check className="h-4 w-4 text-slate-900" /> Usuarios Ilimitados</div>
                                    <div className="flex items-center gap-2"><Check className="h-4 w-4 text-slate-900" /> API Personalizada</div>
                                    <div className="flex items-center gap-2"><Check className="h-4 w-4 text-slate-900" /> Servidor Dedicado</div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant="outline">Contactar Ventas</Button>
                            </CardFooter>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Facturas</h3>
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">Folio</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Monto</TableHead>
                                        <TableHead className="text-right">Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">INV001</TableCell>
                                        <TableCell>01 Ene 2024</TableCell>
                                        <TableCell>$45,000.00</TableCell>
                                        <TableCell className="text-right"><Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-transparent">Pagado</Badge></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- TAB 5: APARIENCIA --- */}
                <TabsContent value="apariencia" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tema</CardTitle>
                            <CardDescription>Personaliza el aspecto de la aplicación.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="theme-mode" className="flex flex-col space-y-1">
                                    <span>Modo Oscuro</span>
                                    <span className="font-normal leading-snug text-muted-foreground">
                                        Cambia entre el tema claro, oscuro o sistema.
                                    </span>
                                </Label>
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="icon" onClick={() => setTheme("light")}>
                                        <Sun className="h-[1.2rem] w-[1.2rem]" />
                                        <span className="sr-only">Claro</span>
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => setTheme("dark")}>
                                        <Moon className="h-[1.2rem] w-[1.2rem]" />
                                        <span className="sr-only">Oscuro</span>
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => setTheme("system")}>
                                        <Laptop className="h-[1.2rem] w-[1.2rem]" />
                                        <span className="sr-only">Sistema</span>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    )
}

function LogoDropzone({ side, label, badge, currentImage, onImageUpload }: { side: string, label: string, badge: string, currentImage: string, onImageUpload: (v: string) => void }) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                onImageUpload(e.target.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="font-semibold">{label}</Label>
                <Badge variant="outline">{badge}</Badge>
            </div>
            <div
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center min-h-[150px] transition-colors relative ${isDragging ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 hover:bg-slate-100/50 dark:hover:bg-slate-800'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleChange}
                />

                {currentImage ? (
                    <div className="relative z-10 flex flex-col items-center">
                        <img src={currentImage} alt="Logo Preview" className="max-h-[100px] object-contain mb-4 shadow-sm" />
                        <span className="text-xs text-muted-foreground bg-white/80 px-2 py-1 rounded">Click o Arrastra para cambiar</span>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground mb-4 z-10 pointer-events-none">
                        <Upload className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <span className="text-xs font-medium">Arrastra tu imagen aquí</span>
                        <p className="text-[10px] mt-1 text-slate-400">o haz click para buscar</p>
                    </div>
                )}
            </div>
        </div>
    );
}