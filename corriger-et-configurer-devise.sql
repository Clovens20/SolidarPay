-- ====================================
-- CORRECTION DES TRIGGERS + CONFIGURATION DEVISE
-- Script complet qui corrige les triggers puis configure la devise
-- ====================================

-- ====================================
-- ÉTAPE 1 : CORRIGER LES TRIGGERS
-- ====================================

-- Supprimer TOUS les anciens triggers problématiques (tous formats)
DROP TRIGGER IF EXISTS update_payment_countries_updated_at ON payment_countries;
DROP TRIGGER IF EXISTS update_kyc_documents_updated_at ON kyc_documents;
DROP TRIGGER IF EXISTS update_platform_customization_updated_at ON platform_customization;
DROP TRIGGER IF EXISTS update_user_payment_methods_updated_at ON user_payment_methods;
DROP TRIGGER IF EXISTS update_footer_content_updated_at ON footer_content;
DROP TRIGGER IF EXISTS update_landing_page_content_updated_at ON landing_page_content;
DROP TRIGGER IF EXISTS update_legal_pages_updated_at ON legal_pages;
DROP TRIGGER IF EXISTS update_maintenance_schedule_updated_at ON maintenance_schedule;

-- Supprimer les anciennes fonctions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- Créer une fonction pour les colonnes camelCase (updatedAt avec guillemets)
CREATE OR REPLACE FUNCTION update_updated_at_camelcase()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer une fonction pour les colonnes snake_case (updated_at)
CREATE OR REPLACE FUNCTION update_updated_at_snakecase()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer les triggers avec la bonne fonction selon le format de colonne

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

-- Pour user_payment_methods si la table existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'user_payment_methods') THEN
    CREATE TRIGGER update_user_payment_methods_updated_at
      BEFORE UPDATE ON user_payment_methods
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_camelcase();
  END IF;
END $$;

-- ====================================
-- ÉTAPE 2 : CONFIGURER LA DEVISE
-- ====================================

-- 1. Ajouter le champ currency dans la table tontines
ALTER TABLE tontines 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CAD' CHECK (currency IN ('CAD', 'USD', 'EUR', 'CHF', 'XOF', 'XAF', 'HTG', 'MXN', 'CLP'));

COMMENT ON COLUMN tontines.currency IS 'Devise de la tontine (CAD, USD, EUR, etc.) - Configurée automatiquement selon le pays de l''admin';

-- 2. Ajouter une colonne currency dans payment_countries si elle n'existe pas
ALTER TABLE payment_countries 
ADD COLUMN IF NOT EXISTS currency TEXT;

-- 3. Configurer les devises par défaut pour chaque pays
-- Les triggers sont maintenant corrects, mais on peut quand même désactiver temporairement pour être sûr
ALTER TABLE payment_countries DISABLE TRIGGER ALL;

UPDATE payment_countries SET currency = 'CAD' WHERE code = 'CA';
UPDATE payment_countries SET currency = 'USD' WHERE code = 'US';
UPDATE payment_countries SET currency = 'EUR' WHERE code = 'FR';
UPDATE payment_countries SET currency = 'EUR' WHERE code = 'BE';
UPDATE payment_countries SET currency = 'CHF' WHERE code = 'CH';
UPDATE payment_countries SET currency = 'MXN' WHERE code = 'MX';
UPDATE payment_countries SET currency = 'CLP' WHERE code = 'CL';
UPDATE payment_countries SET currency = 'HTG' WHERE code = 'HT';
UPDATE payment_countries SET currency = 'XOF' WHERE code = 'SN';
UPDATE payment_countries SET currency = 'XAF' WHERE code = 'CM';

-- Mettre à jour updatedAt manuellement
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'payment_countries' 
             AND column_name = 'updatedAt') THEN
    UPDATE payment_countries SET "updatedAt" = NOW() WHERE currency IS NOT NULL;
  END IF;
END $$;

-- Réactiver les triggers
ALTER TABLE payment_countries ENABLE TRIGGER ALL;

-- 4. Créer un index pour améliorer les recherches
CREATE INDEX IF NOT EXISTS idx_tontines_currency ON tontines(currency);

-- 5. Mettre à jour les tontines existantes avec la devise de l'admin
DO $$
BEGIN
  UPDATE tontines t
  SET currency = COALESCE(pc.currency, 'CAD')
  FROM users u
  LEFT JOIN payment_countries pc ON u.country = pc.code
  WHERE t."adminId" = u.id 
    AND u.country IS NOT NULL
    AND (t.currency IS NULL OR t.currency = 'CAD');
END $$;

-- ====================================
-- VÉRIFICATIONS
-- ====================================

-- Vérifier les triggers créés
SELECT 
  '✅ Triggers créés' as info,
  trigger_name,
  event_object_table as table_name
FROM information_schema.triggers
WHERE trigger_name LIKE '%updated%'
  AND event_object_schema = 'public'
ORDER BY event_object_table;

-- Vérifier la configuration devise
SELECT 
  '✅ Configuration devise' as info,
  COUNT(*) as "tontines_count",
  currency,
  COUNT(*) as count
FROM tontines
GROUP BY currency;

-- Afficher les pays avec leurs devises
SELECT 
  '✅ Pays configurés' as info,
  code,
  name,
  currency,
  enabled
FROM payment_countries
ORDER BY name;

