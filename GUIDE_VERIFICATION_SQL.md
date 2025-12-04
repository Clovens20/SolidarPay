# 📋 Guide : Vérifier tous les Scripts SQL

## 🎯 Objectif

Vérifier que **TOUS** les scripts SQL ont été exécutés correctement et que tous les éléments nécessaires sont en place dans la base de données.

## 🚀 Méthode 1 : Script SQL de Vérification Automatique (RECOMMANDÉ)

### Étape 1 : Exécuter le script de vérification

1. **Ouvrez Supabase Dashboard**
2. **Allez dans SQL Editor**
3. **Copiez et collez** le contenu du fichier **`VERIFICATION_COMPLETE_SQL.sql`**
4. **Cliquez sur "Run"**

### Résultat attendu

Le script vous donnera un rapport complet avec :

- ✅ **Tables existantes** (avec ✅)
- ❌ **Tables manquantes** (avec ❌ et le script à exécuter)
- ✅ **Colonnes importantes** vérifiées
- ✅ **Contraintes** vérifiées
- ✅ **Vues SQL** vérifiées
- ✅ **Fonctions SQL** vérifiées
- 📊 **Résumé global** avec compteurs
- ❌ **Liste des éléments manquants** avec actions à prendre

## 📝 Ce que le script vérifie

### 1. **Tables (13 tables au total)**

#### Tables de base (5) :
- ✅ `users`
- ✅ `tontines`
- ✅ `tontine_members`
- ✅ `cycles`
- ✅ `contributions`

#### Tables Super Admin (5) :
- ✅ `kyc_documents`
- ✅ `payment_countries`
- ✅ `platform_customization`
- ✅ `system_logs`
- ✅ `maintenance_schedule`

#### Tables de gestion de contenu (3) :
- ✅ `landing_page_content`
- ✅ `footer_content`
- ✅ `legal_pages`

### 2. **Colonnes importantes**

- ✅ `users.country` (pour Admin Tontine)
- ✅ `kyc_documents.autoScore`
- ✅ `kyc_documents.analysisResults`
- ✅ `kyc_documents.extractedInfo`
- ✅ `kyc_documents.documentHash`
- ✅ `kyc_documents.metadata`
- ✅ `payment_countries.code`, `name`, `enabled`, `paymentMethods`

### 3. **Contraintes**

- ✅ `users.role` accepte `super_admin`
- ✅ `tontines.frequency` accepte `weekly`

### 4. **Vues SQL (6)**

- ✅ `kyc_stats_view`
- ✅ `kyc_auto_stats`
- ✅ `kyc_manual_reviews`
- ✅ `searchable_members`
- ✅ `kyc_logs_stats`
- ✅ `critical_errors_recent`

### 5. **Fonctions SQL (3)**

- ✅ `calculate_avg_processing_time()`
- ✅ `check_kyc_attempts()`
- ✅ `check_duplicate_hash()`

## 🔍 Méthode 2 : Vérification Manuelle (Alternative)

Si vous préférez vérifier manuellement, voici les requêtes à exécuter :

### Vérifier toutes les tables

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'users', 'tontines', 'tontine_members', 'cycles', 'contributions',
    'kyc_documents', 'payment_countries', 'platform_customization', 
    'system_logs', 'maintenance_schedule',
    'landing_page_content', 'footer_content', 'legal_pages'
  )
ORDER BY table_name;
```

**Résultat attendu** : **13 tables** doivent être listées.

### Vérifier les colonnes importantes

```sql
-- Vérifier users.country
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name = 'country';

-- Vérifier les colonnes KYC
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'kyc_documents' 
  AND column_name IN ('autoScore', 'documentHash', 'metadata');
```

### Vérifier les vues

```sql
SELECT table_name as view_name
FROM information_schema.views 
WHERE table_schema = 'public'
  AND table_name IN (
    'kyc_stats_view',
    'kyc_auto_stats',
    'kyc_manual_reviews',
    'searchable_members'
  )
ORDER BY table_name;
```

### Vérifier les fonctions

```sql
SELECT routine_name as function_name
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name IN (
    'calculate_avg_processing_time',
    'check_kyc_attempts',
    'check_duplicate_hash'
  )
ORDER BY routine_name;
```

## ✅ Checklist Complète

Après avoir exécuté le script de vérification, vous devriez avoir :

### Tables
- [ ] ✅ 5/5 Tables de base
- [ ] ✅ 5/5 Tables Super Admin
- [ ] ✅ 3/3 Tables de gestion de contenu

### Colonnes
- [ ] ✅ `users.country` existe
- [ ] ✅ Colonnes KYC complètes (`autoScore`, `documentHash`, etc.)
- [ ] ✅ `payment_countries` a les bonnes colonnes (`code`, `name`, `enabled`)

### Contraintes
- [ ] ✅ `users.role` accepte `super_admin`
- [ ] ✅ `tontines.frequency` accepte `weekly`

### Vues et Fonctions
- [ ] ✅ 6 vues SQL créées
- [ ] ✅ 3 fonctions SQL créées

## 🔧 Si des éléments manquent

Le script de vérification vous indiquera **exactement** quel script exécuter pour chaque élément manquant.

### Scripts à exécuter dans l'ordre :

1. **`database-schema.sql`** - Tables de base
2. **`database-super-admin.sql`** - Tables Super Admin
3. **`database-admin-tontine-updates.sql`** - Colonne `country` dans `users`
4. **`database-kyc-updates.sql`** - Colonnes d'analyse KYC
5. **`database-kyc-automatic-updates.sql`** - Système KYC automatique
6. **`database-system-logs-updates.sql`** - Logs système
7. **`database-frequency-weekly-update.sql`** - Fréquence hebdomadaire
8. **`FIX_COMPLET_SUPER_ADMIN.sql`** - Tables de gestion de contenu

**OU** : Exécutez directement **`database-complete.sql`** qui contient tout dans le bon ordre.

## 📊 Résultat Final

Si tout est ✅, votre base de données est **100% prête** pour le déploiement !

## 🆘 Dépannage

### Erreur : "relation does not exist"
→ La table n'existe pas. Exécutez le script indiqué.

### Erreur : "column does not exist"
→ La colonne manque. Exécutez le script de mise à jour indiqué.

### Erreur : "constraint does not exist"
→ La contrainte manque. Exécutez le script de mise à jour indiqué.

---

**Le script de vérification vous dira exactement ce qui manque et quoi faire ! 📋**

