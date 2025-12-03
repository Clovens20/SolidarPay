'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Settings, 
  LogOut, 
  User, 
  ShieldCheck,
  Bell 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

export default function AdminHeader({ user, kycPending }) {
  const router = useRouter()
  const [notifications, setNotifications] = useState([])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-solidarpay-border z-50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo and Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-solidarpay-primary to-solidarpay-secondary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-solidarpay-text">SolidarPay</span>
          </div>
          <div className="h-6 w-px bg-solidarpay-border" />
          <span className="text-sm text-solidarpay-text/70">Super Admin - Gestion Technique</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* KYC Badge */}
          {kycPending > 0 && (
            <Badge 
              variant="destructive" 
              className="flex items-center gap-1 px-3 py-1"
            >
              <ShieldCheck className="w-4 h-4" />
              {kycPending} vérifications KYC en attente
            </Badge>
          )}

          {/* Bouton de déconnexion visible - PLACÉ AVANT LE PROFIL */}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Aucune notification
                </div>
              ) : (
                notifications.map((notif) => (
                  <DropdownMenuItem key={notif.id}>
                    {notif.message}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-solidarpay-primary flex items-center justify-center text-white font-semibold">
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <span className="text-sm font-medium text-solidarpay-text">
                  {user?.fullName || 'Admin'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-semibold">{user?.fullName}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

