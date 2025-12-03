-- ====================================
-- SOLIDARPAY ADMIN TONTINE UPDATES
-- Ajouts pour l'interface admin tontine
-- ====================================

-- Ajouter le champ country à la table users si il n'existe pas
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS country TEXT;

-- Ajouter un index pour améliorer les recherches
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Ajouter un champ countryCode à payment_countries si nécessaire
ALTER TABLE payment_countries
ADD COLUMN IF NOT EXISTS flag TEXT;

-- Mettre à jour les flags pour les pays existants
UPDATE payment_countries SET flag = '🇨🇦' WHERE code = 'CA';
UPDATE payment_countries SET flag = '🇫🇷' WHERE code = 'FR';
UPDATE payment_countries SET flag = '🇧🇪' WHERE code = 'BE';
UPDATE payment_countries SET flag = '🇨🇭' WHERE code = 'CH';

-- Créer une vue pour faciliter la recherche de membres
CREATE OR REPLACE VIEW member_search_view AS
SELECT 
  u.id,
  u.email,
  u."fullName",
  u.phone,
  u.country,
  u."createdAt",
  u.role,
  (
    SELECT kyc.status 
    FROM kyc_documents kyc 
    WHERE kyc."userId" = u.id 
    ORDER BY kyc."createdAt" DESC 
    LIMIT 1
  ) as kyc_status
FROM users u
WHERE u.role = 'member';

-- Commentaire pour documentation
COMMENT ON COLUMN users.country IS 'Code pays ISO (CA, FR, BE, etc.) pour filtrer les membres par pays';

