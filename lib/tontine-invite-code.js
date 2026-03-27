/** Code court partageable pour rejoindre une tontine (sans exposer la liste de toutes les tontines). */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomUint8Array(length) {
  const arr = new Uint8Array(length)
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(arr)
    return arr
  }
  throw new Error('Environnement sans crypto.getRandomValues')
}

export function generateInviteCode(length = 8) {
  const arr = randomUint8Array(length)
  let s = ''
  for (let i = 0; i < length; i++) {
    s += ALPHABET[arr[i] % ALPHABET.length]
  }
  return s
}

/** Génère un code absent de la colonne tontines.inviteCode (requêtes successives si collision). */
export async function ensureUniqueInviteCode(supabase, length = 8) {
  for (let attempt = 0; attempt < 24; attempt++) {
    const code = generateInviteCode(length)
    const { data } = await supabase.from('tontines').select('id').eq('inviteCode', code).maybeSingle()
    if (!data) return code
  }
  throw new Error('Impossible de générer un code d’invitation unique')
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Résout une tontine à partir du code d’invitation ou de l’UUID saisi par un membre.
 * @returns {{ tontine: object } | { error: string }}
 */
export async function resolveTontineByInviteInput(supabase, raw) {
  const s = (raw || '').trim()
  if (!s) {
    return { error: 'Saisissez le code d’invitation ou l’identifiant partagé par votre administrateur.' }
  }

  let query = supabase.from('tontines').select('id, name, status, inviteCode').limit(1)

  if (UUID_RE.test(s)) {
    query = query.eq('id', s)
  } else {
    query = query.eq('inviteCode', s.toUpperCase())
  }

  const { data, error } = await query.maybeSingle()
  if (error) {
    return { error: error.message || 'Recherche impossible' }
  }
  if (!data) {
    return {
      error:
        'Tontine introuvable. Vérifiez le code ou l’identifiant (demandez à l’administrateur de la tontine).',
    }
  }
  return { tontine: data }
}
