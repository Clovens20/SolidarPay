import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { withSupabaseRetry } from '@/lib/supabase-query-retry'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user: authUser },
    error: authErr,
  } = await supabase.auth.getUser(token)

  if (authErr || !authUser) {
    return NextResponse.json(
      { error: authErr?.message || 'Session invalide' },
      { status: 401 }
    )
  }

  const db = createSupabaseAdmin() || supabase
  const { data: profile } = await withSupabaseRetry(
    () =>
      db
        .from('users')
        .select('id, role, country')
        .eq('id', authUser.id)
        .maybeSingle(),
    { maxAttempts: 6, baseDelayMs: 400 }
  )

  const role = profile?.role ?? authUser.user_metadata?.role
  if (role !== 'member') {
    return NextResponse.json(
      { error: 'Accès réservé aux membres' },
      { status: 403 }
    )
  }

  const userId = profile?.id || authUser.id
  const country =
    profile?.country ?? authUser.user_metadata?.country ?? null

  let tontinesData = []
  const { data: memberTontines, error: memberError } = await withSupabaseRetry(
    () =>
      db.from('tontine_members').select('tontineId').eq('userId', userId),
    { maxAttempts: 4, baseDelayMs: 400 }
  )

  if (memberError) {
    return NextResponse.json(
      { error: memberError.message || 'Erreur chargement tontines' },
      { status: 500 }
    )
  }

  const tontineIds = (memberTontines || []).map((m) => m.tontineId)
  if (tontineIds.length > 0) {
    const { data: tontines, error: tontinesError } = await withSupabaseRetry(
      () =>
        db
          .from('tontines')
          .select(`
            *,
            admin:adminId (id, fullName, email)
          `)
          .in('id', tontineIds)
          .order('createdAt', { ascending: false }),
      { maxAttempts: 4, baseDelayMs: 400 }
    )
    if (tontinesError) {
      return NextResponse.json(
        { error: tontinesError.message || 'Erreur chargement tontines' },
        { status: 500 }
      )
    }
    tontinesData = tontines || []
  }

  let myJoinRequests = []
  const { data: joinReqRows, error: joinReqErr } = await withSupabaseRetry(
    () =>
      db
        .from('tontine_join_requests')
        .select('id, status, createdAt, tontineId, message')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .limit(30),
    { maxAttempts: 4, baseDelayMs: 400 }
  )

  if (!joinReqErr && joinReqRows?.length) {
    const allReqTontineIds = [...new Set(joinReqRows.map((r) => r.tontineId))]
    let nameById = {}
    if (allReqTontineIds.length) {
      const { data: tontNameRows } = await withSupabaseRetry(
        () =>
          db.from('tontines').select('id, name').in('id', allReqTontineIds),
        { maxAttempts: 4, baseDelayMs: 400 }
      )
      nameById = Object.fromEntries(
        (tontNameRows || []).map((t) => [t.id, t.name])
      )
    }
    myJoinRequests = joinReqRows.map((r) => ({
      ...r,
      tontineName: nameById[r.tontineId] || null,
    }))
  }

  let countryTontines = []
  let countryDiscoverLabel = ''
  if (country) {
    const { data: pcRow } = await withSupabaseRetry(
      () =>
        db
          .from('payment_countries')
          .select('name')
          .eq('code', country)
          .maybeSingle(),
      { maxAttempts: 4, baseDelayMs: 400 }
    )
    countryDiscoverLabel = pcRow?.name || country

    const { data: adminsSameCountry } = await withSupabaseRetry(
      () =>
        db
          .from('users')
          .select('id')
          .eq('role', 'admin')
          .eq('country', country),
      { maxAttempts: 4, baseDelayMs: 400 }
    )
    const adminIds = (adminsSameCountry || []).map((a) => a.id)
    if (adminIds.length) {
      const { data: disc, error: discoverErr } = await withSupabaseRetry(
        () =>
          db
            .from('tontines')
            .select(`
              id,
              name,
              status,
              contributionAmount,
              currency,
              frequency,
              adminId,
              admin:adminId (id, fullName, email, country),
              members:tontine_members(count)
            `)
            .eq('status', 'active')
            .in('adminId', adminIds),
        { maxAttempts: 4, baseDelayMs: 400 }
      )
      if (!discoverErr && disc) {
        countryTontines = disc
          .filter((t) => t.admin?.country === country)
          .sort((a, b) =>
            (a.name || '').localeCompare(b.name || '', 'fr', {
              sensitivity: 'base',
            })
          )
      }
    }
  }

  return NextResponse.json({
    tontines: tontinesData,
    myJoinRequests,
    countryTontines,
    countryDiscoverLabel,
  })
}
