-- ====================================
-- CRÉER L'UTILISATEUR SUPER ADMIN DANS LA TABLE users
-- Script pour résoudre "Utilisateur introuvable dans la base de données"
-- ====================================

-- ÉTAPE 1: VÉRIFIER L'EXISTENCE DANS auth.users
SELECT 
  '🔍 ÉTAPE 1: Vérification dans auth.users' as etape,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'clodenerc@yahoo.fr'
   OR id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e';

-- ÉTAPE 2: VÉRIFIER L'EXISTENCE DANS users
SELECT 
  '🔍 ÉTAPE 2: Vérification dans users' as etape,
  id,
  email,
  role,
  "fullName"
FROM users
WHERE email = 'clodenerc@yahoo.fr'
   OR id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e';

-- ÉTAPE 3: CRÉER L'UTILISATEUR S'IL N'EXISTE PAS
-- Cette requête crée l'utilisateur depuis auth.users vers users
INSERT INTO users (id, email, "fullName", role, "createdAt")
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'fullName', 'Super Admin'),
  'super_admin',
  au.created_at
FROM auth.users au
WHERE (au.email = 'clodenerc@yahoo.fr' OR au.id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e')
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = au.id
  )
ON CONFLICT (id) DO UPDATE
SET 
  role = 'super_admin',
  email = EXCLUDED.email,
  "fullName" = COALESCE(EXCLUDED."fullName", users."fullName");

-- ÉTAPE 4: OU CRÉER DIRECTEMENT AVEC L'ID CONNU
-- Si l'INSERT ci-dessus ne fonctionne pas, utilisez cette version directe
INSERT INTO users (id, email, "fullName", role, "createdAt")
VALUES (
  'cb289deb-9d0d-498c-ba0d-90f77fc58f4e',
  'clodenerc@yahoo.fr',
  'Super Admin',
  'super_admin',
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
  role = 'super_admin',
  email = 'clodenerc@yahoo.fr',
  "fullName" = COALESCE(EXCLUDED."fullName", users."fullName");

-- ÉTAPE 5: METTRE À JOUR LE RÔLE SI L'UTILISATEUR EXISTE DÉJÀ
UPDATE users
SET 
  role = 'super_admin',
  email = 'clodenerc@yahoo.fr'
WHERE (id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e'
   OR email = 'clodenerc@yahoo.fr')
  AND role != 'super_admin';

-- ÉTAPE 6: VÉRIFICATION FINALE
SELECT 
  '✅ VÉRIFICATION FINALE' as etape,
  u.id,
  u.email,
  u.role,
  u."fullName",
  CASE 
    WHEN u.id IS NULL THEN '❌ Utilisateur manquant dans users'
    WHEN u.role != 'super_admin' THEN CONCAT('⚠️ Rôle incorrect: ', u.role)
    WHEN au.id IS NULL THEN '❌ Utilisateur manquant dans auth.users'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ Email non confirmé'
    WHEN u.id = au.id THEN '✅ OK - Prêt pour la connexion'
    ELSE '⚠️ IDs ne correspondent pas'
  END as statut
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE au.email = 'clodenerc@yahoo.fr'
   OR au.id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e';

-- Message de confirmation
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ SCRIPT TERMINÉ';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Vérifiez les résultats de l''ÉTAPE 6 ci-dessus.';
  RAISE NOTICE 'Si le statut est "✅ OK", vous pouvez vous connecter maintenant.';
  RAISE NOTICE '';
  RAISE NOTICE 'Si le problème persiste:';
  RAISE NOTICE '1. Vérifiez que l''utilisateur existe dans auth.users';
  RAISE NOTICE '2. Vérifiez que l''ID correspond exactement';
  RAISE NOTICE '3. Vérifiez que l''email est confirmé dans Supabase Auth';
  RAISE NOTICE '';
END $$;

