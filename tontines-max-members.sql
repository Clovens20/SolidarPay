-- Nombre maximum de membres par tontine (NULL = pas de limite côté produit)
-- Exécuter dans Supabase → SQL Editor

ALTER TABLE tontines ADD COLUMN IF NOT EXISTS "maxMembers" INTEGER;

ALTER TABLE tontines DROP CONSTRAINT IF EXISTS tontines_max_members_positive;
ALTER TABLE tontines ADD CONSTRAINT tontines_max_members_positive
  CHECK ("maxMembers" IS NULL OR "maxMembers" >= 1);

COMMENT ON COLUMN tontines."maxMembers" IS 'Capacité max de membres ; NULL = illimité';
