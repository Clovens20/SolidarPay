-- Mise à jour de la description de la section Hero
-- Remplace l'ancienne phrase par la nouvelle

UPDATE landing_page_content
SET 
  description = 'Simplifiez la gestion de vos tontines grâce à la technologie',
  updated_at = NOW()
WHERE section_name = 'hero'
  AND description = 'Gérez vos tontines familiales en toute simplicité, sécurité et transparence';

-- Si la condition exacte ne correspond pas, mettre à jour quand même si section_name = 'hero'
UPDATE landing_page_content
SET 
  description = 'Simplifiez la gestion de vos tontines grâce à la technologie',
  updated_at = NOW()
WHERE section_name = 'hero';

