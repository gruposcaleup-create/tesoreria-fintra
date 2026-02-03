"use client"

import Link from "next/link"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { register } from "@/app/actions/auth-actions"

export default function SignupPage() {
  const [errorMessage, dispatch] = useActionState(register, undefined)

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <img
              src="/logompv.png"
              alt="Logo"
              className="h-8 w-auto object-contain"
            />
            FINTRA.ai
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">

            <form action={dispatch} className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Crear cuenta corporativa</h1>
                <p className="text-balance text-sm text-muted-foreground">
                  Ingresa los datos de tu institución para registrarte
                </p>
              </div>

              <div className="grid gap-4">

                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input id="name" name="name" type="text" placeholder="Ej. Juan Pérez" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="m@ejemplo.com" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="55 1234 5678" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="institution">Institución</Label>
                    <Input id="institution" name="institution" type="text" placeholder="Ej. Tesorería Local" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="municipality">Municipio</Label>
                    <Input id="municipality" name="municipality" type="text" placeholder="Ej. Xalapa" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="role">Rol / Cargo</Label>
                  <Input id="role" name="role" type="text" placeholder="Ej. Tesorero" required />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" name="password" type="password" required />
                </div>

                <RegisterButton />
              </div>

              <div className="flex h-8 items-end space-x-1" aria-live="polite" aria-atomic="true">
                {errorMessage && (
                  <p className="text-sm text-red-500">{errorMessage}</p>
                )}
              </div>

              <div className="text-center text-sm">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="underline underline-offset-4">
                  Inicia sesión
                </Link>
              </div>
            </form>

          </div>
        </div>
      </div>

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

function RegisterButton() {
  const { pending } = useFormStatus()
  return (
    <Button className="w-full" aria-disabled={pending}>
      {pending ? "Registrando..." : "Registrarse"}
    </Button>
  )
}