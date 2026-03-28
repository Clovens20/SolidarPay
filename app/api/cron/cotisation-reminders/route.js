import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase.js'
import { createSupabaseAdmin } from '../../../../lib/supabase-admin.js'
import { runCotisationReminders } from '../../../../lib/cotisation-reminders.js'

/**
 * Cron : rappels e-mail 24 h / 12 h / échéance (cotisants + bénéficiaire).
 *
 * Variables :
 * - CRON_SECRET : obligatoire en production ; header Authorization: Bearer <CRON_SECRET> ou ?secret=
 * - SUPABASE_SERVICE_ROLE_KEY : recommandé pour le job (sinon clé anon si RLS le permet)
 * - RESEND_API_KEY : pour l’envoi réel
 *
 * Vercel : ajouter CRON_SECRET dans les env du projet ; le cron peut envoyer le même secret.
 */
export async function GET(request) {
  const secret = process.env.CRON_SECRET
  if (process.env.NODE_ENV === 'production' && !secret) {
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET doit être défini en production' },
      { status: 500 }
    )
  }

  if (secret) {
    const auth = request.headers.get('authorization') || ''
    const bearer = auth.replace(/^Bearer\s+/i, '').trim()
    const q = request.nextUrl.searchParams.get('secret')
    if (bearer !== secret && q !== secret) {
      return NextResponse.json({ ok: false, error: 'Non autorisé' }, { status: 401 })
    }
  }

  const admin = createSupabaseAdmin()
  const client = admin || supabase

  try {
    const summary = await runCotisationReminders(client)
    return NextResponse.json({ ok: true, ...summary })
  } catch (e) {
    console.error('runCotisationReminders', e)
    return NextResponse.json(
      { ok: false, error: e.message || 'Erreur cron' },
      { status: 500 }
    )
  }
}
