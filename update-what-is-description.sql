-- Mise à jour de la description de la section "Qu'est-ce que SolidarPay ?"
-- Remplace l'ancien texte par le nouveau

UPDATE landing_page_content
SET 
  description = 'SolidarPay est une plateforme digitale qui modernise les tontines traditionnelles. Nous combinons l''esprit de solidarité avec la technologie moderne pour vous offrir une expérience simple, sécurisée et transparente.',
  updated_at = NOW()
WHERE section_name = 'what_is';

