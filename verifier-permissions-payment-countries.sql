-- ====================================
-- VÉRIFIER LES PERMISSIONS RLS POUR payment_countries
-- ====================================

-- 1. Vérifier si RLS est activé
SELECT 
  tablename,
  rowsecurity as "RLS activé"
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'payment_countries';

-- 2. Vérifier les politiques RLS existantes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'payment_countries';

-- 3. Si aucune politique n'existe, créer une politique pour permettre la lecture à tous
-- (Les admins-tontines doivent pouvoir lire les pays)
DO $$
BEGIN
  -- Vérifier si une politique existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payment_countries' 
    AND policyname = 'Allow read payment_countries'
  ) THEN
    -- Créer une politique pour permettre la lecture à tous les utilisateurs authentifiés
    CREATE POLICY "Allow read payment_countries" ON payment_countries
      FOR SELECT
      USING (true);
    
    RAISE NOTICE '✅ Politique RLS créée pour payment_countries';
  ELSE
    RAISE NOTICE '✅ Politique RLS existe déjà pour payment_countries';
  END IF;
END $$;

-- 4. Vérifier que les pays sont bien activés
SELECT 
  code,
  name,
  enabled,
  currency
FROM payment_countries
ORDER BY name;

-- 5. Compter les pays activés
SELECT 
  COUNT(*) as "Total pays",
  COUNT(*) FILTER (WHERE enabled = true) as "Pays activés",
  COUNT(*) FILTER (WHERE enabled = false) as "Pays désactivés"
FROM payment_countries;

