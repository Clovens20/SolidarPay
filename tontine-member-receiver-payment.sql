-- Coordonnées de réception par membre (mode paiement direct : chaque bénéficiaire a ses propres RIB / email)
ALTER TABLE tontine_members ADD COLUMN IF NOT EXISTS "receiverPaymentStorage" TEXT;

COMMENT ON COLUMN tontine_members."receiverPaymentStorage" IS 'JSON SolidarPay (transferencia CL) ou email ; utilisé quand la tontine est en paymentMode=direct et kohoReceiverEmail marque direct_per_member';
