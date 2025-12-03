'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminHeader from '@/components/admin/AdminHeader'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [kycPending, setKycPending] = useState(0)
  const router = useRouter()
  const pathname = usePathname()

  // Ne pas vérifier l'authentification sur la page de login
  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    // Si c'est la page de login, ne pas vérifier l'authentification
    if (pathname === '/admin/login') {
      setLoading(false)
      return
    }
    
    checkAuth()
    loadKycPending()
    
    // Set up real-time subscription for KYC updates
    const channel = supabase
      .channel('kyc-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'kyc_documents' },
        () => loadKycPending()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [pathname])

  const checkAuth = async () => {
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
  }

  const loadKycPending = async () => {
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
  }

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
      <AdminHeader user={user} kycPending={kycPending} />
      <div className="flex pt-16">
        <AdminSidebar pathname={pathname} kycPending={kycPending} />
        <main className="flex-1 p-6 ml-64">
          {children}
        </main>
      </div>
    </div>
  )
}

