/**
 * Coordonnées de réception des cotisations : selon le pays (KOHO/Interac vs transferencia Chili, etc.)
 * Stockage dans tontines.kohoReceiverEmail : email brut OU JSON SolidarPay.
 */

/** @typedef {'cl_transferencia'|'koho_interac'|'email_generic'} ReceiverFieldMode */

/**
 * Mode de saisie selon le pays de l’admin (à la création de tontine).
 * @param {string|null|undefined} countryCode
 * @returns {ReceiverFieldMode}
 */
export function receiverFieldModeForCountry(countryCode) {
  const c = String(countryCode || '').toUpperCase()
  if (c === 'CL') return 'cl_transferencia'
  if (c === 'CA') return 'koho_interac'
  return 'email_generic'
}

/**
 * Pas de décimales pour CLP dans le formulaire montant.
 * @param {string} currencyCode
 */
export function contributionAmountStep(currencyCode) {
  const u = String(currencyCode || '').toUpperCase()
  if (u === 'CLP' || u === 'XOF' || u === 'XAF') return '1'
  return '0.01'
}

export function contributionAmountPlaceholder(currencyCode) {
  const u = String(currencyCode || '').toUpperCase()
  if (u === 'CLP') return '50000'
  return '100.00'
}

/**
 * Sérialise les champs Chili pour la colonne kohoReceiverEmail (JSON).
 */
export function serializeChileReceiver({ rut, bank, accountType, accountNumber }) {
  return JSON.stringify({
    _solidar: 'cl_transferencia',
    rut: String(rut || '').trim(),
    bank: String(bank || '').trim(),
    accountType: String(accountType || '').trim(),
    accountNumber: String(accountNumber || '').trim(),
  })
}

/** Stocké dans tontines.kohoReceiverEmail quand paymentMode=direct et coordonnées par membre. */
export function directPerMemberMarkerJson() {
  return JSON.stringify({ _solidar: 'direct_per_member' })
}

export function isDirectPerMemberStorage(raw) {
  if (raw == null || String(raw).trim() === '') return false
  try {
    const o = JSON.parse(String(raw).trim())
    return !!(o && o._solidar === 'direct_per_member')
  } catch {
    return false
  }
}

/**
 * Brut à utiliser pour affichage / copie cotisation : membre en mode direct, sinon tontine.
 * @param {{ paymentMode?: string, kohoReceiverEmail?: string }} tontine
 * @param {string|null|undefined} beneficiaryUserId
 * @param {Array<{ userId?: string, receiverPaymentStorage?: string|null, user?: { id?: string } }>|null|undefined} members
 */
export function getReceiverRawForPayment(tontine, beneficiaryUserId, members) {
  const bid = beneficiaryUserId ? String(beneficiaryUserId) : ''
  if (tontine?.paymentMode === 'direct' && isDirectPerMemberStorage(tontine.kohoReceiverEmail) && bid && members?.length) {
    const row = members.find(
      (m) => String(m.userId || m.user?.id || '') === bid
    )
    if (row?.receiverPaymentStorage && String(row.receiverPaymentStorage).trim() !== '') {
      return row.receiverPaymentStorage
    }
    return ''
  }
  return tontine?.kohoReceiverEmail ?? ''
}

/**
 * @param {string|null|undefined} raw valeur tontines.kohoReceiverEmail
 * @returns {{ kind: 'cl_transferencia'|'email'|'raw'|'empty', display: string, email?: string, rut?: string, bank?: string, accountType?: string, accountNumber?: string }}
 */
export function parseReceiverStorage(raw) {
  if (raw == null || String(raw).trim() === '') {
    return { kind: 'empty', display: '' }
  }
  const t = String(raw).trim()
  try {
    const o = JSON.parse(t)
    if (o && o._solidar === 'direct_per_member') {
      return {
        kind: 'direct_per_member',
        display:
          'Coordonnées définies par membre (paiement direct). Consultez la fiche du bénéficiaire du cycle ou l’onglet Membres côté admin.',
      }
    }
    if (o && o._solidar === 'cl_transferencia') {
      const display = formatChileReceiverLines(o)
      return {
        kind: 'cl_transferencia',
        display,
        rut: o.rut,
        bank: o.bank,
        accountType: o.accountType,
        accountNumber: o.accountNumber,
      }
    }
  } catch {
    // legacy email / texte libre
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
    return { kind: 'email', email: t, display: t }
  }
  return { kind: 'raw', display: t }
}

export function formatChileReceiverLines(o) {
  const lines = ['Cuenta RUT / transferencia bancaria']
  if (o.rut) lines.push(`RUT: ${o.rut}`)
  if (o.bank) lines.push(`Banco: ${o.bank}`)
  if (o.accountType) lines.push(`Tipo de cuenta: ${o.accountType}`)
  if (o.accountNumber) lines.push(`N° cuenta: ${o.accountNumber}`)
  return lines.join('\n')
}

/**
 * Bloc à copier pour le membre (cotisation).
 * @param {string|null|undefined} [beneficiaryReceiverRaw] — stockage membre si paiement direct par bénéficiaire
 */
export function buildMemberPaymentCopyText(tontine, beneficiaryName, amountFormatted, beneficiaryReceiverRaw) {
  const raw =
    tontine?.paymentMode === 'direct' && isDirectPerMemberStorage(tontine.kohoReceiverEmail) && beneficiaryReceiverRaw
      ? beneficiaryReceiverRaw
      : tontine.kohoReceiverEmail
  const p = parseReceiverStorage(raw)
  const header = `SolidarPay — ${tontine.name}\nMontant: ${amountFormatted}\nBénéficiaire (cycle): ${beneficiaryName || '—'}\n`
  if (p.kind === 'empty' || p.kind === 'direct_per_member') {
    return `${header}\n(En attente des coordonnées de réception du bénéficiaire — contactez l’administrateur.)`
  }
  if (p.kind === 'cl_transferencia') {
    return `${header}\n${p.display}`
  }
  if (p.kind === 'email') {
    return `${header}\nEmail de réception (virement / Interac): ${p.email}`
  }
  return `${header}\n${p.display}`
}

export function isChileTransferStorage(raw) {
  return parseReceiverStorage(raw).kind === 'cl_transferencia'
}

/**
 * Texte court pour e-mails de rappel (sans exposer tout le JSON Chili dans le HTML).
 * @param {string|null|undefined} raw
 */
export function shortReminderPaymentHint(raw) {
  const p = parseReceiverStorage(raw)
  if (p.kind === 'direct_per_member') {
    return 'Paiement direct : les coordonnées du bénéficiaire du cycle sont dans votre espace SolidarPay.'
  }
  if (p.kind === 'cl_transferencia') {
    return 'Effectuez un virement bancaire : le détail (banque, RUT, compte) est dans votre espace SolidarPay, section cotisation.'
  }
  if (p.kind === 'email') {
    return `Courriel de réception pour votre paiement : ${p.email}`
  }
  if (p.kind === 'raw' && p.display) {
    return 'Consultez votre espace SolidarPay pour les instructions de paiement exactes.'
  }
  return 'Connectez-vous à SolidarPay pour les instructions de paiement.'
}
