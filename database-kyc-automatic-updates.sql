-- ====================================
-- SOLIDARPAY KYC AUTOMATIC VERIFICATION
-- Mises à jour pour le système de vérification automatique
-- ====================================

-- Ajouter les champs nécessaires pour la vérification automatique
ALTER TABLE kyc_documents 
ADD COLUMN IF NOT EXISTS "autoScore" INTEGER,
ADD COLUMN IF NOT EXISTS "analysisResults" JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "extractedInfo" JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "documentHash" TEXT,
ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}'::jsonb;

-- Ajouter index pour les recherches par hash
CREATE INDEX IF NOT EXISTS idx_kyc_documents_hash ON kyc_documents("documentHash");

-- Ajouter index pour le score automatique
CREATE INDEX IF NOT EXISTS idx_kyc_documents_score ON kyc_documents("autoScore");

-- Mettre à jour le statut 'pending_review' pour les revues manuelles
-- Le statut peut être:
-- 'pending' - En cours d'analyse automatique (pas encore de score)
-- 'pending_review' - Analyse terminée, nécessite revue manuelle (score 50-84)
-- 'approved' - Approuvé (automatiquement ou manuellement)
-- 'rejected' - Rejeté (automatiquement ou manuellement)
-- 'new_document_required' - Nouveau document requis

-- Vue pour les revues manuelles
CREATE OR REPLACE VIEW kyc_manual_reviews AS
SELECT *
FROM kyc_documents
WHERE status = 'pending_review'
  AND "autoScore" >= 50
  AND "autoScore" < 85
ORDER BY "submittedAt" ASC;

-- Vue pour les statistiques automatiques
CREATE OR REPLACE VIEW kyc_auto_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'approved' AND "autoScore" >= 85) as auto_approved,
  COUNT(*) FILTER (WHERE status = 'rejected' AND "autoScore" < 50) as auto_rejected,
  COUNT(*) FILTER (WHERE status = 'pending_review' AND "autoScore" >= 50 AND "autoScore" < 85) as manual_review,
  COUNT(*) as total,
  AVG("autoScore") FILTER (WHERE "autoScore" IS NOT NULL) as avg_score,
  DATE("submittedAt") as date
FROM kyc_documents
GROUP BY DATE("submittedAt")
ORDER BY date DESC;

-- Fonction pour limiter les tentatives (à appeler avant insertion)
CREATE OR REPLACE FUNCTION check_kyc_attempts(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO attempt_count
  FROM kyc_documents
  WHERE "userId" = user_id;
  
  RETURN attempt_count < 5;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier les doublons de hash
CREATE OR REPLACE FUNCTION check_duplicate_hash(hash TEXT, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM kyc_documents
  WHERE "documentHash" = hash
    AND "userId" != user_id;
  
  RETURN duplicate_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON COLUMN kyc_documents."autoScore" IS 'Score automatique (0-100) calculé par le système';
COMMENT ON COLUMN kyc_documents."analysisResults" IS 'Résultats de l''analyse automatique (checks, détections)';
COMMENT ON COLUMN kyc_documents."extractedInfo" IS 'Informations extraites du document (nom, date, etc.)';
COMMENT ON COLUMN kyc_documents."documentHash" IS 'Hash du document pour détecter les doublons';
COMMENT ON COLUMN kyc_documents."metadata" IS 'Métadonnées additionnelles (tentatives, temps traitement, etc.)';

