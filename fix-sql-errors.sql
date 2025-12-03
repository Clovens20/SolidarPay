-- ====================================
-- SOLIDARPAY - CORRECTION DES ERREURS SQL DÉTECTÉES
-- Script pour corriger les erreurs existantes
-- ====================================

-- ÉTAPE 1: SUPPRIMER TOUTES LES VUES QUI DÉPENDENT DES FONCTIONS
DROP VIEW IF EXISTS kyc_stats_view CASCADE;
DROP VIEW IF EXISTS searchable_members CASCADE;
DROP VIEW IF EXISTS member_search_view CASCADE;

-- ÉTAPE 2: SUPPRIMER LES FONCTIONS
DROP FUNCTION IF EXISTS calculate_avg_processing_time() CASCADE;

-- ÉTAPE 3: S'ASSURER QUE TOUTES LES COLONNES KYC EXISTENT
-- IMPORTANT: Faire cela AVANT de créer les vues
DO $$ 
BEGIN
  -- Ajouter autoScore s'il n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'kyc_documents' 
    AND column_name = 'autoScore'
  ) THEN
    ALTER TABLE kyc_documents ADD COLUMN "autoScore" INTEGER;
    RAISE NOTICE '✓ Colonne autoScore ajoutée à kyc_documents';
  END IF;

  -- Ajouter analysisResults s'il n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'kyc_documents' 
    AND column_name = 'analysisResults'
  ) THEN
    ALTER TABLE kyc_documents ADD COLUMN "analysisResults" JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE '✓ Colonne analysisResults ajoutée à kyc_documents';
  END IF;

  -- Ajouter extractedInfo s'il n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'kyc_documents' 
    AND column_name = 'extractedInfo'
  ) THEN
    ALTER TABLE kyc_documents ADD COLUMN "extractedInfo" JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE '✓ Colonne extractedInfo ajoutée à kyc_documents';
  END IF;

  -- Ajouter documentHash s'il n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'kyc_documents' 
    AND column_name = 'documentHash'
  ) THEN
    ALTER TABLE kyc_documents ADD COLUMN "documentHash" TEXT;
    RAISE NOTICE '✓ Colonne documentHash ajoutée à kyc_documents';
  END IF;

  -- Ajouter metadata s'il n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'kyc_documents' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE kyc_documents ADD COLUMN "metadata" JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE '✓ Colonne metadata ajoutée à kyc_documents';
  END IF;

  -- Vérifier que la colonne country existe dans users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'users' 
    AND column_name = 'country'
  ) THEN
    ALTER TABLE users ADD COLUMN country TEXT;
    RAISE NOTICE '✓ Colonne country ajoutée à users';
  END IF;
END $$;

-- ÉTAPE 4: RECRÉER LA FONCTION calculate_avg_processing_time (avec reviewedAt en camelCase)
CREATE OR REPLACE FUNCTION calculate_avg_processing_time()
RETURNS NUMERIC AS $$
  SELECT COALESCE(
    AVG(
      EXTRACT(EPOCH FROM ("reviewedAt" - "submittedAt")) / 3600
    ),
    0
  )::NUMERIC(10, 2)
  FROM kyc_documents
  WHERE "reviewedAt" IS NOT NULL
    AND "submittedAt" IS NOT NULL;
$$ LANGUAGE SQL;

-- ÉTAPE 5: RECRÉER LA VUE kyc_stats_view (avec reviewedAt en camelCase)
CREATE OR REPLACE VIEW kyc_stats_view AS
SELECT
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
  COUNT(*) FILTER (
    WHERE status != 'pending' 
    AND "reviewedAt" >= CURRENT_DATE
  ) as processed_today,
  CASE 
    WHEN COUNT(*) FILTER (WHERE status IN ('approved', 'rejected')) > 0
    THEN ROUND(
      (COUNT(*) FILTER (WHERE status = 'approved')::NUMERIC / 
       COUNT(*) FILTER (WHERE status IN ('approved', 'rejected'))) * 100,
      2
    )
    ELSE 0
  END as approval_rate,
  calculate_avg_processing_time() as avg_processing_hours
FROM kyc_documents;

-- ÉTAPE 6: RECRÉER LA VUE searchable_members (maintenant que autoScore existe)
CREATE OR REPLACE VIEW searchable_members AS
SELECT 
  u.id,
  u.email,
  u."fullName",
  u.phone,
  u.country,
  u.role,
  kd.status as "kycStatus",
  COALESCE(kd."autoScore", 0) as "kycScore"
FROM users u
LEFT JOIN LATERAL (
  SELECT status, "autoScore"
  FROM kyc_documents
  WHERE "userId" = u.id
  ORDER BY "createdAt" DESC
  LIMIT 1
) kd ON true;

-- ÉTAPE 7: RECRÉER LA VUE member_search_view (version alternative)
CREATE OR REPLACE VIEW member_search_view AS
SELECT 
  u.id,
  u.email,
  u."fullName",
  u.phone,
  u.country,
  u."createdAt",
  u.role,
  (
    SELECT kyc.status 
    FROM kyc_documents kyc 
    WHERE kyc."userId" = u.id 
    ORDER BY kyc."createdAt" DESC 
    LIMIT 1
  ) as kyc_status
FROM users u
WHERE u.role = 'member';

-- Message de confirmation
DO $$ 
BEGIN
  RAISE NOTICE '✅ Corrections SQL appliquées avec succès!';
  RAISE NOTICE 'Toutes les colonnes, fonctions et vues ont été corrigées.';
END $$;
