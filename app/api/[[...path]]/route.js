import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase.js'
import { sendWelcomeEmail, sendContributionReminder, sendBeneficiaryNotification } from '../../../lib/resend.js'
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

      // Get user details from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single()

      if (userError) {
        return NextResponse.json({ error: userError.message }, { status: 404 })
      }

      return NextResponse.json({ user: userData })
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

    // Get all tontines
    if (path === 'tontines') {
      const { data, error } = await supabase
        .from('tontines')
        .select(`
          *,
          admin:adminId (id, fullName, email)
        `)
        .order('createdAt', { ascending: false })

      if (error) throw error
      return NextResponse.json(data || [])
    }

    // Get tontine by ID with members
    if (path.startsWith('tontines/')) {
      const tontineId = path.split('/')[1]
      
      const { data: tontine, error: tontineError } = await supabase
        .from('tontines')
        .select(`
          *,
          admin:adminId (id, fullName, email)
        `)
        .eq('id', tontineId)
        .single()

      if (tontineError) throw tontineError

      // Get members
      const { data: members, error: membersError } = await supabase
        .from('tontine_members')
        .select(`
          *,
          user:userId (id, fullName, email, kohoEmail)
        `)
        .eq('tontineId', tontineId)
        .order('rotationOrder', { ascending: true })

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
      const { email, password, fullName, phone, role = 'member' } = body

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      // Create user record
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email,
          fullName,
          phone,
          role,
        }])
        .select()
        .single()

      if (userError) throw userError

      // Send welcome email
      await sendWelcomeEmail(email, fullName)

      return NextResponse.json({ user: userData, session: authData.session })
    }

    // Login
    if (path === 'auth/login') {
      const { email, password } = body

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Get user details - utiliser .maybeSingle() pour éviter l'erreur si utilisateur non trouvé
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (userError) {
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }

      if (!userData) {
        return NextResponse.json({ error: 'Utilisateur introuvable dans la base de données' }, { status: 404 })
      }

      return NextResponse.json({ user: userData, session: data.session })
    }

    // Create tontine
    if (path === 'tontines') {
      const { name, contributionAmount, frequency, adminId, kohoReceiverEmail, memberIds } = body

      // Create tontine
      const { data: tontine, error: tontineError } = await supabase
        .from('tontines')
        .insert([{
          name,
          contributionAmount,
          frequency,
          adminId,
          kohoReceiverEmail,
          status: 'active',
        }])
        .select()
        .single()

      if (tontineError) throw tontineError

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
        .select('contributionAmount')
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
        await sendBeneficiaryNotification(
          beneficiary.email,
          beneficiary.fullName,
          totalExpected,
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

      // Get next rotation order
      const { data: lastMember } = await supabase
        .from('tontine_members')
        .select('rotationOrder')
        .eq('tontineId', tontineId)
        .order('rotationOrder', { ascending: false })
        .limit(1)
        .single()

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

      if (error) throw error
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
          tontine:tontineId (contributionAmount)
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
      for (const contrib of contributions) {
        const result = await sendContributionReminder(
          contrib.user.email,
          contrib.user.fullName,
          cycle.tontine.contributionAmount,
          cycle.beneficiary.fullName,
          new Date(cycle.endDate).toLocaleDateString('fr-FR')
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