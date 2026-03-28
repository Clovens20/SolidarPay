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
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/admin/login')
        return
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching user:', error)
        router.push('/admin/login')
        return
      }

      if (!userData) {
        console.error('User not found in database')
        router.push('/admin/login')
        return
      }

      if (userData.role !== 'super_admin') {
        if (userData.role === 'admin') {
          router.push('/')
        } else {
          router.push('/')
        }
        return
      }

      setUser(userData)
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (pathname === '/admin/login') {
      setLoading(false)
      return
    }

    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoginPage) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-solidarpay-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solidarpay-primary mx-auto"></div>
          <p className="mt-4 text-solidarpay-text">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
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
