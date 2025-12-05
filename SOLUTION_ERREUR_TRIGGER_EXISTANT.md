# 🔧 Solution - Erreur Trigger Déjà Existant

## ❌ Erreur

```
ERROR: 42710: trigger "update_footer_content_updated_at" 
for relation "footer_content" already exists
```

## 🔍 Cause

Le trigger existe déjà dans la base de données, mais le script essaie de le recréer sans le supprimer d'abord.

## ✅ Solution

### Option 1 : Script de Nettoyage Complet (RECOMMANDÉ)

**Utilisez ce script** : `nettoyer-et-corriger-triggers.sql`

Ce script :
1. ✅ Supprime **TOUS** les triggers existants
2. ✅ Supprime **TOUTES** les fonctions existantes
3. ✅ Recrée les fonctions correctes
4. ✅ Recrée tous les triggers avec les bonnes fonctions

### Option 2 : Script Simple de Correction

**Utilisez ce script** : `corriger-triggers-version-finale.sql`

Ce script fait la même chose mais de manière plus directe.

## 📝 Comment Utiliser

1. Ouvrez **Supabase Dashboard** → **SQL Editor**
2. Copiez **tout le contenu** de `nettoyer-et-corriger-triggers.sql`
3. Collez et exécutez
4. ✅ Les triggers seront supprimés puis recréés correctement

## 🎯 Résultat Attendu

Après l'exécution, vous devriez voir :
- ✅ Tous les anciens triggers supprimés
- ✅ Toutes les anciennes fonctions supprimées
- ✅ Nouvelles fonctions créées (camelCase et snake_case)
- ✅ Tous les triggers recréés avec les bonnes fonctions

---

**Note** : Si vous avez déjà exécuté le script de configuration de devise, vous pouvez exécuter uniquement le script de nettoyage des triggers. La configuration de devise ne sera pas affectée.

