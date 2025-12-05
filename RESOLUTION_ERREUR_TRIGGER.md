# 🔧 Résolution de l'Erreur de Trigger updated_at

## ❌ Problème

```
ERROR: 42703: record "new" has no field "updated_at" 
CONTEXT: PL/pgSQL assignment "NEW.updated_at = NOW()" 
PL/pgSQL function update_updated_at_column() line 3 at assignment
```

## 🔍 Cause

Il y a un conflit entre deux formats de nommage de colonnes :

1. **snake_case** : `updated_at` (utilisé dans certaines tables)
2. **camelCase** : `updatedAt` (utilisé dans d'autres tables)

Le trigger `update_updated_at_column()` essaie d'utiliser `updated_at` mais certaines tables utilisent `updatedAt`.

## ✅ Solution

### Étape 1 : Exécuter le Script de Correction des Triggers

Exécutez **d'abord** ce script pour corriger tous les triggers :

**Fichier** : `fix-triggers-updated-at.sql` ou `corriger-all-triggers-updated-at.sql`

Ce script :
- ✅ Supprime les anciens triggers problématiques
- ✅ Crée deux fonctions séparées :
  - `update_updated_at_camelcase()` pour les colonnes `updatedAt`
  - `update_updated_at_snakecase()` pour les colonnes `updated_at`
- ✅ Crée les bons triggers pour chaque table

### Étape 2 : Exécuter le Script de Configuration de Devise

Ensuite, exécutez le script de configuration de devise :

**Fichier** : `configurer-devise-automatique.sql`

Ce script a été modifié pour :
- ✅ Désactiver temporairement les triggers pendant les UPDATE
- ✅ Réactiver les triggers après

## 📝 Ordre d'Exécution Recommandé

1. **D'abord** : `fix-triggers-updated-at.sql` ou `corriger-all-triggers-updated-at.sql`
2. **Ensuite** : `configurer-devise-automatique.sql`

## 🔧 Scripts Disponibles

1. **`fix-triggers-updated-at.sql`** - Correction complète des triggers
2. **`corriger-all-triggers-updated-at.sql`** - Version alternative avec vérifications
3. **`configurer-devise-automatique.sql`** - Configuration de la devise (modifié)

---

**Date de création** : $(date)
**Statut** : ✅ **SOLUTION PRÊTE**

