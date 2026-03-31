import { createSupabaseAdmin } from './supabase-admin.js'
import { supabase } from './supabase.js'
import {
  withSupabaseRetry,
  isSupabaseTransientError,
} from './supabase-query-retry.js'

/** Profil pour la session UI si public.users est illisible via PostgREST (ex. PGRST002). */
export function userPayloadFromAuthUser(authUser, emailFallback) {
  const m = authUser?.user_metadata || {}
  const rawRole = m.role
  const role =
    rawRole === 'super_admin'
      ? 'super_admin'
      : rawRole === 'admin'
        ? 'admin'
        : 'member'
  const resolvedEmail = authUser?.email || emailFallback
  return {
    id: authUser.id,
    email: resolvedEmail,
    fullName:
      m.fullName ||
      m.full_name ||
      (resolvedEmail ? resolvedEmail.split('@')[0] : 'Utilisateur'),
    phone: m.phone ?? null,
    country: m.country ?? null,
    role,
    createdAt: authUser.created_at ?? new Date().toISOString(),
  }
}

export function roleFromAuthMetadata(authUser) {
  const r = authUser?.user_metadata?.role
  if (r === 'super_admin' || r === 'admin' || r === 'member') return r
  return 'member'
}

/**
 * id + rôle depuis public.users, ou repli Auth si erreur PostgREST transitoire.
 */
export async function resolveUserIdAndRole(authUser) {
  if (!authUser?.id) return null
  const db = createSupabaseAdmin() || supabase
  const { data, error } = await withSupabaseRetry(
    () =>
      db
        .from('users')
        .select('id, role')
        .eq('id', authUser.id)
        .maybeSingle(),
    { maxAttempts: 6, baseDelayMs: 400 }
  )
  if (!error && data) return { userId: data.id, userRole: data.role }
  if (error && isSupabaseTransientError(error)) {
    console.warn(
      '[resolveUserIdAndRole] public.users indisponible, repli métadonnées Auth:',
      error.code || error.message
    )
    return { userId: authUser.id, userRole: roleFromAuthMetadata(authUser) }
  }
  return null
}

export async function fetchPublicUserProfileWithFallback(authUser) {
  if (!authUser?.id) {
    return { error: new Error('Utilisateur Auth invalide') }
  }
  const db = createSupabaseAdmin() || supabase
  const { data: userData, error: userError } = await withSupabaseRetry(
    () =>
      db
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle(),
    { maxAttempts: 8, baseDelayMs: 600 }
  )
  if (!userError && userData) return { user: userData }
  if (!userError && !userData) return { notFound: true }
  if (userError && isSupabaseTransientError(userError) && authUser) {
    console.warn(
      '[fetchPublicUserProfileWithFallback] repli métadonnées Auth:',
      userError.code || userError.message
    )
    return {
      user: userPayloadFromAuthUser(authUser, authUser.email),
      fallback: true,
    }
  }
  return { error: userError }
}

export async function fetchPublicUserByEmailWithFallback(email, authUser) {
  const db = createSupabaseAdmin() || supabase
  const { data: userData, error: userError } = await withSupabaseRetry(
    () =>
      db.from('users').select('*').eq('email', email).maybeSingle(),
    { maxAttempts: 8, baseDelayMs: 600 }
  )
  if (!userError && userData) return { user: userData }
  if (!userError && !userData) return { notFound: true }
  if (userError && isSupabaseTransientError(userError) && authUser) {
    console.warn(
      '[fetchPublicUserByEmailWithFallback] repli métadonnées Auth:',
      userError.code || userError.message
    )
    return {
      user: userPayloadFromAuthUser(authUser, email),
      fallback: true,
    }
  }
  return { error: userError }
}
