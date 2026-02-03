'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Credenciales inválidas.';
                default:
                    return 'Algo salió mal.';
            }
        }
        throw error;
    }
}

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const RegisterSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    email: z.string().email("Correo inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    role: z.string().optional(),
})

export async function register(prevState: string | undefined, formData: FormData) {
    const validatedFields = RegisterSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedFields.success) {
        return "Campos inválidos. Revisa los datos."
    }

    const { name, email, password, role } = validatedFields.data

    try {
        /*
    const userExists = await (prisma as any).user.findUnique({
      where: { email },
    })

    if (userExists) {
      return "El correo ya está registrado."
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await (prisma as any).user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'user',
      },
    })
    */

        // MOCK SUCCESS
        console.log("Mock registration for:", email);
        return "Usuario creado exitosamente (Modo Local). Ahora puedes iniciar sesión.";

        // Auto login or redirect? For now just return success message or redirect
        // return "Usuario creado exitosamente. Ahora puedes iniciar sesión."
    } catch (error) {
        console.error("Registration error:", error)
        if (error instanceof Error) {
            return `Error detallado: ${error.message}`
        }
        return "Error al crear el usuario."
    }
}

export async function signOutAction() {
    await signOut();
}
