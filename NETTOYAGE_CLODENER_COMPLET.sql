-- ====================================
-- NETTOYAGE COMPLET DE clodenerc@yahoo.fr
-- Retirer cet utilisateur des membres et tontines
-- ====================================

-- ID correct du Super Admin
-- clodenerc@yahoo.fr = cb289deb-9d0d-498c-ba0d-90f77fc58f4e (Super Admin)

-- 1. Vérifier où clodenerc@yahoo.fr apparaît dans les tontines
SELECT 
  'TONTINES' as table_name,
  t.id,
  t.name,
  t."adminId",
  u.email as admin_email,
  u.role as admin_role
FROM tontines t
LEFT JOIN users u ON t."adminId" = u.id
WHERE u.email = 'clodenerc@yahoo.fr';

-- 2. Vérifier où clodenerc@yahoo.fr apparaît dans les membres de tontine
SELECT 
  'TONTINE_MEMBERS' as table_name,
  tm.*,
  u.email,
  u.role
FROM tontine_members tm
JOIN users u ON tm."userId" = u.id
WHERE u.email = 'clodenerc@yahoo.fr';

-- 3. Vérifier dans les cycles
SELECT 
  'CYCLES' as table_name,
  c.*,
  u.email,
  u.role
FROM cycles c
JOIN users u ON c."beneficiaryId" = u.id
WHERE u.email = 'clodenerc@yahoo.fr';

-- 4. Vérifier dans les contributions
SELECT 
  'CONTRIBUTIONS' as table_name,
  contrib.*,
  u.email,
  u.role
FROM contributions contrib
JOIN users u ON contrib."userId" = u.id
WHERE u.email = 'clodenerc@yahoo.fr';

-- 5. RETIRER clodenerc@yahoo.fr DES MEMBRES DE TONTINE
-- (Il ne doit pas être membre, seulement Super Admin)
DELETE FROM tontine_members
WHERE "userId" = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e';

-- 6. RETIRER clodenerc@yahoo.fr DES TONTINES (s'il est admin d'une tontine)
-- Si des tontines ont clodenerc@yahoo.fr comme admin, les supprimer ou changer l'admin
-- ATTENTION: Vérifiez d'abord quelles tontines sont concernées

-- Option 1: Supprimer les tontines avec clodenerc@yahoo.fr comme admin
-- DELETE FROM tontines WHERE "adminId" = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e';

-- Option 2: Changer l'admin vers un autre admin (si disponible)
-- UPDATE tontines 
-- SET "adminId" = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
-- WHERE "adminId" = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e';

-- 7. RETIRER clodenerc@yahoo.fr DES CYCLES (s'il est bénéficiaire)
DELETE FROM cycles
WHERE "beneficiaryId" = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e';

-- 8. RETIRER clodenerc@yahoo.fr DES CONTRIBUTIONS
DELETE FROM contributions
WHERE "userId" = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e';

-- 9. VÉRIFICATION FINALE
SELECT 
  'VERIFICATION' as status,
  COUNT(*) FILTER (WHERE tm."userId" = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e') as tontine_members_count,
  COUNT(*) FILTER (WHERE t."adminId" = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e') as tontines_admin_count,
  COUNT(*) FILTER (WHERE c."beneficiaryId" = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e') as cycles_beneficiary_count,
  COUNT(*) FILTER (WHERE contrib."userId" = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e') as contributions_count
FROM users u
LEFT JOIN tontine_members tm ON u.id = tm."userId"
LEFT JOIN tontines t ON u.id = t."adminId"
LEFT JOIN cycles c ON u.id = c."beneficiaryId"
LEFT JOIN contributions contrib ON u.id = contrib."userId"
WHERE u.email = 'clodenerc@yahoo.fr';

