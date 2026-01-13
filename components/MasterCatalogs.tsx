"use client"

import React, { useState } from "react"
import { 
  Plus, Search, FileText, Landmark, 
  ListTree, Edit2, Trash2, CheckCircle2 
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function MasterCatalogs() {
  return (
    <div className="flex flex-col gap-6 p-2 md:p-6 bg-slate-50/50 min-h-screen">
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Catálogos Maestros</h1>
        <p className="text-muted-foreground text-sm">Estructura base para la armonización contable y presupuestal.</p>
      </div>

      <Tabs defaultValue="partidas" className="space-y-6">
        
        <div className="flex items-center">
            <TabsList className="bg-white border h-10 p-1 shadow-sm">
                <TabsTrigger value="partidas" className="gap-2">
                    <ListTree className="w-4 h-4" /> Partidas (COG)
                </TabsTrigger>
                <TabsTrigger value="fuentes" className="gap-2">
                    <Landmark className="w-4 h-4" /> Fondos y Fuentes
                </TabsTrigger>
            </TabsList>
        </div>

        {/* --- TAB: PARTIDAS (COG) --- */}
        <TabsContent value="partidas" className="space-y-4">
            <Card className="border-slate-200">
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b">
                    <div>
                        <CardTitle className="text-lg font-bold text-slate-900">Clasificador por Objeto del Gasto</CardTitle>
                        <CardDescription className="text-xs">Definición de Capítulos, Conceptos y Partidas Genéricas.</CardDescription>
                    </div>
                    <Button className="bg-blue-900 hover:bg-blue-800 shadow-md gap-2">
                        <Plus className="w-4 h-4" /> Nueva Partida
                    </Button>
                </CardHeader>
                <div className="p-4 bg-slate-50/50 flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input placeholder="Buscar por código o nombre..." className="pl-9 bg-white" />
                    </div>
                </div>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="w-[120px] font-bold text-slate-700">Código</TableHead>
                                <TableHead className="font-bold text-slate-700">Descripción de la Partida</TableHead>
                                <TableHead className="w-[150px] font-bold text-slate-700">Tipo</TableHead>
                                <TableHead className="text-right font-bold text-slate-700">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className="hover:bg-slate-50">
                                <TableCell className="font-mono font-bold text-blue-700">1000</TableCell>
                                <TableCell className="font-medium text-slate-900">SERVICIOS PERSONALES</TableCell>
                                <TableCell><Badge variant="outline" className="bg-slate-100 uppercase text-[10px]">Capítulo</Badge></TableCell>
                                <TableCell className="text-right"><Button variant="ghost" size="icon"><Edit2 className="w-4 h-4 text-slate-400"/></Button></TableCell>
                            </TableRow>
                            <TableRow className="hover:bg-slate-50">
                                <TableCell className="font-mono font-bold text-blue-700">21101</TableCell>
                                <TableCell className="font-medium text-slate-900">Materiales y Útiles de Oficina</TableCell>
                                <TableCell><Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 uppercase text-[10px]">Partida</Badge></TableCell>
                                <TableCell className="text-right"><Button variant="ghost" size="icon"><Edit2 className="w-4 h-4 text-slate-400"/></Button></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        {/* --- TAB: FUENTES (FONDOS) --- */}
        <TabsContent value="fuentes" className="space-y-4">
            <Card className="border-slate-200">
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b">
                    <div>
                        <CardTitle className="text-lg font-bold text-slate-900">Fuentes de Financiamiento</CardTitle>
                        <CardDescription className="text-xs">Identificación del origen del recurso (Federal, Estatal, Propio).</CardDescription>
                    </div>
                    <Button className="bg-blue-900 hover:bg-blue-800 shadow-md gap-2">
                        <Plus className="w-4 h-4" /> Nuevo Fondo
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="font-bold text-slate-700">Acrónimo</TableHead>
                                <TableHead className="font-bold text-slate-700">Nombre Oficial del Fondo</TableHead>
                                <TableHead className="font-bold text-slate-700">Origen</TableHead>
                                <TableHead className="text-right font-bold text-slate-700">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className="hover:bg-slate-50">
                                <TableCell className="font-mono font-bold text-slate-900">FISM-DF</TableCell>
                                <TableCell className="font-medium text-slate-700">Fondo de Aportaciones para la Infraestructura Social Municipal</TableCell>
                                <TableCell><Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[10px]">Federal</Badge></TableCell>
                                <TableCell className="text-right"><Button variant="ghost" size="icon"><Edit2 className="w-4 h-4 text-slate-400"/></Button></TableCell>
                            </TableRow>
                            <TableRow className="hover:bg-slate-50">
                                <TableCell className="font-mono font-bold text-slate-900">FORTAMUN</TableCell>
                                <TableCell className="font-medium text-slate-700">Fondo de Aportaciones para el Fortalecimiento de los Municipios</TableCell>
                                <TableCell><Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[10px]">Federal</Badge></TableCell>
                                <TableCell className="text-right"><Button variant="ghost" size="icon"><Edit2 className="w-4 h-4 text-slate-400"/></Button></TableCell>
                            </TableRow>
                            <TableRow className="hover:bg-slate-50">
                                <TableCell className="font-mono font-bold text-slate-900">R. FISCALES</TableCell>
                                <TableCell className="font-medium text-slate-700">Recursos Fiscales (Ingresos Propios)</TableCell>
                                <TableCell><Badge className="bg-blue-50 text-blue-700 border-blue-100 uppercase text-[10px]">Propio</Badge></TableCell>
                                <TableCell className="text-right"><Button variant="ghost" size="icon"><Edit2 className="w-4 h-4 text-slate-400"/></Button></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}