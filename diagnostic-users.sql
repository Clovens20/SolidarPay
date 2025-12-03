-- ====================================
-- DIAGNOSTIC DES UTILISATEURS SOLIDARPAY
-- Script pour vérifier pourquoi les utilisateurs ne fonctionnent pas
-- ====================================

-- 1. VÉRIFIER L'EXISTENCE DES UTILISATEURS DANS LA TABLE users
SELECT 
  id,
  email,
  "fullName",
  role,
  "createdAt",
  "kohoEmail",
  phone,
  CASE 
    WHEN role = 'admin' THEN '✅ Admin Tontine'
    WHEN role = 'super_admin' THEN '✅ Super Admin'
    WHEN role = 'member' THEN '✅ Membre'
    ELSE '⚠️ Rôle inconnu'
  END as statut_role
FROM users
WHERE id IN (
  '76223ba8-d868-4bc3-8363-93a20e60d34f',  -- admin tontine
  'cb289deb-9d0d-498c-ba0d-90f77fc58f4e',  -- super admin
  'e4afdfa7-4699-49cc-b740-2e8bef97ce55'   -- membre
)
OR email IN (
  'claircl18@gmail.com',
  'clodenerc@yahoo.fr',
  'Paulinacharles615@gmail.com'
)
ORDER BY role, email;

-- 2. VÉRIFIER LES UTILISATEURS DANS SUPABASE AUTH
-- (Cette requête nécessite d'être exécutée dans Supabase SQL Editor)
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  raw_user_meta_data->>'fullName' as fullName,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Email non confirmé'
    ELSE '✅ Email confirmé'
  END as statut_email
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

-- 3. VÉRIFIER LA CORRESPONDANCE ENTRE auth.users ET users
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  au.email_confirmed_at,
  u.id as user_id,
  u.email as user_email,
  u.role,
  CASE 
    WHEN u.id IS NULL THEN '❌ Utilisateur manquant dans users'
    WHEN au.id IS NULL THEN '❌ Utilisateur manquant dans auth.users'
    WHEN au.id != u.id THEN '⚠️ IDs ne correspondent pas'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ Email non confirmé'
    ELSE '✅ OK'
  END as statut
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

-- 4. VÉRIFIER LES RÔLES (CHECK CONSTRAINT)
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%role%';

-- 5. VÉRIFIER LES PROBLÈMES SPÉCIFIQUES PAR UTILISATEUR

-- Utilisateur 1: Admin Tontine
SELECT 
  '=== ADMIN TONTINE ===' as section,
  u.id,
  u.email,
  u.role,
  u."fullName",
  CASE 
    WHEN u.role != 'admin' THEN '❌ Rôle incorrect (devrait être "admin")'
    WHEN au.email_confirmed_at IS NULL THEN '❌ Email non confirmé'
    ELSE '✅ Configuration OK'
  END as probleme
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.id = '76223ba8-d868-4bc3-8363-93a20e60d34f'
   OR u.email = 'claircl18@gmail.com';

-- Utilisateur 2: Super Admin
SELECT 
  '=== SUPER ADMIN ===' as section,
  u.id,
  u.email,
  u.role,
  u."fullName",
  CASE 
    WHEN u.role != 'super_admin' THEN '❌ Rôle incorrect (devrait être "super_admin")'
    WHEN au.email_confirmed_at IS NULL THEN '❌ Email non confirmé'
    ELSE '✅ Configuration OK'
  END as probleme
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e'
   OR u.email = 'clodenerc@yahoo.fr';

-- Utilisateur 3: Membre
SELECT 
  '=== MEMBRE ===' as section,
  u.id,
  u.email,
  u.role,
  u."fullName",
  CASE 
    WHEN u.role != 'member' THEN '❌ Rôle incorrect (devrait être "member")'
    WHEN au.email_confirmed_at IS NULL THEN '❌ Email non confirmé'
    ELSE '✅ Configuration OK'
  END as probleme
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.id = 'e4afdfa7-4699-49cc-b740-2e8bef97ce55'
   OR u.email = 'Paulinacharles615@gmail.com';

-- 6. CORRECTION DES PROBLÈMES POTENTIELS

-- A. Vérifier si le rôle super_admin est autorisé
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'users_role_check'
   OR constraint_name LIKE '%role%';

-- B. Si super_admin n'est pas dans la contrainte, la corriger
-- (Ce script sera généré automatiquement si nécessaire)

-- 7. CRÉER/METTRE À JOUR LES UTILISATEURS SI NÉCESSAIRE

-- Vérifier d'abord s'ils existent, puis proposer les corrections

