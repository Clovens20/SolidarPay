-- ====================================
-- CONFIGURATION AUTOMATIQUE DE LA DEVISE (VERSION SÉCURISÉE)
-- La devise est configurée automatiquement selon le pays de l'admin
-- Version qui évite les erreurs de trigger
-- ====================================

-- 1. Ajouter le champ currency dans la table tontines
ALTER TABLE tontines 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CAD' CHECK (currency IN ('CAD', 'USD', 'EUR', 'CHF', 'XOF', 'XAF', 'HTG', 'MXN', 'CLP'));

COMMENT ON COLUMN tontines.currency IS 'Devise de la tontine (CAD, USD, EUR, etc.) - Configurée automatiquement selon le pays de l''admin';

-- 2. Mettre à jour les pays existants avec leur devise par défaut
-- Ajouter une colonne currency dans payment_countries si elle n'existe pas
ALTER TABLE payment_countries 
ADD COLUMN IF NOT EXISTS currency TEXT;

-- 3. Configurer les devises par défaut pour chaque pays
-- Désactiver temporairement les triggers pour éviter les erreurs
DO $$
BEGIN
  -- Désactiver tous les triggers sur payment_countries
  ALTER TABLE payment_countries DISABLE TRIGGER ALL;
  
  -- Mettre à jour les devises
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
  
  -- Mettre à jour manuellement updatedAt si la colonne existe
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'payment_countries' AND column_name = 'updatedAt') THEN
    UPDATE payment_countries SET "updatedAt" = NOW() WHERE currency IS NOT NULL;
  END IF;
  
  -- Réactiver les triggers
  ALTER TABLE payment_countries ENABLE TRIGGER ALL;
END $$;

-- 4. Créer un index pour améliorer les recherches
CREATE INDEX IF NOT EXISTS idx_tontines_currency ON tontines(currency);

-- 5. Mettre à jour les tontines existantes avec la devise de l'admin
-- Si l'admin a un pays configuré, utiliser la devise de ce pays
DO $$
BEGIN
  UPDATE tontines t
  SET currency = pc.currency
  FROM users u
  JOIN payment_countries pc ON u.country = pc.code
  WHERE t."adminId" = u.id 
    AND u.country IS NOT NULL
    AND pc.currency IS NOT NULL
    AND (t.currency IS NULL OR t.currency = 'CAD');
END $$;

-- Vérification
SELECT 
  '✅ Configuration devise automatique installée' as status,
  COUNT(*) as "tontines_count",
  currency,
  COUNT(*) as count
FROM tontines
GROUP BY currency;

-- Afficher les pays avec leurs devises
SELECT 
  code,
  name,
  currency,
  enabled
FROM payment_countries
ORDER BY name;

