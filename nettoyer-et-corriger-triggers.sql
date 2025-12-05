-- ====================================
-- NETTOYAGE COMPLET ET CORRECTION DES TRIGGERS
-- Supprime TOUT puis recrée correctement
-- ====================================

-- ÉTAPE 1 : Supprimer TOUS les triggers (avec gestion d'erreur)
DO $$
BEGIN
  -- Supprimer tous les triggers qui pourraient exister
  DROP TRIGGER IF EXISTS update_payment_countries_updated_at ON payment_countries;
  DROP TRIGGER IF EXISTS update_kyc_documents_updated_at ON kyc_documents;
  DROP TRIGGER IF EXISTS update_platform_customization_updated_at ON platform_customization;
  DROP TRIGGER IF EXISTS update_user_payment_methods_updated_at ON user_payment_methods;
  DROP TRIGGER IF EXISTS update_footer_content_updated_at ON footer_content;
  DROP TRIGGER IF EXISTS update_landing_page_content_updated_at ON landing_page_content;
  DROP TRIGGER IF EXISTS update_legal_pages_updated_at ON legal_pages;
  DROP TRIGGER IF EXISTS update_maintenance_schedule_updated_at ON maintenance_schedule;
  
  RAISE NOTICE '✅ Tous les triggers supprimés';
END $$;

-- ÉTAPE 2 : Supprimer TOUTES les fonctions (avec gestion d'erreur)
DO $$
BEGIN
  DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
  DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
  DROP FUNCTION IF EXISTS update_updated_at_camelcase() CASCADE;
  DROP FUNCTION IF EXISTS update_updated_at_snakecase() CASCADE;
  
  RAISE NOTICE '✅ Toutes les fonctions supprimées';
END $$;

-- ÉTAPE 3 : Créer les nouvelles fonctions

-- Fonction pour camelCase (updatedAt avec guillemets)
CREATE OR REPLACE FUNCTION update_updated_at_camelcase()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour snake_case (updated_at)
CREATE OR REPLACE FUNCTION update_updated_at_snakecase()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ÉTAPE 4 : Créer les triggers pour les tables camelCase (updatedAt)

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

-- ÉTAPE 5 : Créer les triggers pour les tables snake_case (updated_at)

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

-- ÉTAPE 6 : Trigger conditionnel pour maintenance_schedule
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'maintenance_schedule') THEN
    CREATE TRIGGER update_maintenance_schedule_updated_at
      BEFORE UPDATE ON maintenance_schedule
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_camelcase();
    RAISE NOTICE '✅ Trigger pour maintenance_schedule créé';
  END IF;
END $$;

-- VÉRIFICATION FINALE
SELECT 
  '✅ TRIGGERS CRÉÉS' as status,
  trigger_name,
  event_object_table as table_name
FROM information_schema.triggers
WHERE trigger_name LIKE '%updated%'
  AND event_object_schema = 'public'
ORDER BY event_object_table;

