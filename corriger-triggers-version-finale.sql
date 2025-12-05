-- ====================================
-- CORRECTION COMPLÈTE DES TRIGGERS - VERSION FINALE
-- Supprime TOUS les triggers et fonctions avant de recréer
-- ====================================

-- 1. Supprimer TOUS les triggers existants (peu importe le format)
DROP TRIGGER IF EXISTS update_payment_countries_updated_at ON payment_countries;
DROP TRIGGER IF EXISTS update_kyc_documents_updated_at ON kyc_documents;
DROP TRIGGER IF EXISTS update_platform_customization_updated_at ON platform_customization;
DROP TRIGGER IF EXISTS update_user_payment_methods_updated_at ON user_payment_methods;
DROP TRIGGER IF EXISTS update_footer_content_updated_at ON footer_content;
DROP TRIGGER IF EXISTS update_landing_page_content_updated_at ON landing_page_content;
DROP TRIGGER IF EXISTS update_legal_pages_updated_at ON legal_pages;
DROP TRIGGER IF EXISTS update_maintenance_schedule_updated_at ON maintenance_schedule;

-- 2. Supprimer TOUTES les anciennes fonctions (tous formats)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_camelcase() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_snakecase() CASCADE;

-- 3. Créer une fonction pour les colonnes camelCase (updatedAt avec guillemets)
CREATE OR REPLACE FUNCTION update_updated_at_camelcase()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer une fonction pour les colonnes snake_case (updated_at)
CREATE OR REPLACE FUNCTION update_updated_at_snakecase()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Recréer les triggers avec la bonne fonction selon le format de colonne

-- Tables qui utilisent camelCase (updatedAt)
CREATE TRIGGER update_payment_countries_updated_at
  BEFORE UPDATE ON payment_countries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_camelcase();

CREATE TRIGGER update_kyc_documents_updated_at
  BEFORE UPDATE ON kyc_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_camelcase();

CREATE TRIGGER update_platform_customization_updated_at
  BEFORE UPDATE ON platform_customization
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_camelcase();

CREATE TRIGGER update_user_payment_methods_updated_at
  BEFORE UPDATE ON user_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_camelcase();

-- Tables qui utilisent snake_case (updated_at)
CREATE TRIGGER update_footer_content_updated_at
  BEFORE UPDATE ON footer_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_snakecase();

CREATE TRIGGER update_landing_page_content_updated_at
  BEFORE UPDATE ON landing_page_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_snakecase();

CREATE TRIGGER update_legal_pages_updated_at
  BEFORE UPDATE ON legal_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_snakecase();

-- Pour maintenance_schedule si la table existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'maintenance_schedule') THEN
    CREATE TRIGGER update_maintenance_schedule_updated_at
      BEFORE UPDATE ON maintenance_schedule
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_camelcase();
  END IF;
END $$;

-- 6. Vérification finale : Afficher tous les triggers créés
SELECT 
  '✅ Triggers créés avec succès' as info,
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE '%updated%'
  AND event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

