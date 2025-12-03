/**
 * Fonctions utilitaires pour les tontines
 */

/**
 * Formate la fréquence d'une tontine en français
 * @param {string} frequency - 'monthly' | 'biweekly' | 'weekly'
 * @returns {string} - Fréquence formatée en français
 */
export function formatFrequency(frequency) {
  const frequencies = {
    'monthly': 'Mensuelle',
    'biweekly': 'Bi-hebdomadaire',
    'weekly': 'Hebdomadaire'
  }
  return frequencies[frequency] || frequency
}

/**
 * Formate la fréquence pour l'affichage dans les stats (ex: "Par mois")
 * @param {string} frequency - 'monthly' | 'biweekly' | 'weekly'
 * @returns {string} - Fréquence formatée
 */
export function formatFrequencyForStats(frequency) {
  const frequencies = {
    'monthly': 'Par mois',
    'biweekly': 'Bi-hebdomadaire',
    'weekly': 'Par semaine'
  }
  return frequencies[frequency] || frequency
}

