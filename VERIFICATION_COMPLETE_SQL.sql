-- ====================================
-- SOLIDARPAY - VÉRIFICATION COMPLÈTE DE LA BASE DE DONNÉES
-- Ce script vérifie que TOUS les éléments sont en place
-- Exécutez-le dans Supabase SQL Editor pour obtenir un rapport complet
-- ====================================

-- ====================================
-- 1. VÉRIFICATION DES TABLES
-- ====================================

-- Tables de base (5)
SELECT 
  '1. TABLES DE BASE' as section,
  table_name as element,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = t.table_name
    ) THEN '✅ EXISTE'
    ELSE '❌ MANQUANT - Exécuter: database-schema.sql'
  END as status
FROM (VALUES 
  ('users'),
  ('tontines'),
  ('tontine_members'),
  ('cycles'),
  ('contributions')
) as t(table_name)
ORDER BY t.table_name;

-- Tables Super Admin (5)
SELECT 
  '2. TABLES SUPER ADMIN' as section,
  table_name as element,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = t.table_name
    ) THEN '✅ EXISTE'
    ELSE '❌ MANQUANT - Exécuter: database-super-admin.sql'
  END as status
FROM (VALUES 
  ('kyc_documents'),
  ('payment_countries'),
  ('platform_customization'),
  ('system_logs'),
  ('maintenance_schedule')
) as t(table_name)
ORDER BY t.table_name;

-- Tables de gestion de contenu (3)
SELECT 
  '3. TABLES CONTENU' as section,
  table_name as element,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = t.table_name
    ) THEN '✅ EXISTE'
    ELSE '❌ MANQUANT - Exécuter: FIX_COMPLET_SUPER_ADMIN.sql'
  END as status
FROM (VALUES 
  ('landing_page_content'),
  ('footer_content'),
  ('legal_pages')
) as t(table_name)
ORDER BY t.table_name;

-- ====================================
-- 2. VÉRIFICATION DES COLONNES IMPORTANTES
-- ====================================

-- Colonnes dans users
SELECT 
  '4. COLONNES USERS' as section,
  'users.' || column_name as element,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = c.column_name
    ) THEN '✅ EXISTE'
    ELSE '❌ MANQUANT - ' || c.script
  END as status
FROM (VALUES 
  ('country', 'Exécuter: database-admin-tontine-updates.sql')
) as c(column_name, script)
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users');

-- Colonnes dans kyc_documents
SELECT 
  '5. COLONNES KYC' as section,
  'kyc_documents.' || column_name as element,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'kyc_documents' 
      AND column_name = c.column_name
    ) THEN '✅ EXISTE'
    ELSE '❌ MANQUANT - ' || c.script
  END as status
FROM (VALUES 
  ('autoScore', 'Exécuter: database-kyc-updates.sql'),
  ('analysisResults', 'Exécuter: database-kyc-updates.sql'),
  ('extractedInfo', 'Exécuter: database-kyc-updates.sql'),
  ('documentHash', 'Exécuter: database-kyc-automatic-updates.sql'),
  ('metadata', 'Exécuter: database-kyc-automatic-updates.sql')
) as c(column_name, script)
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kyc_documents');

-- Colonnes dans payment_countries
SELECT 
  '6. COLONNES PAYMENT_COUNTRIES' as section,
  'payment_countries.' || column_name as element,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'payment_countries' 
      AND column_name = c.column_name
    ) THEN '✅ EXISTE'
    ELSE '❌ MANQUANT - Colonnes attendues: code, name, enabled, paymentMethods'
  END as status
FROM (VALUES 
  ('code'),
  ('name'),
  ('enabled'),
  ('paymentMethods')
) as c(column_name)
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_countries');

-- ====================================
-- 3. VÉRIFICATION DES CONTRAINTES
-- ====================================

-- Vérifier que users.role accepte 'super_admin'
SELECT 
  '7. CONTRAINTES' as section,
  'users.role accepte super_admin' as element,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'users' 
      AND ccu.column_name = 'role'
      AND tc.constraint_type = 'CHECK'
    ) THEN '✅ EXISTE'
    ELSE '❌ MANQUANT - Exécuter: database-super-admin.sql'
  END as status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users');

-- Vérifier que tontines.frequency accepte 'weekly'
SELECT 
  '7. CONTRAINTES' as section,
  'tontines.frequency accepte weekly' as element,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'tontines' 
      AND ccu.column_name = 'frequency'
      AND tc.constraint_type = 'CHECK'
      AND EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = tc.constraint_name 
        AND pg_get_constraintdef(oid) LIKE '%weekly%'
      )
    ) THEN '✅ EXISTE'
    ELSE '❌ MANQUANT - Exécuter: database-frequency-weekly-update.sql'
  END as status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tontines');

-- ====================================
-- 4. VÉRIFICATION DES VUES
-- ====================================

SELECT 
  '8. VUES SQL' as section,
  view_name as element,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = v.view_name
    ) THEN '✅ EXISTE'
    ELSE '❌ MANQUANT'
  END as status
FROM (VALUES 
  ('kyc_stats_view'),
  ('kyc_auto_stats'),
  ('kyc_manual_reviews'),
  ('searchable_members'),
  ('kyc_logs_stats'),
  ('critical_errors_recent')
) as v(view_name)
ORDER BY v.view_name;

-- ====================================
-- 5. VÉRIFICATION DES FONCTIONS
-- ====================================

SELECT 
  '9. FONCTIONS SQL' as section,
    f.function_name as element,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name = f.function_name
      AND routine_type = 'FUNCTION'
    ) THEN '✅ EXISTE'
    ELSE '❌ MANQUANT'
  END as status
FROM (VALUES 
  ('calculate_avg_processing_time'),
  ('check_kyc_attempts'),
  ('check_duplicate_hash')
) as f(function_name)
ORDER BY f.function_name;

-- ====================================
-- 6. RÉSUMÉ GLOBAL
-- ====================================

SELECT 
  '📊 RÉSUMÉ GLOBAL' as section,
  'Tables de base: ' || 
  COUNT(DISTINCT CASE WHEN table_name IN ('users', 'tontines', 'tontine_members', 'cycles', 'contributions') THEN table_name END) || '/5' as element,
  'Status' as status
FROM information_schema.tables
WHERE table_schema = 'public';

SELECT 
  '📊 RÉSUMÉ GLOBAL' as section,
  'Tables Super Admin: ' || 
  COUNT(DISTINCT CASE WHEN table_name IN ('kyc_documents', 'payment_countries', 'platform_customization', 'system_logs', 'maintenance_schedule') THEN table_name END) || '/5' as element,
  'Status' as status
FROM information_schema.tables
WHERE table_schema = 'public';

SELECT 
  '📊 RÉSUMÉ GLOBAL' as section,
  'Tables Contenu: ' || 
  COUNT(DISTINCT CASE WHEN table_name IN ('landing_page_content', 'footer_content', 'legal_pages') THEN table_name END) || '/3' as element,
  'Status' as status
FROM information_schema.tables
WHERE table_schema = 'public';

-- ====================================
-- 7. LISTE DES ÉLÉMENTS MANQUANTS
-- ====================================

-- Tables manquantes
SELECT 
  '❌ TABLES MANQUANTES' as section,
  t.table_name as element,
  t.script as status
FROM (
  SELECT 'users' as table_name, 'database-schema.sql' as script
  UNION SELECT 'tontines', 'database-schema.sql'
  UNION SELECT 'tontine_members', 'database-schema.sql'
  UNION SELECT 'cycles', 'database-schema.sql'
  UNION SELECT 'contributions', 'database-schema.sql'
  UNION SELECT 'kyc_documents', 'database-super-admin.sql'
  UNION SELECT 'payment_countries', 'database-super-admin.sql'
  UNION SELECT 'platform_customization', 'database-super-admin.sql'
  UNION SELECT 'system_logs', 'database-super-admin.sql'
  UNION SELECT 'maintenance_schedule', 'database-super-admin.sql'
  UNION SELECT 'landing_page_content', 'FIX_COMPLET_SUPER_ADMIN.sql'
  UNION SELECT 'footer_content', 'FIX_COMPLET_SUPER_ADMIN.sql'
  UNION SELECT 'legal_pages', 'FIX_COMPLET_SUPER_ADMIN.sql'
) as t
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = t.table_name
)
ORDER BY t.script, t.table_name;

-- Colonnes manquantes dans users
SELECT 
  '❌ COLONNES MANQUANTES' as section,
  'users.country' as element,
  'Exécuter: database-admin-tontine-updates.sql' as status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'country'
  );

-- Colonnes manquantes dans kyc_documents
SELECT 
  '❌ COLONNES MANQUANTES' as section,
  'kyc_documents.' || c.column_name as element,
  c.script as status
FROM (
  SELECT 'autoScore' as column_name, 'database-kyc-updates.sql' as script
  UNION SELECT 'analysisResults', 'database-kyc-updates.sql'
  UNION SELECT 'extractedInfo', 'database-kyc-updates.sql'
  UNION SELECT 'documentHash', 'database-kyc-automatic-updates.sql'
  UNION SELECT 'metadata', 'database-kyc-automatic-updates.sql'
) as c
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kyc_documents')
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'kyc_documents' AND column_name = c.column_name
  )
ORDER BY c.script, c.column_name;

-- ====================================
-- 8. CHECKLIST FINALE
-- ====================================

SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'tontines', 'tontine_members', 'cycles', 'contributions')) = 5 
    THEN '✅'
    ELSE '❌'
  END || ' Tables de base (5/5)' as "CHECKLIST FINALE",
  '' as status;

SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('kyc_documents', 'payment_countries', 'platform_customization', 'system_logs', 'maintenance_schedule')) = 5 
    THEN '✅'
    ELSE '❌'
  END || ' Tables Super Admin (5/5)' as "CHECKLIST FINALE",
  '' as status;

SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('landing_page_content', 'footer_content', 'legal_pages')) = 3 
    THEN '✅'
    ELSE '❌'
  END || ' Tables Contenu (3/3)' as "CHECKLIST FINALE",
  '' as status;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'country')
    THEN '✅'
    ELSE '❌'
  END || ' Colonne users.country' as "CHECKLIST FINALE",
  '' as status;

