import { Resend } from 'resend'

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Rendre Resend optionnel pour éviter les erreurs si la clé API n'est pas configurée
let resend = null

try {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
} catch (error) {
  console.warn('Resend not configured:', error.message)
}

export async function sendEmail({ to, subject, html }) {
  // Si Resend n'est pas configuré, retourner un succès silencieux
  if (!resend) {
    console.warn('Resend not configured. Email not sent to:', to)
    return { success: false, error: 'Resend API key not configured' }
  }

  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'SolidarPay <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    })
    return { success: true, data }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: error.message }
  }
}

export async function sendWelcomeEmail(to, fullName) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #0891b2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Votre compte SolidarPay est ouvert</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${escapeHtml(fullName)}</strong>,</p>
            <p>Merci d’avoir créé votre compte SolidarPay. Vous pouvez dès maintenant vous connecter et gérer vos tontines en toute simplicité.</p>
            <p><strong>Ce que vous pouvez faire :</strong></p>
            <ul>
              <li>Accéder à votre tableau de bord</li>
              <li>Rejoindre des tontines ou en créer une (selon votre rôle)</li>
              <li>Suivre les cycles, les cotisations et votre tour de bénéficiaire</li>
              <li>Effectuer vos paiements selon les instructions de votre tontine (virement, Interac, etc.)</li>
            </ul>
            <p>Si vous n’êtes pas à l’origine de cette inscription, contactez-nous sans attendre.</p>
            <p>À très bientôt sur SolidarPay.</p>
          </div>
        </div>
      </body>
    </html>
  `
  return sendEmail({ to, subject: 'SolidarPay — Votre compte est prêt', html })
}

/**
 * @param {string} amountFormatted - Montant déjà formaté (ex. via formatCurrency)
 * @param {string} [paymentHint] - Phrase courte (échappée pour le HTML)
 */
export async function sendContributionReminder(
  to,
  fullName,
  amountFormatted,
  beneficiary,
  dueDate,
  paymentHint
) {
  const safeHint = escapeHtml(
    paymentHint || 'Connectez-vous à SolidarPay pour les instructions de paiement.'
  )
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .highlight { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Rappel de Cotisation</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${escapeHtml(fullName)}</strong>,</p>
            <p>C'est bientôt le moment de votre cotisation pour le cycle en cours!</p>
            <div class="highlight">
              <p><strong>💰 Montant :</strong> ${escapeHtml(String(amountFormatted))}</p>
              <p><strong>👤 Bénéficiaire :</strong> ${escapeHtml(beneficiary)}</p>
              <p><strong>📅 Date limite :</strong> ${escapeHtml(dueDate)}</p>
            </div>
            <p>${safeHint}</p>
            <p>Connectez-vous à votre espace SolidarPay pour plus de détails sur ce cycle.</p>
            <p>Merci de votre engagement! 🤝</p>
          </div>
        </div>
      </body>
    </html>
  `
  return sendEmail({ to, subject: '⏰ Rappel: Cotisation SolidarPay', html })
}

const CONTRIB_PHASE = {
  '24h': {
    subject: '⏰ SolidarPay — Cotisation : rappel 24 h',
    headline: 'Rappel J-1',
    lead: 'Il reste environ une journée avant la date limite de cotisation pour ce cycle.',
  },
  '12h': {
    subject: '⏰ SolidarPay — Cotisation : rappel 12 h',
    headline: 'Rappel 12 heures',
    lead: 'La date limite de cotisation approche (environ 12 heures).',
  },
  due: {
    subject: '⏰ SolidarPay — Cotisation : échéance',
    headline: 'Échéance imminente',
    lead: 'La date limite de cotisation est très proche ou atteinte — merci de régulariser si ce n’est pas déjà fait.',
  },
}

/**
 * Rappels planifiés (cron) : 24 h, 12 h ou échéance.
 * @param {'24h'|'12h'|'due'} phase
 */
export async function sendContributionReminderPhase(
  to,
  fullName,
  amountFormatted,
  beneficiary,
  dueDate,
  paymentHint,
  phase
) {
  const p = CONTRIB_PHASE[phase] || CONTRIB_PHASE.due
  const safeHint = escapeHtml(
    paymentHint || 'Connectez-vous à SolidarPay pour les instructions de paiement.'
  )
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .highlight { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${escapeHtml(p.headline)}</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${escapeHtml(fullName)}</strong>,</p>
            <p>${escapeHtml(p.lead)}</p>
            <div class="highlight">
              <p><strong>💰 Montant :</strong> ${escapeHtml(String(amountFormatted))}</p>
              <p><strong>👤 Bénéficiaire du cycle :</strong> ${escapeHtml(beneficiary)}</p>
              <p><strong>📅 Date limite :</strong> ${escapeHtml(dueDate)}</p>
            </div>
            <p>${safeHint}</p>
            <p>Connectez-vous à votre espace SolidarPay pour plus de détails.</p>
            <p>Merci de votre engagement.</p>
          </div>
        </div>
      </body>
    </html>
  `
  return sendEmail({ to, subject: p.subject, html })
}

const BEN_PHASE = {
  '24h': {
    subject: '💚 SolidarPay — Vous êtes bénéficiaire : échéance dans ~24 h',
    lead: 'Les cotisations de ce cycle se terminent dans environ 24 heures. Vous êtes le ou la bénéficiaire de ce tour.',
  },
  '12h': {
    subject: '💚 SolidarPay — Bénéficiaire : échéance dans ~12 h',
    lead: 'Les cotisations de ce cycle se terminent dans environ 12 heures. Vous êtes le ou la bénéficiaire de ce tour.',
  },
}

/**
 * Rappel automatique au bénéficiaire avant la clôture des cotisations.
 * @param {'24h'|'12h'} phase
 */
export async function sendBeneficiaryDeadlineReminder(
  to,
  fullName,
  amountFormatted,
  dueDate,
  phase,
  contributorsCount
) {
  const p = BEN_PHASE[phase] || BEN_PHASE['24h']
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .highlight { background: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bénéficiaire du cycle</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${escapeHtml(fullName)}</strong>,</p>
            <p>${escapeHtml(p.lead)}</p>
            <div class="highlight">
              <p><strong>💰 Montant attendu (cycle) :</strong> ${escapeHtml(String(amountFormatted))}</p>
              <p><strong>👥 Membres :</strong> ${escapeHtml(String(contributorsCount))}</p>
              <p><strong>📅 Date limite des cotisations :</strong> ${escapeHtml(dueDate)}</p>
            </div>
            <p>Le versement effectif dépend des validations de l’administrateur une fois toutes les cotisations reçues.</p>
          </div>
        </div>
      </body>
    </html>
  `
  return sendEmail({ to, subject: p.subject, html })
}

/**
 * @param {string} amountFormatted - Total attendu déjà formaté
 */
export async function sendBeneficiaryNotification(to, fullName, amountFormatted, contributorsCount) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .celebration { font-size: 48px; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 C'est votre tour!</h1>
          </div>
          <div class="content">
            <div class="celebration">🎊 🎉 🎊</div>
            <p>Bonjour <strong>${escapeHtml(fullName)}</strong>,</p>
            <p>Excellente nouvelle! C'est à votre tour de recevoir le montant collecté de la tontine!</p>
            <p><strong>💰 Montant total :</strong> ${escapeHtml(String(amountFormatted))}</p>
            <p><strong>👥 Contributeurs :</strong> ${escapeHtml(String(contributorsCount))} membres</p>
            <p>Le montant sera disponible une fois que tous les membres auront effectué leur cotisation et que l'administrateur aura validé les paiements.</p>
            <p>Félicitations! 🎊</p>
          </div>
        </div>
      </body>
    </html>
  `
  return sendEmail({ to, subject: '🎉 SolidarPay: C\'est votre tour de recevoir!', html })
}