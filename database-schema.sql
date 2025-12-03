-- ====================================
-- SOLIDARPAY DATABASE SCHEMA
-- Supabase PostgreSQL Database
-- ====================================

-- Table des utilisateurs (membres de la tontine)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  "fullName" TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  "kohoEmail" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des tontines (groupes)
CREATE TABLE tontines (
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
CREATE TABLE tontine_members (
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
CREATE TABLE cycles (
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
CREATE TABLE contributions (
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

-- ====================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontines ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontine_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Policies (public access pour simplifier le MVP)
CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON users FOR UPDATE USING (true);

CREATE POLICY "Allow all on tontines" ON tontines FOR ALL USING (true);
CREATE POLICY "Allow all on tontine_members" ON tontine_members FOR ALL USING (true);
CREATE POLICY "Allow all on cycles" ON cycles FOR ALL USING (true);
CREATE POLICY "Allow all on contributions" ON contributions FOR ALL USING (true);

-- ====================================
-- INDEXES FOR PERFORMANCE
-- ====================================

CREATE INDEX idx_tontine_members_tontine ON tontine_members("tontineId");
CREATE INDEX idx_cycles_tontine ON cycles("tontineId");
CREATE INDEX idx_contributions_cycle ON contributions("cycleId");
CREATE INDEX idx_contributions_user ON contributions("userId");

-- ====================================
-- TRIGGERS
-- ====================================

-- Fonction pour mettre à jour updatedAt
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour auto-update updatedAt
DROP TRIGGER IF EXISTS update_tontines_updated_at ON tontines;
CREATE TRIGGER update_tontines_updated_at
  BEFORE UPDATE ON tontines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ====================================
-- SAMPLE DATA (Optional - for testing)
-- ====================================

-- Uncomment below to insert sample data for testing

/*
-- Insert sample admin user
INSERT INTO users (id, email, "fullName", role) VALUES 
('11111111-1111-1111-1111-111111111111', 'admin@solidarpay.com', 'Admin SolidarPay', 'admin');

-- Insert sample members
INSERT INTO users (id, email, "fullName", phone) VALUES 
('22222222-2222-2222-2222-222222222222', 'jean@example.com', 'Jean Dupont', '+1 514 123 4567'),
('33333333-3333-3333-3333-333333333333', 'marie@example.com', 'Marie Martin', '+1 514 234 5678'),
('44444444-4444-4444-4444-444444444444', 'paul@example.com', 'Paul Bernard', '+1 514 345 6789');

-- Insert sample tontine
INSERT INTO tontines (id, name, "contributionAmount", frequency, "adminId", "kohoReceiverEmail") VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tontine Famille Dupont', 100.00, 'monthly', '11111111-1111-1111-1111-111111111111', 'tontine@koho.ca');

-- Insert tontine members
INSERT INTO tontine_members ("tontineId", "userId", "rotationOrder") VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 1),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 2),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 3);
*/
