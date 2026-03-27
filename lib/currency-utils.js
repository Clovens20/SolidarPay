// Mapping des pays vers leurs devises
const COUNTRY_CURRENCY_MAP = {
  'CA': 'CAD',  // Canada - Dollar canadien
  'US': 'USD',  // États-Unis - Dollar américain
  'FR': 'EUR',  // France - Euro
  'BE': 'EUR',  // Belgique - Euro
  'CH': 'CHF',  // Suisse - Franc suisse
  'MX': 'MXN',  // Mexique - Peso mexicain
  'CL': 'CLP',  // Chili - Peso chilien
  'HT': 'HTG',  // Haïti - Gourde haïtienne
  'SN': 'XOF',  // Sénégal - Franc CFA (XOF)
  'CM': 'XAF',  // Cameroun - Franc CFA (XAF)
}

// Labels des devises
const CURRENCY_LABELS = {
  'CAD': { symbol: '$', name: 'Dollar canadien', code: 'CAD' },
  'USD': { symbol: '$', name: 'Dollar américain', code: 'USD' },
  'EUR': { symbol: '€', name: 'Euro', code: 'EUR' },
  'CHF': { symbol: 'CHF', name: 'Franc suisse', code: 'CHF' },
  'MXN': { symbol: '$', name: 'Peso mexicain', code: 'MXN' },
  'CLP': { symbol: '$', name: 'Peso chilien', code: 'CLP' },
  'HTG': { symbol: 'G', name: 'Gourde haïtienne', code: 'HTG' },
  'XOF': { symbol: 'CFA', name: 'Franc CFA (XOF)', code: 'XOF' },
  'XAF': { symbol: 'FCFA', name: 'Franc CFA (XAF)', code: 'XAF' },
}

/**
 * Obtenir la devise d'un pays
 * @param {string} countryCode - Code pays ISO (CA, FR, US, etc.)
 * @returns {string} Code devise (CAD, EUR, USD, etc.) ou 'CAD' par défaut
 */
export function getCurrencyByCountry(countryCode) {
  if (!countryCode) return 'CAD'
  return COUNTRY_CURRENCY_MAP[countryCode.toUpperCase()] || 'CAD'
}

/**
 * Obtenir les informations complètes d'une devise
 * @param {string} currencyCode - Code devise (CAD, EUR, USD, etc.)
 * @returns {object} { symbol, name, code }
 */
export function getCurrencyInfo(currencyCode) {
  if (!currencyCode) currencyCode = 'CAD'
  return CURRENCY_LABELS[currencyCode.toUpperCase()] || CURRENCY_LABELS['CAD']
}

/**
 * Formater un montant avec sa devise
 * @param {number} amount - Montant à formater
 * @param {string} currencyCode - Code devise (CAD, EUR, USD, etc.)
 * @returns {string} Montant formaté (ex: "$100.00 CAD")
 */
export function formatCurrency(amount, currencyCode = 'CAD') {
  const currency = getCurrencyInfo(currencyCode)
  const code = (currencyCode || 'CAD').toUpperCase()

  // Devises sans décimales courantes (affichage plus lisible)
  if (code === 'CLP' || code === 'XOF' || code === 'XAF') {
    const n = Math.round(parseFloat(amount || 0))
    const formatted = n.toLocaleString('fr-FR')
    if (code === 'CLP') {
      return `${currency.symbol}${formatted} ${currency.code}`
    }
    return `${formatted} ${currency.symbol} ${currency.code}`
  }

  const formattedAmount = parseFloat(amount || 0).toFixed(2)

  if (code === 'EUR') {
    return `${formattedAmount} ${currency.symbol}`
  }
  if (code === 'CHF') {
    return `${currency.symbol} ${formattedAmount}`
  }
  return `${currency.symbol}${formattedAmount} ${currency.code}`
}

/**
 * Obtenir tous les mappings pays/devise
 * @returns {object} Mapping complet
 */
export function getAllCurrencyMappings() {
  return COUNTRY_CURRENCY_MAP
}

/**
 * Obtenir toutes les devises disponibles
 * @returns {array} Liste des codes de devises
 */
export function getAvailableCurrencies() {
  return Object.keys(CURRENCY_LABELS)
}

