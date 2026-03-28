-- ====================================
-- SOLIDARPAY — initialisation complète (nouveau projet Supabase)
-- À exécuter une fois dans : Supabase → SQL Editor
-- Politiques RLS permissives (MVP) : à resserrer en production
-- ====================================

-- --- Utilisateurs (profil app ; lié à auth.users.id après inscription) ---
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  "fullName" TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'super_admin')),
  "kohoEmail" TEXT,
  country TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- --- Tontines ---
CREATE TABLE IF NOT EXISTS tontines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  "contributionAmount" DECIMAL(10,2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'biweekly', 'weekly')),
  "adminId" UUID REFERENCES users(id),
  "kohoReceiverEmail" TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'completed')),
  "paymentMode" TEXT DEFAULT 'direct' CHECK ("paymentMode" IN ('direct', 'via_admin')),
  currency TEXT DEFAULT 'CAD',
  "inviteCode" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE tontines ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CAD';
ALTER TABLE tontines ADD COLUMN IF NOT EXISTS "inviteCode" TEXT;
ALTER TABLE tontines ADD COLUMN IF NOT EXISTS "maxMembers" INTEGER;

CREATE TABLE IF NOT EXISTS tontine_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tontineId" UUID REFERENCES tontines(id) ON DELETE CASCADE,
  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  "rotationOrder" INTEGER NOT NULL,
  "hasReceived" BOOLEAN DEFAULT false,
  "joinedAt" TIMESTAMPTZ DEFAULT NOW(),
  "receiverPaymentStorage" TEXT,
  UNIQUE("tontineId", "userId"),
  UNIQUE("tontineId", "rotationOrder")
);

CREATE TABLE IF NOT EXISTS tontine_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tontineId" UUID NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "respondedAt" TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS tontine_join_requests_pending_unique
  ON tontine_join_requests ("tontineId", "userId")
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_tontine_join_requests_tontine ON tontine_join_requests ("tontineId");
CREATE INDEX IF NOT EXISTS idx_tontine_join_requests_user ON tontine_join_requests ("userId");

CREATE TABLE IF NOT EXISTS cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tontineId" UUID REFERENCES tontines(id) ON DELETE CASCADE,
  "cycleNumber" INTEGER NOT NULL,
  "beneficiaryId" UUID REFERENCES users(id),
  "startDate" TIMESTAMPTZ NOT NULL,
  "endDate" TIMESTAMPTZ NOT NULL,
  "totalExpected" DECIMAL(10,2) NOT NULL,
  "totalCollected" DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  "allPaymentsReceived" BOOLEAN DEFAULT false,
  "beneficiaryPaid" BOOLEAN DEFAULT false,
  "beneficiaryPaidAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "cycleId" UUID REFERENCES cycles(id) ON DELETE CASCADE,
  "userId" UUID REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'pending_validation', 'validated', 'rejected')),
  "declaredAt" TIMESTAMPTZ,
  "validatedAt" TIMESTAMPTZ,
  "validatedBy" UUID REFERENCES users(id),
  notes TEXT,
  "receivedByAdmin" BOOLEAN DEFAULT false,
  "receivedByAdminAt" TIMESTAMPTZ,
  "transferredToBeneficiary" BOOLEAN DEFAULT false,
  "transferredToBeneficiaryAt" TIMESTAMPTZ,
  "paymentMethod" TEXT,
  "paymentDetails" JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- --- KYC ---
CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  "documentType" TEXT NOT NULL CHECK ("documentType" IN ('identity', 'proof_of_address', 'selfie')),
  "documentUrl" TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'pending_review', 'approved', 'rejected', 'new_document_required', 'en_attente')
  ),
  "submittedAt" TIMESTAMPTZ DEFAULT NOW(),
  "reviewedAt" TIMESTAMPTZ,
  "reviewedBy" UUID REFERENCES users(id),
  "rejectionReason" TEXT,
  "autoScore" INTEGER,
  "analysisResults" JSONB DEFAULT '{}'::jsonb,
  "extractedInfo" JSONB DEFAULT '{}'::jsonb,
  "documentHash" TEXT,
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kyc_documents_hash ON kyc_documents("documentHash");
CREATE INDEX IF NOT EXISTS idx_kyc_documents_score ON kyc_documents("autoScore");
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user ON kyc_documents("userId");
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON kyc_documents(status);

-- --- Pays / méthodes de paiement (colonnes attendues par l’app : code, name, enabled) ---
CREATE TABLE IF NOT EXISTS payment_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  currency TEXT,
  "paymentMethods" JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE payment_countries ADD COLUMN IF NOT EXISTS currency TEXT;

-- --- Personnalisation (clé / valeur JSONB, ex. logo_url, site_name) ---
CREATE TABLE IF NOT EXISTS platform_customization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  "updatedBy" UUID REFERENCES users(id),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'critical')),
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "userId" UUID REFERENCES users(id),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  "startTime" TIMESTAMPTZ NOT NULL,
  "endTime" TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  "createdBy" UUID REFERENCES users(id),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  country TEXT NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  "paymentDetails" JSONB DEFAULT '{}'::jsonb,
  "isDefault" BOOLEAN DEFAULT false,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("userId", country, "paymentMethod")
);

CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user ON user_payment_methods("userId");
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_country ON user_payment_methods(country);

CREATE TABLE IF NOT EXISTS tontine_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tontineId" UUID NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
  "adminId" UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tontine_messages_tontine ON tontine_messages("tontineId");
CREATE INDEX IF NOT EXISTS idx_tontine_messages_admin ON tontine_messages("adminId");

CREATE TABLE IF NOT EXISTS tontine_message_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "messageId" UUID NOT NULL REFERENCES tontine_messages(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reply TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tontine_message_replies_message ON tontine_message_replies("messageId");
CREATE INDEX IF NOT EXISTS idx_tontine_message_replies_user ON tontine_message_replies("userId");

CREATE TABLE IF NOT EXISTS landing_page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_name TEXT UNIQUE NOT NULL,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  content JSONB,
  image_url TEXT,
  enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS footer_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_name TEXT UNIQUE NOT NULL,
  title TEXT,
  content JSONB,
  enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS legal_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  meta_description TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_landing_page_section ON landing_page_content(section_name);
CREATE INDEX IF NOT EXISTS idx_footer_section ON footer_content(section_name);
CREATE INDEX IF NOT EXISTS idx_legal_pages_slug ON legal_pages(page_slug);

CREATE INDEX IF NOT EXISTS idx_tontine_members_tontine ON tontine_members("tontineId");
CREATE INDEX IF NOT EXISTS idx_cycles_tontine ON cycles("tontineId");
CREATE INDEX IF NOT EXISTS idx_contributions_cycle ON contributions("cycleId");
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_user ON system_logs("userId");
CREATE INDEX IF NOT EXISTS idx_system_logs_level_category ON system_logs(level, category);
CREATE INDEX IF NOT EXISTS idx_system_logs_level_date ON system_logs(level, "createdAt" DESC);

-- --- Triggers updatedAt (camelCase) ---
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tontines_updated_at ON tontines;
CREATE TRIGGER update_tontines_updated_at
  BEFORE UPDATE ON tontines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_kyc_documents_updated_at ON kyc_documents;
CREATE TRIGGER update_kyc_documents_updated_at
  BEFORE UPDATE ON kyc_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_payment_countries_updated_at ON payment_countries;
CREATE TRIGGER update_payment_countries_updated_at
  BEFORE UPDATE ON payment_countries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_platform_customization_updated_at ON platform_customization;
CREATE TRIGGER update_platform_customization_updated_at
  BEFORE UPDATE ON platform_customization
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_maintenance_schedule_updated_at ON maintenance_schedule;
CREATE TRIGGER update_maintenance_schedule_updated_at
  BEFORE UPDATE ON maintenance_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_user_payment_methods_updated_at ON user_payment_methods;
CREATE TRIGGER update_user_payment_methods_updated_at
  BEFORE UPDATE ON user_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_tontine_messages_updated_at ON tontine_messages;
CREATE TRIGGER trigger_update_tontine_messages_updated_at
  BEFORE UPDATE ON tontine_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- --- Triggers updated_at (snake_case) ---
CREATE OR REPLACE FUNCTION update_updated_at_snake()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_landing_page_content_updated_at ON landing_page_content;
CREATE TRIGGER update_landing_page_content_updated_at
  BEFORE UPDATE ON landing_page_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_snake();

DROP TRIGGER IF EXISTS update_footer_content_updated_at ON footer_content;
CREATE TRIGGER update_footer_content_updated_at
  BEFORE UPDATE ON footer_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_snake();

DROP TRIGGER IF EXISTS update_legal_pages_updated_at ON legal_pages;
CREATE TRIGGER update_legal_pages_updated_at
  BEFORE UPDATE ON legal_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_snake();

-- --- Vues & fonctions utilitaires ---
CREATE OR REPLACE VIEW searchable_members AS
SELECT
  u.id,
  u.email,
  u."fullName",
  u.phone,
  u.country,
  u.role,
  kd.status AS "kycStatus",
  COALESCE(kd."autoScore", 0) AS "kycScore"
FROM users u
LEFT JOIN LATERAL (
  SELECT status, "autoScore"
  FROM kyc_documents
  WHERE "userId" = u.id
  ORDER BY "createdAt" DESC
  LIMIT 1
) kd ON true;

CREATE OR REPLACE VIEW kyc_manual_reviews AS
SELECT *
FROM kyc_documents
WHERE status = 'pending_review'
  AND "autoScore" >= 50
  AND "autoScore" < 85
ORDER BY "submittedAt" ASC;

CREATE OR REPLACE VIEW kyc_auto_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'approved' AND "autoScore" >= 85) AS auto_approved,
  COUNT(*) FILTER (WHERE status = 'rejected' AND "autoScore" < 50) AS auto_rejected,
  COUNT(*) FILTER (WHERE status = 'pending_review' AND "autoScore" >= 50 AND "autoScore" < 85) AS manual_review,
  COUNT(*) AS total,
  AVG("autoScore") FILTER (WHERE "autoScore" IS NOT NULL) AS avg_score,
  DATE("submittedAt") AS date
FROM kyc_documents
GROUP BY DATE("submittedAt")
ORDER BY date DESC;

CREATE OR REPLACE VIEW kyc_logs_stats AS
SELECT
  COUNT(*) FILTER (WHERE category = 'kyc_approved') AS approved_count,
  COUNT(*) FILTER (WHERE category = 'kyc_rejected') AS rejected_count,
  COUNT(*) FILTER (WHERE category = 'kyc_requested') AS requested_count,
  COUNT(*) FILTER (WHERE category LIKE 'kyc_%') AS total_kyc_actions,
  DATE("createdAt") AS log_date
FROM system_logs
WHERE category LIKE 'kyc_%'
GROUP BY DATE("createdAt")
ORDER BY log_date DESC;

CREATE OR REPLACE VIEW critical_errors_recent AS
SELECT *
FROM system_logs
WHERE level = 'critical'
  AND "createdAt" >= NOW() - INTERVAL '24 hours'
ORDER BY "createdAt" DESC;

CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM system_logs
  WHERE "createdAt" < NOW() - INTERVAL '90 days'
    AND level NOT IN ('critical', 'error');
END;
$$ LANGUAGE plpgsql;

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

CREATE OR REPLACE VIEW cycle_payments_summary AS
SELECT
  c.id AS "cycleId",
  c."tontineId",
  c."cycleNumber",
  c."beneficiaryId",
  c."totalExpected",
  c."totalCollected",
  c.status AS "cycleStatus",
  c."allPaymentsReceived",
  c."beneficiaryPaid",
  COUNT(DISTINCT contrib.id) AS "totalContributions",
  COUNT(DISTINCT CASE WHEN contrib.status = 'validated' THEN contrib.id END) AS "validatedCount",
  COUNT(DISTINCT CASE WHEN contrib."receivedByAdmin" = true THEN contrib.id END) AS "receivedByAdminCount",
  COUNT(DISTINCT CASE WHEN contrib."transferredToBeneficiary" = true THEN contrib.id END) AS "transferredCount"
FROM cycles c
LEFT JOIN contributions contrib ON contrib."cycleId" = c.id
GROUP BY c.id, c."tontineId", c."cycleNumber", c."beneficiaryId", c."totalExpected",
  c."totalCollected", c.status, c."allPaymentsReceived", c."beneficiaryPaid";

-- --- RLS : accès large (aligné sur le MVP du dépôt) ---
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontines ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontine_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_customization ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontine_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontine_message_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontine_join_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'mvp_all_users') THEN
    CREATE POLICY "mvp_all_users" ON users FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tontines' AND policyname = 'mvp_all_tontines') THEN
    CREATE POLICY "mvp_all_tontines" ON tontines FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tontine_members' AND policyname = 'mvp_all_tontine_members') THEN
    CREATE POLICY "mvp_all_tontine_members" ON tontine_members FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tontine_join_requests' AND policyname = 'mvp_all_tontine_join_requests') THEN
    CREATE POLICY "mvp_all_tontine_join_requests" ON tontine_join_requests FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cycles' AND policyname = 'mvp_all_cycles') THEN
    CREATE POLICY "mvp_all_cycles" ON cycles FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contributions' AND policyname = 'mvp_all_contributions') THEN
    CREATE POLICY "mvp_all_contributions" ON contributions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'kyc_documents' AND policyname = 'mvp_all_kyc_documents') THEN
    CREATE POLICY "mvp_all_kyc_documents" ON kyc_documents FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_countries' AND policyname = 'mvp_all_payment_countries') THEN
    CREATE POLICY "mvp_all_payment_countries" ON payment_countries FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'platform_customization' AND policyname = 'mvp_all_platform_customization') THEN
    CREATE POLICY "mvp_all_platform_customization" ON platform_customization FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'system_logs' AND policyname = 'mvp_all_system_logs') THEN
    CREATE POLICY "mvp_all_system_logs" ON system_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'maintenance_schedule' AND policyname = 'mvp_all_maintenance') THEN
    CREATE POLICY "mvp_all_maintenance" ON maintenance_schedule FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_payment_methods' AND policyname = 'mvp_all_user_payment_methods') THEN
    CREATE POLICY "mvp_all_user_payment_methods" ON user_payment_methods FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tontine_messages' AND policyname = 'mvp_all_tontine_messages') THEN
    CREATE POLICY "mvp_all_tontine_messages" ON tontine_messages FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tontine_message_replies' AND policyname = 'mvp_all_tontine_message_replies') THEN
    CREATE POLICY "mvp_all_tontine_message_replies" ON tontine_message_replies FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'landing_page_content' AND policyname = 'mvp_all_landing') THEN
    CREATE POLICY "mvp_all_landing" ON landing_page_content FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'footer_content' AND policyname = 'mvp_all_footer') THEN
    CREATE POLICY "mvp_all_footer" ON footer_content FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'legal_pages' AND policyname = 'mvp_all_legal_pages') THEN
    CREATE POLICY "mvp_all_legal_pages" ON legal_pages FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- --- Données initiales (pays, personnalisation, contenu) ---
INSERT INTO payment_countries (code, name, currency, "paymentMethods") VALUES
  ('CA', 'Canada', 'CAD', '["interac", "credit_card", "bank_transfer"]'::jsonb),
  ('FR', 'France', 'EUR', '["bank_transfer", "credit_card"]'::jsonb),
  ('BE', 'Belgique', 'EUR', '["bank_transfer", "credit_card"]'::jsonb),
  ('CH', 'Suisse', 'CHF', '["bank_transfer", "credit_card"]'::jsonb),
  ('CL', 'Chili', 'CLP', '["cuenta_rut_transferencia"]'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO platform_customization (key, value, description) VALUES
  ('primary_color', '"#0891B2"'::jsonb, 'Couleur principale'),
  ('secondary_color', '"#0E7490"'::jsonb, 'Couleur secondaire'),
  ('logo_url', 'null'::jsonb, 'URL du logo'),
  ('maintenance_mode', 'false'::jsonb, 'Mode maintenance')
ON CONFLICT (key) DO NOTHING;

INSERT INTO landing_page_content (section_name, title, subtitle, description, enabled, display_order)
VALUES
  ('hero', 'SolidarPay', 'La Tontine Simplifiée', 'Simplifiez la gestion de vos tontines grâce à la technologie', true, 1),
  ('what_is', 'Qu''est-ce que SolidarPay ?', NULL, 'SolidarPay est une plateforme digitale qui modernise les tontines traditionnelles.', true, 2),
  ('features', 'Pourquoi SolidarPay ?', NULL, NULL, true, 3),
  ('how_it_works', 'Comment ça marche ?', NULL, NULL, true, 4),
  ('target_audience', 'Pour qui est SolidarPay ?', NULL, NULL, true, 5),
  ('testimonials', 'Ils nous font confiance', NULL, NULL, true, 6),
  ('cta', 'Prêt à moderniser votre tontine ?', 'Rejoignez SolidarPay dès aujourd''hui', NULL, true, 7)
ON CONFLICT (section_name) DO NOTHING;

INSERT INTO footer_content (section_name, title, content, enabled, display_order)
VALUES
  ('brand', 'SolidarPay', '{"description": "La plateforme digitale qui modernise les tontines familiales africaines"}', true, 1),
  ('navigation', 'Navigation', '{"links": [{"label": "Comment ça marche", "href": "/#how-it-works"}, {"label": "Inscription", "href": "/register"}, {"label": "Connexion", "href": "/login"}]}', true, 2),
  ('legal', 'Légal', '{"links": [{"label": "À propos", "href": "/about"}, {"label": "Contact", "href": "/contact"}, {"label": "CGU", "href": "/terms"}, {"label": "Confidentialité", "href": "/privacy"}]}', true, 3),
  ('contact', 'Contact', '{"email": "support@solidarpay.com", "phone": "+1 (555) 123-4567"}', true, 4),
  ('social', 'Réseaux sociaux', '{"links": [{"platform": "facebook", "url": "#"}, {"platform": "twitter", "url": "#"}, {"platform": "instagram", "url": "#"}, {"platform": "linkedin", "url": "#"}]}', true, 5)
ON CONFLICT (section_name) DO NOTHING;

INSERT INTO legal_pages (page_slug, title, content, meta_description, enabled)
VALUES
  ('about', 'À propos de SolidarPay', '<h1>À propos de SolidarPay</h1><p>Contenu à compléter...</p>', 'Découvrez SolidarPay', true),
  ('contact', 'Contactez-nous', '<h1>Contactez-nous</h1><p>Contenu à compléter...</p>', 'Contact SolidarPay', true),
  ('terms', 'Conditions Générales d''Utilisation', '<h1>CGU</h1><p>Contenu à compléter...</p>', 'CGU SolidarPay', true),
  ('privacy', 'Politique de Confidentialité', '<h1>Politique de Confidentialité</h1><p>Contenu à compléter...</p>', 'Confidentialité SolidarPay', true)
ON CONFLICT (page_slug) DO NOTHING;

-- Nom de tontine unique (tous administrateurs), normalisé trim + minuscules
CREATE UNIQUE INDEX IF NOT EXISTS tontines_name_lower_trim_unique
ON public.tontines ((lower(trim(name))));

CREATE UNIQUE INDEX IF NOT EXISTS tontines_invite_code_unique
  ON public.tontines ("inviteCode")
  WHERE "inviteCode" IS NOT NULL;

DO $$
BEGIN
  RAISE NOTICE 'SolidarPay : initialisation SQL terminée (tables, vues, RLS MVP, seeds).';
END $$;