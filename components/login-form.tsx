"use client"

import * as React from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { authenticate } from "@/app/actions/auth-actions"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [errorMessage, dispatch] = useActionState(authenticate, undefined)

  return (
    <form
      action={dispatch}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Bienvenido</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Ingresa tu correo para entrar al sistema
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" name="email" type="email" placeholder="m@ejemplo.com" required />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Contraseña</Label>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <Input id="password" name="password" type="password" required />
        </div>
        <LoginButton />
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">
            O continúa con
          </span>
        </div>
        <Button variant="outline" type="button" className="w-full">
          Login con Google
        </Button>
      </div>
      <div className="flex h-8 items-end space-x-1" aria-live="polite" aria-atomic="true">
        {errorMessage && (
          <p className="text-sm text-red-500">{errorMessage}</p>
        )}
      </div>
      <div className="text-center text-sm">
        ¿No tienes una cuenta?{" "}
        <Link href="/signup" className="underline underline-offset-4">
          Regístrate
        </Link>
      </div>
    </form>
  )
}

function LoginButton() {
  const { pending } = useFormStatus()
  return (
    <Button className="w-full" aria-disabled={pending}>
      {pending ? "Ingresando..." : "Ingresar"}
    </Button>
  )
}