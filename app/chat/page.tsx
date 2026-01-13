"use client"

import * as React from "react"
import Link from "next/link"
import { 
  Send, Search, Phone, Video, MoreVertical, 
  Plus, FileText, TriangleAlert, Paperclip, 
  X, ArrowLeft, MessageSquare 
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// --- Tipos ---
type MessageType = 'text' | 'alert' | 'document';

interface Message {
  id: number;
  text: string;
  title?: string;
  sender: 'me' | 'other';
  time: string;
  type: MessageType;
  fileName?: string;
}

const contacts = [
  { id: 1, name: "Juan Pérez", avatar: "/avatars/01.png", status: "online", lastMessage: "Alerta crítica en Sector B" },
  { id: 2, name: "Micaela Admin", avatar: "/avatars/02.png", status: "offline", lastMessage: "¿A qué hora es la reunión?" },
  { id: 3, name: "Soporte Técnico", avatar: "/avatars/03.png", status: "online", lastMessage: "El servidor ya está estable." },
]

const initialMessages: Message[] = [
  { id: 1, text: "Hola, ¿cómo va la obra?", sender: "me", time: "10:00 AM", type: 'text' },
  { id: 2, text: "Todo bien, pero detectamos un riesgo.", sender: "other", time: "10:02 AM", type: 'text' },
  { id: 3, title: "RIESGO DE CAÍDA", text: "Andamio inestable en zona norte, se requiere revisión inmediata.", sender: "other", time: "10:03 AM", type: 'alert' },
]

export default function ChatPage() {
  const [selectedContact, setSelectedContact] = React.useState(contacts[0])
  const [messages, setMessages] = React.useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = React.useState("")
  
  const [showMobileChat, setShowMobileChat] = React.useState(false)

  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)
  const [isAlertDialogOpen, setIsAlertDialogOpen] = React.useState(false)
  const [alertTitle, setAlertTitle] = React.useState("")
  const [alertDesc, setAlertDesc] = React.useState("")
  
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleContactSelect = (contact: typeof contacts[0]) => {
    setSelectedContact(contact)
    setShowMobileChat(true)
  }

  const handleMobileBack = () => {
    setShowMobileChat(false)
  }

  const sendMessage = (text: string, type: MessageType = 'text', extraData?: { fileName?: string, title?: string }) => {
    const message: Message = {
      id: messages.length + 1,
      text: text,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: type,
      fileName: extraData?.fileName,
      title: extraData?.title
    }
    setMessages([...messages, message])
    setNewMessage("")
    setIsPopoverOpen(false)
  }

  const handleSendText = () => {
    if (newMessage.trim() === "") return
    sendMessage(newMessage, 'text')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSendText()
  }

  const handleAttachmentClick = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) sendMessage(`Archivo adjunto`, 'document', { fileName: file.name })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const openAlertModal = () => {
    setIsPopoverOpen(false)
    setIsAlertDialogOpen(true)
    setAlertTitle("")
    setAlertDesc("")
  }

  const submitAlert = () => {
    if (!alertTitle || !alertDesc) return
    sendMessage(alertDesc, 'alert', { title: alertTitle })
    setIsAlertDialogOpen(false)
  }

  return (
    // Agregamos 'font-sans' aquí para asegurar que herede la fuente global de tu configuración
    <div className="flex flex-col h-screen bg-background overflow-hidden font-sans">
      
      {/* --- HEADER GLOBAL --- */}
      <div className="flex-none p-4 border-b flex items-center justify-between bg-card z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          {/* TÍTULO CORREGIDO: font-sans, font-semibold (más limpio) y tracking-tight */}
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Comunicación con Áreas
          </h1>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm" className="gap-2 text-muted-foreground hover:text-destructive">
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Cerrar</span>
          </Button>
        </Link>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

      {/* MODAL DE ALERTA */}
      <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <DialogContent className="sm:max-w-[425px] w-[95%] rounded-lg font-sans"> 
          <DialogHeader>
            <DialogTitle className="tracking-tight">Crear Alerta de Sitio</DialogTitle>
            <DialogDescription>Notificación prioritaria.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" placeholder="Ej: Material Peligroso" value={alertTitle} onChange={(e) => setAlertTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">Descripción</Label>
              <Textarea id="desc" placeholder="Detalles..." value={alertDesc} onChange={(e) => setAlertDesc(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" variant="destructive" onClick={submitAlert}>
              <TriangleAlert className="mr-2 h-4 w-4" /> Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- CONTENEDOR PRINCIPAL RESPONSIVE --- */}
      <div className="flex flex-1 min-h-0 relative">
        
        {/* === LISTA DE CONTACTOS === */}
        <Card className={`
          flex-col border-r border-t-0 rounded-none h-full bg-card z-0
          ${showMobileChat ? 'hidden md:flex' : 'flex w-full'} 
          md:w-[320px]
        `}>
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." className="pl-8 bg-muted/50" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-1 p-2">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleContactSelect(contact)}
                  className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:bg-muted/80 ${
                    selectedContact.id === contact.id ? "bg-muted shadow-sm" : ""
                  }`}
                >
                  <Avatar>
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="font-medium truncate text-sm text-foreground">{contact.name}</div>
                    <div className="text-xs text-muted-foreground truncate opacity-80">
                      {contact.lastMessage}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* === ÁREA DE CHAT === */}
        <Card className={`
          flex-col h-full border-t-0 rounded-none shadow-none flex-1 bg-background
          ${showMobileChat ? 'flex w-full fixed inset-0 z-20 md:static md:z-0' : 'hidden md:flex'}
        `}>
          
          {/* Chat Header */}
          <div className="flex items-center justify-between p-3 border-b bg-muted/30 h-16 shrink-0">
            <div className="flex items-center gap-2 md:gap-3">
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden -ml-2" 
                onClick={handleMobileBack}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <Avatar className="h-9 w-9 md:h-10 md:w-10 border">
                <AvatarImage src={selectedContact.avatar} />
                <AvatarFallback>{selectedContact.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <div className="font-semibold text-sm truncate max-w-[120px] md:max-w-none text-foreground">
                  {selectedContact.name}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500 block"></span>
                  <span className="text-xs text-muted-foreground">En línea</span>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="hidden sm:inline-flex h-8 w-8"><Video className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
            </div>
          </div>

          {/* Area de Mensajes */}
          <ScrollArea className="flex-1 p-4 bg-slate-50/50 dark:bg-background w-full">
            <div className="flex flex-col gap-4 pb-2">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                  <div className={`
                    relative max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm font-sans
                    ${msg.sender === "me" 
                      ? "bg-primary text-primary-foreground rounded-br-none" 
                      : "bg-white dark:bg-muted border text-foreground rounded-bl-none"}
                    ${msg.type === 'alert' && msg.sender === 'other' ? "bg-red-50 text-red-900 border-red-200" : ""}
                    ${msg.type === 'alert' && msg.sender === 'me' ? "bg-red-600 text-white border-red-600" : ""}
                  `}>
                    
                    {msg.type === 'alert' && (
                      <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-xs opacity-90 pb-1 border-b border-white/20 mb-1">
                            <TriangleAlert className="h-4 w-4" />
                            {msg.title || "ALERTA"}
                         </div>
                        <span className="font-medium">{msg.text}</span>
                      </div>
                    )}

                    {msg.type === 'document' && (
                      <div className="flex items-center gap-3">
                        <div className="bg-background/20 p-2 rounded-md shrink-0">
                          <FileText className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <div className="flex flex-col overflow-hidden min-w-0">
                          <span className="font-medium truncate text-xs md:text-sm">{msg.fileName}</span>
                          <span className="text-[10px] opacity-80 uppercase">Documento</span>
                        </div>
                      </div>
                    )}

                    {msg.type === 'text' && <p className="break-words leading-relaxed">{msg.text}</p>}

                    <span className="text-[10px] opacity-70 block text-right mt-1 pt-1">
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-2 md:p-3 border-t bg-background shrink-0">
            <div className="flex gap-2 items-end">
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0 rounded-full h-10 w-10">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2 mb-2 ml-2" align="start" side="top">
                  <div className="grid gap-1">
                    <p className="px-2 text-xs font-medium text-muted-foreground mb-1">Adjuntar</p>
                    <Button variant="ghost" className="w-full justify-start gap-2 h-9 font-sans" onClick={handleAttachmentClick}>
                      <Paperclip className="h-4 w-4 text-blue-500" /> Documento
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2 h-9 hover:text-red-600 hover:bg-red-50 font-sans" onClick={openAlertModal}>
                      <TriangleAlert className="h-4 w-4 text-red-500" /> Alerta
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Input 
                placeholder="Mensaje..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 min-h-[40px] py-2 text-sm font-sans"
              />
              <Button onClick={handleSendText} size="icon" className="shrink-0 h-10 w-10">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}