-- ====================================
-- VÉRIFIER ET CRÉER LA TABLE payment_countries
-- Script complet pour vérifier/créer la table des pays
-- ====================================

-- Vérifier si la table existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'payment_countries'
  ) THEN
    -- Créer la table si elle n'existe pas
    CREATE TABLE payment_countries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT UNIQUE NOT NULL,  -- CA, FR, US, etc.
      name TEXT NOT NULL,          -- Canada, France, etc.
      enabled BOOLEAN DEFAULT true,
      "paymentMethods" JSONB DEFAULT '[]'::jsonb,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    RAISE NOTICE 'Table payment_countries créée avec succès';
  ELSE
    RAISE NOTICE 'La table payment_countries existe déjà';
  END IF;
END $$;

-- Vérifier la structure de la table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'payment_countries'
ORDER BY ordinal_position;

-- Afficher les pays existants (si la table existe)
SELECT 
  code,
  name,
  enabled,
  "paymentMethods"
FROM payment_countries
ORDER BY name;

