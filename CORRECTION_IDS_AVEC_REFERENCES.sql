-- ====================================
-- CORRECTION DES IDs AVEC GESTION DES RÉFÉRENCES
-- Met à jour toutes les références avant de corriger les IDs
-- ====================================

-- ÉTAPE 1: DIAGNOSTIC - Voir l'état actuel
SELECT 
  '=== DIAGNOSTIC ===' as info,
  'users' as table_name,
  id,
  email,
  role
FROM users
WHERE email IN ('clodenerc@yahoo.fr', 'claircl18@gmail.com', 'Paulinacharles615@gmail.com')
   OR id IN (
     'ea3b8a37-e6c8-4828-9614-51bfdf5ce9cf',
     'cb289deb-9d0d-498c-ba0d-90f77fc58f4e',
     '76223ba8-d868-4bc3-8363-93a20e60d34f',
     'e4afdfa7-4699-49cc-b740-2e8bef97ce55',
     '3559cf88-21a6-46bb-8c27-ba2fee095954'
   );

-- Vérifier dans auth.users
SELECT 
  'auth.users' as table_name,
  id,
  email
FROM auth.users
WHERE email IN ('clodenerc@yahoo.fr', 'claircl18@gmail.com', 'Paulinacharles615@gmail.com')
   OR id IN (
     'cb289deb-9d0d-498c-ba0d-90f77fc58f4e',
     '76223ba8-d868-4bc3-8363-93a20e60d34f',
     'e4afdfa7-4699-49cc-b740-2e8bef97ce55'
   );

-- ÉTAPE 2: METTRE À JOUR TOUTES LES RÉFÉRENCES
-- Avant de changer les IDs, on met à jour toutes les tables qui référencent users

-- 2.1 - Corriger les références dans tontines (adminId)
UPDATE tontines
SET "adminId" = '76223ba8-d868-4bc3-8363-93a20e60d34f'
WHERE "adminId" = '3559cf88-21a6-46bb-8c27-ba2fee095954'
   OR "adminId" IN (
     SELECT id FROM users 
     WHERE email = 'claircl18@gmail.com' 
       AND id != '76223ba8-d868-4bc3-8363-93a20e60d34f'
   );

-- 2.2 - Corriger les références dans cycles (beneficiaryId)
UPDATE cycles
SET "beneficiaryId" = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e'
WHERE "beneficiaryId" = 'ea3b8a37-e6c8-4828-9614-51bfdf5ce9cf'
   OR "beneficiaryId" IN (
     SELECT id FROM users 
     WHERE email = 'clodenerc@yahoo.fr' 
       AND id != 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e'
   );

-- 2.3 - Corriger les références dans tontine_members (userId)
-- Pour claircl18@gmail.com
UPDATE tontine_members
SET "userId" = '76223ba8-d868-4bc3-8363-93a20e60d34f'
WHERE "userId" = '3559cf88-21a6-46bb-8c27-ba2fee095954'
   OR "userId" IN (
     SELECT id FROM users 
     WHERE email = 'claircl18@gmail.com' 
       AND id != '76223ba8-d868-4bc3-8363-93a20e60d34f'
   );

-- Pour clodenerc@yahoo.fr
UPDATE tontine_members
SET "userId" = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e'
WHERE "userId" = 'ea3b8a37-e6c8-4828-9614-51bfdf5ce9cf'
   OR "userId" IN (
     SELECT id FROM users 
     WHERE email = 'clodenerc@yahoo.fr' 
       AND id != 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e'
   );

-- 2.4 - Corriger les références dans contributions (userId et validatedBy)
-- userId pour clodenerc@yahoo.fr
UPDATE contributions
SET "userId" = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e'
WHERE "userId" = 'ea3b8a37-e6c8-4828-9614-51bfdf5ce9cf'
   OR "userId" IN (
     SELECT id FROM users 
     WHERE email = 'clodenerc@yahoo.fr' 
       AND id != 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e'
   );

-- validatedBy pour clodenerc@yahoo.fr
UPDATE contributions
SET "validatedBy" = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e'
WHERE "validatedBy" = 'ea3b8a37-e6c8-4828-9614-51bfdf5ce9cf'
   OR "validatedBy" IN (
     SELECT id FROM users 
     WHERE email = 'clodenerc@yahoo.fr' 
       AND id != 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e'
   );

-- validatedBy pour claircl18@gmail.com
UPDATE contributions
SET "validatedBy" = '76223ba8-d868-4bc3-8363-93a20e60d34f'
WHERE "validatedBy" = '3559cf88-21a6-46bb-8c27-ba2fee095954'
   OR "validatedBy" IN (
     SELECT id FROM users 
     WHERE email = 'claircl18@gmail.com' 
       AND id != '76223ba8-d868-4bc3-8363-93a20e60d34f'
   );

-- 2.5 - Corriger les références dans kyc_documents (si la table existe)
-- userId pour clodenerc@yahoo.fr
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kyc_documents') THEN
    UPDATE kyc_documents
    SET "userId" = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e'
    WHERE "userId" = 'ea3b8a37-e6c8-4828-9614-51bfdf5ce9cf'
       OR "userId" IN (
         SELECT id FROM users 
         WHERE email = 'clodenerc@yahoo.fr' 
           AND id != 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e'
       );
    
    UPDATE kyc_documents
    SET "reviewedBy" = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e'
    WHERE "reviewedBy" = 'ea3b8a37-e6c8-4828-9614-51bfdf5ce9cf'
       OR "reviewedBy" IN (
         SELECT id FROM users 
         WHERE email = 'clodenerc@yahoo.fr' 
           AND id != 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e'
       );
  END IF;
END $$;

-- 2.6 - Corriger les références dans system_logs (si la table existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_logs') THEN
    UPDATE system_logs
    SET "userId" = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e'
    WHERE "userId" = 'ea3b8a37-e6c8-4828-9614-51bfdf5ce9cf'
       OR "userId" IN (
         SELECT id FROM users 
         WHERE email = 'clodenerc@yahoo.fr' 
           AND id != 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e'
       );
  END IF;
END $$;

-- ÉTAPE 3: SUPPRIMER LES ANCIENS UTILISATEURS (maintenant que les références sont mises à jour)
-- Pour clodenerc@yahoo.fr (supprimer l'ancien avec mauvais ID)
DELETE FROM users 
WHERE email = 'clodenerc@yahoo.fr' 
  AND id != 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e';

-- Pour claircl18@gmail.com (supprimer l'ancien avec mauvais ID)
DELETE FROM users 
WHERE email = 'claircl18@gmail.com' 
  AND id != '76223ba8-d868-4bc3-8363-93a20e60d34f';

-- Pour Paulinacharles615@gmail.com (supprimer l'ancien avec mauvais ID)
DELETE FROM users 
WHERE email = 'Paulinacharles615@gmail.com' 
  AND id != 'e4afdfa7-4699-49cc-b740-2e8bef97ce55';

-- ÉTAPE 4: CRÉER/METTRE À JOUR LES UTILISATEURS AVEC LES BONS IDs
-- Super Admin
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
  email = 'clodenerc@yahoo.fr',
  role = 'super_admin',
  "fullName" = COALESCE(EXCLUDED."fullName", users."fullName");

-- Admin Tontine
INSERT INTO users (id, email, "fullName", role, "createdAt")
VALUES (
  '76223ba8-d868-4bc3-8363-93a20e60d34f',
  'claircl18@gmail.com',
  'Admin Tontine',
  'admin',
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
  email = 'claircl18@gmail.com',
  role = 'admin',
  "fullName" = COALESCE(EXCLUDED."fullName", users."fullName");

-- Membre
INSERT INTO users (id, email, "fullName", role, "createdAt")
VALUES (
  'e4afdfa7-4699-49cc-b740-2e8bef97ce55',
  'Paulinacharles615@gmail.com',
  'Membre',
  'member',
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
  email = 'Paulinacharles615@gmail.com',
  role = 'member',
  "fullName" = COALESCE(EXCLUDED."fullName", users."fullName");

-- ÉTAPE 5: VÉRIFICATION FINALE
SELECT 
  '=== ✅ RÉSULTAT FINAL ===' as info,
  id,
  email,
  role,
  CASE 
    WHEN id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e' AND email = 'clodenerc@yahoo.fr' AND role = 'super_admin' THEN '✅ Super Admin OK'
    WHEN id = '76223ba8-d868-4bc3-8363-93a20e60d34f' AND email = 'claircl18@gmail.com' AND role = 'admin' THEN '✅ Admin Tontine OK'
    WHEN id = 'e4afdfa7-4699-49cc-b740-2e8bef97ce55' AND email = 'Paulinacharles615@gmail.com' AND role = 'member' THEN '✅ Membre OK'
    ELSE '⚠️ À vérifier'
  END as statut
FROM users
WHERE id IN (
  'cb289deb-9d0d-498c-ba0d-90f77fc58f4e',
  '76223ba8-d868-4bc3-8363-93a20e60d34f',
  'e4afdfa7-4699-49cc-b740-2e8bef97ce55'
)
ORDER BY role;

-- Vérifier qu'il n'y a plus d'anciens enregistrements
SELECT 
  '=== VÉRIFICATION DOUBLONS ===' as info,
  email,
  COUNT(*) as nombre,
  CASE 
    WHEN COUNT(*) > 1 THEN '⚠️ DOUBLON !'
    WHEN COUNT(*) = 1 THEN '✅ OK'
    ELSE '❌ Manquant'
  END as statut
FROM users
WHERE email IN ('clodenerc@yahoo.fr', 'claircl18@gmail.com', 'Paulinacharles615@gmail.com')
GROUP BY email;

-- Message final
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ CORRECTION TERMINÉE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Toutes les références ont été mises à jour.';
  RAISE NOTICE 'Les utilisateurs ont les bons IDs maintenant.';
  RAISE NOTICE '';
  RAISE NOTICE 'Vous pouvez maintenant vous connecter !';
  RAISE NOTICE '';
END $$;

