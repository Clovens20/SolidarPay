-- ====================================
-- MISE À JOUR DU FOOTER POUR N'AVOIR QUE TIKTOK
-- ====================================

-- Mettre à jour la section réseaux sociaux pour n'avoir que TikTok
UPDATE footer_content
SET content = '{"links": [{"platform": "tiktok", "url": "#"}]}'
WHERE section_name = 'social';

-- Si la section n'existe pas, la créer
INSERT INTO footer_content (section_name, title, content, enabled, display_order)
VALUES 
  ('social', 'Réseaux sociaux', '{"links": [{"platform": "tiktok", "url": "#"}]}', true, 5)
ON CONFLICT (section_name) DO UPDATE
SET content = '{"links": [{"platform": "tiktok", "url": "#"}]}';

SELECT '✅ Footer mis à jour avec TikTok uniquement!' as status;

