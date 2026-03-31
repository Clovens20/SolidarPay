-- =============================================================================
-- SolidarPay — Maintenance PostgREST / diagnostic (à exécuter dans Supabase SQL Editor)
-- =============================================================================
-- Quand l’app renvoie PGRST002 ou « Could not query the database for the schema cache » :
--
-- 1) Vérifier que le projet n’est pas en pause (Dashboard → Settings).
-- 2) Exécuter la ligne ci-dessous pour forcer le rechargement du cache schéma PostgREST.
-- 3) Consulter https://status.supabase.com si l’erreur affecte plusieurs projets.
-- 4) Si ça persiste : ticket support Supabase ou upgrade plan / charge DB.
--
-- Rechargement du schéma (sans redémarrage) :
NOTIFY pgrst, 'reload schema';

-- Optionnel (PostgreSQL 14+) — utilisation de la file de notifications :
-- SELECT pg_notification_queue_usage();
