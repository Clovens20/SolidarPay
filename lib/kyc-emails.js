import { sendEmail } from './resend'

export async function sendKYCApprovalEmail(to, fullName) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .checkmark { font-size: 48px; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Félicitations !</h1>
          </div>
          <div class="content">
            <div class="checkmark">✅</div>
            <p>Bonjour <strong>${fullName}</strong>,</p>
            <p>Excellente nouvelle ! Votre identité a été vérifiée avec succès.</p>
            <p><strong>Vous pouvez maintenant participer pleinement à SolidarPay.</strong></p>
            <p>Vous pouvez :</p>
            <ul>
              <li>Rejoindre des tontines</li>
              <li>Effectuer des cotisations</li>
              <li>Bénéficier de tous les services de la plateforme</li>
            </ul>
            <p>Merci de votre confiance !</p>
            <p>L'équipe SolidarPay</p>
          </div>
        </div>
      </body>
    </html>
  `
  return sendEmail({ 
    to, 
    subject: '✅ SolidarPay - Vérification approuvée !', 
    html 
  })
}

export async function sendKYCRejectionEmail(to, fullName, reason, comment) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .reason-box { background: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ef4444; }
          .button { display: inline-block; background: #0891b2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Vérification non approuvée</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${fullName}</strong>,</p>
            <p>Malheureusement, votre document de vérification d'identité n'a pas pu être approuvé.</p>
            <div class="reason-box">
              <p><strong>Raison :</strong> ${reason}</p>
              ${comment ? `<p><strong>Commentaire :</strong> ${comment}</p>` : ''}
            </div>
            <p><strong>Que faire maintenant ?</strong></p>
            <p>Vous pouvez soumettre un nouveau document dans votre profil en vous assurant de :</p>
            <ul>
              <li>Fournir une photo claire et bien éclairée</li>
              <li>Vérifier que le document n'est pas expiré</li>
              <li>Assurer que toutes les informations sont visibles</li>
              <li>Utiliser un document accepté (pièce d'identité officielle)</li>
            </ul>
            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
            <p>L'équipe SolidarPay</p>
          </div>
        </div>
      </body>
    </html>
  `
  return sendEmail({ 
    to, 
    subject: '❌ SolidarPay - Nouveau document requis', 
    html 
  })
}

export async function sendKYCNewDocumentEmail(to, fullName, reason, instructions) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .instructions-box { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          .button { display: inline-block; background: #0891b2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔄 Nouveau document requis</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${fullName}</strong>,</p>
            <p>Nous avons besoin d'un nouveau document pour finaliser votre vérification d'identité.</p>
            <div class="instructions-box">
              <p><strong>Raison :</strong> ${reason}</p>
              ${instructions ? `<p><strong>Instructions spécifiques :</strong></p><p>${instructions}</p>` : ''}
            </div>
            <p><strong>Prochaines étapes :</strong></p>
            <ol>
              <li>Connectez-vous à votre compte SolidarPay</li>
              <li>Allez dans votre profil</li>
              <li>Soumettez un nouveau document en suivant les instructions ci-dessus</li>
            </ol>
            <p>Une fois le nouveau document soumis, nous le vérifierons dans les plus brefs délais.</p>
            <p>Merci de votre compréhension.</p>
            <p>L'équipe SolidarPay</p>
          </div>
        </div>
      </body>
    </html>
  `
  return sendEmail({ 
    to, 
    subject: '🔄 SolidarPay - Nouveau document requis', 
    html 
  })
}

export async function sendKYCManualReviewEmail(to, fullName) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0891b2; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏳ Vérification en cours</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${fullName}</strong>,</p>
            <p>Votre document de vérification d'identité est en cours d'examen approfondi par notre équipe.</p>
            <div class="info-box">
              <p><strong>⏰ Délai de traitement :</strong> 24-48 heures</p>
              <p>Notre équipe vérifie attentivement votre document pour garantir la sécurité de la plateforme.</p>
            </div>
            <p>Vous recevrez une notification par email dès qu'une décision sera prise.</p>
            <p>Merci de votre patience.</p>
            <p>L'équipe SolidarPay</p>
          </div>
        </div>
      </body>
    </html>
  `
  return sendEmail({ 
    to, 
    subject: '⏳ SolidarPay - Vérification en cours', 
    html 
  })
}

