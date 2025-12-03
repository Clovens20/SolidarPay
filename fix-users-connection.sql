-- ====================================
-- CORRECTION DES UTILISATEURS - SOLIDARPAY
-- Script pour corriger les problèmes de connexion
-- ====================================

-- IMPORTANT: Exécutez d'abord diagnostic-users.sql pour identifier les problèmes

-- 1. VÉRIFIER QUE LA CONTRAINTE DE RÔLE INCLUT super_admin
-- Si super_admin n'est pas accepté, cette requête échouera

DO $$ 
BEGIN
  -- Supprimer l'ancienne contrainte si elle existe
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
  
  -- Créer la nouvelle contrainte avec tous les rôles
  ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('admin', 'member', 'super_admin'));
  
  RAISE NOTICE '✅ Contrainte de rôle mise à jour avec super_admin';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Erreur lors de la mise à jour de la contrainte: %', SQLERRM;
END $$;

-- 2. METTRE À JOUR L'UTILISATEUR ADMIN TONTINE
-- Vérifier et corriger si nécessaire

UPDATE users
SET 
  role = 'admin',
  email = 'claircl18@gmail.com',
  "fullName" = COALESCE("fullName", 'Admin Tontine')
WHERE id = '76223ba8-d868-4bc3-8363-93a20e60d34f'
   OR email = 'claircl18@gmail.com';

-- Si l'utilisateur n'existe pas dans users mais existe dans auth.users
INSERT INTO users (id, email, "fullName", role, "createdAt")
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'fullName', 'Admin Tontine'),
  'admin',
  created_at
FROM auth.users
WHERE (id = '76223ba8-d868-4bc3-8363-93a20e60d34f'
   OR email = 'claircl18@gmail.com')
  AND NOT EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.users.id
  );

-- 3. METTRE À JOUR L'UTILISATEUR SUPER ADMIN
UPDATE users
SET 
  role = 'super_admin',
  email = 'clodenerc@yahoo.fr',
  "fullName" = COALESCE("fullName", 'Super Admin')
WHERE id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e'
   OR email = 'clodenerc@yahoo.fr';

-- Si l'utilisateur n'existe pas dans users mais existe dans auth.users
INSERT INTO users (id, email, "fullName", role, "createdAt")
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'fullName', 'Super Admin'),
  'super_admin',
  created_at
FROM auth.users
WHERE (id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e'
   OR email = 'clodenerc@yahoo.fr')
  AND NOT EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.users.id
  );

-- 4. METTRE À JOUR L'UTILISATEUR MEMBRE
UPDATE users
SET 
  role = 'member',
  email = 'Paulinacharles615@gmail.com',
  "fullName" = COALESCE("fullName", 'Membre')
WHERE id = 'e4afdfa7-4699-49cc-b740-2e8bef97ce55'
   OR email = 'Paulinacharles615@gmail.com';

-- Si l'utilisateur n'existe pas dans users mais existe dans auth.users
INSERT INTO users (id, email, "fullName", role, "createdAt")
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'fullName', 'Membre'),
  'member',
  created_at
FROM auth.users
WHERE (id = 'e4afdfa7-4699-49cc-b740-2e8bef97ce55'
   OR email = 'Paulinacharles615@gmail.com')
  AND NOT EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.users.id
  );

-- 5. VÉRIFICATION FINALE
SELECT 
  '=== RÉSUMÉ DES CORRECTIONS ===' as section;

SELECT 
  id,
  email,
  role,
  "fullName",
  CASE 
    WHEN role = 'admin' AND email = 'claircl18@gmail.com' THEN '✅ Admin Tontine corrigé'
    WHEN role = 'super_admin' AND email = 'clodenerc@yahoo.fr' THEN '✅ Super Admin corrigé'
    WHEN role = 'member' AND email = 'Paulinacharles615@gmail.com' THEN '✅ Membre corrigé'
    ELSE '⚠️ À vérifier'
  END as statut
FROM users
WHERE id IN (
  '76223ba8-d868-4bc3-8363-93a20e60d34f',
  'cb289deb-9d0d-498c-ba0d-90f77fc58f4e',
  'e4afdfa7-4699-49cc-b740-2e8bef97ce55'
)
OR email IN (
  'claircl18@gmail.com',
  'clodenerc@yahoo.fr',
  'Paulinacharles615@gmail.com'
);

-- 6. VÉRIFIER LA CORRESPONDANCE ENTRE auth.users ET users
SELECT 
  '=== VÉRIFICATION CORRESPONDANCE ===' as section;

SELECT 
  au.id,
  au.email,
  CASE 
    WHEN au.email_confirmed_at IS NULL THEN '❌ Email non confirmé'
    ELSE '✅ Email confirmé'
  END as auth_statut,
  u.role,
  CASE 
    WHEN u.id IS NULL THEN '❌ Manquant dans users'
    ELSE '✅ Présent dans users'
  END as user_statut
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE au.email IN (
  'claircl18@gmail.com',
  'clodenerc@yahoo.fr',
  'Paulinacharles615@gmail.com'
)
OR au.id IN (
  '76223ba8-d868-4bc3-8363-93a20e60d34f',
  'cb289deb-9d0d-498c-ba0d-90f77fc58f4e',
  'e4afdfa7-4699-49cc-b740-2e8bef97ce55'
);

-- 7. NOTE IMPORTANTE
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ CORRECTIONS APPLIQUÉES';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Si les utilisateurs ne peuvent toujours pas se connecter:';
  RAISE NOTICE '1. Vérifiez que leur email est confirmé dans Supabase Auth';
  RAISE NOTICE '2. Vérifiez leur mot de passe dans Supabase Auth';
  RAISE NOTICE '3. Vérifiez que les URLs redirect sont configurées dans Supabase';
  RAISE NOTICE '4. Vérifiez les logs dans la console du navigateur (F12)';
  RAISE NOTICE '';
END $$;

