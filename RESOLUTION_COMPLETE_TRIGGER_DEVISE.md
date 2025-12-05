# 🔧 Résolution Complète - Erreur de Trigger + Configuration Devise

## ❌ Problème

L'erreur vient d'un conflit entre les noms de colonnes :
- Le trigger essaie d'utiliser `updated_at` (snake_case)
- Mais la colonne s'appelle `updatedAt` (camelCase avec guillemets)

## ✅ Solution Complète en 1 Script

### Utilisez ce script : `corriger-et-configurer-devise.sql`

Ce script fait **tout en une seule fois** :

1. ✅ **Corrige les triggers** (supprime et recrée avec la bonne syntaxe)
2. ✅ **Configure la devise** (ajoute currency et configure les pays)
3. ✅ **Désactive temporairement les triggers** pendant les UPDATE
4. ✅ **Réactive les triggers** après

## 🚀 Comment L'Utiliser

1. Ouvrez **Supabase Dashboard** → **SQL Editor**
2. Copiez **tout le contenu** de `corriger-et-configurer-devise.sql`
3. Collez et exécutez
4. ✅ Tout devrait fonctionner sans erreur

## 📝 Ce que le Script Fait

### Étape 1 : Correction des Triggers
- Supprime les anciens triggers problématiques
- Crée `update_updated_at_camelcase()` qui utilise `"updatedAt"` (camelCase)
- Recrée les triggers avec la bonne fonction

### Étape 2 : Configuration de la Devise
- Ajoute `currency` dans `tontines`
- Ajoute `currency` dans `payment_countries`
- Configure les devises par pays
- Met à jour les tontines existantes

## ⚠️ Alternative : 2 Scripts Séparés

Si vous préférez exécuter en 2 étapes :

### Script 1 : `fix-triggers-updated-at.sql`
Corrige les triggers

### Script 2 : `configurer-devise-automatique.sql` (version corrigée)
Configure la devise

---

**Recommandation** : Utilisez `corriger-et-configurer-devise.sql` - **Tout en un seul script !**

