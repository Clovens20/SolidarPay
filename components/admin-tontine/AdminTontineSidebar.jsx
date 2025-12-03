'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  PlusCircle,
  Search,
  User
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

export default function AdminTontineSidebar({ pathname }) {
  const isActive = (href) => {
    if (href === '/admin-tontine') {
      return pathname === '/admin-tontine' || pathname === '/admin-tontine/'
    }
    return pathname?.startsWith(href)
  }

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-solidarpay-border overflow-y-auto">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
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
      </nav>
    </aside>
  )
}

