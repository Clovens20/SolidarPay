/**
 * PostgREST renvoie parfois PGRST002 / « schema cache » de façon transitoire.
 */
export function isSupabaseTransientError(error) {
  if (!error) return false
  if (error.code === 'PGRST002') return true
  const msg = String(error.message || '')
  return /schema cache|Retrying/i.test(msg)
}

/**
 * @template T
 * @param {() => Promise<{ data: T; error: import('@supabase/supabase-js').PostgrestError | null }>} queryFn
 * @param {{ maxAttempts?: number; baseDelayMs?: number }} [opts]
 */
export async function withSupabaseRetry(queryFn, opts = {}) {
  const maxAttempts = opts.maxAttempts ?? 8
  const baseDelayMs = opts.baseDelayMs ?? 600
  let lastError = null

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data, error } = await queryFn()
    if (!error) return { data, error: null }
    lastError = error
    if (!isSupabaseTransientError(error) || attempt === maxAttempts - 1) {
      break
    }
    await new Promise((r) =>
      setTimeout(r, baseDelayMs * Math.pow(2, attempt))
    )
  }

  return { data: null, error: lastError }
}
