'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminTontineHeader from '@/components/admin-tontine/AdminTontineHeader'
import AdminTontineSidebar from '@/components/admin-tontine/AdminTontineSidebar'
import { useIsMobile } from '@/hooks/use-mobile'
import { Sheet, SheetContent } from '@/components/ui/sheet'

export default function AdminTontineLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isMobile = useIsMobile()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = async () => {
    try {
      // Vérifier d'abord localStorage (session sauvegardée après connexion)
      const savedSession = localStorage.getItem('solidarpay_session')
      const savedUser = localStorage.getItem('solidarpay_user')
      
      if (savedSession && savedUser) {
        try {
          const userData = JSON.parse(savedUser)
          
          // Vérifier que c'est bien un admin tontine
          if (userData.role === 'admin') {
            // Vérifier que la session Supabase existe aussi
            const { data: { session } } = await supabase.auth.getSession()
            
            if (!session) {
              // Essayer de restaurer la session depuis localStorage
              try {
                const sessionData = JSON.parse(savedSession)
                // La session peut être soit directement la session, soit session.session
                const actualSession = sessionData?.session || sessionData
                if (actualSession?.access_token) {
                  const { error: sessionError } = await supabase.auth.setSession({
                    access_token: actualSession.access_token,
                    refresh_token: actualSession.refresh_token
                  })
                  if (sessionError) {
                    console.warn('Could not restore session:', sessionError)
                  }
                }
              } catch (restoreError) {
                console.warn('Error restoring session:', restoreError)
              }
            }
            
            // Vérifier dans la base de données pour confirmer
            const { data: dbUserData, error: dbError } = await supabase
              .from('users')
              .select('*')
              .eq('id', userData.id)
              .maybeSingle()
            
            if (dbError || !dbUserData) {
              console.error('Error fetching user from DB:', dbError)
              // Utiliser les données de localStorage comme fallback
              setUser(userData)
              return
            }
            
            // Vérifier le rôle dans la DB
            if (dbUserData.role === 'admin') {
              setUser(dbUserData)
              return
            }
          }
        } catch (parseError) {
          console.error('Error parsing localStorage data:', parseError)
          localStorage.removeItem('solidarpay_session')
          localStorage.removeItem('solidarpay_user')
        }
      }
      
      // Vérifier la session Supabase directement
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      // Check if user is admin tontine
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching user:', error)
        router.push('/login')
        return
      }

      if (!userData) {
        console.error('User not found in database')
        router.push('/login')
        return
      }

      // Les admins tontine utilisent cette interface complète
      if (userData.role === 'admin') {
        // Sauvegarder dans localStorage pour la prochaine fois
        localStorage.setItem('solidarpay_session', JSON.stringify(session))
        localStorage.setItem('solidarpay_user', JSON.stringify(userData))
        setUser(userData)
        return
      }

      // Si super admin, rediriger vers /admin/login
      if (userData.role === 'super_admin') {
        router.push('/admin/login')
        return
      }

      // Si membre ou autre rôle, rediriger vers la page principale
      router.push('/')
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/login')
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
      <AdminTontineHeader user={user} onMenuClick={() => setMobileMenuOpen(true)} />
      <div className="flex pt-16">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-solidarpay-border overflow-y-auto z-40">
          <AdminTontineSidebar pathname={pathname} onNavigate={() => {}} />
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <AdminTontineSidebar 
              pathname={pathname} 
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

