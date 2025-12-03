-- ====================================
-- SOLIDARPAY - MISE À JOUR FRÉQUENCE WEEKLY
-- Ajoute l'option "weekly" (hebdomadaire) à la fréquence des tontines
-- ====================================

-- Mettre à jour la contrainte CHECK pour accepter 'weekly'
ALTER TABLE tontines DROP CONSTRAINT IF EXISTS tontines_frequency_check;
ALTER TABLE tontines ADD CONSTRAINT tontines_frequency_check 
  CHECK (frequency IN ('monthly', 'biweekly', 'weekly'));

-- Vérification
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'tontines' 
  AND constraint_name LIKE '%frequency%';

