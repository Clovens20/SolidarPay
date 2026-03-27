-- =============================================================================
-- Export MANUEL de public.users (ANCIEN projet Supabase)
-- Exécutez, puis copiez la colonne "sql_statement" et exécutez le résultat
-- sur le NOUVEAU projet (après avoir créé le schéma / migré l’auth si besoin).
--
-- Limite : ne migre pas les mots de passe Auth. Pour la connexion, il faut
-- aussi copier auth.users + auth.identities (voir scripts/migrate-users-supabase.mjs).
-- =============================================================================

SELECT format(
  $f$
INSERT INTO public.users (id, email, phone, "fullName", role, "kohoEmail", country, "createdAt")
VALUES (%L::uuid, %L, %L, %L, %L, %L, %L, %L::timestamptz)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  "fullName" = EXCLUDED."fullName",
  role = EXCLUDED.role,
  "kohoEmail" = EXCLUDED."kohoEmail",
  country = EXCLUDED.country;
$f$,
  id,
  email,
  phone,
  "fullName",
  role,
  "kohoEmail",
  country,
  "createdAt"
) AS sql_statement
FROM public.users
ORDER BY "createdAt";
