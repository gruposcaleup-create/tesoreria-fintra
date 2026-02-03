import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';

async function getUser(email: string): Promise<any> {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    // DB DISCONNECTED: Mock login allowed for any email/password
                    // const user = await (prisma as any).user.findUnique({ where: { email } });
                    // if (!user) return null;
                    // const passwordsMatch = await bcrypt.compare(password, user.password);

                    // if (passwordsMatch) return user;

                    // MOCK USER RETURN
                    return {
                        id: 'mock-user-id',
                        name: 'Usuario Local',
                        email: email,
                        role: 'admin'
                    } as any;
                }

                console.log('Invalid credentials');
                return null;
            },
        }),
    ],
});
