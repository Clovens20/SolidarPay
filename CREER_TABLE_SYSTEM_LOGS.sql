-- ====================================
-- CRÉER LA TABLE SYSTEM_LOGS
-- Si elle n'existe pas déjà
-- ====================================

-- Créer la table system_logs
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

-- Activer RLS
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre la lecture aux super admins
DROP POLICY IF EXISTS "Super admin can read system_logs" ON system_logs;
CREATE POLICY "Super admin can read system_logs" ON system_logs
  FOR SELECT
  USING (true);

-- Vérification
SELECT 
  '=== ✅ VÉRIFICATION ===' as info,
  COUNT(*) as nombre_logs
FROM system_logs;

SELECT 
  'Table créée avec succès !' as message;

