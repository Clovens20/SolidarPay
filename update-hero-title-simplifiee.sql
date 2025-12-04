-- Script pour mettre à jour le titre de la section Hero dans la base de données
-- Remplace "La Tontine Familiale Réinventée" par "La Tontine Simplifiée"

-- Mettre à jour le subtitle de la section Hero
UPDATE landing_page_content
SET subtitle = 'La Tontine Simplifiée'
WHERE section_name = 'hero'
  AND subtitle = 'La Tontine Familiale Réinventée';

-- Vérifier la mise à jour
SELECT section_name, title, subtitle, description
FROM landing_page_content
WHERE section_name = 'hero';

