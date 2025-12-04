import { Resend } from 'resend'

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
            <h1>🤝 Bienvenue sur SolidarPay!</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${fullName}</strong>,</p>
            <p>Nous sommes ravis de vous accueillir dans votre groupe de tontine digitalisée!</p>
            <p>Avec SolidarPay, gérez facilement vos cotisations et suivez votre tour de bénéficiaire en toute transparence.</p>
            <p><strong>Prochaines étapes:</strong></p>
            <ul>
              <li>Consultez votre tableau de bord</li>
              <li>Vérifiez le cycle en cours</li>
              <li>Effectuez votre première cotisation via KOHO</li>
            </ul>
            <p>À très bientôt sur SolidarPay!</p>
          </div>
        </div>
      </body>
    </html>
  `
  return sendEmail({ to, subject: '🎉 Bienvenue sur SolidarPay!', html })
}

export async function sendContributionReminder(to, fullName, amount, beneficiary, dueDate) {
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
            <p>Bonjour <strong>${fullName}</strong>,</p>
            <p>C'est bientôt le moment de votre cotisation pour le cycle en cours!</p>
            <div class="highlight">
              <p><strong>💰 Montant:</strong> ${amount} CAD</p>
              <p><strong>👤 Bénéficiaire:</strong> ${beneficiary}</p>
              <p><strong>📅 Date limite:</strong> ${dueDate}</p>
            </div>
            <p>Connectez-vous à votre espace SolidarPay pour effectuer votre paiement via KOHO.</p>
            <p>Merci de votre engagement! 🤝</p>
          </div>
        </div>
      </body>
    </html>
  `
  return sendEmail({ to, subject: '⏰ Rappel: Cotisation SolidarPay', html })
}

export async function sendBeneficiaryNotification(to, fullName, amount, contributorsCount) {
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
            <p>Bonjour <strong>${fullName}</strong>,</p>
            <p>Excellente nouvelle! C'est à votre tour de recevoir le montant collecté de la tontine!</p>
            <p><strong>💰 Montant total:</strong> ${amount} CAD</p>
            <p><strong>👥 Contributeurs:</strong> ${contributorsCount} membres</p>
            <p>Le montant sera disponible une fois que tous les membres auront effectué leur cotisation et que l'administrateur aura validé les paiements.</p>
            <p>Félicitations! 🎊</p>
          </div>
        </div>
      </body>
    </html>
  `
  return sendEmail({ to, subject: '🎉 SolidarPay: C\'est votre tour de recevoir!', html })
}