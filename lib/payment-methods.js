/**
 * Méthodes de paiement : clés stockées dans payment_countries.paymentMethods (JSON).
 */

export const PAYMENT_METHOD_LABELS = {
  interac: 'Interac e-Transfer',
  credit_card: 'Carte de crédit',
  bank_transfer: 'Virement bancaire',
  paypal: 'PayPal',
  zelle: 'Zelle',
  cash_app: 'Cash App',
  mobile_money: 'Mobile Money',
  cuenta_rut_transferencia: 'Cuenta RUT / Transferencia bancaria (Chili)',
}

/** Clés proposées dans l’admin (cases à cocher) — ordre d’affichage */
export const ADMIN_PAYMENT_METHOD_KEYS = [
  'interac',
  'credit_card',
  'bank_transfer',
  'cuenta_rut_transferencia',
  'paypal',
  'mobile_money',
  'zelle',
  'cash_app',
]

export function paymentMethodAdminLabel(key) {
  return PAYMENT_METHOD_LABELS[key] || key
}

/** Email requis (Interac, PayPal, Zelle, Cash App) */
export function paymentMethodUsesEmail(method) {
  return ['interac', 'paypal', 'zelle', 'cash_app'].includes(method)
}

/** Compte / téléphone / RUT (virement, mobile money, cuenta RUT chilienne) */
export function paymentMethodUsesAccountOrRut(method) {
  return ['bank_transfer', 'mobile_money', 'cuenta_rut_transferencia'].includes(method)
}
