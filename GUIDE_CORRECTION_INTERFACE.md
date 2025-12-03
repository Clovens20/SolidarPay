# 🔧 Guide de Correction - Interface Admin Tontine

## ❌ Problème

L'interface de recherche de membres n'apparaît pas dans l'onglet "Membres".

## ✅ Solution en 2 Étapes

### Étape 1 : Exécuter le Script SQL

Dans **Supabase SQL Editor**, exécutez :

```
SCRIPT_COMPLET_CORRECTION.sql
```

Ce script va :
- ✅ Recréer la table `payment_countries` avec les bonnes colonnes
- ✅ Insérer 5 pays par défaut (Canada, France, Belgique, Suisse, États-Unis)
- ✅ S'assurer que la colonne `country` existe dans `users`
- ✅ Configurer les permissions (RLS)

### Étape 2 : Recharger l'Interface

1. **Vider le cache du navigateur** (Ctrl + Shift + Delete)
2. **Recharger la page** (Ctrl + F5)
3. **Aller sur** : `/admin-tontine/tontine/[ID_DE_LA_TONTINE]`
4. **Cliquer sur l'onglet** : "Membres"

## 📍 Où Trouver l'Interface

L'interface de recherche devrait apparaître **en haut** de l'onglet "Membres" :

1. **Section "Rechercher des membres"**
   - Étape 1 : Sélectionner le pays (dropdown)
   - Étape 2 : Rechercher (champ texte pour nom ou email)
   - Bouton "Rechercher"

2. **Résultats de recherche** (si des membres sont trouvés)

3. **Liste des membres actuels** (tableau en bas)

## ✅ Vérification

Après avoir exécuté le script, vérifiez :

```sql
SELECT * FROM payment_countries;
```

Vous devriez voir 5 pays.

## 🔍 Si Ça Ne Marche Toujours Pas

1. **Ouvrir la console** (F12)
2. **Vérifier les erreurs** JavaScript
3. **Vérifier** que vous êtes bien sur l'onglet "Membres"
4. **Vérifier** que la tontine existe

## 📝 Fichiers Modifiés

- ✅ `components/admin-tontine/MembersTab.jsx` - Amélioration de la gestion d'erreurs
- ✅ `SCRIPT_COMPLET_CORRECTION.sql` - Script de correction SQL

---

**Exécutez le script SQL et l'interface devrait apparaître ! 🎉**

