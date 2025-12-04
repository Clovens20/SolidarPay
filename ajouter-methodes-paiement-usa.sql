-- ====================================
-- AJOUTER ZELLE ET CASH APP POUR LES ÉTATS-UNIS
-- ====================================

-- Mettre à jour les méthodes de paiement pour les États-Unis
UPDATE payment_countries
SET 
  "paymentMethods" = '["credit_card", "bank_transfer", "paypal", "zelle", "cash_app"]'::jsonb,
  "updatedAt" = NOW()
WHERE code = 'US';

-- Si le pays n'existe pas encore, l'ajouter
INSERT INTO payment_countries (code, name, "paymentMethods", enabled)
VALUES ('US', 'États-Unis', '["credit_card", "bank_transfer", "paypal", "zelle", "cash_app"]'::jsonb, true)
ON CONFLICT (code) DO UPDATE
SET 
  "paymentMethods" = '["credit_card", "bank_transfer", "paypal", "zelle", "cash_app"]'::jsonb,
  "updatedAt" = NOW();

-- Vérification
SELECT 
  '=== ✅ MÉTHODES DE PAIEMENT USA ===' as info,
  code,
  name,
  "paymentMethods",
  enabled
FROM payment_countries
WHERE code = 'US';

