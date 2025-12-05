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
  const [kycPending, setKycPending] = useState(0)
  const router = useRouter()
  const pathname = usePathname()

  // Ne pas vérifier l'authentification sur la page de login
  const isLoginPage = pathname === '/admin/login'

  // Mémoriser loadKycPending pour éviter les re-créations
  const loadKycPending = useCallback(async () => {
    try {
      // Compter uniquement les revues manuelles (pending_review)
      const { count, error } = await supabase
        .from('kyc_documents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_review')

      if (!error) {
        setKycPending(count || 0)
      }
    } catch (error) {
      console.error('Error loading KYC pending:', error)
    }
  }, [])

  // Mémoriser checkAuth pour éviter les re-créations
  const checkAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/admin/login')
        return
      }

      // Check if user is super admin - utiliser maybeSingle() pour éviter les erreurs
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

      // Rediriger les non-super-admin vers leur interface appropriée
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
    // Si c'est la page de login, ne pas vérifier l'authentification
    if (pathname === '/admin/login') {
      setLoading(false)
      return
    }
    
    checkAuth()
    loadKycPending()
    
    // Set up real-time subscription for KYC updates
    let channel = null
    const setupSubscription = async () => {
      channel = supabase
        .channel(`kyc-updates-${Date.now()}`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'kyc_documents' },
          () => {
            loadKycPending()
          }
        )
        .subscribe()

      // Vérifier la connexion après un court délai
      setTimeout(() => {
        if (channel && channel.state === 'SUBSCRIBED') {
          // Subscription active
        }
      }, 1000)
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [pathname, checkAuth, loadKycPending])

  // Sur la page de login, afficher directement les children sans layout
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
      <AdminHeader user={user} kycPending={kycPending} onMenuClick={() => setMobileMenuOpen(true)} />
      <div className="flex pt-16">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-solidarpay-border overflow-y-auto z-40">
          <AdminSidebar pathname={pathname} kycPending={kycPending} onNavigate={() => {}} />
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <AdminSidebar 
              pathname={pathname} 
              kycPending={kycPending}
              onNavigate={() => setMobileMenuOpen(false)} 
            />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 w-full md:ml-64 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

