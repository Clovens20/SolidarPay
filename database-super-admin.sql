-- ====================================
-- SOLIDARPAY SUPER ADMIN EXTENSIONS
-- Tables pour la gestion technique
-- ====================================

-- Table pour les documents KYC (Know Your Customer)
CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  "documentType" TEXT NOT NULL CHECK ("documentType" IN ('identity', 'proof_of_address', 'selfie')),
  "documentUrl" TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  "reviewedBy" UUID REFERENCES users(id),
  "reviewedAt" TIMESTAMP WITH TIME ZONE,
  "rejectionReason" TEXT,
  "submittedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les pays et méthodes de paiement
CREATE TABLE IF NOT EXISTS payment_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- ISO country code (CA, FR, BE, etc.)
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  "paymentMethods" JSONB DEFAULT '[]'::jsonb, -- Array of available payment methods
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour la personnalisation de la plateforme
CREATE TABLE IF NOT EXISTS platform_customization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  "updatedBy" UUID REFERENCES users(id),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les logs système
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

-- Table pour la maintenance
CREATE TABLE IF NOT EXISTS maintenance_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  "startTime" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endTime" TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  "createdBy" UUID REFERENCES users(id),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajout du rôle super_admin à la table users
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'member', 'super_admin'));

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user ON kyc_documents("userId");
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON kyc_documents(status);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs("createdAt" DESC);

-- RLS Policies pour super admin
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_customization ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedule ENABLE ROW LEVEL SECURITY;

-- KYC Documents: Super admin peut tout voir/modifier
CREATE POLICY "Super admin all access on kyc_documents" ON kyc_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- Payment Countries: Super admin peut tout gérer
CREATE POLICY "Super admin all access on payment_countries" ON payment_countries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- Platform Customization: Super admin peut tout gérer
CREATE POLICY "Super admin all access on platform_customization" ON platform_customization
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- System Logs: Super admin peut tout voir
CREATE POLICY "Super admin read access on system_logs" ON system_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- Maintenance Schedule: Super admin peut tout gérer
CREATE POLICY "Super admin all access on maintenance_schedule" ON maintenance_schedule
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- Trigger pour mettre à jour updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kyc_documents_updated_at
  BEFORE UPDATE ON kyc_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_countries_updated_at
  BEFORE UPDATE ON payment_countries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_customization_updated_at
  BEFORE UPDATE ON platform_customization
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_schedule_updated_at
  BEFORE UPDATE ON maintenance_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default payment countries
INSERT INTO payment_countries (code, name, "paymentMethods") VALUES
('CA', 'Canada', '["interac", "credit_card", "bank_transfer"]'::jsonb),
('FR', 'France', '["bank_transfer", "credit_card"]'::jsonb),
('BE', 'Belgique', '["bank_transfer", "credit_card"]'::jsonb),
('CH', 'Suisse', '["bank_transfer", "credit_card"]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- Insert default platform customization
INSERT INTO platform_customization (key, value, description) VALUES
('primary_color', '"#0891B2"'::jsonb, 'Couleur principale de la plateforme'),
('secondary_color', '"#0E7490"'::jsonb, 'Couleur secondaire de la plateforme'),
('logo_url', 'null'::jsonb, 'URL du logo de la plateforme'),
('maintenance_mode', 'false'::jsonb, 'Mode maintenance activé/désactivé')
ON CONFLICT (key) DO NOTHING;

