# 📋 Guide d'Exécution des Scripts SQL

## ✅ Ordre d'exécution recommandé

Vous devez exécuter les scripts SQL dans l'ordre suivant dans l'éditeur SQL de Supabase :

### 1. **database-schema.sql** (Schéma de base)
📄 **Fichier**: `database-schema.sql`
- ✅ Créer en premier
- Tables de base : `users`, `tontines`, `tontine_members`, `cycles`, `contributions`
- Row Level Security (RLS) de base

### 2. **database-super-admin.sql** (Super Admin)
📄 **Fichier**: `database-super-admin.sql`
- ✅ Créer après le schéma de base
- Tables : `kyc_documents`, `payment_countries`, `platform_customization`, `system_logs`, `maintenance_schedule`
- Ajoute le rôle `super_admin` à la table `users`

### 3. **database-admin-tontine-updates.sql** (Admin Tontine)
📄 **Fichier**: `database-admin-tontine-updates.sql`
- ✅ Créer après Super Admin
- Ajoute le champ `country` à la table `users`
- Crée des vues pour faciliter les recherches de membres

### 4. **database-kyc-updates.sql** (KYC initial)
📄 **Fichier**: `database-kyc-updates.sql`
- ✅ Créer après Admin Tontine
- Ajoute des champs pour l'analyse KYC : `autoScore`, `analysisResults`, `extractedInfo`

### 5. **database-kyc-automatic-updates.sql** (KYC Automatique)
📄 **Fichier**: `database-kyc-automatic-updates.sql`
- ✅ Créer après les mises à jour KYC initiales
- Ajoute : `documentHash`, `metadata`
- Vues pour statistiques automatiques
- Fonctions pour vérifier tentatives et doublons

### 6. **database-system-logs-updates.sql** (Logs Système)
📄 **Fichier**: `database-system-logs-updates.sql`
- ✅ Créer en dernier
- Améliore la table `system_logs` (si pas déjà complète)
- Ajoute des index et vues pour les statistiques

## 🚀 Script consolidé (Tout-en-un)

Vous pouvez aussi exécuter le fichier **`database-complete.sql`** qui contient tout dans le bon ordre.

## ✅ Vérification

Pour vérifier si les scripts ont été exécutés, exécutez cette requête dans Supabase :

```sql
-- Vérifier les tables créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'users', 
    'tontines', 
    'tontine_members', 
    'cycles', 
    'contributions',
    'kyc_documents',
    'payment_countries',
    'platform_customization',
    'system_logs',
    'maintenance_schedule'
  )
ORDER BY table_name;
```

### Vérifier les colonnes ajoutées

```sql
-- Vérifier les colonnes de kyc_documents
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'kyc_documents' 
ORDER BY ordinal_position;

-- Vérifier les colonnes de users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
```

### Vérifier les vues créées

```sql
-- Vérifier les vues créées
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name IN (
    'kyc_manual_reviews',
    'kyc_auto_stats',
    'kyc_logs_stats',
    'critical_errors_recent'
  );
```

### Vérifier les fonctions créées

```sql
-- Vérifier les fonctions créées
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'check_kyc_attempts',
    'check_duplicate_hash',
    'cleanup_old_logs'
  );
```

## 📝 Checklist

Cocher au fur et à mesure :

- [ ] `database-schema.sql` - Schéma de base
- [ ] `database-super-admin.sql` - Tables Super Admin
- [ ] `database-admin-tontine-updates.sql` - Mises à jour Admin Tontine
- [ ] `database-kyc-updates.sql` - Mises à jour KYC initiales
- [ ] `database-kyc-automatic-updates.sql` - Système KYC automatique
- [ ] `database-system-logs-updates.sql` - Améliorations logs système

## ⚠️ Important

1. **Ne pas exécuter plusieurs fois** : Les scripts utilisent `CREATE TABLE IF NOT EXISTS` et `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, mais il vaut mieux vérifier avant.

2. **Ordre important** : Respecter l'ordre car certains scripts dépendent des tables créées dans les précédents.

3. **Backup** : Faire un backup de votre base de données avant d'exécuter les scripts si vous avez déjà des données.

## 🔧 Si vous avez déjà exécuté certains scripts

Si vous avez déjà exécuté certains scripts :
1. Vérifiez quelles tables existent déjà
2. Exécutez seulement les scripts manquants dans l'ordre

## 📞 Support

En cas de problème :
1. Vérifiez les erreurs dans la console SQL de Supabase
2. Les erreurs comme "table already exists" sont normales et peuvent être ignorées si vous réexécutez
3. Les erreurs comme "column already exists" indiquent que le script a déjà été partiellement exécuté

