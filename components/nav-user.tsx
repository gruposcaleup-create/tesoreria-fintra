"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { signOutAction } from "@/app/actions/auth-actions"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()

  // Helper: extract smart initials from name or email
  const getInitials = (name: string) => {
    if (name.includes("@")) {
      // Email: take first 2 chars of local part
      return name.split("@")[0].substring(0, 2).toUpperCase()
    }
    // Name: take first letter of first two words
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }



  // ... inside component ...

  const handleLogout = async () => {
    await signOutAction()
    // The server action handles the redirect
  }

  const goToSettings = (tab: string) => {
    router.push(`/configuracion?tab=${tab}`)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg border border-slate-200">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg font-bold bg-blue-900 text-white">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-slate-900 tracking-tight">{user.name}</span>
                <span className="truncate text-xs text-slate-500 font-mono">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-slate-400" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg border-slate-200 shadow-md"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg border border-slate-100">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg bg-blue-900 text-white font-bold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-slate-900 tracking-tight">{user.name}</span>
                  <span className="truncate text-xs text-slate-500 font-mono">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-slate-100" />

            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => goToSettings("perfil")}
                className="cursor-pointer text-slate-700 focus:bg-slate-50"
              >
                <BadgeCheck className="mr-2 size-4 text-slate-400" />
                Cuenta
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => goToSettings("facturacion")}
                className="cursor-pointer text-slate-700 focus:bg-slate-50"
              >
                <CreditCard className="mr-2 size-4 text-slate-400" />
                Planes y Facturación
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => goToSettings("seguridad")}
                className="cursor-pointer text-slate-700 focus:bg-slate-50"
              >
                <Bell className="mr-2 size-4 text-slate-400" />
                Seguridad
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-slate-100" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 font-medium"
            >
              <LogOut className="mr-2 size-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}