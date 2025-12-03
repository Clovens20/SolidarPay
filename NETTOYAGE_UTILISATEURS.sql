-- ====================================
-- NETTOYAGE COMPLET DES UTILISATEURS
-- Supprime les anciens IDs et assure les bons IDs
-- ====================================

-- ÉTAPE 1: DIAGNOSTIC - Voir tous les enregistrements actuels
SELECT 
  '=== DIAGNOSTIC AVANT NETTOYAGE ===' as info,
  id,
  email,
  role,
  "fullName",
  "createdAt"
FROM users
WHERE email IN ('clodenerc@yahoo.fr', 'claircl18@gmail.com', 'Paulinacharles615@gmail.com')
   OR id IN (
     '76223ba8-d868-4bc3-8363-93a20e60d34f',
     'cb289deb-9d0d-498c-ba0d-90f77fc58f4e',
     'e4afdfa7-4699-49cc-b740-2e8bef97ce55'
   )
ORDER BY email;

-- ÉTAPE 2: SUPPRIMER TOUS LES ANCIENS ENREGISTREMENTS
-- Supprimer tous les enregistrements avec ces emails qui n'ont PAS les bons IDs
DELETE FROM users
WHERE (
  email = 'clodenerc@yahoo.fr' AND id != 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e'
  OR email = 'claircl18@gmail.com' AND id != '76223ba8-d868-4bc3-8363-93a20e60d34f'
  OR email = 'Paulinacharles615@gmail.com' AND id != 'e4afdfa7-4699-49cc-b740-2e8bef97ce55'
);

-- ÉTAPE 3: CRÉER/METTRE À JOUR LES BONS UTILISATEURS

-- 3.1 - Super Admin (clodenerc@yahoo.fr)
INSERT INTO users (id, email, "fullName", role, "createdAt")
SELECT 
  'cb289deb-9d0d-498c-ba0d-90f77fc58f4e',
  'clodenerc@yahoo.fr',
  'Super Admin',
  'super_admin',
  COALESCE(au.created_at, NOW())
FROM auth.users au
WHERE au.id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e'
  OR au.email = 'clodenerc@yahoo.fr'
LIMIT 1
ON CONFLICT (id) DO UPDATE
SET 
  email = 'clodenerc@yahoo.fr',
  role = 'super_admin',
  "fullName" = COALESCE(EXCLUDED."fullName", users."fullName");

-- Si l'insertion depuis auth.users n'a pas fonctionné, créer directement
INSERT INTO users (id, email, "fullName", role, "createdAt")
SELECT 
  'cb289deb-9d0d-498c-ba0d-90f77fc58f4e',
  'clodenerc@yahoo.fr',
  'Super Admin',
  'super_admin',
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e');

-- 3.2 - Admin Tontine (claircl18@gmail.com)
INSERT INTO users (id, email, "fullName", role, "createdAt")
SELECT 
  '76223ba8-d868-4bc3-8363-93a20e60d34f',
  'claircl18@gmail.com',
  'Admin Tontine',
  'admin',
  COALESCE(au.created_at, NOW())
FROM auth.users au
WHERE au.id = '76223ba8-d868-4bc3-8363-93a20e60d34f'
  OR au.email = 'claircl18@gmail.com'
LIMIT 1
ON CONFLICT (id) DO UPDATE
SET 
  email = 'claircl18@gmail.com',
  role = 'admin',
  "fullName" = COALESCE(EXCLUDED."fullName", users."fullName");

INSERT INTO users (id, email, "fullName", role, "createdAt")
SELECT 
  '76223ba8-d868-4bc3-8363-93a20e60d34f',
  'claircl18@gmail.com',
  'Admin Tontine',
  'admin',
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = '76223ba8-d868-4bc3-8363-93a20e60d34f');

-- 3.3 - Membre (Paulinacharles615@gmail.com)
INSERT INTO users (id, email, "fullName", role, "createdAt")
SELECT 
  'e4afdfa7-4699-49cc-b740-2e8bef97ce55',
  'Paulinacharles615@gmail.com',
  'Membre',
  'member',
  COALESCE(au.created_at, NOW())
FROM auth.users au
WHERE au.id = 'e4afdfa7-4699-49cc-b740-2e8bef97ce55'
  OR au.email = 'Paulinacharles615@gmail.com'
LIMIT 1
ON CONFLICT (id) DO UPDATE
SET 
  email = 'Paulinacharles615@gmail.com',
  role = 'member',
  "fullName" = COALESCE(EXCLUDED."fullName", users."fullName");

INSERT INTO users (id, email, "fullName", role, "createdAt")
SELECT 
  'e4afdfa7-4699-49cc-b740-2e8bef97ce55',
  'Paulinacharles615@gmail.com',
  'Membre',
  'member',
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 'e4afdfa7-4699-49cc-b740-2e8bef97ce55');

-- ÉTAPE 4: VÉRIFIER LES IDs DANS auth.users
SELECT 
  '=== VÉRIFICATION auth.users ===' as info,
  id,
  email,
  CASE 
    WHEN id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e' AND email = 'clodenerc@yahoo.fr' THEN '✅ Super Admin - ID correct'
    WHEN id = '76223ba8-d868-4bc3-8363-93a20e60d34f' AND email = 'claircl18@gmail.com' THEN '✅ Admin Tontine - ID correct'
    WHEN id = 'e4afdfa7-4699-49cc-b740-2e8bef97ce55' AND email = 'Paulinacharles615@gmail.com' THEN '✅ Membre - ID correct'
    ELSE '⚠️ ID ou email ne correspond pas'
  END as statut
FROM auth.users
WHERE email IN ('clodenerc@yahoo.fr', 'claircl18@gmail.com', 'Paulinacharles615@gmail.com')
   OR id IN (
     '76223ba8-d868-4bc3-8363-93a20e60d34f',
     'cb289deb-9d0d-498c-ba0d-90f77fc58f4e',
     'e4afdfa7-4699-49cc-b740-2e8bef97ce55'
   );

-- ÉTAPE 5: VÉRIFICATION FINALE - Résultat après nettoyage
SELECT 
  '=== ✅ RÉSULTAT APRÈS NETTOYAGE ===' as info,
  id,
  email,
  role,
  "fullName",
  CASE 
    WHEN id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e' AND email = 'clodenerc@yahoo.fr' AND role = 'super_admin' THEN '✅ Super Admin - PARFAIT'
    WHEN id = '76223ba8-d868-4bc3-8363-93a20e60d34f' AND email = 'claircl18@gmail.com' AND role = 'admin' THEN '✅ Admin Tontine - PARFAIT'
    WHEN id = 'e4afdfa7-4699-49cc-b740-2e8bef97ce55' AND email = 'Paulinacharles615@gmail.com' AND role = 'member' THEN '✅ Membre - PARFAIT'
    ELSE '⚠️ À vérifier'
  END as statut
FROM users
WHERE id IN (
  '76223ba8-d868-4bc3-8363-93a20e60d34f',
  'cb289deb-9d0d-498c-ba0d-90f77fc58f4e',
  'e4afdfa7-4699-49cc-b740-2e8bef97ce55'
)
ORDER BY 
  CASE role
    WHEN 'super_admin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'member' THEN 3
  END;

-- ÉTAPE 6: VÉRIFIER QU'IL N'Y A PLUS D'ANCIENS ENREGISTREMENTS
SELECT 
  '=== VÉRIFICATION DOUBLONS ===' as info,
  email,
  COUNT(*) as nombre_occurrences,
  CASE 
    WHEN COUNT(*) > 1 THEN '⚠️ DOUBLON DÉTECTÉ !'
    WHEN COUNT(*) = 1 THEN '✅ OK - Un seul enregistrement'
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
  RAISE NOTICE '✅ NETTOYAGE TERMINÉ';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Vérifiez les résultats ci-dessus.';
  RAISE NOTICE '';
  RAISE NOTICE 'Chaque email doit avoir :';
  RAISE NOTICE '  - Un seul enregistrement dans users';
  RAISE NOTICE '  - Le bon ID correspondant';
  RAISE NOTICE '  - Le bon rôle';
  RAISE NOTICE '';
  RAISE NOTICE 'Si tout est ✅ PARFAIT, vous pouvez vous connecter !';
  RAISE NOTICE '';
END $$;

