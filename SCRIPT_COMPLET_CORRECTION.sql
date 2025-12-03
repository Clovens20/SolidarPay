-- ====================================
-- SCRIPT COMPLET DE CORRECTION
-- Corrige tous les problèmes de l'interface Admin Tontine
-- ====================================

-- ÉTAPE 1: Supprimer la table si elle existe avec les mauvaises colonnes
DROP TABLE IF EXISTS payment_countries CASCADE;

-- ÉTAPE 2: Créer la table avec les BONNES colonnes (code, name, enabled)
CREATE TABLE payment_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  "paymentMethods" JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ÉTAPE 3: Insérer les pays par défaut
INSERT INTO payment_countries (code, name, "paymentMethods", enabled) VALUES
('CA', 'Canada', '["interac", "credit_card", "bank_transfer"]'::jsonb, true),
('FR', 'France', '["bank_transfer", "credit_card"]'::jsonb, true),
('BE', 'Belgique', '["bank_transfer", "credit_card"]'::jsonb, true),
('CH', 'Suisse', '["bank_transfer", "credit_card"]'::jsonb, true),
('US', 'États-Unis', '["credit_card", "bank_transfer"]'::jsonb, true);

-- ÉTAPE 4: S'assurer que la colonne country existe dans users
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;

-- ÉTAPE 5: Créer un index pour améliorer les recherches
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ÉTAPE 6: Activer RLS si nécessaire
ALTER TABLE payment_countries ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 7: Créer une politique pour permettre la lecture
DROP POLICY IF EXISTS "Allow read payment_countries" ON payment_countries;
CREATE POLICY "Allow read payment_countries" ON payment_countries
  FOR SELECT
  USING (true);

-- ÉTAPE 8: Vérification finale
SELECT 
  '=== ✅ VÉRIFICATION FINALE ===' as info,
  COUNT(*) as nombre_pays,
  COUNT(*) FILTER (WHERE enabled = true) as pays_actifs
FROM payment_countries;

SELECT 
  'Pays créés:' as info,
  code,
  name,
  enabled
FROM payment_countries
ORDER BY name;

-- Message de confirmation
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ CORRECTION TERMINÉE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'La table payment_countries a été créée avec succès !';
  RAISE NOTICE 'Les pays par défaut ont été insérés.';
  RAISE NOTICE '';
  RAISE NOTICE 'Vous pouvez maintenant utiliser l''interface de recherche.';
  RAISE NOTICE '';
END $$;

