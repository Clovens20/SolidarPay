-- ====================================
-- NETTOYAGE SIMPLE DE clodenerc@yahoo.fr
-- Retirer cet utilisateur des membres et tontines
-- ID correct: cb289deb-9d0d-498c-ba0d-90f77fc58f4e (Super Admin)
-- ====================================

-- 1. Retirer des membres de tontine
DELETE FROM tontine_members
WHERE "userId" = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e';

-- 2. Retirer des cycles (s'il est bénéficiaire)
DELETE FROM cycles
WHERE "beneficiaryId" = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e';

-- 3. Retirer des contributions
DELETE FROM contributions
WHERE "userId" = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e';

-- 4. Vérifier qu'il n'est plus dans les tontines comme admin
-- (Ne pas supprimer les tontines, juste vérifier)
SELECT 
  'VERIFICATION' as status,
  COUNT(*) as tontines_count
FROM tontines
WHERE "adminId" = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e';

-- Si des tontines ont clodenerc@yahoo.fr comme admin, vous devez les supprimer ou changer l'admin manuellement
-- DELETE FROM tontines WHERE "adminId" = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e';

