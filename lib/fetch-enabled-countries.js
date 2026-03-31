import { FALLBACK_ENABLED_PAYMENT_COUNTRIES } from '@/lib/fallback-payment-countries'

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function isRetryableMessage(msg) {
  return /schema cache|Retrying|PGRST002|502|503|504/i.test(String(msg || ''))
}

/**
 * Pays activés via l’API serveur ; repli sur liste embarquée si réseau / serveur défaillant.
 */
export async function fetchEnabledPaymentCountries() {
  const maxAttempts = 6
  let lastErr = 'Erreur inconnue'

  try {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const res = await fetch('/api/payment-countries', { cache: 'no-store' })
      const body = await res.json().catch(() => ({}))

      if (res.ok && !body?.error) {
        const list = Array.isArray(body) ? body : []
        if (list.length > 0) return list
        if (attempt === maxAttempts - 1) break
        await sleep(500 * Math.pow(2, attempt))
        continue
      }

      const msg =
        typeof body?.error === 'string' ? body.error : `Erreur ${res.status}`
      lastErr = msg

      const retry =
        attempt < maxAttempts - 1 &&
        (res.status >= 500 || isRetryableMessage(msg))
      if (retry) {
        await sleep(500 * Math.pow(2, attempt))
        continue
      }

      break
    }
  } catch (e) {
    lastErr = e?.message || String(e)
  }

  console.warn(
    '[fetchEnabledPaymentCountries] repli embarqué après échecs API:',
    lastErr
  )
  return [...FALLBACK_ENABLED_PAYMENT_COUNTRIES]
}

/**
 * Appel API unique avec timeout — affichage immédiat côté page + remplacement si la base répond.
 * @param {number} [timeoutMs]
 * @returns {Promise<object[]|null>}
 */
export async function refreshPaymentCountriesFromServer(timeoutMs = 20000) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch('/api/payment-countries', {
      cache: 'no-store',
      signal: ctrl.signal,
    })
    clearTimeout(id)
    if (!res.ok) return null
    const body = await res.json().catch(() => null)
    if (!Array.isArray(body) || body.length === 0) return null
    return body
  } catch {
    clearTimeout(id)
    return null
  }
}
