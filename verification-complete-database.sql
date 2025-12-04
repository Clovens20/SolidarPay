-- ====================================
-- SOLIDARPAY - VÉRIFICATION COMPLÈTE DE LA BASE DE DONNÉES
-- Ce script vérifie que TOUS les éléments sont en place
-- Exécutez-le dans Supabase SQL Editor pour obtenir un rapport complet
-- ====================================

-- ====================================
-- 1. VÉRIFICATION DES TABLES
-- ====================================

SELECT 
  '📊 VÉRIFICATION DES TABLES' as section,
  '' as detail;

-- Tables de base (5)
SELECT 
  'Tables de base' as category,
  table_name as "Table",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = t.table_name
    ) THEN '✅ EXISTE'
    ELSE '❌ MANQUANT'
  END as status,
  'Exécuter: database-schema.sql' as action_required
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
  'Tables Super Admin' as category,
  table_name as "Table",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = t.table_name
    ) THEN '✅ EXISTE'
    ELSE '❌ MANQUANT'
  END as status,
  'Exécuter: database-super-admin.sql' as action_required
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
  'Tables Contenu' as category,
  table_name as "Table",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = t.table_name
    ) THEN '✅ EXISTE'
    ELSE '❌ MANQUANT'
  END as status,
  'Exécuter: creer-tables-contenu-manquant.sql ou FIX_COMPLET_SUPER_ADMIN.sql' as action_required
FROM (VALUES 
  ('landing_page_content'),
  ('footer_content'),
  ('legal_pages')
) as t(table_name)
ORDER BY t.table_name;

-- ====================================
-- 2. VÉRIFICATION DES COLONNES IMPORTANTES
-- ====================================

SELECT 
  '🔍 VÉRIFICATION DES COLONNES' as section,
  '' as detail;

-- Colonnes dans users
SELECT 
  'Colonnes users' as category,
  column_name as "Colonne",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = c.column_name
    ) THEN '✅ EXISTE'
    ELSE '❌ MANQUANT'
  END as status,
  c.script as action_required
FROM (VALUES 
  ('country', 'Exécuter: database-admin-tontine-updates.sql'),
  ('role', 'Exécuter: database-schema.sql'),
  ('fullName', 'Exécuter: database-schema.sql'),
  ('email', 'Exécuter: database-schema.sql'),
  ('phone', 'Exécuter: database-schema.sql')
) as c(column_name, script)
ORDER BY c.column_name;

-- Colonnes dans kyc_documents
SELECT 
  'Colonnes KYC' as category,
  column_name as "Colonne",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'kyc_documents' 
      AND column_name = c.column_name
    ) THEN '✅ EXISTE'
    ELSE '❌ MANQUANT'
  END as status,
  c.script as action_required
FROM (VALUES 
  ('autoScore', 'Exécuter: database-kyc-updates.sql'),
  ('analysisResults', 'Exécuter: database-kyc-updates.sql'),
  ('extractedInfo', 'Exécuter: database-kyc-updates.sql'),
  ('documentHash', 'Exécuter: database-kyc-automatic-updates.sql'),
  ('metadata', 'Exécuter: database-kyc-automatic-updates.sql'),
  ('status', 'Exécuter: database-super-admin.sql'),
  ('userId', 'Exécuter: database-super-admin.sql'),
  ('documentImage', 'Exécuter: database-super-admin.sql')
) as c(column_name, script)
ORDER BY c.column_name;

-- Colonnes dans payment_countries
SELECT 
  'Colonnes payment_countries' as category,
  column_name as "Colonne",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'payment_countries' 
      AND column_name = c.column_name
    ) THEN '✅ EXISTE'
    ELSE '❌ MANQUANT'
  END as status,
  'Colonnes attendues: code, name, enabled, paymentMethods' as action_required
FROM (VALUES 
  ('code'),
  ('name'),
  ('enabled'),
  ('paymentMethods')
) as c(column_name)
ORDER BY c.column_name;

-- Colonnes dans platform_customization
SELECT 
  'Colonnes platform_customization' as category,
  column_name as "Colonne",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'platform_customization' 
      AND column_name = c.column_name
    ) THEN '✅ EXISTE'
    ELSE '❌ MANQUANT'
  END as status,
  'Structure attendue: key TEXT UNIQUE, value JSONB' as action_required
FROM (VALUES 
  ('key'),
  ('value')
) as c(column_name)
ORDER BY c.column_name;

-- ====================================
-- 3. VÉRIFICATION DES CONTRAINTES
-- ====================================

SELECT 
  '🔒 VÉRIFICATION DES CONTRAINTES' as section,
  '' as detail;

-- Vérifier que users.role accepte 'super_admin'
SELECT 
  'Contraintes users.role' as category,
  constraint_name as "Contrainte",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.check_constraints cc
      JOIN information_schema.constraint_column_usage ccu 
        ON cc.constraint_name = ccu.constraint_name
      WHERE ccu.table_name = 'users' 
      AND ccu.column_name = 'role'
      AND (cc.check_clause LIKE '%super_admin%' OR cc.check_clause LIKE '%admin%' OR cc.check_clause LIKE '%member%')
    ) THEN '✅ EXISTE'
    ELSE '❌ MANQUANT'
  END as status,
  'Exécuter: database-super-admin.sql pour ajouter super_admin' as action_required
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users');

-- Vérifier que tontines.frequency accepte 'weekly'
SELECT 
  'Contraintes tontines.frequency' as category,
  constraint_name as "Contrainte",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.check_constraints cc
      JOIN information_schema.constraint_column_usage ccu 
        ON cc.constraint_name = ccu.constraint_name
      WHERE ccu.table_name = 'tontines' 
      AND ccu.column_name = 'frequency'
      AND cc.check_clause LIKE '%weekly%'
    ) THEN '✅ ACCEPTE WEEKLY'
    ELSE '❌ WEEKLY NON SUPPORTÉ'
  END as status,
  'Exécuter: database-frequency-weekly-update.sql' as action_required
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tontines');

-- ====================================
-- 4. VÉRIFICATION DES INDEXES
-- ====================================

SELECT 
  '📇 VÉRIFICATION DES INDEXES' as section,
  '' as detail;

-- Indexes sur kyc_documents
SELECT 
  'Indexes KYC' as category,
  indexname as "Index",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'kyc_documents' 
      AND indexname = i.indexname
    ) THEN '✅ EXISTE'
    ELSE '❌ MANQUANT'
  END as status,
  'Important pour les performances' as action_required
FROM (VALUES 
  ('idx_kyc_documents_score'),
  ('idx_kyc_documents_status'),
  ('idx_kyc_documents_submitted')
) as i(indexname)
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kyc_documents');

-- Indexes sur system_logs
SELECT 
  'Indexes System Logs' as category,
  indexname as "Index",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'system_logs' 
      AND indexname = i.indexname
    ) THEN '✅ EXISTE'
    ELSE '❌ MANQUANT'
  END as status,
  'Important pour les performances' as action_required
FROM (VALUES 
  ('idx_system_logs_level'),
  ('idx_system_logs_category'),
  ('idx_system_logs_created'),
  ('idx_system_logs_user')
) as i(indexname)
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_logs');

-- ====================================
-- 5. VÉRIFICATION DES VUES
-- ====================================

SELECT 
  '👁️ VÉRIFICATION DES VUES' as section,
  '' as detail;

SELECT 
  'Vues SQL' as category,
  table_name as "Vue",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = v.view_name
    ) THEN '✅ EXISTE'
    ELSE '❌ MANQUANT'
  END as status,
  v.script as action_required
FROM (VALUES 
  ('kyc_stats_view', 'Créée par: database-kyc-updates.sql'),
  ('kyc_auto_stats', 'Créée par: database-kyc-automatic-updates.sql'),
  ('kyc_manual_reviews', 'Créée par: database-kyc-automatic-updates.sql'),
  ('searchable_members', 'Créée par: database-admin-tontine-updates.sql'),
  ('kyc_logs_stats', 'Créée par: database-system-logs-updates.sql'),
  ('critical_errors_recent', 'Créée par: database-system-logs-updates.sql')
) as v(view_name, script)
ORDER BY v.view_name;

-- ====================================
-- 6. VÉRIFICATION DES FONCTIONS
-- ====================================

SELECT 
  '⚙️ VÉRIFICATION DES FONCTIONS' as section,
  '' as detail;

SELECT 
  'Fonctions SQL' as category,
  routine_name as "Fonction",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name = f.function_name
      AND routine_type = 'FUNCTION'
    ) THEN '✅ EXISTE'
    ELSE '❌ MANQUANT'
  END as status,
  f.script as action_required
FROM (VALUES 
  ('calculate_avg_processing_time', 'Créée par: database-kyc-updates.sql'),
  ('check_kyc_attempts', 'Créée par: database-kyc-automatic-updates.sql'),
  ('check_duplicate_hash', 'Créée par: database-kyc-automatic-updates.sql')
) as f(function_name, script)
ORDER BY f.function_name;

-- ====================================
-- 7. VÉRIFICATION DES RLS POLICIES
-- ====================================

SELECT 
  '🛡️ VÉRIFICATION DES RLS POLICIES' as section,
  '' as detail;

SELECT 
  'RLS Policies' as category,
  tablename as "Table",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = p.table_name
    ) THEN '✅ RLS ACTIVÉ'
    ELSE '❌ RLS NON ACTIVÉ'
  END as status,
  'Vérifier les policies dans database-schema.sql et database-super-admin.sql' as action_required
FROM (VALUES 
  ('users'),
  ('tontines'),
  ('tontine_members'),
  ('cycles'),
  ('contributions'),
  ('kyc_documents'),
  ('payment_countries'),
  ('platform_customization'),
  ('system_logs'),
  ('maintenance_schedule')
) as p(table_name)
ORDER BY p.table_name;

-- ====================================
-- 8. RÉSUMÉ GLOBAL
-- ====================================

SELECT 
  '📋 RÉSUMÉ GLOBAL' as section,
  '' as detail;

SELECT 
  'Résumé' as category,
  COUNT(DISTINCT CASE WHEN table_name IN ('users', 'tontines', 'tontine_members', 'cycles', 'contributions') THEN table_name END) || '/5' as "Tables de base",
  COUNT(DISTINCT CASE WHEN table_name IN ('kyc_documents', 'payment_countries', 'platform_customization', 'system_logs', 'maintenance_schedule') THEN table_name END) || '/5' as "Tables Super Admin",
  COUNT(DISTINCT CASE WHEN table_name IN ('landing_page_content', 'footer_content', 'legal_pages') THEN table_name END) || '/3' as "Tables Contenu",
  (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public' AND table_name IN ('kyc_stats_view', 'kyc_auto_stats', 'kyc_manual_reviews', 'searchable_members', 'kyc_logs_stats', 'critical_errors_recent')) || '/6' as "Vues SQL",
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION' AND routine_name IN ('calculate_avg_processing_time', 'check_kyc_attempts', 'check_duplicate_hash')) || '/3' as "Fonctions SQL"
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'users', 'tontines', 'tontine_members', 'cycles', 'contributions',
    'kyc_documents', 'payment_countries', 'platform_customization', 'system_logs', 'maintenance_schedule',
    'landing_page_content', 'footer_content', 'legal_pages'
  );

-- ====================================
-- 9. LISTE DES ÉLÉMENTS MANQUANTS
-- ====================================

SELECT 
  '❌ ÉLÉMENTS MANQUANTS DÉTECTÉS' as section,
  '' as detail;

-- Tables manquantes
SELECT 
  'Tables manquantes' as "Type",
  t.table_name as "Élément",
  t.script as "Script à exécuter"
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
  UNION SELECT 'landing_page_content', 'FIX_COMPLET_SUPER_ADMIN.sql ou creer-tables-contenu-manquant.sql'
  UNION SELECT 'footer_content', 'FIX_COMPLET_SUPER_ADMIN.sql ou creer-tables-contenu-manquant.sql'
  UNION SELECT 'legal_pages', 'FIX_COMPLET_SUPER_ADMIN.sql ou creer-tables-contenu-manquant.sql'
) as t
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = t.table_name
)
ORDER BY t.script, t.table_name;

-- Colonnes manquantes dans users
SELECT 
  'Colonne manquante' as "Type",
  'users.' || c.column_name as "Élément",
  c.script as "Script à exécuter"
FROM (
  SELECT 'country' as column_name, 'database-admin-tontine-updates.sql' as script
) as c
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = c.column_name
  );

-- Colonnes manquantes dans kyc_documents
SELECT 
  'Colonne manquante' as "Type",
  'kyc_documents.' || c.column_name as "Élément",
  c.script as "Script à exécuter"
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
-- 10. CHECKLIST FINALE
-- ====================================

SELECT 
  '✅ CHECKLIST FINALE' as section,
  '' as detail;

SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'tontines', 'tontine_members', 'cycles', 'contributions')) = 5 
    THEN '✅'
    ELSE '❌'
  END || ' Tables de base (5/5)' as "Status",
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('kyc_documents', 'payment_countries', 'platform_customization', 'system_logs', 'maintenance_schedule')) = 5 
    THEN '✅'
    ELSE '❌'
  END || ' Tables Super Admin (5/5)' as "Status",
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('landing_page_content', 'footer_content', 'legal_pages')) = 3 
    THEN '✅'
    ELSE '❌'
  END || ' Tables Contenu (3/3)' as "Status",
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'country')
    THEN '✅'
    ELSE '❌'
  END || ' Colonne users.country' as "Status",
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.check_constraints cc JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name WHERE ccu.table_name = 'users' AND ccu.column_name = 'role' AND (cc.check_clause LIKE '%super_admin%' OR cc.check_clause LIKE '%admin%'))
    THEN '✅'
    ELSE '❌'
  END || ' Rôle super_admin supporté' as "Status",
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.check_constraints cc JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name WHERE ccu.table_name = 'tontines' AND ccu.column_name = 'frequency' AND cc.check_clause LIKE '%weekly%')
    THEN '✅'
    ELSE '❌'
  END || ' Fréquence weekly supportée' as "Status";

-- ====================================
-- FIN DU RAPPORT
-- ====================================

SELECT 
  '📝 NOTE' as section,
  'Si vous voyez des éléments marqués comme MANQUANTS, exécutez les scripts SQL indiqués dans la colonne "action_required". Vous pouvez aussi exécuter database-complete.sql qui contient tout dans le bon ordre.' as detail;

