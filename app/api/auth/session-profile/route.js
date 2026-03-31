import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { fetchPublicUserProfileWithFallback } from '@/lib/auth-user-profile'

export const dynamic = 'force-dynamic'

/**
 * Profil public.users pour une session (après callback e-mail, etc.).
 * Même logique que login : retry PostgREST + repli métadonnées Auth si PGRST002.
 */
export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    return NextResponse.json(
      { error: error?.message || 'Session invalide' },
      { status: 401 }
    )
  }

  const result = await fetchPublicUserProfileWithFallback(user)

  if (result.user) {
    return NextResponse.json({ user: result.user })
  }
  if (result.notFound) {
    return NextResponse.json(
      { error: 'Profil introuvable. Contactez le support.' },
      { status: 404 }
    )
  }
  return NextResponse.json(
    { error: result.error?.message || 'Erreur serveur' },
    { status: 500 }
  )
}
