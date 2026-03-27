-- Demandes d’adhésion à une tontine (membre → admin accepte / refuse)
-- À exécuter sur une base Supabase déjà initialisée.

ALTER TABLE tontines ADD COLUMN IF NOT EXISTS "inviteCode" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS tontines_invite_code_unique
  ON tontines ("inviteCode")
  WHERE "inviteCode" IS NOT NULL;

CREATE TABLE IF NOT EXISTS tontine_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tontineId" UUID NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "respondedAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tontine_join_requests_tontine ON tontine_join_requests ("tontineId");
CREATE INDEX IF NOT EXISTS idx_tontine_join_requests_user ON tontine_join_requests ("userId");

CREATE UNIQUE INDEX IF NOT EXISTS tontine_join_requests_pending_unique
  ON tontine_join_requests ("tontineId", "userId")
  WHERE status = 'pending';

-- Codes d’invitation pour les tontines existantes (sans code)
UPDATE tontines t
SET "inviteCode" = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
WHERE t."inviteCode" IS NULL;

ALTER TABLE tontine_join_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tontine_join_requests' AND policyname = 'mvp_all_tontine_join_requests'
  ) THEN
    CREATE POLICY "mvp_all_tontine_join_requests" ON tontine_join_requests FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

COMMENT ON TABLE tontine_join_requests IS 'Demandes des membres pour rejoindre une tontine (validation par l’admin).';
COMMENT ON COLUMN tontines."inviteCode" IS 'Code court unique pour inviter des membres sans lister les tontines.';
