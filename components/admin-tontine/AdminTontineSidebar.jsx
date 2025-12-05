'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  PlusCircle,
  Search,
  User,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  {
    title: 'Mes Tontines',
    icon: LayoutDashboard,
    href: '/admin-tontine'
  },
  {
    title: 'Créer une nouvelle tontine',
    icon: PlusCircle,
    href: '/admin-tontine/new'
  },
  {
    title: 'Rechercher des membres',
    icon: Search,
    href: '/admin-tontine/search-members'
  },
  {
    title: 'Mon profil',
    icon: User,
    href: '/admin-tontine/profile'
  }
]

export default function AdminTontineSidebar({ pathname, onNavigate }) {
  const router = useRouter()
  
  const isActive = (href) => {
    if (href === '/admin-tontine') {
      return pathname === '/admin-tontine' || pathname === '/admin-tontine/'
    }
    return pathname?.startsWith(href)
  }

  const handleClick = () => {
    if (onNavigate) {
      onNavigate()
    }
  }

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
    <nav className="p-4 space-y-1 h-full">
      {menuItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleClick}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              active
                ? 'bg-solidarpay-primary text-white'
                : 'text-solidarpay-text hover:bg-solidarpay-bg'
            )}
          >
            <Icon className={cn('w-5 h-5', active ? 'text-white' : 'text-solidarpay-primary')} />
            <span className="flex-1 font-medium">{item.title}</span>
          </Link>
        )
      })}
      
      {/* Bouton de déconnexion */}
      <div className="pt-4 mt-4 border-t border-solidarpay-border">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="w-5 h-5" />
          <span className="flex-1 font-medium text-left">Déconnexion</span>
        </Button>
      </div>
    </nav>
  )
}

