'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminHeader from '@/components/admin/AdminHeader'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { Sheet, SheetContent } from '@/components/ui/sheet'

export default function AdminLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const isLoginPage = pathname === '/admin/login'

  const checkAuth = useCallback(async () => {
    const withTimeout = (promise, ms, label) =>
      Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`${label} (${ms / 1000}s)`)), ms)
        ),
      ])

    try {
      const { data: { session } } = await withTimeout(
        supabase.auth.getSession(),
        20000,
        'Délai dépassé — connexion Supabase'
      )

      if (!session) {
        router.replace('/admin/login')
        return
      }

      const { data: userData, error } = await withTimeout(
        supabase.from('users').select('*').eq('id', session.user.id).maybeSingle(),
        20000,
        'Délai dépassé — lecture du profil'
      )

      if (error) {
        console.error('Error fetching user:', error)
        router.replace('/admin/login')
        return
      }

      if (!userData) {
        console.error('User not found in database')
        router.replace('/admin/login')
        return
      }

      /* /admin = interface super-admin plateforme uniquement (table users.role = super_admin) */
      if (userData.role !== 'super_admin') {
        if (userData.role === 'admin') {
          router.replace('/admin-tontine')
        } else {
          router.replace('/')
        }
        return
      }

      setUser(userData)
    } catch (error) {
      console.error('Auth error:', error)
      router.replace('/admin/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  /**
   * Important : dépendre de `pathname`. Après login sur /admin/login → router.push('/admin'),
   * le layout ne se remonte pas : avec [] seul, checkAuth ne s’exécutait jamais → user null + loading false → page blanche.
   */
  useEffect(() => {
    if (pathname === '/admin/login') {
      setLoading(false)
      return
    }

    setLoading(true)
    checkAuth()
  }, [pathname, checkAuth])

  if (isLoginPage) {
    return <>{children}</>
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-solidarpay-bg">
        <div className="text-center px-4 max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solidarpay-primary mx-auto"></div>
          <p className="mt-4 text-solidarpay-text">
            {loading ? 'Chargement…' : 'Redirection…'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-solidarpay-bg">
      <AdminHeader user={user} onMenuClick={() => setMobileMenuOpen(true)} />
      <div className="flex pt-16">
        <aside className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-solidarpay-border overflow-y-auto z-40">
          <AdminSidebar pathname={pathname} onNavigate={() => {}} />
        </aside>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <AdminSidebar pathname={pathname} onNavigate={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        <main className="min-w-0 flex-1 w-full pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 md:ml-64 md:pt-0 px-3 sm:px-4 md:px-6">
          {children}
        </main>
      </div>
    </div>
  )
}
