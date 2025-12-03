-- ====================================
-- SOLIDARPAY KYC ENHANCEMENTS
-- Mises à jour pour l'interface KYC avancée
-- ====================================

-- Ajouter les champs pour l'analyse automatique
ALTER TABLE kyc_documents 
ADD COLUMN IF NOT EXISTS "autoScore" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "analysisResults" JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "extractedInfo" JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "processedAt" TIMESTAMP WITH TIME ZONE;

-- Créer un index pour les scores
CREATE INDEX IF NOT EXISTS idx_kyc_documents_score ON kyc_documents("autoScore");
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON kyc_documents(status);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_submitted ON kyc_documents("submittedAt" DESC);

-- Ajouter le champ country à users si pas déjà présent
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;

-- Fonction pour calculer le temps de traitement moyen
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

-- Vue pour les statistiques KYC
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

-- Commentaires pour documentation
COMMENT ON COLUMN kyc_documents."autoScore" IS 'Score automatique de 0 à 100 calculé par IA/ML';
COMMENT ON COLUMN kyc_documents."analysisResults" IS 'Résultats de l''analyse automatique (JSON)';
COMMENT ON COLUMN kyc_documents."extractedInfo" IS 'Informations extraites du document (JSON)';

