'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

async function waitForSession(maxAttempts = 20, delayMs = 150) {
  for (let i = 0; i < maxAttempts; i++) {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (error) throw error
    if (session?.user) return session
    await new Promise((r) => setTimeout(r, delayMs))
  }
  return null
}

function redirectPathForRole(role) {
  if (role === 'super_admin') return '/admin'
  if (role === 'admin') return '/admin-tontine'
  return '/'
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Confirmation de votre compte…')

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const url = new URL(window.location.href)
        const code = url.searchParams.get('code')
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) throw exchangeError
          url.searchParams.delete('code')
          window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
        }

        const session = await waitForSession()
        if (cancelled) return

        if (!session?.user) {
          setMessage('Lien invalide ou expiré. Connectez-vous avec votre e-mail et mot de passe.')
          setTimeout(() => router.replace('/login'), 2800)
          return
        }

        const { data: userData, error: userErr } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (cancelled) return

        if (userErr || !userData) {
          setMessage('Profil introuvable. Contactez le support.')
          setTimeout(() => router.replace('/login'), 2800)
          return
        }

        localStorage.setItem('solidarpay_session', JSON.stringify(session))
        localStorage.setItem('solidarpay_user', JSON.stringify(userData))

        const dest = redirectPathForRole(userData.role)
        router.replace(dest)
      } catch (e) {
        console.error('auth/callback:', e)
        if (!cancelled) {
          setMessage('Erreur lors de la confirmation. Réessayez depuis l’e-mail ou connectez-vous.')
          setTimeout(() => router.replace('/login'), 3200)
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-solidarpay-bg px-4">
      <div className="text-center max-w-md">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-solidarpay-primary mx-auto mb-4" />
        <p className="text-solidarpay-text">{message}</p>
      </div>
    </div>
  )
}
