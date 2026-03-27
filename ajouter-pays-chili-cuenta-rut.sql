-- Chili : SolidarPay avec Cuenta RUT / transferencia bancaire
-- À exécuter sur le projet Supabase (SQL Editor) si la base existe déjà sans le Chili.

INSERT INTO payment_countries (code, name, currency, enabled, "paymentMethods")
VALUES (
  'CL',
  'Chili',
  'CLP',
  true,
  '["cuenta_rut_transferencia"]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  currency = EXCLUDED.currency,
  enabled = COALESCE(EXCLUDED.enabled, payment_countries.enabled),
  "paymentMethods" = EXCLUDED."paymentMethods",
  "updatedAt" = NOW();
