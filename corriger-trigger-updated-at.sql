-- ====================================
-- CORRECTION DU TRIGGER updated_at
-- Le problème : le trigger utilise updated_at mais la colonne s'appelle updatedAt
-- ====================================

-- 1. Supprimer les anciens triggers problématiques
DROP TRIGGER IF EXISTS update_payment_countries_updated_at ON payment_countries;
DROP TRIGGER IF EXISTS update_kyc_documents_updated_at ON kyc_documents;
DROP TRIGGER IF EXISTS update_platform_customization_updated_at ON platform_customization;
DROP TRIGGER IF EXISTS update_user_payment_methods_updated_at ON user_payment_methods;

-- 2. Supprimer l'ancienne fonction problématique
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 3. Créer une nouvelle fonction qui utilise le bon nom de colonne (updatedAt avec guillemets)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Utiliser "updatedAt" (camelCase avec guillemets) pour les tables qui l'utilisent
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recréer les triggers avec la bonne fonction
-- Pour payment_countries
CREATE TRIGGER update_payment_countries_updated_at
  BEFORE UPDATE ON payment_countries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Pour kyc_documents
CREATE TRIGGER update_kyc_documents_updated_at
  BEFORE UPDATE ON kyc_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Pour platform_customization
CREATE TRIGGER update_platform_customization_updated_at
  BEFORE UPDATE ON platform_customization
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Pour user_payment_methods (si la table existe)
CREATE TRIGGER update_user_payment_methods_updated_at
  BEFORE UPDATE ON user_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Vérifier que les triggers sont créés
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE '%updated_at%'
ORDER BY event_object_table;

