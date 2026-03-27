-- Unicité globale du nom de tontine (après trim + insensible à la casse)
-- À exécuter sur Supabase SQL Editor si la base existe déjà.
-- En cas d’erreur « duplicate key », supprimez ou renommez les doublons existants puis réessayez.

CREATE UNIQUE INDEX IF NOT EXISTS tontines_name_lower_trim_unique
ON public.tontines ((lower(trim(name))));
