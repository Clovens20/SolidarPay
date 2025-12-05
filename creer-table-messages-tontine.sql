-- ====================================
-- TABLE POUR LES MESSAGES DE L'ADMINISTRATEUR AUX MEMBRES
-- ====================================

-- Table des messages de l'administrateur aux membres d'une tontine
CREATE TABLE IF NOT EXISTS tontine_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tontineId" UUID REFERENCES tontines(id) ON DELETE CASCADE NOT NULL,
  "adminId" UUID REFERENCES users(id) NOT NULL,
  message TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_tontine_messages_tontine ON tontine_messages("tontineId");
CREATE INDEX IF NOT EXISTS idx_tontine_messages_admin ON tontine_messages("adminId");
CREATE INDEX IF NOT EXISTS idx_tontine_messages_created ON tontine_messages("createdAt" DESC);

-- Enable Row Level Security
ALTER TABLE tontine_messages ENABLE ROW LEVEL SECURITY;

-- Policies pour la sécurité
-- Les admins peuvent créer, lire, modifier et supprimer leurs propres messages
CREATE POLICY "Admins can manage their tontine messages" ON tontine_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tontines
      WHERE tontines.id = tontine_messages."tontineId"
      AND tontines."adminId" = auth.uid()
    )
  );

-- Les membres peuvent lire les messages de leurs tontines
CREATE POLICY "Members can read messages from their tontines" ON tontine_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tontine_members
      WHERE tontine_members."tontineId" = tontine_messages."tontineId"
      AND tontine_members."userId" = auth.uid()
    )
  );

-- Trigger pour mettre à jour updatedAt
CREATE OR REPLACE FUNCTION update_tontine_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tontine_messages_updated_at
  BEFORE UPDATE ON tontine_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_tontine_messages_updated_at();

