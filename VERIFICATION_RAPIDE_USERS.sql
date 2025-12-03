-- ====================================
-- VÉRIFICATION RAPIDE DES UTILISATEURS
-- Script simple pour vérifier rapidement l'état des 3 utilisateurs
-- ====================================

-- VÉRIFICATION RAPIDE
SELECT 
  '=== VÉRIFICATION RAPIDE ===' as info;

-- 1. Vérifier dans users
SELECT 
  '📋 Table users' as source,
  id,
  email,
  role,
  "fullName",
  CASE 
    WHEN id = '76223ba8-d868-4bc3-8363-93a20e60d34f' AND role = 'admin' THEN '✅ Admin Tontine OK'
    WHEN id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e' AND role = 'super_admin' THEN '✅ Super Admin OK'
    WHEN id = 'e4afdfa7-4699-49cc-b740-2e8bef97ce55' AND role = 'member' THEN '✅ Membre OK'
    WHEN id IS NOT NULL THEN CONCAT('⚠️ Rôle incorrect: ', role)
    ELSE '❌ Utilisateur manquant'
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

-- 2. Vérifier dans auth.users (si accessible)
SELECT 
  '🔐 Table auth.users' as source,
  id,
  email,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Email non confirmé'
    ELSE '✅ Email confirmé'
  END as statut_email,
  created_at
FROM auth.users
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

-- 3. Vérifier la correspondance
SELECT 
  '🔗 Correspondance auth.users ↔ users' as source,
  au.id,
  au.email,
  CASE 
    WHEN u.id IS NULL THEN '❌ Manquant dans users'
    WHEN au.id != u.id THEN '⚠️ IDs différents'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ Email non confirmé'
    ELSE '✅ OK'
  END as statut
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE au.email IN (
  'claircl18@gmail.com',
  'clodenerc@yahoo.fr',
  'Paulinacharles615@gmail.com'
);

-- 4. Vérifier la contrainte de rôle
SELECT 
  '⚙️ Contrainte de rôle' as source,
  constraint_name,
  check_clause,
  CASE 
    WHEN check_clause LIKE '%super_admin%' THEN '✅ super_admin autorisé'
    ELSE '❌ super_admin NON autorisé'
  END as statut
FROM information_schema.check_constraints
WHERE constraint_name = 'users_role_check';

