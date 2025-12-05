-- ====================================
-- AJOUTER LA COLONNE COUNTRY À LA TABLE USERS
-- Pour permettre aux utilisateurs de sélectionner leur pays lors de l'inscription
-- ====================================

-- Vérifier si la colonne existe déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'country'
  ) THEN
    -- Ajouter la colonne country
    ALTER TABLE users 
    ADD COLUMN country TEXT;

    -- Créer un index pour améliorer les recherches
    CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);

    RAISE NOTICE 'Colonne country ajoutée avec succès';
  ELSE
    RAISE NOTICE 'La colonne country existe déjà';
  END IF;
END $$;

-- Vérification
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'country';

-- Commentaire pour documentation
COMMENT ON COLUMN users.country IS 'Code pays ISO (CA, FR, BE, etc.) - Pays de résidence de l''utilisateur';

