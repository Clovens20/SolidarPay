-- Journal des rappels automatiques (cotisations / bénéficiaire) pour éviter les doublons
CREATE TABLE IF NOT EXISTS cotisation_reminder_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "cycleId" UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('contrib_24h', 'contrib_12h', 'contrib_due', 'ben_24h', 'ben_12h')),
  "sentAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("cycleId", "userId", kind)
);

CREATE INDEX IF NOT EXISTS idx_cotisation_reminder_cycle ON cotisation_reminder_sent("cycleId");

ALTER TABLE cotisation_reminder_sent ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cotisation_reminder_sent' AND policyname = 'mvp_all_cotisation_reminder_sent'
  ) THEN
    CREATE POLICY "mvp_all_cotisation_reminder_sent" ON cotisation_reminder_sent FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
