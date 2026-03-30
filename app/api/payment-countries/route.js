import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { withSupabaseRetry } from '@/lib/supabase-query-retry'
import { FALLBACK_ENABLED_PAYMENT_COUNTRIES } from '@/lib/fallback-payment-countries'

export const dynamic = 'force-dynamic'

/**
 * Liste des pays activés pour formulaires publics (inscription, profil, tontines, etc.).
 * En cas d’erreur PostgREST (ex. PGRST002), renvoie une liste embarquée pour que les clients
 * puissent toujours choisir un pays (les codes restent valides avec le schéma SQL du dépôt).
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!url || !anonKey) {
    return NextResponse.json(FALLBACK_ENABLED_PAYMENT_COUNTRIES)
  }

  const admin = createSupabaseAdmin()
  const client =
    admin ||
    createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

  const { data, error } = await withSupabaseRetry(
    () =>
      client
        .from('payment_countries')
        .select('code, name, paymentMethods')
        .eq('enabled', true)
        .order('name', { ascending: true }),
    { maxAttempts: 8, baseDelayMs: 600 }
  )

  if (error) {
    console.warn(
      '[api/payment-countries] Supabase indisponible, liste embarquée:',
      error.code || error.message
    )
    return NextResponse.json(FALLBACK_ENABLED_PAYMENT_COUNTRIES)
  }

  const list = data || []
  if (list.length === 0) {
    console.warn('[api/payment-countries] Aucun pays activé en base, liste embarquée')
    return NextResponse.json(FALLBACK_ENABLED_PAYMENT_COUNTRIES)
  }

  return NextResponse.json(list)
}
