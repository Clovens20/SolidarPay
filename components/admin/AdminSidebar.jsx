'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShieldCheck,
  Globe,
  Palette,
  Settings,
  Wrench,
  FileText,
  Home,
  AlignLeft,
  FileCheck
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin',
    badge: null
  },
  {
    title: 'Vérifications KYC',
    icon: ShieldCheck,
    href: '/admin/kyc',
    badge: 'kycPending'
  },
  {
    title: 'Pays & Méthodes',
    icon: Globe,
    href: '/admin/countries',
    badge: null
  },
  {
    title: 'Personnalisation',
    icon: Palette,
    href: '/admin/customization',
    badge: null
  },
  {
    title: 'Paramètres',
    icon: Settings,
    href: '/admin/settings',
    badge: null
  },
  {
    title: 'Maintenance',
    icon: Wrench,
    href: '/admin/maintenance',
    badge: null
  },
  {
    title: 'Logs Système',
    icon: FileText,
    href: '/admin/logs',
    badge: null
  },
  {
    title: 'Page d\'Accueil',
    icon: Home,
    href: '/admin/landing-page',
    badge: null
  },
  {
    title: 'Footer',
    icon: AlignLeft,
    href: '/admin/footer',
    badge: null
  },
  {
    title: 'Pages Légales',
    icon: FileCheck,
    href: '/admin/legal-pages',
    badge: null
  }
]

export default function AdminSidebar({ pathname, kycPending, onNavigate }) {
  const isActive = (href) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname?.startsWith(href)
  }

  const handleClick = () => {
    if (onNavigate) {
      onNavigate()
    }
  }

  return (
    <nav className="p-4 space-y-1 h-full">
      {menuItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item.href)
        const badgeCount = item.badge === 'kycPending' ? kycPending : null

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
            {badgeCount !== null && badgeCount > 0 && (
              <Badge 
                variant={active ? 'secondary' : 'destructive'} 
                className="ml-auto"
              >
                {badgeCount}
              </Badge>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

