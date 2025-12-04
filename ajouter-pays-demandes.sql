-- ====================================
-- AJOUTER LES PAYS DEMANDÉS
-- Canada, USA, Mexique, Chili, Haïti, Sénégal, Cameroun
-- ====================================

-- S'assurer que la table existe avec les bonnes colonnes
CREATE TABLE IF NOT EXISTS payment_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  "paymentMethods" JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter les pays demandés (s'ils n'existent pas déjà)
INSERT INTO payment_countries (code, name, "paymentMethods", enabled) VALUES
('CA', 'Canada', '["interac", "credit_card", "bank_transfer"]'::jsonb, true),
('US', 'États-Unis', '["credit_card", "bank_transfer", "paypal", "zelle", "cash_app"]'::jsonb, true),
('MX', 'Mexique', '["credit_card", "bank_transfer", "paypal"]'::jsonb, true),
('CL', 'Chili', '["credit_card", "bank_transfer"]'::jsonb, true),
('HT', 'Haïti', '["bank_transfer", "mobile_money"]'::jsonb, true),
('SN', 'Sénégal', '["bank_transfer", "mobile_money"]'::jsonb, true),
('CM', 'Cameroun', '["bank_transfer", "mobile_money"]'::jsonb, true)
ON CONFLICT (code) DO UPDATE
SET 
  name = EXCLUDED.name,
  enabled = COALESCE(payment_countries.enabled, EXCLUDED.enabled, true),
  "updatedAt" = NOW();

-- Vérification
SELECT 
  '=== ✅ PAYS AJOUTÉS ===' as info,
  code,
  name,
  enabled,
  "paymentMethods"
FROM payment_countries
WHERE code IN ('CA', 'US', 'MX', 'CL', 'HT', 'SN', 'CM')
ORDER BY name;
