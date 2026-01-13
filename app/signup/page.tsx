import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            {/* TU LOGO */}
            <img 
              src="/logompv.png" 
              alt="Logo" 
              className="h-8 w-auto object-contain" 
            />
            FINTRA.ai
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md"> {/* Cambié max-w-xs a max-w-md para dar más aire a las columnas */}
            
            {/* --- FORMULARIO DE REGISTRO COMPLETO --- */}
            <form className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Crear cuenta corporativa</h1>
                <p className="text-balance text-sm text-muted-foreground">
                  Ingresa los datos de tu institución para registrarte
                </p>
              </div>
              
              <div className="grid gap-4">
                
                {/* 1. NOMBRE COMPLETO */}
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input id="name" type="text" placeholder="Ej. Juan Pérez" required />
                </div>

                {/* 2. EMAIL Y TELÉFONO (Dos columnas) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="m@ejemplo.com" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" type="tel" placeholder="55 1234 5678" required />
                  </div>
                </div>

                {/* 3. INSTITUCIÓN Y MUNICIPIO (Dos columnas) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="institution">Institución</Label>
                    <Input id="institution" type="text" placeholder="Ej. Tesorería Local" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="municipality">Municipio</Label>
                    <Input id="municipality" type="text" placeholder="Ej. Xalapa" required />
                  </div>
                </div>

                {/* 4. ROL */}
                <div className="grid gap-2">
                  <Label htmlFor="role">Rol / Cargo</Label>
                  <Input id="role" type="text" placeholder="Ej. Tesorero, Administrador..." required />
                </div>

                {/* 5. CONTRASEÑA */}
                <div className="grid gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" required />
                </div>

                <Button type="submit" className="w-full">
                  Registrarse
                </Button>
              </div>
              
              <div className="text-center text-sm">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="underline underline-offset-4">
                  Inicia sesión
                </Link>
              </div>
            </form>
            {/* --------------------------------------- */}

          </div>
        </div>
      </div>
      
      {/* TU IMAGEN DE FONDO */}
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/signup.png"
          alt="Imagen de fondo"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}