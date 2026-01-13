"use client"

import * as React from "react"
import { useState } from "react"
import { IconPlus, IconCalendar } from "@tabler/icons-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type Task = {
  id: string
  title: string
  description: string
  dueDate: Date | undefined
  completed: boolean
}

export function TasksCard() {
  const [open, setOpen] = useState(false)
  
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDesc, setNewTaskDesc] = useState("")
  const [newTaskDate, setNewTaskDate] = useState<Date | undefined>(new Date())

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Revisar balance mensual",
      description: "Enviar reporte a socios antes de las 5pm.",
      dueDate: new Date(),
      completed: false,
    },
    {
      id: "2",
      title: "Pago de nómina quincenal",
      description: "Validar horas extra del equipo de diseño.",
      dueDate: new Date(),
      completed: false,
    },
  ])

  const handleAddTask = () => {
    if (!newTaskTitle) return

    const taskToAdd: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTaskTitle,
      description: newTaskDesc,
      dueDate: newTaskDate,
      completed: false,
    }

    setTasks([...tasks, taskToAdd])
    
    setNewTaskTitle("")
    setNewTaskDesc("")
    setNewTaskDate(new Date())
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Card className="@container/card flex flex-col overflow-hidden h-full shadow-xs">
        
        {/* --- HEADER CORREGIDO PARA MATCH EXACTO --- */}
        {/* Usamos p-4 pb-1 igual que SectionCards */}
        <CardHeader className="p-4 pb-1 relative">
          <div className="flex items-center justify-between z-10">
            {/* Texto pequeño igual: text-xs font-medium */}
            <CardDescription className="text-xs font-medium">Tareas Pendientes</CardDescription>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 -mr-2 relative z-20 cursor-pointer hover:bg-muted"
              >
                <IconPlus className="h-4 w-4" />
                <span className="sr-only">Nueva tarea</span>
              </Button>
            </DialogTrigger>
          </div>
          {/* Numero grande igual: text-xl font-bold */}
          <CardTitle className="text-xl font-bold tabular-nums mt-0.5">
            {tasks.length}
          </CardTitle>
        </CardHeader>

        {/* CONTENIDO (Lista con scroll) */}
        <CardContent className="px-4 pb-2 pt-1 flex-1">
          <div className="h-[125px] overflow-y-auto pr-1 space-y-3">
            {tasks.map((task, index) => (
              <div key={task.id}>
                <div className="flex items-start gap-2.5">
                  <Checkbox id={`task-${task.id}`} className="mt-1 h-3 w-3 translate-y-[1px]" />
                  <div className="grid gap-0.5 leading-none w-full">
                    <div className="flex justify-between items-start gap-2">
                        <label
                        htmlFor={`task-${task.id}`}
                        className="text-[11px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 break-words"
                        >
                        {task.title}
                        </label>
                        <span className="shrink-0 text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                            {task.dueDate ? format(task.dueDate, "dd MMM", { locale: es }) : "S/F"}
                        </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 break-all">
                      {task.description}
                    </p>
                  </div>
                </div>
                {index < tasks.length - 1 && <div className="h-px bg-border/40 mt-3" />}
              </div>
            ))}
            
            {tasks.length === 0 && (
                <div className="h-full flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">No hay tareas pendientes</p>
                </div>
            )}
          </div>
        </CardContent>

        {/* FOOTER */}
        <CardFooter className="px-4 py-1.5 bg-muted/10 border-t min-h-[32px] flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground opacity-80">
            <IconCalendar className="h-3 w-3" />
            <span>Agenda del día</span>
          </div>
          <div className="text-[9px] font-medium text-primary cursor-pointer hover:underline">
            Ver todas
          </div>
        </CardFooter>
      </Card>

      {/* --- MODAL (DIALOG) --- */}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Pendiente</DialogTitle>
          <DialogDescription>
            Crea una nueva tarea para tu lista.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Título</Label>
            <Input
              id="title"
              placeholder="Ej. Pagar impuestos"
              className="col-span-3"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Detalles..."
              className="col-span-3"
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Vencimiento</Label>
            <Popover modal={true}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !newTaskDate && "text-muted-foreground"
                  )}
                >
                  <IconCalendar className="mr-2 h-4 w-4" />
                  {newTaskDate ? format(newTaskDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newTaskDate}
                  onSelect={setNewTaskDate}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" onClick={handleAddTask}>Guardar Pendiente</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}