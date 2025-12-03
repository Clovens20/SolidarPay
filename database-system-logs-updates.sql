-- ====================================
-- SOLIDARPAY SYSTEM LOGS ENHANCEMENTS
-- Mises à jour pour le système de logs technique
-- ====================================

-- Assure-toi que la table system_logs existe avec tous les champs nécessaires
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'critical')),
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "userId" UUID REFERENCES users(id),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter les index pour les performances
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_user ON system_logs("userId");
CREATE INDEX IF NOT EXISTS idx_system_logs_level_category ON system_logs(level, category);

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_system_logs_level_date ON system_logs(level, "createdAt" DESC);

-- Vue pour les statistiques KYC (pour faciliter les requêtes)
CREATE OR REPLACE VIEW kyc_logs_stats AS
SELECT
  COUNT(*) FILTER (WHERE category = 'kyc_approved') as approved_count,
  COUNT(*) FILTER (WHERE category = 'kyc_rejected') as rejected_count,
  COUNT(*) FILTER (WHERE category = 'kyc_requested') as requested_count,
  COUNT(*) FILTER (WHERE category LIKE 'kyc_%') as total_kyc_actions,
  DATE("createdAt") as log_date
FROM system_logs
WHERE category LIKE 'kyc_%'
GROUP BY DATE("createdAt")
ORDER BY log_date DESC;

-- Vue pour les erreurs critiques récentes
CREATE OR REPLACE VIEW critical_errors_recent AS
SELECT *
FROM system_logs
WHERE level = 'critical'
  AND "createdAt" >= NOW() - INTERVAL '24 hours'
ORDER BY "createdAt" DESC;

-- Fonction pour nettoyer les anciens logs (garder 90 jours)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM system_logs
  WHERE "createdAt" < NOW() - INTERVAL '90 days'
    AND level NOT IN ('critical', 'error');
END;
$$ LANGUAGE plpgsql;

-- Commentaires pour documentation
COMMENT ON TABLE system_logs IS 'Logs système techniques uniquement - surveillance de la plateforme';
COMMENT ON COLUMN system_logs.level IS 'Niveau: info, warning, error, critical';
COMMENT ON COLUMN system_logs.category IS 'Catégorie de l''événement (auth, kyc, tontine, system, error)';
COMMENT ON COLUMN system_logs.metadata IS 'Métadonnées additionnelles en JSON';

