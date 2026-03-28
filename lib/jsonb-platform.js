/**
 * Lit une valeur scalaire stockée en JSONB (chaîne, booléen, nombre).
 */
export function jsonbScalarToString(val) {
  if (val === null || val === undefined) return ''
  if (typeof val === 'string') return val.replace(/^"|"$/g, '').replace(/""/g, '"')
  if (typeof val === 'boolean' || typeof val === 'number') return String(val)
  if (typeof val === 'object' && val !== null && 'toString' in val) return String(val)
  return ''
}

/**
 * Prépare une valeur pour une colonne JSONB (texte affiché côté app).
 */
export function stringToJsonbValue(str) {
  if (str === null || str === undefined) return null
  return str
}
