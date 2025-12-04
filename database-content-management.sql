-- ====================================
-- GESTION DE CONTENU - LANDING PAGE, FOOTER, PAGES LÉGALES
-- ====================================

-- Table pour stocker le contenu de la landing page par section
CREATE TABLE IF NOT EXISTS landing_page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_name TEXT UNIQUE NOT NULL, -- 'hero', 'what_is', 'features', 'how_it_works', 'target_audience', 'testimonials', 'cta'
  title TEXT,
  subtitle TEXT,
  description TEXT,
  content JSONB, -- Pour stocker du contenu flexible (listes, objets, etc.)
  image_url TEXT,
  enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour stocker le contenu du footer
CREATE TABLE IF NOT EXISTS footer_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_name TEXT UNIQUE NOT NULL, -- 'brand', 'navigation', 'legal', 'contact', 'social'
  title TEXT,
  content JSONB, -- Pour stocker les liens, contacts, réseaux sociaux, etc.
  enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour stocker les pages légales
CREATE TABLE IF NOT EXISTS legal_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT UNIQUE NOT NULL, -- 'about', 'contact', 'terms', 'privacy'
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Contenu HTML ou markdown
  meta_description TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_landing_page_section ON landing_page_content(section_name);
CREATE INDEX IF NOT EXISTS idx_landing_page_enabled ON landing_page_content(enabled);
CREATE INDEX IF NOT EXISTS idx_footer_section ON footer_content(section_name);
CREATE INDEX IF NOT EXISTS idx_footer_enabled ON footer_content(enabled);
CREATE INDEX IF NOT EXISTS idx_legal_pages_slug ON legal_pages(page_slug);
CREATE INDEX IF NOT EXISTS idx_legal_pages_enabled ON legal_pages(enabled);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS update_landing_page_content_updated_at ON landing_page_content;
CREATE TRIGGER update_landing_page_content_updated_at
  BEFORE UPDATE ON landing_page_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_footer_content_updated_at ON footer_content;
CREATE TRIGGER update_footer_content_updated_at
  BEFORE UPDATE ON footer_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_legal_pages_updated_at ON legal_pages;
CREATE TRIGGER update_legal_pages_updated_at
  BEFORE UPDATE ON legal_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Seul le super_admin peut modifier
ALTER TABLE landing_page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_pages ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut lire, seul super_admin peut modifier
CREATE POLICY "Anyone can read landing page content" ON landing_page_content
  FOR SELECT USING (true);

CREATE POLICY "Only super_admin can modify landing page content" ON landing_page_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text::uuid
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Anyone can read footer content" ON footer_content
  FOR SELECT USING (true);

CREATE POLICY "Only super_admin can modify footer content" ON footer_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text::uuid
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Anyone can read legal pages" ON legal_pages
  FOR SELECT USING (enabled = true);

CREATE POLICY "Only super_admin can modify legal pages" ON legal_pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text::uuid
      AND users.role = 'super_admin'
    )
  );

-- Données initiales pour la landing page
INSERT INTO landing_page_content (section_name, title, subtitle, description, enabled, display_order)
VALUES 
  ('hero', 'SolidarPay', 'La Tontine Simplifiée', 'Simplifiez la gestion de vos tontines grâce à la technologie', true, 1),
  ('what_is', 'Qu''est-ce que SolidarPay ?', NULL, 'SolidarPay est une plateforme digitale qui modernise les tontines traditionnelles. Nous combinons l''esprit de solidarité avec la technologie moderne pour vous offrir une expérience simple, sécurisée et transparente.', true, 2),
  ('features', 'Pourquoi SolidarPay ?', NULL, NULL, true, 3),
  ('how_it_works', 'Comment ça marche ?', NULL, NULL, true, 4),
  ('target_audience', 'Pour qui est SolidarPay ?', NULL, NULL, true, 5),
  ('testimonials', 'Ils nous font confiance', NULL, NULL, true, 6),
  ('cta', 'Prêt à moderniser votre tontine ?', 'Rejoignez SolidarPay dès aujourd''hui', NULL, true, 7)
ON CONFLICT (section_name) DO NOTHING;

-- Données initiales pour le footer
INSERT INTO footer_content (section_name, title, content, enabled, display_order)
VALUES 
  ('brand', 'SolidarPay', '{"description": "La plateforme digitale qui modernise les tontines familiales africaines"}', true, 1),
  ('navigation', 'Navigation', '{"links": [{"label": "Comment ça marche", "href": "/#how-it-works"}, {"label": "Inscription", "href": "/register"}, {"label": "Connexion", "href": "/login"}]}', true, 2),
  ('legal', 'Légal', '{"links": [{"label": "À propos", "href": "/about"}, {"label": "Contact", "href": "/contact"}, {"label": "CGU", "href": "/terms"}, {"label": "Confidentialité", "href": "/privacy"}]}', true, 3),
  ('contact', 'Contact', '{"email": "support@solidarpay.com", "phone": "+1 (555) 123-4567"}', true, 4),
  ('social', 'Réseaux sociaux', '{"links": [{"platform": "facebook", "url": "#"}, {"platform": "twitter", "url": "#"}, {"platform": "instagram", "url": "#"}, {"platform": "linkedin", "url": "#"}]}', true, 5)
ON CONFLICT (section_name) DO NOTHING;

-- Pages légales initiales (vides par défaut)
INSERT INTO legal_pages (page_slug, title, content, meta_description, enabled)
VALUES 
  ('about', 'À propos de SolidarPay', '<h1>À propos de SolidarPay</h1><p>Contenu à compléter...</p>', 'Découvrez SolidarPay, la plateforme qui modernise les tontines familiales', true),
  ('contact', 'Contactez-nous', '<h1>Contactez-nous</h1><p>Contenu à compléter...</p>', 'Contactez l''équipe SolidarPay', true),
  ('terms', 'Conditions Générales d''Utilisation', '<h1>CGU</h1><p>Contenu à compléter...</p>', 'Conditions Générales d''Utilisation de SolidarPay', true),
  ('privacy', 'Politique de Confidentialité', '<h1>Politique de Confidentialité</h1><p>Contenu à compléter...</p>', 'Politique de Confidentialité de SolidarPay', true)
ON CONFLICT (page_slug) DO NOTHING;

