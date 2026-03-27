-- Réponses membres/admin aux messages de tontine (fil de discussion)
-- À exécuter sur une base Supabase déjà existante.

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

ALTER TABLE tontine_message_replies ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tontine_message_replies'
      AND policyname = 'mvp_all_tontine_message_replies'
  ) THEN
    CREATE POLICY "mvp_all_tontine_message_replies"
      ON tontine_message_replies
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

COMMENT ON TABLE tontine_message_replies IS 'Réponses postées sous les messages admin d’une tontine.';
