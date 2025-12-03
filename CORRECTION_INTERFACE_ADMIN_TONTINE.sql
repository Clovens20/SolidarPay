-- ====================================
-- CORRECTION DE L'INTERFACE ADMIN TONTINE
-- Unifier les colonnes de payment_countries
-- ====================================

-- ÉTAPE 1: Vérifier la structure actuelle
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'payment_countries'
ORDER BY ordinal_position;

-- ÉTAPE 2: Si la table utilise countryCode/countryName/isActive, ajouter des colonnes compatibles
DO $$
BEGIN
  -- Vérifier si countryCode existe mais pas code
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_countries' AND column_name = 'countryCode'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_countries' AND column_name = 'code'
  ) THEN
    -- Ajouter les colonnes avec les bons noms
    ALTER TABLE payment_countries ADD COLUMN IF NOT EXISTS code TEXT;
    ALTER TABLE payment_countries ADD COLUMN IF NOT EXISTS name TEXT;
    ALTER TABLE payment_countries ADD COLUMN IF NOT EXISTS enabled BOOLEAN;
    
    -- Copier les données
    UPDATE payment_countries SET code = "countryCode", name = "countryName", enabled = "isActive";
    
    -- Créer les index si nécessaire
    CREATE UNIQUE INDEX IF NOT EXISTS payment_countries_code_key ON payment_countries(code);
    
    RAISE NOTICE 'Colonnes code, name, enabled ajoutées et données copiées';
  END IF;
END $$;

-- ÉTAPE 3: S'assurer que la table payment_countries existe avec les bonnes colonnes
CREATE TABLE IF NOT EXISTS payment_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  "paymentMethods" JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ÉTAPE 4: Insérer les pays par défaut s'ils n'existent pas
INSERT INTO payment_countries (code, name, "paymentMethods", enabled) VALUES
('CA', 'Canada', '["interac", "credit_card", "bank_transfer"]'::jsonb, true),
('FR', 'France', '["bank_transfer", "credit_card"]'::jsonb, true),
('BE', 'Belgique', '["bank_transfer", "credit_card"]'::jsonb, true),
('CH', 'Suisse', '["bank_transfer", "credit_card"]'::jsonb, true),
('US', 'États-Unis', '["credit_card", "bank_transfer"]'::jsonb, true)
ON CONFLICT (code) DO UPDATE
SET 
  name = EXCLUDED.name,
  enabled = COALESCE(EXCLUDED.enabled, payment_countries.enabled);

-- ÉTAPE 5: S'assurer que la colonne country existe dans users
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;

-- ÉTAPE 6: Vérification finale
SELECT 
  '=== VÉRIFICATION ===' as info,
  COUNT(*) as nombre_pays,
  COUNT(*) FILTER (WHERE enabled = true) as pays_actifs
FROM payment_countries;

SELECT 
  'Pays disponibles:' as info,
  code,
  name,
  enabled
FROM payment_countries
ORDER BY name;

