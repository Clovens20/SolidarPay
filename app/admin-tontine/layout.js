'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminTontineHeader from '@/components/admin-tontine/AdminTontineHeader'
import AdminTontineSidebar from '@/components/admin-tontine/AdminTontineSidebar'

export default function AdminTontineLayout({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/')
        return
      }

      // Check if user is admin tontine
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error || !userData) {
        router.push('/')
        return
      }

      // Les admins tontine utilisent cette interface complète
      if (userData.role === 'admin') {
        setUser(userData)
        return
      }

      // Si super admin, rediriger vers /admin/login
      if (userData.role === 'super_admin') {
        router.push('/admin/login')
        return
      }

      setUser(userData)
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
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
      <AdminTontineHeader user={user} />
      <div className="flex pt-16">
        <AdminTontineSidebar pathname={pathname} />
        <main className="flex-1 p-6 ml-64">
          {children}
        </main>
      </div>
    </div>
  )
}

