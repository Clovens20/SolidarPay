-- ====================================
-- SYSTÈME DE PAIEMENT - DEUX MODES
-- Ajout du choix de mode de paiement pour les admin-tontines
-- ====================================

-- 1. Ajouter le champ paymentMode dans la table tontines
ALTER TABLE tontines 
ADD COLUMN IF NOT EXISTS "paymentMode" TEXT DEFAULT 'direct' 
CHECK ("paymentMode" IN ('direct', 'via_admin'));

COMMENT ON COLUMN tontines."paymentMode" IS 
'Mode de paiement: direct (membres paient directement le bénéficiaire) ou via_admin (membres paient l''admin, admin paie ensuite)';

-- 2. Créer la table pour stocker les méthodes de paiement des membres
CREATE TABLE IF NOT EXISTS user_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  country TEXT NOT NULL, -- Code pays (CA, FR, US, etc.)
  "paymentMethod" TEXT NOT NULL, -- interac, credit_card, bank_transfer, paypal, zelle, cash_app, mobile_money
  "paymentDetails" JSONB DEFAULT '{}'::jsonb, -- Détails spécifiques (email, numéro de compte, etc.)
  "isDefault" BOOLEAN DEFAULT false, -- Méthode de paiement par défaut pour ce pays
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("userId", country, "paymentMethod")
);

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user ON user_payment_methods("userId");
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_country ON user_payment_methods(country);
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_active ON user_payment_methods("isActive");

-- Commentaire pour documentation
COMMENT ON TABLE user_payment_methods IS 
'Stocke les méthodes de paiement configurées par chaque membre selon leur pays';

-- 3. Ajouter un champ pour suivre les paiements reçus par l'admin (mode via_admin)
ALTER TABLE contributions 
ADD COLUMN IF NOT EXISTS "receivedByAdmin" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "receivedByAdminAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "transferredToBeneficiary" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "transferredToBeneficiaryAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT, -- Méthode utilisée pour payer
ADD COLUMN IF NOT EXISTS "paymentDetails" JSONB DEFAULT '{}'::jsonb; -- Détails du paiement

COMMENT ON COLUMN contributions."receivedByAdmin" IS 
'Indique si le paiement a été reçu par l''admin (mode via_admin)';
COMMENT ON COLUMN contributions."transferredToBeneficiary" IS 
'Indique si l''admin a transféré le paiement au bénéficiaire';

-- 4. Ajouter un champ dans cycles pour suivre le paiement final au bénéficiaire (mode via_admin)
ALTER TABLE cycles
ADD COLUMN IF NOT EXISTS "allPaymentsReceived" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "beneficiaryPaid" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "beneficiaryPaidAt" TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN cycles."allPaymentsReceived" IS 
'Indique si tous les paiements des membres ont été reçus par l''admin (mode via_admin)';
COMMENT ON COLUMN cycles."beneficiaryPaid" IS 
'Indique si l''admin a payé le bénéficiaire (mode via_admin)';

-- 5. Créer une vue pour faciliter la gestion des paiements
CREATE OR REPLACE VIEW cycle_payments_summary AS
SELECT 
  c.id as "cycleId",
  c."tontineId",
  c."cycleNumber",
  c."beneficiaryId",
  c."totalExpected",
  c."totalCollected",
  c.status as "cycleStatus",
  c."allPaymentsReceived",
  c."beneficiaryPaid",
  COUNT(DISTINCT contrib.id) as "totalContributions",
  COUNT(DISTINCT CASE WHEN contrib.status = 'validated' THEN contrib.id END) as "validatedCount",
  COUNT(DISTINCT CASE WHEN contrib."receivedByAdmin" = true THEN contrib.id END) as "receivedByAdminCount",
  COUNT(DISTINCT CASE WHEN contrib."transferredToBeneficiary" = true THEN contrib.id END) as "transferredCount"
FROM cycles c
LEFT JOIN contributions contrib ON contrib."cycleId" = c.id
GROUP BY c.id, c."tontineId", c."cycleNumber", c."beneficiaryId", c."totalExpected", 
         c."totalCollected", c.status, c."allPaymentsReceived", c."beneficiaryPaid";

-- Vérification
SELECT 
  '✅ Système de paiement deux modes installé' as status,
  COUNT(*) as "tontines_count"
FROM tontines;

