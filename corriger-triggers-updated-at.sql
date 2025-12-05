-- ====================================
-- CORRECTION DES TRIGGERS updated_at
-- Corrige les problèmes de nommage des colonnes (snake_case vs camelCase)
-- ====================================

-- 1. Supprimer les anciens triggers problématiques
DROP TRIGGER IF EXISTS update_landing_page_content_updated_at ON landing_page_content;
DROP TRIGGER IF EXISTS update_footer_content_updated_at ON footer_content;
DROP TRIGGER IF EXISTS update_legal_pages_updated_at ON legal_pages;
DROP TRIGGER IF EXISTS update_payment_countries_updated_at ON payment_countries;
DROP TRIGGER IF EXISTS update_kyc_documents_updated_at ON kyc_documents;
DROP TRIGGER IF EXISTS update_platform_customization_updated_at ON platform_customization;

-- 2. Supprimer les anciennes fonctions de trigger
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- 3. Créer une fonction générique qui détecte automatiquement le nom de la colonne
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Essayer d'abord avec camelCase (updatedAt)
  IF TG_TABLE_NAME IN ('kyc_documents', 'payment_countries', 'platform_customization', 'user_payment_methods') THEN
    NEW."updatedAt" = NOW();
  -- Sinon utiliser snake_case (updated_at)
  ELSIF TG_TABLE_NAME IN ('landing_page_content', 'footer_content', 'legal_pages') THEN
    NEW.updated_at = NOW();
  ELSE
    -- Tentative automatique : essayer d'abord camelCase, puis snake_case
    BEGIN
      NEW."updatedAt" = NOW();
    EXCEPTION WHEN OTHERS THEN
      NEW.updated_at = NOW();
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer une fonction spécifique pour camelCase
CREATE OR REPLACE FUNCTION update_updated_at_camelcase()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Créer une fonction spécifique pour snake_case
CREATE OR REPLACE FUNCTION update_updated_at_snakecase()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Vérifier les colonnes existantes et créer les bons triggers
DO $$
BEGIN
  -- Pour kyc_documents (camelCase)
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'kyc_documents' AND column_name = 'updatedAt') THEN
    CREATE TRIGGER update_kyc_documents_updated_at
      BEFORE UPDATE ON kyc_documents
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_camelcase();
  END IF;

  -- Pour payment_countries (camelCase)
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'payment_countries' AND column_name = 'updatedAt') THEN
    CREATE TRIGGER update_payment_countries_updated_at
      BEFORE UPDATE ON payment_countries
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_camelcase();
  END IF;

  -- Pour platform_customization (camelCase)
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'platform_customization' AND column_name = 'updatedAt') THEN
    CREATE TRIGGER update_platform_customization_updated_at
      BEFORE UPDATE ON platform_customization
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_camelcase();
  END IF;

  -- Pour user_payment_methods (camelCase)
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'user_payment_methods' AND column_name = 'updatedAt') THEN
    CREATE TRIGGER update_user_payment_methods_updated_at
      BEFORE UPDATE ON user_payment_methods
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_camelcase();
  END IF;

  -- Pour landing_page_content (snake_case)
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'landing_page_content' AND column_name = 'updated_at') THEN
    CREATE TRIGGER update_landing_page_content_updated_at
      BEFORE UPDATE ON landing_page_content
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_snakecase();
  END IF;

  -- Pour footer_content (snake_case)
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'footer_content' AND column_name = 'updated_at') THEN
    CREATE TRIGGER update_footer_content_updated_at
      BEFORE UPDATE ON footer_content
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_snakecase();
  END IF;

  -- Pour legal_pages (snake_case)
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'legal_pages' AND column_name = 'updated_at') THEN
    CREATE TRIGGER update_legal_pages_updated_at
      BEFORE UPDATE ON legal_pages
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_snakecase();
  END IF;

END $$;

-- 7. Vérification : Afficher tous les triggers créés
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE '%updated_at%'
ORDER BY event_object_table, trigger_name;

-- 8. Afficher les colonnes updatedAt/updated_at pour vérification
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE column_name IN ('updatedAt', 'updated_at')
ORDER BY table_name, column_name;

