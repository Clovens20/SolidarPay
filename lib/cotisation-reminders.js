import {
  sendContributionReminderPhase,
  sendBeneficiaryDeadlineReminder,
} from './resend.js'
import { formatCurrency } from './currency-utils.js'
import { shortReminderPaymentHint } from './tontine-receiver.js'

const KIND = {
  CONTRIB_24: 'contrib_24h',
  CONTRIB_12: 'contrib_12h',
  CONTRIB_DUE: 'contrib_due',
  BEN_24: 'ben_24h',
  BEN_12: 'ben_12h',
}

function hoursToEnd(endIso) {
  return (new Date(endIso).getTime() - Date.now()) / (1000 * 60 * 60)
}

/** Fenêtres compatibles avec un cron horaire (marge anti-décalage horloge). */
function band24h(h) {
  return h <= 24.5 && h >= 22.5
}
function band12h(h) {
  return h <= 12.5 && h >= 10.5
}
function bandDue(h) {
  return h <= 2.5 && h >= -0.5
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
export async function runCotisationReminders(supabase) {
  const summary = {
    cyclesScanned: 0,
    emailsSent: 0,
    skippedNoTable: false,
    errors: [],
  }

  const { data: cycles, error: cyclesError } = await supabase
    .from('cycles')
    .select('id, tontineId, endDate, beneficiaryId, status, totalExpected')
    .eq('status', 'active')

  if (cyclesError) throw cyclesError

  for (const cycle of cycles || []) {
    const h = hoursToEnd(cycle.endDate)
    if (h < -48) continue
    summary.cyclesScanned++

    const { data: tontine, error: tontineError } = await supabase
      .from('tontines')
      .select('contributionAmount, currency, kohoReceiverEmail')
      .eq('id', cycle.tontineId)
      .maybeSingle()

    if (tontineError || !tontine) continue

    const currency = tontine.currency || 'CAD'
    const amountFormatted = formatCurrency(tontine.contributionAmount, currency)
    const totalFormatted = formatCurrency(cycle.totalExpected, currency)
    const paymentHint = shortReminderPaymentHint(tontine.kohoReceiverEmail)
    const dueDateStr = new Date(cycle.endDate).toLocaleString('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'short',
    })

    const { data: beneficiary } = await supabase
      .from('users')
      .select('id, fullName, email')
      .eq('id', cycle.beneficiaryId)
      .maybeSingle()

    const { data: contribs, error: contribErr } = await supabase
      .from('contributions')
      .select('id, userId, status')
      .eq('cycleId', cycle.id)
      .in('status', ['pending', 'pending_validation'])

    if (contribErr) {
      summary.errors.push(contribErr.message)
      continue
    }

    const userIds = [...new Set((contribs || []).map((c) => c.userId))]
    let usersById = {}
    if (userIds.length) {
      const { data: usersRows } = await supabase
        .from('users')
        .select('id, fullName, email')
        .in('id', userIds)
      usersById = Object.fromEntries((usersRows || []).map((u) => [u.id, u]))
    }

    const { data: logs, error: logErr } = await supabase
      .from('cotisation_reminder_sent')
      .select('userId, kind')
      .eq('cycleId', cycle.id)

    if (logErr) {
      if (logErr.code === '42P01' || logErr.message?.includes('does not exist')) {
        summary.skippedNoTable = true
        summary.errors.push(
          'Table cotisation_reminder_sent absente — exécuter cotisation-reminder-sent.sql sur Supabase.'
        )
        return summary
      }
      summary.errors.push(logErr.message)
      continue
    }

    const sent = new Set((logs || []).map((l) => `${l.userId}|${l.kind}`))

    async function markSent(userId, kind) {
      const { error: insErr } = await supabase.from('cotisation_reminder_sent').insert({
        cycleId: cycle.id,
        userId,
        kind,
      })
      if (insErr && insErr.code !== '23505') {
        summary.errors.push(insErr.message)
      }
    }

    const benName = beneficiary?.fullName || '—'

    for (const c of contribs || []) {
      const u = usersById[c.userId]
      if (!u?.email) continue
      const uid = c.userId
      const key24 = `${uid}|${KIND.CONTRIB_24}`
      const key12 = `${uid}|${KIND.CONTRIB_12}`
      const keyDue = `${uid}|${KIND.CONTRIB_DUE}`

      if (band24h(h) && !sent.has(key24)) {
        const r = await sendContributionReminderPhase(
          u.email,
          u.fullName,
          amountFormatted,
          benName,
          dueDateStr,
          paymentHint,
          '24h'
        )
        summary.emailsSent++
        if (r?.success) {
          await markSent(uid, KIND.CONTRIB_24)
          sent.add(key24)
        }
      }
      if (band12h(h) && !sent.has(key12)) {
        const r = await sendContributionReminderPhase(
          u.email,
          u.fullName,
          amountFormatted,
          benName,
          dueDateStr,
          paymentHint,
          '12h'
        )
        summary.emailsSent++
        if (r?.success) {
          await markSent(uid, KIND.CONTRIB_12)
          sent.add(key12)
        }
      }
      if (bandDue(h) && !sent.has(keyDue)) {
        const r = await sendContributionReminderPhase(
          u.email,
          u.fullName,
          amountFormatted,
          benName,
          dueDateStr,
          paymentHint,
          'due'
        )
        summary.emailsSent++
        if (r?.success) {
          await markSent(uid, KIND.CONTRIB_DUE)
          sent.add(keyDue)
        }
      }
    }

    if (beneficiary?.email && cycle.beneficiaryId) {
      const bid = beneficiary.id
      let memberCount = 0
      const { count: mc } = await supabase
        .from('tontine_members')
        .select('*', { count: 'exact', head: true })
        .eq('tontineId', cycle.tontineId)
      if (typeof mc === 'number') memberCount = mc
      else if (tontine.contributionAmount > 0) {
        memberCount = Math.round(Number(cycle.totalExpected) / Number(tontine.contributionAmount))
      }

      const kBen24 = `${bid}|${KIND.BEN_24}`
      const kBen12 = `${bid}|${KIND.BEN_12}`

      if (band24h(h) && !sent.has(kBen24)) {
        const r = await sendBeneficiaryDeadlineReminder(
          beneficiary.email,
          beneficiary.fullName,
          totalFormatted,
          dueDateStr,
          '24h',
          memberCount
        )
        summary.emailsSent++
        if (r?.success) {
          await markSent(bid, KIND.BEN_24)
          sent.add(kBen24)
        }
      }
      if (band12h(h) && !sent.has(kBen12)) {
        const r = await sendBeneficiaryDeadlineReminder(
          beneficiary.email,
          beneficiary.fullName,
          totalFormatted,
          dueDateStr,
          '12h',
          memberCount
        )
        summary.emailsSent++
        if (r?.success) {
          await markSent(bid, KIND.BEN_12)
          sent.add(kBen12)
        }
      }
    }
  }

  return summary
}
