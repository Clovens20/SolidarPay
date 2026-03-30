/**
 * Pays par défaut si Supabase / PostgREST est indisponible (ex. PGRST002 schema cache).
 * Doit rester aligné sur les INSERT de `database-init-supabase-complet.sql` pour que
 * l’inscription et les tontines restent valides côté API.
 */
export const FALLBACK_ENABLED_PAYMENT_COUNTRIES = [
  {
    code: 'BE',
    name: 'Belgique',
    paymentMethods: ['bank_transfer', 'credit_card'],
  },
  {
    code: 'CA',
    name: 'Canada',
    paymentMethods: ['interac', 'credit_card', 'bank_transfer'],
  },
  {
    code: 'CH',
    name: 'Suisse',
    paymentMethods: ['bank_transfer', 'credit_card'],
  },
  {
    code: 'CL',
    name: 'Chili',
    paymentMethods: ['cuenta_rut_transferencia'],
  },
  {
    code: 'FR',
    name: 'France',
    paymentMethods: ['bank_transfer', 'credit_card'],
  },
].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
