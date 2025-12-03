-- ====================================
-- NETTOYAGE SIMPLE ET DIRECT
-- Supprime tous les anciens et recrée proprement
-- ====================================

-- ÉTAPE 1: SUPPRIMER TOUS LES ANCIENS ENREGISTREMENTS
-- Pour clodenerc@yahoo.fr
DELETE FROM users WHERE email = 'clodenerc@yahoo.fr';

-- Pour claircl18@gmail.com
DELETE FROM users WHERE email = 'claircl18@gmail.com';

-- Pour Paulinacharles615@gmail.com
DELETE FROM users WHERE email = 'Paulinacharles615@gmail.com';

-- ÉTAPE 2: CRÉER LES UTILISATEURS AVEC LES BONS IDs

-- Super Admin
INSERT INTO users (id, email, "fullName", role, "createdAt")
VALUES (
  'cb289deb-9d0d-498c-ba0d-90f77fc58f4e',
  'clodenerc@yahoo.fr',
  'Super Admin',
  'super_admin',
  NOW()
);

-- Admin Tontine
INSERT INTO users (id, email, "fullName", role, "createdAt")
VALUES (
  '76223ba8-d868-4bc3-8363-93a20e60d34f',
  'claircl18@gmail.com',
  'Admin Tontine',
  'admin',
  NOW()
);

-- Membre
INSERT INTO users (id, email, "fullName", role, "createdAt")
VALUES (
  'e4afdfa7-4699-49cc-b740-2e8bef97ce55',
  'Paulinacharles615@gmail.com',
  'Membre',
  'member',
  NOW()
);

-- ÉTAPE 3: VÉRIFICATION
SELECT 
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

