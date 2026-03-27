/** Message affiché quand le nom est déjà pris (création ou conflit DB). */
export const TONTINE_NAME_TAKEN_MSG =
  'Ce nom de tontine est déjà utilisé. Veuillez en choisir un autre.'

export function normalizeTontineName(name) {
  return String(name ?? '').trim()
}

/**
 * Vérifie si une autre tontine porte déjà ce nom (comparaison insensible à la casse, nom trimé).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} normalizedName — résultat de normalizeTontineName
 * @param {string} [excludeTontineId] — pour une future modification : ignorer cette tontine
 */
export async function isTontineNameTaken(supabase, normalizedName, excludeTontineId) {
  if (!normalizedName) return false

  let q = supabase.from('tontines').select('id').ilike('name', normalizedName).limit(1)

  if (excludeTontineId) {
    q = q.neq('id', excludeTontineId)
  }

  const { data, error } = await q.maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  return !!data
}
