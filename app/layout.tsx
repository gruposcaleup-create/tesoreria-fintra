import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { ThemeProvider } from "@/components/theme-provider"
import { TreasuryProvider } from '@/components/providers/treasury-context'
import { Toaster } from "@/components/ui/toaster"
import { SessionProvider } from "next-auth/react"


const _geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: 'FINTRA.ai',
  description: 'Created with v0',
  generator: 'FINTRA.ai',
  icons: {
    icon: '/icono_pestaña.png',
    apple: '/icono_pestaña.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${_geist.variable} ${_geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TreasuryProvider>
              {children}
            </TreasuryProvider>
            <Toaster />
            {/* TODO: Remove this debug component after fixing auth */}
            <DebugSession />
          </ThemeProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
