import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/');
            // Allow access to login, signup, and public assets
            if (nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/signup') || nextUrl.pathname.startsWith('/api') || nextUrl.pathname.startsWith('/_next') || nextUrl.pathname.includes('.')) {
                if (isLoggedIn && nextUrl.pathname.startsWith('/login')) {
                    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
                        ? process.env.NEXT_PUBLIC_APP_URL
                        : process.env.VERCEL_URL
                            ? `https://${process.env.VERCEL_URL}`
                            : nextUrl.origin;
                    return Response.redirect(new URL('/', baseUrl));
                }
                return true;
            }

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            }
            return true;
        },
    },
    providers: [], // Add providers with an empty array for now
    trustHost: true,
} satisfies NextAuthConfig;
