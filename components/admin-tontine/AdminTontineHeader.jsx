'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User, Settings, Menu } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'

export default function AdminTontineHeader({ user, onMenuClick }) {
  const router = useRouter()
  const isMobile = useIsMobile()

  const handleLogout = async () => {
    try {
      // Déconnexion Supabase
      await supabase.auth.signOut()
      
      // Nettoyer le localStorage
      localStorage.removeItem('solidarpay_session')
      localStorage.removeItem('solidarpay_user')
      
      // Rediriger vers la page d'accueil
      router.push('/')
    } catch (error) {
      console.error('Error during logout:', error)
      // Nettoyer quand même le localStorage et rediriger
      localStorage.removeItem('solidarpay_session')
      localStorage.removeItem('solidarpay_user')
      router.push('/')
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-solidarpay-border">
      <div className="flex h-full items-center justify-between gap-2 px-3 md:px-6 overflow-hidden">
        {/* Logo and Title */}
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-4 overflow-hidden">
          {/* Mobile Menu Button */}
          {isMobile && onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex items-center gap-2">
            <img 
              src="/logo.png.jpg" 
              alt="SolidarPay" 
              className="h-8 w-8 object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextElementSibling.style.display = 'flex'
              }}
            />
            <div className="w-8 h-8 bg-gradient-to-br from-solidarpay-primary to-solidarpay-secondary rounded-lg flex items-center justify-center hidden">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="truncate text-base font-bold text-solidarpay-text md:text-lg md:text-xl">
              SolidarPay
            </span>
          </div>
          <div className="hidden md:block h-6 w-px shrink-0 bg-solidarpay-border" />
          <span className="hidden md:block shrink-0 text-sm text-solidarpay-text/70">Admin Tontine</span>
        </div>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex max-w-[min(200px,45vw)] shrink-0 items-center gap-2 sm:max-w-none">
              <div className="w-8 h-8 rounded-full bg-solidarpay-primary flex items-center justify-center text-white font-semibold shrink-0">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <span className="hidden min-w-0 truncate sm:block text-sm font-medium text-solidarpay-text">
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
            <DropdownMenuItem onClick={() => router.push('/admin-tontine/profile')}>
              <User className="w-4 h-4 mr-2" />
              Mon profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/admin-tontine/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

