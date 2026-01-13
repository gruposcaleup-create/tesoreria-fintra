import { GalleryVerticalEnd } from "lucide-react"
import { LoginForm } from "@/components/login-form"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <img 
      src="/logompv.png"          // <--- Nombre de tu archivo en la carpeta public
      alt="Logo" 
      className="h-8 w-auto object-contain" // Ajusta el tamaño aquí (h-8 = 32px)
    />
            FINTRA.ai
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            {/* Aquí cargamos tu formulario */}
            <LoginForm />
          </div>
        </div>
      </div>
      {/* Esta es la parte de la imagen lateral */}
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/fondo-login.png" // <--- Asegúrate de tener una imagen aquí o cambia la ruta
          alt="Imagen de fondo"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}