-- ====================================
-- CORRECTION DE L'UTILISATEUR SUPER ADMIN
-- Script pour créer/corriger l'utilisateur super admin
-- ====================================

-- 1. VÉRIFIER L'EXISTENCE DANS auth.users
SELECT 
  '=== UTILISATEUR DANS auth.users ===' as info,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'clodenerc@yahoo.fr'
   OR id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e';

-- 2. VÉRIFIER L'EXISTENCE DANS users
SELECT 
  '=== UTILISATEUR DANS users ===' as info,
  id,
  email,
  role,
  "fullName"
FROM users
WHERE email = 'clodenerc@yahoo.fr'
   OR id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e';

-- 3. CRÉER L'UTILISATEUR S'IL N'EXISTE PAS DANS users
-- Option A : Si vous connaissez l'ID exact depuis auth.users
INSERT INTO users (id, email, "fullName", role, "createdAt")
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'fullName', 'Super Admin', 'Administrateur'),
  'super_admin',
  created_at
FROM auth.users
WHERE (email = 'clodenerc@yahoo.fr' OR id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e')
  AND NOT EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.users.id
  )
ON CONFLICT (id) DO UPDATE
SET 
  role = 'super_admin',
  email = EXCLUDED.email,
  "fullName" = COALESCE(EXCLUDED."fullName", users."fullName");

-- 4. OU METTRE À JOUR SI L'UTILISATEUR EXISTE MAIS AVEC LE MAUVAIS RÔLE
UPDATE users
SET 
  role = 'super_admin',
  email = 'clodenerc@yahoo.fr',
  "fullName" = COALESCE("fullName", 'Super Admin')
WHERE email = 'clodenerc@yahoo.fr'
   OR id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e';

-- 5. VÉRIFICATION FINALE
SELECT 
  '=== VÉRIFICATION FINALE ===' as info,
  u.id,
  u.email,
  u.role,
  u."fullName",
  au.email_confirmed_at,
  CASE 
    WHEN u.id IS NULL THEN '❌ Manquant dans users'
    WHEN au.id IS NULL THEN '❌ Manquant dans auth.users'
    WHEN u.id != au.id THEN '⚠️ IDs différents'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ Email non confirmé'
    WHEN u.role != 'super_admin' THEN CONCAT('⚠️ Rôle incorrect: ', u.role)
    ELSE '✅ OK - Prêt pour la connexion'
  END as statut
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE au.email = 'clodenerc@yahoo.fr'
   OR au.id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e';

-- 6. SI L'UTILISATEUR N'EXISTE PAS DU TOUT, CRÉER UN NOUVEAU
-- (À utiliser seulement si l'utilisateur n'existe pas dans auth.users)
-- IMPORTANT: Vous devez d'abord créer l'utilisateur dans Supabase Auth Dashboard

-- Message de confirmation
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ CORRECTION APPLIQUÉE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Vérifiez les résultats ci-dessus.';
  RAISE NOTICE 'Si l''utilisateur est marqué comme "✅ OK", vous pouvez vous connecter.';
  RAISE NOTICE '';
  RAISE NOTICE 'Si le problème persiste:';
  RAISE NOTICE '1. Vérifiez que l''email est confirmé dans Supabase Auth';
  RAISE NOTICE '2. Vérifiez que l''ID correspond entre auth.users et users';
  RAISE NOTICE '3. Vérifiez que le rôle est bien "super_admin"';
  RAISE NOTICE '';
END $$;

