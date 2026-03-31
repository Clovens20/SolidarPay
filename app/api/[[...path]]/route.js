import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase.js'
import { sendWelcomeEmail, sendContributionReminder, sendBeneficiaryNotification } from '../../../lib/resend.js'
import {
  normalizeTontineName,
  isTontineNameTaken,
  TONTINE_NAME_TAKEN_MSG,
} from '../../../lib/tontine-name.js'
import { formatCurrency } from '../../../lib/currency-utils.js'
import { shortReminderPaymentHint } from '../../../lib/tontine-receiver.js'
import { ensureUniqueInviteCode } from '../../../lib/tontine-invite-code.js'
import { getAuthCallbackUrl } from '../../../lib/site-url.js'
import { createSupabaseAdmin } from '../../../lib/supabase-admin.js'
import { FALLBACK_COUNTRY_CODES } from '../../../lib/fallback-payment-countries.js'
import { withSupabaseRetry } from '../../../lib/supabase-query-retry.js'
import {
  fetchPublicUserByEmailWithFallback,
  fetchPublicUserProfileWithFallback,
  resolveUserIdAndRole,
} from '../../../lib/auth-user-profile.js'
import { v4 as uuidv4 } from 'uuid'

// Helper function to handle errors
const handleError = (error, message = 'An error occurred') => {
  console.error(message, error)
  return NextResponse.json(
    { error: error.message || message },
    { status: 500 }
  )
}

// GET /api/test
export async function GET(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/', '')

  try {
    // Test endpoint
    if (path === 'test') {
      return NextResponse.json({ message: 'API is working!', timestamp: new Date().toISOString() })
    }

    // Get current user
    if (path === 'user/me') {
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
      }

      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }

      const profile = await fetchPublicUserProfileWithFallback(user)
      if (profile.user) {
        return NextResponse.json({ user: profile.user })
      }
      if (profile.notFound) {
        return NextResponse.json(
          { error: 'Utilisateur introuvable dans la base de données' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: profile.error?.message || 'Erreur serveur' },
        { status: 500 }
      )
    }

    // Get all users
    if (path === 'users') {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('createdAt', { ascending: false })

      if (error) throw error
      return NextResponse.json(data || [])
    }

    // Get all tontines (filtrées selon le rôle de l'utilisateur)
    if (path === 'tontines') {
      const authHeader = request.headers.get('authorization')
      let userId = null
      let userRole = null
      const db = createSupabaseAdmin() || supabase

      if (authHeader) {
        try {
          const token = authHeader.replace('Bearer ', '')
          const { data: { user }, error: userError } = await supabase.auth.getUser(token)

          if (!userError && user) {
            const resolved = await resolveUserIdAndRole(user)
            if (resolved) {
              userId = resolved.userId
              userRole = resolved.userRole
            }
          }
        } catch (err) {
          // Ignorer les erreurs d'authentification pour cette route
        }
      }

      if (!userId) {
        return NextResponse.json([])
      }

      let tontinesData = []

      if (userRole === 'admin') {
        const { data, error } = await withSupabaseRetry(
          () =>
            db
              .from('tontines')
              .select(`
            *,
            admin:adminId (id, fullName, email)
          `)
              .eq('adminId', userId)
              .order('createdAt', { ascending: false }),
          { maxAttempts: 4, baseDelayMs: 400 }
        )
        if (error) throw error
        tontinesData = data || []
      } else if (userRole === 'member') {
        const { data: memberTontines, error: memberError } = await withSupabaseRetry(
          () =>
            db.from('tontine_members').select('tontineId').eq('userId', userId),
          { maxAttempts: 4, baseDelayMs: 400 }
        )
        if (memberError) throw memberError

        const tontineIds = (memberTontines || []).map((m) => m.tontineId)

        if (tontineIds.length > 0) {
          const { data, error } = await withSupabaseRetry(
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
          if (error) throw error
          tontinesData = data || []
        }
      } else {
        const { data, error } = await withSupabaseRetry(
          () =>
            db
              .from('tontines')
              .select(`
            *,
            admin:adminId (id, fullName, email)
          `)
              .order('createdAt', { ascending: false }),
          { maxAttempts: 4, baseDelayMs: 400 }
        )
        if (error) throw error
        tontinesData = data || []
      }

      return NextResponse.json(tontinesData)
    }

    // Get tontine by ID with members (avec vérification d'accès)
    // Vérifier que c'est bien "tontines/{id}" et pas "tontines/members/..." ou autre
    const tontinesPathMatch = path.match(/^tontines\/([^\/]+)$/)
    if (tontinesPathMatch) {
      const tontineId = tontinesPathMatch[1]
      const db = createSupabaseAdmin() || supabase

      const authHeader = request.headers.get('authorization')
      let userId = null
      let userRole = null

      if (authHeader) {
        try {
          const token = authHeader.replace('Bearer ', '')
          const { data: { user }, error: userError } = await supabase.auth.getUser(token)

          if (!userError && user) {
            const resolved = await resolveUserIdAndRole(user)
            if (resolved) {
              userId = resolved.userId
              userRole = resolved.userRole
            }
          }
        } catch (err) {
          // Ignorer les erreurs d'authentification
        }
      }

      const { data: tontine, error: tontineError } = await withSupabaseRetry(
        () =>
          db
            .from('tontines')
            .select(`
          *,
          admin:adminId (id, fullName, email)
        `)
            .eq('id', tontineId)
            .single(),
        { maxAttempts: 4, baseDelayMs: 400 }
      )

      if (tontineError) throw tontineError
      if (!tontine) {
        return NextResponse.json({ error: 'Tontine not found' }, { status: 404 })
      }

      if (userId && userRole) {
        if (userRole === 'member') {
          const { data: membership, error: membershipError } = await withSupabaseRetry(
            () =>
              db
                .from('tontine_members')
                .select('id')
                .eq('tontineId', tontineId)
                .eq('userId', userId)
                .single(),
            { maxAttempts: 4, baseDelayMs: 400 }
          )

          if (membershipError || !membership) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
          }
        } else if (userRole === 'admin') {
          if (tontine.adminId !== userId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
          }
        }
      }

      const { data: members, error: membersError } = await withSupabaseRetry(
        () =>
          db
            .from('tontine_members')
            .select(`
          *,
          user:userId (id, fullName, email, kohoEmail)
        `)
            .eq('tontineId', tontineId)
            .order('rotationOrder', { ascending: true }),
        { maxAttempts: 4, baseDelayMs: 400 }
      )

      if (membersError) throw membersError

      return NextResponse.json({ ...tontine, members: members || [] })
    }

    // Get cycles for a tontine
    if (path.startsWith('cycles/tontine/')) {
      const tontineId = path.split('/')[2]
      
      const { data, error } = await supabase
        .from('cycles')
        .select(`
          *,
          beneficiary:beneficiaryId (id, fullName, email, kohoEmail)
        `)
        .eq('tontineId', tontineId)
        .order('cycleNumber', { ascending: false })

      if (error) throw error
      return NextResponse.json(data || [])
    }

    // Get active cycle for a tontine
    if (path.startsWith('cycles/active/')) {
      const tontineId = path.split('/')[2]
      
      const { data, error } = await supabase
        .from('cycles')
        .select(`
          *,
          beneficiary:beneficiaryId (id, fullName, email, kohoEmail)
        `)
        .eq('tontineId', tontineId)
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return NextResponse.json(data || null)
    }

    // Get contributions for a cycle
    if (path.startsWith('contributions/cycle/')) {
      const cycleId = path.split('/')[2]
      
      const { data, error } = await supabase
        .from('contributions')
        .select(`
          *,
          user:userId (id, fullName, email)
        `)
        .eq('cycleId', cycleId)
        .order('createdAt', { ascending: false })

      if (error) throw error
      return NextResponse.json(data || [])
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
  } catch (error) {
    return handleError(error, `Error in GET ${path}`)
  }
}

// POST endpoints
export async function POST(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/', '')

  try {
    const body = await request.json()

    // Register new user
    if (path === 'auth/register') {
      const { email, password, fullName, phone, country, role = 'member' } = body

      const countryCode = String(country ?? '')
        .trim()
        .toUpperCase()
      if (!countryCode) {
        return NextResponse.json({ error: 'Le pays est obligatoire' }, { status: 400 })
      }

      // Valider le rôle - seuls 'member' et 'admin' sont autorisés lors de l'inscription
      const validRoles = ['member', 'admin']
      const userRole = validRoles.includes(role) ? role : 'member'

      // Pays : clé service si dispo (contourne RLS), sinon anon ; retry PostgREST (PGRST002 / schema cache)
      const countryClient = createSupabaseAdmin() || supabase
      const { data: countryRow, error: countryQueryError } = await withSupabaseRetry(
        () =>
          countryClient
            .from('payment_countries')
            .select('code, enabled')
            .eq('code', countryCode)
            .maybeSingle(),
        { maxAttempts: 6, baseDelayMs: 400 }
      )

      let countryAllowed = false
      if (countryRow) {
        if (countryRow.enabled === false) {
          return NextResponse.json(
            { error: 'Ce pays n\'est pas disponible actuellement' },
            { status: 400 }
          )
        }
        countryAllowed = true
      } else if (FALLBACK_COUNTRY_CODES.has(countryCode)) {
        if (countryQueryError) {
          console.warn(
            '[auth/register] payment_countries indisponible, repli codes embarqués:',
            countryQueryError.code || countryQueryError.message
          )
        }
        countryAllowed = true
      } else if (countryQueryError) {
        return NextResponse.json(
          {
            error:
              'Service temporairement indisponible. Réessayez dans quelques instants.',
          },
          { status: 503 }
        )
      }

      if (!countryAllowed) {
        return NextResponse.json({ error: 'Pays invalide' }, { status: 400 })
      }

      // Auth + profil : métadonnées pour le trigger SQL public.handle_new_user (voir sql/trigger-handle-new-user.sql).
      // Le profil est inséré dans Postgres au même moment que auth.users — plus d’échec PostgREST après e-mail envoyé.
      const phoneTrimmed = phone && String(phone).trim() ? String(phone).trim() : null
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
          data: {
            fullName,
            country: countryCode,
            role: userRole,
            phone: phoneTrimmed,
          },
        },
      })

      if (authError) throw authError

      if (!authData?.user?.id) {
        return NextResponse.json(
          {
            error:
              'Inscription incomplète. Réessayez ou contactez le support.',
          },
          { status: 500 }
        )
      }

      const userPayload = {
        id: authData.user.id,
        email,
        fullName,
        phone: phoneTrimmed,
        country: countryCode,
        role: userRole,
        createdAt: authData.user.created_at ?? new Date().toISOString(),
      }

      void sendWelcomeEmail(email, fullName).catch((err) =>
        console.error('sendWelcomeEmail:', err)
      )

      return NextResponse.json({ user: userPayload, session: authData.session })
    }

    // Login
    if (path === 'auth/login') {
      const { email, password } = body

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        const invalid =
          error.code === 'invalid_credentials' ||
          String(error.message || '').toLowerCase().includes('invalid login')
        return NextResponse.json(
          {
            error: invalid
              ? 'Email ou mot de passe incorrect.'
              : error.message || 'Connexion impossible.',
          },
          { status: invalid ? 401 : 400 }
        )
      }

      if (!data.session) {
        return NextResponse.json({ error: 'Erreur de session' }, { status: 500 })
      }

      const profile = await fetchPublicUserByEmailWithFallback(email, data.user)

      if (profile.user) {
        return NextResponse.json({ user: profile.user, session: data.session })
      }
      if (profile.notFound) {
        return NextResponse.json(
          { error: 'Utilisateur introuvable dans la base de données' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: profile.error?.message || 'Connexion impossible.' },
        { status: 500 }
      )
    }

    // Create tontine
    if (path === 'tontines') {
      const { name, contributionAmount, frequency, adminId, kohoReceiverEmail, memberIds, currency, paymentMode } = body

      const trimmedName = normalizeTontineName(name)
      if (!trimmedName) {
        return NextResponse.json(
          { error: 'Le nom de la tontine est requis' },
          { status: 400 }
        )
      }

      if (await isTontineNameTaken(supabase, trimmedName)) {
        return NextResponse.json({ error: TONTINE_NAME_TAKEN_MSG }, { status: 409 })
      }

      const inviteCode = await ensureUniqueInviteCode(supabase)

      const { data: tontine, error: tontineError } = await supabase
        .from('tontines')
        .insert([{
          name: trimmedName,
          contributionAmount,
          frequency,
          adminId,
          kohoReceiverEmail,
          currency: currency || 'CAD',
          paymentMode: paymentMode || 'direct',
          status: 'active',
          inviteCode,
        }])
        .select()
        .single()

      if (tontineError) {
        if (tontineError.code === '23505') {
          return NextResponse.json({ error: TONTINE_NAME_TAKEN_MSG }, { status: 409 })
        }
        throw tontineError
      }

      // Add members with rotation order
      if (memberIds && memberIds.length > 0) {
        const members = memberIds.map((userId, index) => ({
          tontineId: tontine.id,
          userId,
          rotationOrder: index + 1,
        }))

        const { error: membersError } = await supabase
          .from('tontine_members')
          .insert(members)

        if (membersError) throw membersError
      }

      return NextResponse.json(tontine)
    }

    // Create cycle
    if (path === 'cycles') {
      const { tontineId, beneficiaryId, startDate, endDate } = body

      // Get tontine details
      const { data: tontine, error: tontineError } = await supabase
        .from('tontines')
        .select('contributionAmount,currency')
        .eq('id', tontineId)
        .single()

      if (tontineError) throw tontineError

      // Get member count
      const { count, error: countError } = await supabase
        .from('tontine_members')
        .select('*', { count: 'exact', head: true })
        .eq('tontineId', tontineId)

      if (countError) throw countError

      // Get last cycle number
      const { data: lastCycle } = await supabase
        .from('cycles')
        .select('cycleNumber')
        .eq('tontineId', tontineId)
        .order('cycleNumber', { ascending: false })
        .limit(1)
        .single()

      const cycleNumber = lastCycle ? lastCycle.cycleNumber + 1 : 1
      const totalExpected = tontine.contributionAmount * count

      // Create cycle
      const { data: cycle, error: cycleError } = await supabase
        .from('cycles')
        .insert([{
          tontineId,
          cycleNumber,
          beneficiaryId,
          startDate,
          endDate,
          totalExpected,
          totalCollected: 0,
          status: 'active',
        }])
        .select()
        .single()

      if (cycleError) throw cycleError

      // Create pending contributions for all members
      const { data: members, error: membersError } = await supabase
        .from('tontine_members')
        .select('userId')
        .eq('tontineId', tontineId)

      if (membersError) throw membersError

      const contributions = members.map(member => ({
        cycleId: cycle.id,
        userId: member.userId,
        amount: tontine.contributionAmount,
        status: 'pending',
      }))

      const { error: contributionsError } = await supabase
        .from('contributions')
        .insert(contributions)

      if (contributionsError) throw contributionsError

      // Send notification to beneficiary
      const { data: beneficiary } = await supabase
        .from('users')
        .select('fullName, email')
        .eq('id', beneficiaryId)
        .single()

      if (beneficiary) {
        const currency = tontine?.currency || 'CAD'
        await sendBeneficiaryNotification(
          beneficiary.email,
          beneficiary.fullName,
          formatCurrency(totalExpected, currency),
          count
        )
      }

      return NextResponse.json(cycle)
    }

    // Declare payment
    if (path === 'contributions/declare') {
      const { contributionId } = body

      const { data, error } = await supabase
        .from('contributions')
        .update({
          status: 'pending_validation',
          declaredAt: new Date().toISOString(),
        })
        .eq('id', contributionId)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }

    // Validate payment (admin)
    if (path === 'contributions/validate') {
      const { contributionId, adminId, notes } = body

      const { data: contribution, error } = await supabase
        .from('contributions')
        .update({
          status: 'validated',
          validatedAt: new Date().toISOString(),
          validatedBy: adminId,
          notes,
        })
        .eq('id', contributionId)
        .select('*, cycle:cycleId(id, tontineId, totalCollected, totalExpected)')
        .single()

      if (error) throw error

      // Update cycle total collected
      const newTotal = contribution.cycle.totalCollected + contribution.amount
      await supabase
        .from('cycles')
        .update({ totalCollected: newTotal })
        .eq('id', contribution.cycleId)

      // Check if cycle is complete
      if (newTotal >= contribution.cycle.totalExpected) {
        await supabase
          .from('cycles')
          .update({ status: 'completed' })
          .eq('id', contribution.cycleId)
      }

      return NextResponse.json(contribution)
    }

    // Reject payment (admin)
    if (path === 'contributions/reject') {
      const { contributionId, notes } = body

      const { data, error } = await supabase
        .from('contributions')
        .update({
          status: 'rejected',
          notes,
        })
        .eq('id', contributionId)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }

    // Add member to tontine
    if (path === 'tontines/members/add') {
      const { tontineId, userId } = body

      const { data: existing } = await supabase
        .from('tontine_members')
        .select('id')
        .eq('tontineId', tontineId)
        .eq('userId', userId)
        .maybeSingle()
      if (existing) {
        return NextResponse.json(
          { error: 'Ce membre fait déjà partie de la tontine.' },
          { status: 409 }
        )
      }

      const { data: tontineRow } = await supabase
        .from('tontines')
        .select('maxMembers')
        .eq('id', tontineId)
        .maybeSingle()
      const cap = tontineRow?.maxMembers != null ? Number(tontineRow.maxMembers) : null
      if (cap != null && Number.isFinite(cap) && cap >= 1) {
        const { count, error: cErr } = await supabase
          .from('tontine_members')
          .select('*', { count: 'exact', head: true })
          .eq('tontineId', tontineId)
        if (cErr) throw cErr
        if ((count || 0) >= cap) {
          return NextResponse.json(
            { error: `La tontine est complète (${cap} membres maximum).` },
            { status: 400 }
          )
        }
      }

      // Get next rotation order
      const { data: lastMember } = await supabase
        .from('tontine_members')
        .select('rotationOrder')
        .eq('tontineId', tontineId)
        .order('rotationOrder', { ascending: false })
        .limit(1)
        .maybeSingle()

      const rotationOrder = lastMember ? lastMember.rotationOrder + 1 : 1

      const { data, error } = await supabase
        .from('tontine_members')
        .insert([{
          tontineId,
          userId,
          rotationOrder,
        }])
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          return NextResponse.json(
            { error: 'Ce membre est déjà dans cette tontine ou le rang est en conflit.' },
            { status: 409 }
          )
        }
        throw error
      }
      return NextResponse.json(data)
    }

    // Send reminder emails
    if (path === 'notifications/reminders') {
      const { cycleId } = body

      // Get cycle details
      const { data: cycle, error: cycleError } = await supabase
        .from('cycles')
        .select(`
          *,
          beneficiary:beneficiaryId (fullName),
          tontine:tontineId (contributionAmount, currency, kohoReceiverEmail)
        `)
        .eq('id', cycleId)
        .single()

      if (cycleError) throw cycleError

      // Get pending contributions
      const { data: contributions, error: contribError } = await supabase
        .from('contributions')
        .select('*, user:userId (fullName, email)')
        .eq('cycleId', cycleId)
        .eq('status', 'pending')

      if (contribError) throw contribError

      // Send reminders
      const results = []
      const currency = cycle.tontine?.currency || 'CAD'
      const amountFormatted = formatCurrency(cycle.tontine.contributionAmount, currency)
      const paymentHint = shortReminderPaymentHint(cycle.tontine.kohoReceiverEmail)
      const dueDateStr = new Date(cycle.endDate).toLocaleDateString('fr-FR')

      for (const contrib of contributions) {
        const result = await sendContributionReminder(
          contrib.user.email,
          contrib.user.fullName,
          amountFormatted,
          cycle.beneficiary.fullName,
          dueDateStr,
          paymentHint
        )
        results.push(result)
      }

      return NextResponse.json({ sent: results.length, results })
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
  } catch (error) {
    return handleError(error, `Error in POST ${path}`)
  }
}

// PUT endpoints
export async function PUT(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/', '')

  try {
    const body = await request.json()

    // Update tontine
    if (path.startsWith('tontines/')) {
      const tontineId = path.split('/')[1]
      const { name, contributionAmount, frequency, kohoReceiverEmail, status } = body

      const { data, error } = await supabase
        .from('tontines')
        .update({
          name,
          contributionAmount,
          frequency,
          kohoReceiverEmail,
          status,
        })
        .eq('id', tontineId)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }

    // Update user
    if (path.startsWith('users/')) {
      const userId = path.split('/')[1]
      const { fullName, phone, kohoEmail, role } = body

      const { data, error } = await supabase
        .from('users')
        .update({
          fullName,
          phone,
          kohoEmail,
          role,
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
  } catch (error) {
    return handleError(error, `Error in PUT ${path}`)
  }
}

// DELETE endpoints
export async function DELETE(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/', '')

  try {
    // Delete tontine member
    if (path.startsWith('tontines/members/')) {
      const memberId = path.split('/')[2]

      const { error } = await supabase
        .from('tontine_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
  } catch (error) {
    return handleError(error, `Error in DELETE ${path}`)
  }
}