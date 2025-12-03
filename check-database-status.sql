-- ====================================
-- SOLIDARPAY - VÉRIFICATION DE LA BASE DE DONNÉES
-- Ce script vérifie ce qui existe déjà et ce qui manque
-- ====================================

-- 1. VÉRIFIER LES TABLES DE BASE
SELECT 
  'Tables de base' as category,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN '✓ users'
    ELSE '✗ users MANQUANT'
  END as status
UNION ALL
SELECT 
  'Tables de base',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tontines') THEN '✓ tontines'
    ELSE '✗ tontines MANQUANT'
  END
UNION ALL
SELECT 
  'Tables de base',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tontine_members') THEN '✓ tontine_members'
    ELSE '✗ tontine_members MANQUANT'
  END
UNION ALL
SELECT 
  'Tables de base',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cycles') THEN '✓ cycles'
    ELSE '✗ cycles MANQUANT'
  END
UNION ALL
SELECT 
  'Tables de base',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contributions') THEN '✓ contributions'
    ELSE '✗ contributions MANQUANT'
  END
UNION ALL

-- 2. VÉRIFIER LES TABLES SUPER ADMIN
SELECT 
  'Super Admin',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kyc_documents') THEN '✓ kyc_documents'
    ELSE '✗ kyc_documents MANQUANT'
  END
UNION ALL
SELECT 
  'Super Admin',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_countries') THEN '✓ payment_countries'
    ELSE '✗ payment_countries MANQUANT'
  END
UNION ALL
SELECT 
  'Super Admin',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'platform_customization') THEN '✓ platform_customization'
    ELSE '✗ platform_customization MANQUANT'
  END
UNION ALL
SELECT 
  'Super Admin',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_logs') THEN '✓ system_logs'
    ELSE '✗ system_logs MANQUANT'
  END
UNION ALL
SELECT 
  'Super Admin',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_schedule') THEN '✓ maintenance_schedule'
    ELSE '✗ maintenance_schedule MANQUANT'
  END
ORDER BY category, status;

-- ====================================
-- 3. VÉRIFIER LES COLONNES IMPORTANTES
-- ====================================

-- Vérifier si users a le champ country (Admin Tontine)
SELECT 
  'Colonnes users' as category,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'country'
    ) THEN '✓ users.country existe'
    ELSE '✗ users.country MANQUANT - Exécuter database-admin-tontine-updates.sql'
  END as status
UNION ALL

-- Vérifier si users accepte le rôle super_admin
SELECT 
  'Contraintes users',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.check_constraints 
      WHERE constraint_name LIKE '%role%' 
      AND check_clause LIKE '%super_admin%'
    ) THEN '✓ users.role accepte super_admin'
    ELSE '✗ users.role ne supporte pas super_admin - Exécuter database-super-admin.sql'
  END
UNION ALL

-- Vérifier les colonnes KYC importantes
SELECT 
  'Colonnes KYC',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'kyc_documents' AND column_name = 'autoScore'
    ) THEN '✓ kyc_documents.autoScore existe'
    ELSE '✗ kyc_documents.autoScore MANQUANT - Exécuter database-kyc-updates.sql'
  END
UNION ALL
SELECT 
  'Colonnes KYC',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'kyc_documents' AND column_name = 'documentHash'
    ) THEN '✓ kyc_documents.documentHash existe'
    ELSE '✗ kyc_documents.documentHash MANQUANT - Exécuter database-kyc-automatic-updates.sql'
  END
UNION ALL

-- Vérifier la contrainte frequency pour weekly
SELECT 
  'Contraintes tontines',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.check_constraints 
      WHERE constraint_name LIKE '%frequency%' 
      AND check_clause LIKE '%weekly%'
    ) THEN '✓ tontines.frequency accepte weekly'
    ELSE '✗ tontines.frequency ne supporte pas weekly - Exécuter database-frequency-weekly-update.sql'
  END;

-- ====================================
-- 4. RÉSUMÉ DES TABLES MANQUANTES
-- ====================================

SELECT 
  'RÉSUMÉ' as info,
  COUNT(*) FILTER (WHERE table_name IN ('users', 'tontines', 'tontine_members', 'cycles', 'contributions')) as "Tables de base créées",
  COUNT(*) FILTER (WHERE table_name IN ('kyc_documents', 'payment_countries', 'platform_customization', 'system_logs', 'maintenance_schedule')) as "Tables Super Admin créées"
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'users', 'tontines', 'tontine_members', 'cycles', 'contributions',
    'kyc_documents', 'payment_countries', 'platform_customization', 'system_logs', 'maintenance_schedule'
  );

