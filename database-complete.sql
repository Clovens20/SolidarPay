-- ====================================
-- SOLIDARPAY - SCRIPT SQL COMPLET
-- Exécutez ce script dans Supabase SQL Editor
-- Contient tous les scripts dans le bon ordre
-- ====================================

-- ====================================
-- 1. SCHÉMA DE BASE
-- ====================================

-- Table des utilisateurs (membres de la tontine)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  "fullName" TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  "kohoEmail" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des tontines (groupes)
CREATE TABLE IF NOT EXISTS tontines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  "contributionAmount" DECIMAL(10,2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'biweekly', 'weekly')),
  "adminId" UUID REFERENCES users(id),
  "kohoReceiverEmail" TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'completed')),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des membres d'une tontine avec ordre de rotation
CREATE TABLE IF NOT EXISTS tontine_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tontineId" UUID REFERENCES tontines(id) ON DELETE CASCADE,
  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  "rotationOrder" INTEGER NOT NULL,
  "hasReceived" BOOLEAN DEFAULT false,
  "joinedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("tontineId", "userId"),
  UNIQUE("tontineId", "rotationOrder")
);

-- Table des cycles
CREATE TABLE IF NOT EXISTS cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tontineId" UUID REFERENCES tontines(id) ON DELETE CASCADE,
  "cycleNumber" INTEGER NOT NULL,
  "beneficiaryId" UUID REFERENCES users(id),
  "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "totalExpected" DECIMAL(10,2) NOT NULL,
  "totalCollected" DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des contributions (cotisations)
CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "cycleId" UUID REFERENCES cycles(id) ON DELETE CASCADE,
  "userId" UUID REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'pending_validation', 'validated', 'rejected')),
  "declaredAt" TIMESTAMP WITH TIME ZONE,
  "validatedAt" TIMESTAMP WITH TIME ZONE,
  "validatedBy" UUID REFERENCES users(id),
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontines ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontine_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Policies (public access pour simplifier le MVP)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow public read users') THEN
    CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow public insert users') THEN
    CREATE POLICY "Allow public insert users" ON users FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow public update users') THEN
    CREATE POLICY "Allow public update users" ON users FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tontines' AND policyname = 'Allow all on tontines') THEN
    CREATE POLICY "Allow all on tontines" ON tontines FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tontine_members' AND policyname = 'Allow all on tontine_members') THEN
    CREATE POLICY "Allow all on tontine_members" ON tontine_members FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cycles' AND policyname = 'Allow all on cycles') THEN
    CREATE POLICY "Allow all on cycles" ON cycles FOR ALL USING (true);
  END IF;
END $$;

-- ====================================
-- 2. SUPER ADMIN
-- ====================================

-- Ajouter le rôle super_admin à users
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'member', 'super_admin'));

-- Table KYC Documents
CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  "documentType" TEXT NOT NULL CHECK ("documentType" IN ('identity', 'proof_of_address', 'selfie')),
  "documentUrl" TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'pending_review', 'approved', 'rejected', 'new_document_required')),
  "submittedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "reviewedAt" TIMESTAMP WITH TIME ZONE,
  "reviewedBy" UUID REFERENCES users(id),
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Payment Countries
CREATE TABLE IF NOT EXISTS payment_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "countryCode" TEXT UNIQUE NOT NULL,
  "countryName" TEXT NOT NULL,
  "paymentMethods" JSONB DEFAULT '[]'::jsonb,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Platform Customization
CREATE TABLE IF NOT EXISTS platform_customization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "primaryColor" TEXT DEFAULT '#0891B2',
  "secondaryColor" TEXT DEFAULT '#0E7490',
  "logoUrl" TEXT,
  "faviconUrl" TEXT,
  "customCss" TEXT,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedBy" UUID REFERENCES users(id)
);

-- Table System Logs
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

-- Table Maintenance Schedule
CREATE TABLE IF NOT EXISTS maintenance_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "startTime" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endTime" TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  "isActive" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "createdBy" UUID REFERENCES users(id)
);

-- ====================================
-- 3. ADMIN TONTINE UPDATES
-- ====================================

-- Ajouter le champ country à users
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;

-- Note: La vue searchable_members sera créée à la fin après toutes les colonnes KYC

-- ====================================
-- 4. KYC UPDATES
-- ====================================

-- Ajouter les champs pour l'analyse KYC
ALTER TABLE kyc_documents 
ADD COLUMN IF NOT EXISTS "autoScore" INTEGER,
ADD COLUMN IF NOT EXISTS "analysisResults" JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "extractedInfo" JSONB DEFAULT '{}'::jsonb;

-- ====================================
-- 5. KYC AUTOMATIC UPDATES
-- ====================================

-- Ajouter les champs pour le système automatique
ALTER TABLE kyc_documents 
ADD COLUMN IF NOT EXISTS "documentHash" TEXT,
ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}'::jsonb;

-- Index pour les recherches par hash
CREATE INDEX IF NOT EXISTS idx_kyc_documents_hash ON kyc_documents("documentHash");
CREATE INDEX IF NOT EXISTS idx_kyc_documents_score ON kyc_documents("autoScore");

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

-- Fonction pour limiter les tentatives
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

-- ====================================
-- 6. SYSTEM LOGS UPDATES
-- ====================================

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_user ON system_logs("userId");
CREATE INDEX IF NOT EXISTS idx_system_logs_level_category ON system_logs(level, category);
CREATE INDEX IF NOT EXISTS idx_system_logs_level_date ON system_logs(level, "createdAt" DESC);

-- Vue pour les statistiques KYC
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

-- Fonction pour nettoyer les anciens logs
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM system_logs
  WHERE "createdAt" < NOW() - INTERVAL '90 days'
    AND level NOT IN ('critical', 'error');
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- FIN DU SCRIPT
-- ====================================

-- Recréer la vue searchable_members maintenant que toutes les colonnes KYC existent
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

-- Message de confirmation
DO $$ 
BEGIN
  RAISE NOTICE 'Script SQL complet exécuté avec succès!';
  RAISE NOTICE 'Toutes les tables, vues et fonctions ont été créées.';
END $$;

