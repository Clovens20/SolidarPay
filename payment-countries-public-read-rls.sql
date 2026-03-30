-- Lecture publique des pays activés (inscription, profils membres, etc.)
-- À exécuter dans Supabase → SQL si la table n’est lisible que par super_admin.
-- Les politiques RLS pour SELECT sont combinées en OU : cette politique autorise
-- tout le monde (y compris anonyme) à lire les lignes avec enabled = true.

DROP POLICY IF EXISTS "public_read_enabled_payment_countries" ON payment_countries;

CREATE POLICY "public_read_enabled_payment_countries" ON payment_countries
  FOR SELECT
  USING (COALESCE(enabled, true) = true);
