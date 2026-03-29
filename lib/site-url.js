/**
 * URL publique du site (sans slash final).
 * Utilisée pour les redirections Supabase (confirmation e-mail, etc.).
 *
 * Définir NEXT_PUBLIC_SITE_URL en prod (ex. https://solidar-pay.vercel.app).
 * Sur Vercel, VERCEL_URL est utilisé en secours si absent.
 */
export function getPublicSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')
  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, '')
    return `https://${host}`
  }
  return 'http://localhost:3000'
}

export function getAuthCallbackUrl() {
  return `${getPublicSiteUrl()}/auth/callback`
}
