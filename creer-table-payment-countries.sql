-- ====================================
-- CRÉER LA TABLE payment_countries
-- Script SQL complet et prêt à exécuter
-- ====================================

-- Créer la table payment_countries si elle n'existe pas
CREATE TABLE IF NOT EXISTS payment_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,  -- CA, FR, US, etc.
  name TEXT NOT NULL,          -- Canada, France, etc.
  enabled BOOLEAN DEFAULT true,
  "paymentMethods" JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS (Row Level Security) si nécessaire
ALTER TABLE payment_countries ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre la lecture à tous
DROP POLICY IF EXISTS "Allow read payment_countries" ON payment_countries;
CREATE POLICY "Allow read payment_countries" ON payment_countries
  FOR SELECT
  USING (true);

-- Insérer les pays par défaut (s'ils n'existent pas déjà)
INSERT INTO payment_countries (code, name, "paymentMethods", enabled) VALUES
('CA', 'Canada', '["interac", "credit_card", "bank_transfer"]'::jsonb, true),
('US', 'États-Unis', '["credit_card", "bank_transfer", "paypal", "zelle", "cash_app"]'::jsonb, true),
('FR', 'France', '["bank_transfer", "credit_card"]'::jsonb, true),
('BE', 'Belgique', '["bank_transfer", "credit_card"]'::jsonb, true),
('CH', 'Suisse', '["bank_transfer", "credit_card"]'::jsonb, true),
('MX', 'Mexique', '["credit_card", "bank_transfer", "paypal"]'::jsonb, true),
('CL', 'Chili', '["credit_card", "bank_transfer"]'::jsonb, true),
('HT', 'Haïti', '["bank_transfer", "mobile_money"]'::jsonb, true),
('SN', 'Sénégal', '["bank_transfer", "mobile_money"]'::jsonb, true),
('CM', 'Cameroun', '["bank_transfer", "mobile_money"]'::jsonb, true)
ON CONFLICT (code) DO NOTHING;

-- Vérification : Afficher tous les pays créés
SELECT 
  '✅ Table payment_countries créée/verifiée' as status,
  COUNT(*) as nombre_pays
FROM payment_countries;

-- Afficher la liste des pays
SELECT 
  code,
  name,
  enabled,
  "paymentMethods"
FROM payment_countries
ORDER BY name;

