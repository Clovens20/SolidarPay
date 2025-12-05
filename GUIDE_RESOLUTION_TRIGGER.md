# 🔧 Guide de Résolution - Erreur de Trigger updated_at

## ❌ Erreur Rencontrée

```
ERROR: 42703: record "new" has no field "updated_at" 
CONTEXT: PL/pgSQL assignment "NEW.updated_at = NOW()" 
PL/pgSQL function update_updated_at_column() line 3 at assignment
```

## 🔍 Cause du Problème

Le trigger `update_updated_at_column()` essaie d'utiliser `updated_at` (snake_case) mais certaines tables utilisent `updatedAt` (camelCase avec guillemets).

## ✅ Solution en 2 Étapes

### Étape 1 : Corriger les Triggers

**Exécutez d'abord** : `fix-triggers-updated-at.sql` ou `corriger-all-triggers-updated-at.sql`

Ce script :
- Supprime les anciens triggers problématiques
- Crée deux fonctions séparées :
  - `update_updated_at_camelcase()` pour `updatedAt`
  - `update_updated_at_snakecase()` pour `updated_at`
- Recrée les bons triggers pour chaque table

### Étape 2 : Configurer la Devise

**Ensuite, exécutez** : `configurer-devise-automatique.sql` (version corrigée)

Ce script :
- Désactive temporairement les triggers pendant les UPDATE
- Configure les devises pour chaque pays
- Réactive les triggers après

## 📝 Ordre d'Exécution

1. ✅ **Premier** : `fix-triggers-updated-at.sql`
2. ✅ **Deuxième** : `configurer-devise-automatique.sql`

## 🎯 Alternative : Script Unique

Si vous préférez, utilisez le script sécurisé qui fait tout :

**`configurer-devise-automatique-safe.sql`**

Ce script inclut :
- Désactivation des triggers
- Configuration des devises
- Réactivation des triggers

---

**Statut** : ✅ **SOLUTION PRÊTE**

